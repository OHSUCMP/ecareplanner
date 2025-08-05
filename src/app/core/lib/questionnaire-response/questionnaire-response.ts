import { QuestionnaireResponse, QuestionnaireResponseItem, Resource } from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

import { EcpAssessment, EcpAssessmentSummary, EcpScore, MccAssessment, MCCAssessmentResponseItem } from '../../types/mcc-types';
import {getObservationsByCategory} from '../observation/observation';
import { displayDate } from '../service-request/service-request.util';
import { fhirOptions, resourcesFrom, getSupplementalDataClient} from '../../utils/fhir';
import {
    scoredQuestionnaireMetadata, getScore, getQuestionnaireResponsesFromObservations
} from './questionnaire-response.util';

export const getAssessments = async (sdsURL: string, authURL: string, sdsScope: string): Promise<MccAssessment[]> => {

  let assessments: EcpAssessmentSummary[] = []

  try {

    const theCurrentClient: Client = await FHIR.oauth2.ready();
    let sdsClient = await getSupplementalDataClient(theCurrentClient, sdsURL, authURL, sdsScope);

    if (sdsClient) {
        const sdsQuestionnaireResponse: fhirclient.JsonArray = await sdsClient.patient.request('QuestionnaireResponse', fhirOptions);

        const sdsQuestionnaireResponseArray: Resource[] = resourcesFrom(
            sdsQuestionnaireResponse
        );

        const surveyObservations = await getObservationsByCategory('survey');
        let allResponses = sdsQuestionnaireResponseArray;
        allResponses.push(...getQuestionnaireResponsesFromObservations(surveyObservations));

        const groupedByUrl = allResponses.reduce((acc, curr) => {
            const key = (curr as QuestionnaireResponse).questionnaire;
            if (!acc[key]) acc[key] = [];
            acc[key].push(curr);
            return acc;
        }, {} as Record<string, Resource[]>);

        // Pass each resource array to the transformToAssessmentSummary function
        Object.values(groupedByUrl).forEach((resourcesToTransform: Resource[]) => {
            if (resourcesToTransform.length > 0) {
                assessments.push(transformToAssessmentSummary(resourcesToTransform as QuestionnaireResponse[]));
            }
        });
    }

  } catch (error) {
    console.error(`getAssessments Error: ${error.message}`);
  } finally {
    console.log("Operation complete.");
    return assessments;
  }
}

function transformToAssessmentSummary(resourcesToTransform: QuestionnaireResponse[]): EcpAssessmentSummary {
    // Check if there is a metadata entry for the questionnaire
    const metadata = scoredQuestionnaireMetadata.find(metadata => metadata.url === resourcesToTransform[0].questionnaire);
    let assessmentSummary: EcpAssessmentSummary = {
        title: metadata ? metadata.display : (resourcesToTransform[0]?._questionnaire?.extension[0]?.valueString || resourcesToTransform[0].questionnaire),
        isScored: !!metadata,
        responses: []
    }

    resourcesToTransform.forEach((response: QuestionnaireResponse) => {
        
        const assessment: EcpAssessment = {
            date: displayDate(response.authored),
            score: metadata ? getScore(response, metadata) : undefined,
            questions: []
        };

        response.item.forEach(qItem => {
            assessment.questions.push(getAnswer(qItem));
            if (qItem.item) {
                assessment.questions.push(...qItem.item.map(getAnswer));
            }

        });

        assessmentSummary.responses.push(assessment);
    });

    // Sort responses by date (most recent first)
    assessmentSummary.responses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return assessmentSummary;
}

function getAnswer(getAnswer: QuestionnaireResponseItem): MCCAssessmentResponseItem {
  const response: MCCAssessmentResponseItem = {
    question: getAnswer.text,
    answer: getAnswer.answer ? getAnswer.answer[0].valueCoding ? getAnswer.answer[0].valueCoding.display : getAnswer.answer[0].valueBoolean ? JSON.stringify(getAnswer.answer[0].valueBoolean) : JSON.stringify(getAnswer.answer[0]) : ''
  }
  return response;
}


