/* eslint-disable functional/immutable-data */
// import localForage from 'localforage'
import { GoalTarget, QuestionnaireResponse, QuestionnaireResponseItem, Resource } from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

import { MccAssessment, MCCAssessmentResponseItem, MccGoal, MccGoalList, MccGoalSummary } from '../../types/mcc-types';
import log from '../../utils/loglevel';
import { displayDate } from '../service-request/service-request.util';
import { fhirOptions, resourcesFrom, resourcesFromObject, notFoundResponse} from '../../utils/fhir';

import {
  getSupplementalDataClient,
  transformToMccGoalSummary,
} from './goal.util';

enum ACTIVE_STATUS {
  ACTIVE,
  INACTIVE,
  IGNORE
}

// const LF_ID = '-MCP'
// const fcCurrentStateKey = 'fhir-client-state' + LF_ID

const ACTIVE_KEYS = {
  proposed: ACTIVE_STATUS.ACTIVE,
  planned: ACTIVE_STATUS.ACTIVE,
  accepted: ACTIVE_STATUS.ACTIVE,
  'on-hold': ACTIVE_STATUS.ACTIVE,
  unknown: ACTIVE_STATUS.ACTIVE,
  completed: ACTIVE_STATUS.INACTIVE,
  cancelled: ACTIVE_STATUS.INACTIVE,
  rejected: ACTIVE_STATUS.ACTIVE,
  active: ACTIVE_STATUS.ACTIVE,
  'entered-in-error': ACTIVE_STATUS.IGNORE,
}


export const getSupplementalData = async (launchURL: string, sdsClient: Client): Promise<MccGoalSummary[]> => {
  let allThirdPartyMappedGoals: MccGoalSummary[] = [];
  try {

    const linkages = await sdsClient.request('Linkage?item=Patient/' + sdsClient.patient.id);
    console.log("patientId +linkages " + JSON.stringify(linkages));
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
          fhirHeaderRequestOption.url = 'Goal?subject=' + item2.resource.reference;

          // Fetch third-party goals
          const response = await sdsClient.request(fhirHeaderRequestOption, fhirOptions);

          // Process third-party goals
          const thirdPartyGoals: MccGoal[] = resourcesFrom(response) as MccGoal[];
          const thirdPartyMappedGoals: MccGoalSummary[] = thirdPartyGoals.map(transformToMccGoalSummary);

          thirdPartyMappedGoals.forEach(goal => {
            goal.expressedBy = (goal.expressedBy ? goal.expressedBy : '');

            goal.source = item2.resource.extension[0].valueUrl
            allThirdPartyMappedGoals.push(goal);
          });
        }
      }
    }
  } catch (error) {
    // Code to handle the error
    console.error("An error occurred: " + error.message);
  }

  return allThirdPartyMappedGoals;
};


export const getAssessments = async (sdsURL: string, authURL: string, sdsScope: string): Promise<MccAssessment[]> => {

  let assessments: MccAssessment[] = []

  try {

    const theCurrentClient: Client = await FHIR.oauth2.ready();
    let sdsClient = await getSupplementalDataClient(theCurrentClient, sdsURL, authURL, sdsScope);

    if (sdsClient) {
      const sdsQuestionnaireResponse: fhirclient.JsonArray = await sdsClient.patient.request('QuestionnaireResponse', fhirOptions);

      const sdsQuestionnaireResponseArray: Resource[] = resourcesFrom(
        sdsQuestionnaireResponse
      );

      assessments = sdsQuestionnaireResponseArray.map(transformToAssessment);

    }

  } catch (error) {
    console.error(`getAssessments Error: ${error.message}`);
  } finally {
    console.log("Operation complete.");
    return assessments;
  }
}



export const getSummaryGoals = async (sdsURL: string, authURL: string, sdsScope: string): Promise<MccGoalList> => {


  const allGoals: MccGoalSummary[] = [];
  const activePatientGoals: MccGoalSummary[] = [];
  const activeClinicalGoals: MccGoalSummary[] = [];
  const activeTargets: GoalTarget[] = [];
  const inactivePatientGoals: MccGoalSummary[] = [];
  const inactiveClinicalGoals: MccGoalSummary[] = [];
  const sdsPatientGoals: MccGoalSummary[] = [];
  const theCurrentClient: Client = await FHIR.oauth2.ready();
  let sdsClient = await getSupplementalDataClient(theCurrentClient, sdsURL, authURL, sdsScope)

  const queryPath = `Goal`;

  let sdsMappedGoals: MccGoalSummary[] = []
  if (sdsClient) {
    const sdsGoalRequest: fhirclient.JsonArray = await sdsClient.patient.request(
      queryPath, fhirOptions
    );
    const sdsFilterGoals: MccGoal[] = resourcesFrom(
      sdsGoalRequest
    ) as MccGoal[];
    sdsMappedGoals.push(...sdsFilterGoals.map(transformToMccGoalSummary));
  }

  const goalRequest: fhirclient.JsonArray = await theCurrentClient.patient.request(
    queryPath, fhirOptions
  );

  const filteredGoals: MccGoal[] = resourcesFrom(
    goalRequest
  ) as MccGoal[];

  const mappedGoals: MccGoalSummary[] = filteredGoals.map(transformToMccGoalSummary);

  sdsMappedGoals.forEach(goal => {
    mappedGoals.push(goal)
  })

  const thirdPartyStuff = await getSupplementalData(theCurrentClient.state.serverUrl, sdsClient);

  if (thirdPartyStuff) {
    thirdPartyStuff.forEach(goal => {
      mappedGoals.push(goal)
    })
  }

  mappedGoals.forEach(goal => {

    let activeStatus = ACTIVE_KEYS[goal.lifecycleStatus]

    if (isNaN(activeStatus) && !activeStatus) {
      activeStatus = ACTIVE_STATUS.IGNORE;
      allGoals.push(goal)
    }

    switch (activeStatus) {
      case ACTIVE_STATUS.ACTIVE:
        allGoals.push(goal)
        if (goal.expressedByType === 'Patient') {
          activePatientGoals.push(goal)
        } else {
          activeClinicalGoals.push(goal)
        }
        activeTargets.push(...(goal.targets ? goal.targets : []))
        break;
      case ACTIVE_STATUS.INACTIVE:
        allGoals.push(goal)
        if (goal.expressedByType === 'Patient') {
          inactivePatientGoals.push(goal)
        } else {
          inactiveClinicalGoals.push(goal)
        }
        break;
      case ACTIVE_STATUS.IGNORE:
      default:
        break;
    }
  })


  const mccGoalList: MccGoalList = {
    allGoals,
    activeClinicalGoals,
    activePatientGoals,
    activeTargets,
    inactiveClinicalGoals,
    inactivePatientGoals,
    sdsPatientGoals
  };


  log.info(
    `getSummaryGoals - successful`
  );

  return mccGoalList;
};

export const getGoal = async (id: string): Promise<MccGoal> => {
  if (!id) {
    log.error('getGoal - id not found');
    return notFoundResponse as unknown as MccGoal;
  }

  const client = await FHIR.oauth2.ready();

  const queryPath = `Goal?_id=${id}`;
  const goalRequest: fhirclient.JsonObject = await client.patient.request(
    queryPath
  );

  const filteredGoal: MccGoal = resourcesFromObject(
    goalRequest
  ) as MccGoal;

  log.info(
    `getGoal - successful with id ${id}`
  );
  log.debug({ serviceName: 'getGoal', result: filteredGoal });
  return filteredGoal;
};

export const createGoal = async (goal: MccGoal): Promise<Resource> => {
  if (!goal) {
    log.error('Goal not found');
    return {
      resourceType: 'Error',
      id: 'Missing parameter'
    };
  }
  const client = await FHIR.oauth2.ready();
  try {
    const createResult = await client.create({ resourceType: 'Goal', body: goal })

    return createResult as Resource;
  } catch (error) {
    log.error(error)
    return {
      resourceType: 'Error',
      id: 'Error while creating goal'
    }
  }

}
function transformToAssessment(transformToAssessment: QuestionnaireResponse): MccAssessment {

  const transformedData: MccAssessment = {
    title: transformToAssessment._questionnaire.extension[0].valueString,
    date: displayDate(transformToAssessment.authored),
    questions: []
  }

  transformToAssessment.item.forEach(item1 => {
    transformedData.questions.push(getAnswer(item1));
    if (item1.item) {
      transformedData.questions.push(...item1.item.map(getAnswer));
    }

  });

  return transformedData;

}



function getAnswer(getAnswer: QuestionnaireResponseItem): MCCAssessmentResponseItem {
  const response: MCCAssessmentResponseItem = {
    question: getAnswer.text,
    answer: getAnswer.answer ? getAnswer.answer[0].valueCoding ? getAnswer.answer[0].valueCoding.display : getAnswer.answer[0].valueBoolean ? JSON.stringify(getAnswer.answer[0].valueBoolean) : JSON.stringify(getAnswer.answer[0]) : ''
  }
  return response;
}

