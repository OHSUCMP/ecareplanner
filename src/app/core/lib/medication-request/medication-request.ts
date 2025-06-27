/* eslint-disable functional/immutable-data */
import { CodeableConcept } from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

import { MccMedication, MccMedicationSummary, MccMedicationSummaryList } from '../../types/mcc-types';
import log from '../../utils/loglevel';
import { getConditionFromUrl } from '../careplan';
import { getConceptDisplayString, getSupplementalDataClient } from '../goal/goal.util';
import { convertNoteToString } from '../observation/observation.util';
import { displayDate } from '../service-request/service-request.util';

import {
  notFoundResponse,
  resourcesFrom,
  resourcesFromObject,
  resourcesFromObjectArray,
} from './medication-request.util';

enum ACTIVE_STATUS {
  ACTIVE,
  INACTIVE,
  IGNORE
}

const ACTIVE_KEYS = {
  active: ACTIVE_STATUS.ACTIVE,
  'on-hold': ACTIVE_STATUS.INACTIVE,
  cancelled: ACTIVE_STATUS.INACTIVE,
  'completed': ACTIVE_STATUS.INACTIVE,
  'entered-in-error': ACTIVE_STATUS.IGNORE,
  stopped: ACTIVE_STATUS.INACTIVE,
  unknown: ACTIVE_STATUS.INACTIVE,
}


const getSupplementalData = async (launchURL: string, sdsClient: Client): Promise<MccMedication[]> => {
  let allThirdPartyMccMedicationSummary: MccMedication[] = [];
  try {

    const linkages = await sdsClient.request('Linkage?item=Patient/' + sdsClient.patient.id);
    const urlSet = new Set();
    urlSet.add(launchURL)
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
          const response = await sdsClient.request(fhirHeaderRequestOption);
          const thirdPartyMccMedication: MccMedication[] = resourcesFromObjectArray(response) as MccMedication[];
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
    console.error("An error occurred: " + error.message);
  }

  return allThirdPartyMccMedicationSummary;
};


export const getSummaryMedicationRequests = async (sdsURL: string, authURL: string, sdsScope: string): Promise<MccMedicationSummaryList> => {

  const theCurrentClient = await FHIR.oauth2.ready();

  const sdsClient: Client = await getSupplementalDataClient(theCurrentClient, sdsURL, authURL, sdsScope);

  const activeMedications: MccMedicationSummary[] = [];
  const inactiveMedications: MccMedicationSummary[] = [];

  const queryPath = `MedicationRequest`;
  const medicationRequest: fhirclient.JsonObject = await theCurrentClient.patient.request(
    queryPath
  );

  log.debug({ serviceName: 'getSummaryMedicationRequests', result: { medicationRequest } });

  const medicationRequests: MccMedication[] = resourcesFromObjectArray(
    medicationRequest
  ) as MccMedication[];

  const sdsMedicationRequests: MccMedication[] = await getSupplementalData(theCurrentClient.state.serverUrl, sdsClient);


  const allMedicationRequests: MccMedication[] = [...medicationRequests, ...sdsMedicationRequests];

  const mappedMedicationRequest: MccMedicationSummary[] = await Promise.all(allMedicationRequests.map(async (mc) => {
    const condition = mc.reasonReference ? await getConditionFromUrl(mc.reasonReference[0].reference) : { code: [] as CodeableConcept }
    const where = mc.recorder ? mc.recorder.display : '';
    return {
      type: mc.resourceType,
      fhirId: mc.id,
      status: mc.status,
      medication: mc.medicationCodeableConcept ? mc.medicationCodeableConcept.text : mc.medicationReference ? mc.medicationReference.display : 'missing',
      dosages: mc.dosageInstruction ? mc.dosageInstruction[0].text : '',
      requestedBy: mc.requester ? mc.requester.display : '',
      reasons: condition ? getConceptDisplayString(condition.code) : '',
      effectiveDate: mc.authoredOn ? displayDate(mc.authoredOn) : '',
      refillsPermitted: 'Unknown',
      notes: mc.note ? convertNoteToString(mc.note) : '',
      source: where
    }
  }))

  mappedMedicationRequest.forEach(mr => {
    const status = mr.status
    const statusKey = ACTIVE_KEYS[status]

    switch (statusKey) {
      case ACTIVE_STATUS.ACTIVE:
        activeMedications.push(mr)
        break
      case ACTIVE_STATUS.INACTIVE:
        inactiveMedications.push(mr)
        break
      case ACTIVE_STATUS.IGNORE:
      default:
        log.debug({ serviceName: 'getSummaryMedicationRequests', result: { status } });
        break;
    }
  })

  const mccMedicationSummaryRequest: MccMedicationSummaryList = {
    activeMedications,
    inactiveMedications,
  };


  log.info(
    `getSummaryMedicationRequests - successful`
  );

  log.debug({ serviceName: 'getSummaryMedicationRequests', result: { mccMedicationSummaryRequest } });

  return mccMedicationSummaryRequest;
};

export const getMedicationRequests = async (): Promise<MccMedication[]> => {
  const client = await FHIR.oauth2.ready();

  const queryPath = `MedicationRequest`;
  const goalRequest: fhirclient.JsonArray = await client.patient.request(
    queryPath
  );

  // goal from problem list item
  const filteredMedicationRequests: MccMedication[] = resourcesFrom(
    goalRequest
  ) as MccMedication[];

  log.info(
    `getMedicationRequests - successful`
  );

  log.debug({ serviceName: 'getMedicationRequests', result: filteredMedicationRequests });

  return filteredMedicationRequests;
};

export const getMedicationRequest = async (id: string): Promise<MccMedication> => {
  if (!id) {
    log.error('getMedicationRequest - id not found');
    return notFoundResponse as unknown as MccMedication;
  }

  const client = await FHIR.oauth2.ready();

  const queryPath = `MedicationRequest?_id=${id}`;
  const goalRequest: fhirclient.JsonObject = await client.patient.request(
    queryPath
  );

  const filteredMedicationRequest: MccMedication = resourcesFromObject(
    goalRequest
  ) as MccMedication;

  log.info(
    `getMedicationRequest - successful with id ${id}`
  );
  log.debug({ serviceName: 'getMedicationRequest', result: filteredMedicationRequest });
  return filteredMedicationRequest;
};
