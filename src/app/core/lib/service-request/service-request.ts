import { ServiceRequest } from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';
import { MccServiceRequestSummary } from '../../types/mcc-types';
import { getCondition } from '../condition';
import { getSupplementalDataClient } from '../goal/goal.util';
import {
  displayConcept,
  resourcesFromObjectArray, transformToServiceRequest,
} from './service-request.util';



const getSupplementalData = async (launchURL: string, sdsClient: Client): Promise<ServiceRequest[]> => {
  let allThirdPartyServiceRequests: ServiceRequest[] = [];
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
          fhirHeaderRequestOption.url = 'ServiceRequest?status=active&subject=' + item2.resource.reference;
          const response = await sdsClient.request(fhirHeaderRequestOption);
          const thirdPartyServiceRequests: ServiceRequest[] = resourcesFromObjectArray(response) as ServiceRequest[];
          thirdPartyServiceRequests.forEach(serviceRequest => {

            serviceRequest.locationReference.push({
              display: item2.resource.extension[0].valueUrl
            });
            allThirdPartyServiceRequests.push(serviceRequest);
          });
        }
      }
    }
  } catch (error) {
    // Code to handle the error
    console.error("An error occurred: " + error.message);
  }

  return allThirdPartyServiceRequests;
};


async function updateServiceRequestsReferences(serviceRequestResults: ServiceRequest[]) {

  const updates = new Map<string, string>();

  const promiseArray = serviceRequestResults.map(async serviceRequestResult => {
    if (serviceRequestResult.reasonReference) {
      const perhaps = await getCondition(serviceRequestResult.reasonReference[0].reference.split("/")[1]);
      if (perhaps.code) {
        updates.set(serviceRequestResult.reasonReference[0].reference, displayConcept(perhaps.code));
      } else {
        updates.set(serviceRequestResult.reasonReference[0].reference, 'MISSING');
      }

    }
  });
  await Promise.all(promiseArray);
  return updates;
}

export const getSummaryServiceRequest = async (sdsURL: string, authURL: string, sdsScope: string): Promise<MccServiceRequestSummary[]> => {

  const theCurrentClient = await FHIR.oauth2.ready();
  const sdsClient: Client = await getSupplementalDataClient(theCurrentClient, sdsURL, authURL, sdsScope);
  const queryPath = `ServiceRequest?status=active`;
  const serviceRequest: fhirclient.JsonObject = await theCurrentClient.patient.request(
    queryPath
  );
  const sdsMedicationRequests: ServiceRequest[] = await getSupplementalData(theCurrentClient.state.serverUrl, sdsClient);
  const serviceRequestResults: ServiceRequest[] = resourcesFromObjectArray(
    serviceRequest
  ) as ServiceRequest[];
  const allMedicationRequests: ServiceRequest[] = [...serviceRequestResults, ...sdsMedicationRequests];
  const conditionMap = await updateServiceRequestsReferences(allMedicationRequests);
  const mappedServiceRequests = allMedicationRequests.map(
    function (x) { return transformToServiceRequest(x, conditionMap); }
  );
  return mappedServiceRequests;
};
