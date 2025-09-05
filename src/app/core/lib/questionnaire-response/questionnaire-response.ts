import { QuestionnaireResponse, Resource } from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

import { EcpAssessmentSummary } from '../../types/mcc-types';
import {getObservationsByCategory} from '../observation/observation';
import { fhirOptions, resourcesFrom, getSupplementalDataClient} from '../../utils/fhir';
import {
    filterQuestionnaireResponsesByConfigured, getQuestionnaireResponsesFromObservations, transformToAssessmentSummary
} from './questionnaire-response.util';

export const getAssessments = async (sdsURL: string, authURL: string, sdsScope: string, configuredQuestionnairesString: string): Promise<EcpAssessmentSummary[]> => {

  let assessments: EcpAssessmentSummary[] = []

  // Parse the configured questionnaires from a comma-separated string to an array
  const configuredQuestionnaires = configuredQuestionnairesString.split(',').map(q => q.trim());

  try {

    const theCurrentClient: Client = await FHIR.oauth2.ready();
    let sdsClient = await getSupplementalDataClient(theCurrentClient, sdsURL, authURL, sdsScope);

    if (sdsClient) {
        const sdsQuestionnaireResponse: fhirclient.JsonArray = await sdsClient.patient.request('QuestionnaireResponse', fhirOptions);

        const sdsQuestionnaireResponseArray: Resource[] = resourcesFrom(
            sdsQuestionnaireResponse
        );

        // TODO: AEY Filter to only configured questionnaires
        const surveyObservations = await getObservationsByCategory('survey');
        let allResponses = filterQuestionnaireResponsesByConfigured(sdsQuestionnaireResponseArray as QuestionnaireResponse[], configuredQuestionnaires);
        allResponses.push(...getQuestionnaireResponsesFromObservations(surveyObservations, configuredQuestionnaires));

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

