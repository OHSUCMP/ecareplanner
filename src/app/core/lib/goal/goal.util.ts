import { CodeableConcept, Resource } from 'fhir/r4';
import { fhirclient } from 'fhirclient/lib/types';
import FHIR from 'fhirclient'
import Client from 'fhirclient/lib/Client'
import { MccGoal, MccGoalSummary } from '../../types/mcc-types';
import localForage from 'localforage'
import { displayDate } from '../service-request/service-request.util';
// import { fhirclient } from 'fhirclient/lib/types'

const LF_ID = '-MCP'
// const fcCurrentStateKey = 'fhir-client-state' + LF_ID
const fcAllStatesKey = 'fhir-client-states-array' + LF_ID
// const selectedEndpointsKey = 'selected-endpoints' + LF_ID
// const launcherDataKey = 'launcher-data' + LF_ID

export const saveFHIRAccessData = async (key: string, data: any, isArray: boolean): Promise<any> => {
  if (data) {
    if (!isArray) {
      // expiresAt is vital, without that, it means we didn't actually log in
      // e.g.back button pressed or window closed during process
      // The data we get back in the above case is not useful so there is no reason to overwrite
      // serverUrl and clientId are vital as they are used for object identification in the array
      // as well as recalling the data itself, reconnecting, and reauthorizing
      if (data.expiresAt && data.serverUrl && data.clientId) {
        console.log(`Object: localForage.setItem(key: ${key}, data: <see next line>`, data)
        return await localForage.setItem(key, data as fhirclient.ClientState)
      } else {
        console.log('Ignore previous logs, NOT updating data in local storage:')
        console.log('Data is missing data.expiresAt || data.serverUrl || data.clientId')
      }
    } else {
      // We don't need to check contents of array before saving here
      // as we know it was checked before saving currentLocalFhirClientState (the object) (see connected if block)
      // If this were a back button situaiton, it will overwrite with the correct object
      // Not the invalid new one, as the invalid new one won't exist in our persisted state to copy from
      console.log(`Array: localForage.setItem(key: ${key}, data: <see next line>`, data as Array<fhirclient.ClientState>)
      return await localForage.setItem(key, data)
    }
  }
}



const isFHIRAccessData = async (key: string): Promise<boolean> => {
  try {
    const data: any = await localForage.getItem(key)
    // If the key does not exist, getItem() in the localForage API will return null specifically to indicate it
    if (data !== null) {
      console.log('Key ' + key + ' exists in localForage')
      return true
    }
    console.log('Key ' + key + ' does NOT exist in localForage')
    return false
  } catch (e) {
    console.log(`Failure calling localForage.getItem(key) from persistenceService.isFHIRAccessData: ${e}`)
    return false
  }
}

const getFHIRAccessData = async (key: string): Promise<any> => {
  try {
    const isData: boolean = await isFHIRAccessData(key)
    if (isData) {
      return await localForage.getItem(key)
    }
  } catch (e) {
    console.log(`Failure calling isFHIRAccessData(key) from persistenceService.getFHIRAccessData: ${e}`)
  }
}


export const extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint =
  async (givenEndpoint: string): Promise<fhirclient.ClientState | undefined> => {
    // TODO: Create getter function for fcCurrentStateKey serverUrl and use that here
    console.log('enter extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint()')
    console.log('givenEndpoint:', givenEndpoint)

    const arrayOfFhirAccessDataObjects: Array<fhirclient.ClientState> =
      await getFHIRAccessData(fcAllStatesKey) as Array<fhirclient.ClientState>
    console.log('arrayOfFhirAccessDataObjects:', JSON.stringify(arrayOfFhirAccessDataObjects))

    if (arrayOfFhirAccessDataObjects) {
      console.log('arrayOfFhirAccessDataObject is truthy')
      return arrayOfFhirAccessDataObjects.find((curFhirAccessDataObject: fhirclient.ClientState) => {
        console.log('inside arrayOfFhirAccessDataObjects.find((curFhirAccessDataObject) function')
        const endpointInSavedData = curFhirAccessDataObject?.serverUrl
        console.log('endpointInSavedData:', endpointInSavedData)
        return givenEndpoint === endpointInSavedData
      })
    }

    return null;
  }



export const getSupplementalDataClient = async (currentClient: Client, sdsURL: string, authURL: string, sdsScope: string): Promise<Client | undefined> => {



  console.log('getSupplementalDataClient Start');
  let sdsClient: Client | undefined
  const sdsClientId = null

  console.log('getSupplementalDataClient authURL: ', authURL)
  console.log('getSupplementalDataClient sdsURL: ', sdsURL)
  console.log('getSupplementalDataClient sdsScope: ', sdsScope)

  if (sdsClientId && sdsURL) {
    console.log('getSupplementalDataClient if (sdsClientId && sdsURL) == true; authorize in using client id')
    const sdsFhirAccessDataObject: fhirclient.ClientState | undefined =
      await extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint(sdsURL)
    if (sdsFhirAccessDataObject) {
      sdsClient = FHIR.client(sdsFhirAccessDataObject)
    }
  } else if (authURL && sdsURL && sdsScope) {
    console.log('getSupplementalDataClient else if (authURL && sdsURL && sdsScope) == true; authorize using existing token')
    const authFhirAccessDataObject = JSON.parse(JSON.stringify(currentClient.state));
    if (authFhirAccessDataObject) {
      console.log("getSupplementalDataClient authFhirAccessDataObject is truthy")
      // Replace the serverURL and client scope with Shared Data endpoint and scope
      let sdsFhirAccessDataObject = authFhirAccessDataObject
      sdsFhirAccessDataObject.serverUrl = sdsURL
      sdsFhirAccessDataObject.scope = sdsScope
      if (sdsFhirAccessDataObject.tokenResponse) {
        sdsFhirAccessDataObject.tokenResponse.scope = sdsScope
      }
      // Connect to the client
      let sdsClient: Client | undefined
      sdsClient = FHIR.client(sdsFhirAccessDataObject)
      const linkages = await sdsClient.request('Linkage');
      if (sdsFhirAccessDataObject.tokenResponse) {
        if (linkages.entry === undefined) {
          console.log('getSupplementalDataClient Create Patient:');
          const patientResource = {
            resourceType: 'Patient'
          };
          await sdsClient.create(patientResource).then(async (response) => {
            console.log('getSupplementalDataClient Patient resource created successfully:', response);
            console.log('getSupplementalDataClient start wait for patient create:');
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 sec
            console.log('getSupplementalDataClient end wait for patient create:');
            const yy = await sdsClient?.request('Linkage');
            console.log('getSupplementalDataClient Patient resource created linkage :' + JSON.stringify(yy));
            var patientReference = yy.entry[0].resource?.item[0].resource.reference
            var identifier = patientReference.split("/")
            if (sdsFhirAccessDataObject) {
              if (sdsFhirAccessDataObject.tokenResponse) {
                if (sdsFhirAccessDataObject.tokenResponse.patient) {
                  sdsFhirAccessDataObject.tokenResponse.patient = identifier[1]
                  sdsClient = FHIR.client(sdsFhirAccessDataObject)
                  return sdsClient
                }
              }
            }
            return sdsClient
          })
            .catch((error) => {
              console.error('getSupplementalDataClient Error creating Patient resource:', error);
            });
        } else {
          var patientReference = linkages.entry[0].resource?.item[0].resource.reference
          var identifier = patientReference.split("/")
          sdsFhirAccessDataObject.tokenResponse.patient = identifier[1]



          sdsClient = FHIR.client(sdsFhirAccessDataObject)

          console.info('getSupplementalDataClient sdsClient ' + JSON.stringify(sdsClient));

          return sdsClient
        }
      }
      console.log("getSupplementalDataClient FHIR.client(sdsFhirAccessDataObject) sdsClient = ", sdsClient)
    } else {
      console.log("getSupplementalDataClient() authFhirAccessDataObject is null, cannot connect to client")
    }
    return sdsClient
  }

  // TODO: Consider check here if SDS is empty and return undefined if so.
  // Unfortunately, we wouldn't have the specificity of the error (which is why it wasn't done here), but,
  // The program will always know at the most root level that this SDS is not useful, which may be better.
  // This includes that knowledge in ProviderLogin w/o the additional logic it has now to determine that.
  return sdsClient
}

export const fhirOptions: fhirclient.FhirOptions = {
  pageLimit: 0,
};

export const notFoundResponse = (code?: string) => ({
  code,
  status: 'notfound',
  value: {
    stringValue: 'No Data Available',
    valueType: 'string',
  },
});

export const resourcesFromObject = (
  response: fhirclient.JsonObject
): Resource => {
  const entry: fhirclient.JsonObject = response?.entry[0];

  const resource: any = entry?.resource;

  if (resource.resourceType === 'OperationOutcome') {
    return {} as any;
  }

  return resource;
};

export const resourcesFromObjectArray = (response: fhirclient.JsonObject): Resource[] => {
  if (response?.entry) {
    const entries: fhirclient.JsonArray = response?.entry as fhirclient.JsonArray;
    return entries.map((entry: fhirclient.JsonObject) => entry?.resource as any).filter((resource: any) => resource.resourceType !== 'OperationOutcome')
  }
  return new Array<MccGoal>();
};

export const resourcesFromObjectArray2 = (response: fhirclient.JsonObject): Resource[] => {
  if (response?.entry) {
    const entries: fhirclient.JsonArray = response?.entry as fhirclient.JsonArray;
    return entries.map((entry: fhirclient.JsonObject) => entry?.resource as any).filter((resource: any) => resource.resourceType !== 'OperationOutcome')
  }
  return new Array<Resource>();
};


export const resourcesFrom = (response: fhirclient.JsonArray): Resource[] => {
  const firstEntries = response[0] as fhirclient.JsonObject;
  const entries: fhirclient.JsonObject[] = firstEntries?.entry
    ? (firstEntries.entry as [fhirclient.JsonObject])
    : [];
  return entries
    .map((entry: fhirclient.JsonObject) => entry?.resource as any)
    .filter(
      (resource: Resource) => resource.resourceType !== 'OperationOutcome'
    );
};

export const getConceptDisplayString = (code: CodeableConcept): string => {

  if (code == null) {
    return '';
  }
  if (code.text) return code.text;

  if (code.coding) {
    return code.coding.reduce((_, curr) => curr.display, '');
  }

  return '';
};

export const transformToMccGoalSummary = (goal: MccGoal): MccGoalSummary => {
  const priority = getConceptDisplayString(goal.priority)
  const expressedByType = goal.expressedBy?.reference?.split('/')[0] || '';
  const description = getConceptDisplayString(goal.description);
  const achievementText = getConceptDisplayString(goal.achievementStatus);
  const lifecycleStatus = goal.lifecycleStatus || '';
  const startDateText = goal.startDate ? displayDate(goal.startDate) : '';
  const targetDateText = goal.target?.[0]?.dueDate ? displayDate(goal.target[0].dueDate) : undefined;
  // const addresses = goal.addresses?.[0]?.display || '';
  const expressedBy = goal.expressedBy?.display || '';
  const targets = goal.target?.map((target: any) => ({
    measure: target.measure || { coding: [], text: '' },
    value: {
      valueType: 'Quantity',
      quantityValue: target.detailQuantity || { unit: '', value: 0, system: '', code: '' },
    },
    dueType: target.dueDate ? 'date' : undefined,
  })) || [];
  // const useStartConcept = !!goal.startCodeableConcept
  const fhirid = goal.id || '';
  // const source = goal.

  return {
    priority,
    expressedByType,
    description,
    // achievementStatus,
    achievementText,
    lifecycleStatus,
    startDateText,
    targetDateText,
    // addresses,
    expressedBy,
    targets,
    // useStartConcept,
    fhirid
  };
}
