import { CodeableConcept } from 'fhir/r4';
import { fhirclient } from 'fhirclient/lib/types';
import { MccGoal, MccGoalSummary } from '../../types/mcc-types';
import localForage from 'localforage'
import { displayDate } from '../service-request/service-request.util';

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
