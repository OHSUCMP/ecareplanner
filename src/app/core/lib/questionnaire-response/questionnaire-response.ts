import { GoalTarget, QuestionnaireResponse, QuestionnaireResponseItem, Resource } from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

import { MccAssessment, MCCAssessmentResponseItem, MccGoal, MccGoalList, MccGoalSummary } from '../../types/mcc-types';
import log from '../../utils/loglevel';
import { displayDate } from '../service-request/service-request.util';
import { fhirOptions, resourcesFrom, resourcesFromObject, notFoundResponse, getSupplementalDataClient} from '../../utils/fhir';

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


