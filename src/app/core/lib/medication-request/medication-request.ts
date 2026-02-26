/* eslint-disable functional/immutable-data */
/* tslint:disable */
import {CodeableConcept, Medication} from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import {fhirclient} from 'fhirclient/lib/types';

import {MccMedication, MccMedicationSummary, MccMedicationSummaryList} from '../../types/mcc-types';
import log from '../../utils/loglevel';
import { getConditionFromUrl } from '../careplan';
import { getConceptDisplayString } from '../goal/goal.util';
import { convertNoteToString } from '../observation/observation.util';
import { displayDate } from '../../utils/date.utils';
import { fhirOptions, notFoundResponse, resourcesFrom, resourcesFromObject, getSupplementalDataClient} from '../../utils/fhir';
import {MedicationFlag, RxClassSummary} from "../../../rxnorm/rxnormService";
import MedicationFlagConfig from "../../../rxnorm/medicationFlagConfig.json";

enum ACTIVE_STATUS {
  ACTIVE,
  INACTIVE,
  IGNORE
}

const ACTIVE_KEYS = {
  active: ACTIVE_STATUS.ACTIVE,
  'on-hold': ACTIVE_STATUS.INACTIVE,
  cancelled: ACTIVE_STATUS.INACTIVE,
  completed: ACTIVE_STATUS.INACTIVE,
  'entered-in-error': ACTIVE_STATUS.IGNORE,
  stopped: ACTIVE_STATUS.INACTIVE,
  unknown: ACTIVE_STATUS.INACTIVE,
};


const getSupplementalData = async (launchURL: string, sdsClient: Client): Promise<MccMedication[]> => {
  const allThirdPartyMccMedicationSummary: MccMedication[] = [];
  try {

    const linkages = await sdsClient.request('Linkage?item=Patient/' + sdsClient.patient.id);
    const urlSet = new Set();
    urlSet.add(launchURL);
    // Loop through second set of linkages
    for (const entry2 of linkages.entry) {
      for (const item2 of entry2.resource.item) {
        if (item2.type === 'alternate' && !urlSet.has(item2.resource.extension[0].valueUrl)) {
          urlSet.add(item2.resource.extension[0].valueUrl);

          // Prepare FHIR request headers
          const fhirHeaderRequestOption = {} as fhirclient.RequestOptions;
          const fhirHeaders = {
            'X-Partition-Name': item2.resource.extension[0].valueUrl
          };
          fhirHeaderRequestOption.headers = fhirHeaders;
          fhirHeaderRequestOption.url = 'MedicationRequest?subject=' + item2.resource.reference;
          const response = await sdsClient.request(fhirHeaderRequestOption, fhirOptions);
          const thirdPartyMccMedication: MccMedication[] = resourcesFrom(response) as MccMedication[];
          thirdPartyMccMedication.forEach(mccMedication => {
            mccMedication.recorder = {
              display: item2.resource.extension[0].valueUrl
            };
            allThirdPartyMccMedicationSummary.push(mccMedication);
          });
        }
      }
    }
  } catch (error) {
    console.error('An error occurred: ' + error.message);
  }

  return allThirdPartyMccMedicationSummary;
};


export const getSummaryMedicationRequests = async (sdsURL: string, authURL: string, sdsScope: string): Promise<MccMedicationSummaryList> => {

  const theCurrentClient = await FHIR.oauth2.ready();

  const sdsClient: Client = await getSupplementalDataClient(theCurrentClient, sdsURL, authURL, sdsScope);

  const activeMedications: MccMedicationSummary[] = [];
  const inactiveMedications: MccMedicationSummary[] = [];

  const queryPath = `MedicationRequest`;
  const medicationRequest: fhirclient.JsonArray = await theCurrentClient.patient.request(
    queryPath, fhirOptions
  );

  log.debug({ serviceName: 'getSummaryMedicationRequests', result: { medicationRequest } });

  const medicationRequests: MccMedication[] = resourcesFrom(
    medicationRequest
  ) as MccMedication[];

  let sdsMedicationRequests: MccMedication[] = [];
  if (sdsClient) {
    sdsMedicationRequests = await getSupplementalData(theCurrentClient.state.serverUrl, sdsClient);
  }

  const allMedicationRequests: MccMedication[] = [...medicationRequests, ...sdsMedicationRequests];

  const rxnormSystemURL = 'http://www.nlm.nih.gov/research/umls/rxnorm';
  const rxnormSystemOID = 'urn:oid:2.16.840.1.113883.6.88';

  const mappedMedicationRequest: MccMedicationSummary[] = await Promise.all(allMedicationRequests.map(async (mc) => {
    const condition = mc.reasonReference ? await getConditionFromUrl(mc.reasonReference[0].reference) : {code: [] as CodeableConcept};

    const rxcuis: string[] = [];
    let medicationName: string | undefined;

    if (mc.medicationCodeableConcept && mc.medicationCodeableConcept.coding) {
      if (mc.medicationCodeableConcept.text) {
        medicationName = mc.medicationCodeableConcept.text;
      }

      for (const coding of mc.medicationCodeableConcept.coding) {
        if (coding.system === rxnormSystemURL || coding.system === rxnormSystemOID) {
          rxcuis.push(coding.code);

          if (medicationName === undefined && coding.display) {
            medicationName = coding.display;
          }
        }
      }

    } else if (mc.medicationReference) {
      if (mc.medicationReference.display) {
        medicationName = mc.medicationReference.display;
      }

      if (mc.medicationReference.reference) {
        const medication: Medication | undefined = await getMedicationByReference(mc.medicationReference.reference);
        if (medication && medication.code) {
          for (const coding of medication.code.coding) {
            if (coding.system === rxnormSystemURL || coding.system === rxnormSystemOID) {
              rxcuis.push(coding.code);

              if (medicationName === undefined && coding.display) {
                medicationName = coding.display;
              }
            }
          }
        }
      }
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

    const where = mc.recorder ? mc.recorder.display : '';
    return {
      type: mc.resourceType,
      fhirId: mc.id,
      status: mc.status,
      medication: medicationName ?? 'missing',
      RxCui: rxcuis,
      dosages: mc.dosageInstruction ? mc.dosageInstruction[0].text : '',
      requestedBy: mc.requester ? mc.requester.display : '',
      reasons: condition ? getConceptDisplayString(condition.code) : '',
      effectiveDate: mc.authoredOn ? displayDate(mc.authoredOn) : '',
      refillsPermitted: 'Unknown',
      notes: mc.note ? convertNoteToString(mc.note) : '',
      source: where
    }
  }));

  await appendFlagsToMedicationSummary(mappedMedicationRequest);

  mappedMedicationRequest.forEach(mr => {
    const status = mr.status;
    const statusKey = ACTIVE_KEYS[status];

    switch (statusKey) {
      case ACTIVE_STATUS.ACTIVE:
        activeMedications.push(mr);
        break;
      case ACTIVE_STATUS.INACTIVE:
        inactiveMedications.push(mr);
        break;
      case ACTIVE_STATUS.IGNORE:
      default:
        log.debug({serviceName: 'getSummaryMedicationRequests', result: {status}});
        break;
    }
  });

  const mccMedicationSummaryRequest: MccMedicationSummaryList = {
    activeMedications,
    inactiveMedications,
  };


  log.info(
    `getSummaryMedicationRequests - successful`
  );

  log.debug({serviceName: 'getSummaryMedicationRequests', result: {mccMedicationSummaryRequest}});

  return mccMedicationSummaryRequest;
};

export const getMedicationRequests = async (): Promise<MccMedication[]> => {
  const client = await FHIR.oauth2.ready();

  const queryPath = `MedicationRequest`;
  const medicationRequest: fhirclient.JsonArray = await client.patient.request(
    queryPath, fhirOptions
  );

  const filteredMedicationRequests: MccMedication[] = resourcesFrom(
    medicationRequest
  ) as MccMedication[];

  log.info(
    `getMedicationRequests - successful`
  );

  log.debug({serviceName: 'getMedicationRequests', result: filteredMedicationRequests});

  return filteredMedicationRequests;
};

export const getMedicationRequest = async (id: string): Promise<MccMedication> => {
  if (!id) {
    log.error('getMedicationRequest - id not found');
    return notFoundResponse as unknown as MccMedication;
  }

  const client = await FHIR.oauth2.ready();

  const queryPath = `MedicationRequest?_id=${id}`;
  const medicationRequest: fhirclient.JsonObject = await client.patient.request(
    queryPath
  );

  const filteredMedicationRequest: MccMedication = resourcesFromObject(
    medicationRequest
  ) as MccMedication;

  log.info(`getMedicationRequest - successful with id ${id}`);
  log.debug({serviceName: 'getMedicationRequest', result: filteredMedicationRequest});
  return filteredMedicationRequest;
};

export const getMedicationByReference = async (reference: string): Promise<Medication> => {
  if (!reference) {
    return undefined;
  }

  try {
    const client = await FHIR.oauth2.ready();
    const medication: Medication = await client.request(reference);
    log.debug({serviceName: 'getMedicationByReference', result: medication});
    return medication;

  } catch (err) {
    log.error(err);
    return undefined;
  }
};

export const appendFlagsToMedicationSummary = async (mappedMedicationRequest: MccMedicationSummary[]): Promise<void> => {
  if (!mappedMedicationRequest) return;

  let medicationFlagArr: Array<MedicationFlag> = JSON.parse(JSON.stringify(MedicationFlagConfig).toString());

  for (let summary of mappedMedicationRequest) {
    try {
      if (summary.RxCui && summary.RxCui.length > 0) {
        // storer: RxCui will be null if the MedicationRequest's medication is represented as a reference to a Medication resource,
        //         because the Medication resource isn't included in the source resource array.  Medication resources appear to not be pulled
        //         in addition to their referencing MedicationRequest resources.
        console.debug("appendFlagsToMedicationSummaries: got Medication with RxCui: " + summary.RxCui);
        summary.RxClass = await getRxClass(summary.RxCui);

        if (summary.RxClass && summary.RxClass.length > 0) {
          console.debug("appendFlagsToMedicationSummaries: got RxClass=" + JSON.stringify(summary.RxClass));
          let rxClassList: string[] = Array.from(new Set<string>(summary.RxClass.map(r => r.ClassId)));
          console.debug("appendFlagsToMedicationSummaries: RxClassList=" + rxClassList);
          let flags: MedicationFlag[] = [];
          medicationFlagArr.forEach((flag: MedicationFlag) => {
            if (rxClassList.some(r => flag.rxClassList.includes(r))) {
              flags.push(flag);
            }
          });
          summary.Flags = flags;
        }

      } else {
        console.debug("appendFlagsToMedicationSummaries: Medication Summary had no RxCui");
      }
    } catch (err) {
      console.error("Error getting RxClass for RxCui=" + summary.RxCui + ": " + err);
    }
  }
};

export const getRxClass = async (rxcuiList: string[]): Promise<RxClassSummary[]> => {
  console.debug('getRxClass: executing with RxCUI=' + rxcuiList);  // 197770

  // note : it may be the case that this RxCUI has been replaced by another RxCUI in the RxNav system
  //        consider these two medications:
  //            404673 - memantine - RxNav remapped to 996563
  //            153357 - donepezil - RxNav remapped to 997224
  //        see: https://mor.nlm.nih.gov/RxNav/search?searchBy=NameOrCode&searchTerm=153357
  //        the old RxCUI won't return any data in the fetch downcode, just an empty JSON object.
  //
  // todo : investigate to see if there's an API that can give us the current RxCUI for a given RxCUI
  //        and put that here, so that downstream logic is using the current RxCUI

  let promiseArr: Promise<RxClassSummary[]>[] = [];
  for (let rxcui of rxcuiList) {
    try {
      console.debug("getRxClass: building Promise for RxCUI=" + rxcui);
      let promise: Promise<RxClassSummary[]> = new Promise<RxClassSummary[]>((resolve, reject) => {
        fetch('https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=' + rxcui + '&relaSource=ATCPROD')
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Network response was not OK (' + response.status + ')');
            }

          }).then(json => {
            console.debug("getRxClass: json=" + JSON.stringify(json));
            let arr: RxClassSummary[] = [];
            if (json && json.rxclassDrugInfoList && json.rxclassDrugInfoList.rxclassDrugInfo) {
            for (let rxcdi of json?.rxclassDrugInfoList?.rxclassDrugInfo) {
              try {
                // first, ensure that we only consider those rxclassDrugInfo items that reference
                // RxCuis that we care about
                let mc = rxcdi?.minConcept;
                if (!rxcuiList.includes(mc.rxcui)) {
                  continue;
                }

                console.debug("getRxClass: found minConcept with RxCui=" + mc.rxcui);

                // this rxClassDrugInfo item references a minConcept with an rxcui that is in the list
                // that we care about.  grab its class and add it to the list

                let rxcmci = rxcdi?.rxclassMinConceptItem;
                if (rxcmci?.classType === "ATC1-4") {
                  console.debug("getRxClass: adding classId=" + rxcmci.classId +
                    ", className=" + rxcmci.className + " for RxCui=" + mc.rxcui);

                  let obj: RxClassSummary = {
                    RxCui: mc.rxcui,
                    ClassId: rxcmci.classId,
                    ClassName: rxcmci.className
                  };

                  arr.push(obj);
                }

              } catch (err) {
                console.error("getRxClass: error processing rxcdi for RxCui=" + rxcui + ": " + err);
              }
            }

          } else {
            try {
              console.warn("getRxClass: No RxClass info found for RxCui=" + rxcui +
                " - perhaps this has been replaced by another RxCui?");

            } catch (err) {
              console.error("getRxClass: error logging warning for RxCui=" + rxcui + ": " + err);
            }
          }

          resolve(arr);

        }).catch(err => {
          console.error("getRxClass: error=" + err);
          reject(err);
        });
      });
      promiseArr.push(promise);

    } catch (err) {
      console.error("getRxClass: error building Promise for RxCui=" + rxcui + ": " + err);
    }
  }

  const rawResults: RxClassSummary[][] = await Promise.all(promiseArr);
  console.debug("getRxClass: all promises settled!  iterating -");

  let results: RxClassSummary[] = [];
  let foundList: string[] = [];
   rawResults.forEach((value) => {
      for (let rxClassSummary of value) {
        let key: string = rxClassSummary.RxCui + "-" + rxClassSummary.ClassId;
        if (!foundList.includes(key)) {
          results.push(rxClassSummary);
          foundList.push(key);
        }
      }
  });

  return results;
}
