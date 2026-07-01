import { Observation, QuestionnaireResponse, Resource } from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

import { EcpAssessmentSummary } from '../../types/mcc-types';
import {getObservationsByCategory} from '../observation/observation';
import { fhirOptions, resourcesFrom, getSupplementalDataClient} from '../../utils/fhir';
import {
    filterQuestionnaireResponsesByConfigured, getQuestionnaireResponsesFromObservations, transformToAssessmentSummary
} from './questionnaire-response.util';

const getSupplementalSurveyObservations = async (launchURL: string, sdsClient: Client): Promise<Observation[]> => {
  let allThirdPartyMappedObservations: Observation[] = [];

  if (sdsClient) {
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
            fhirHeaderRequestOption.url = 'Observation?category=survey&subject=' + item2.resource.reference;

            // Fetch third-party goals
            const response: fhirclient.JsonArray = await sdsClient.request(fhirHeaderRequestOption, fhirOptions);

            // Process third-party survey observations
            const thirdPartySurveyObservations: Observation[] = resourcesFrom(response) as Observation[];
            thirdPartySurveyObservations.forEach(observation => {
              observation.meta = {
                source: undefined // The valueUrl is too long to be used as a source.
              };
              allThirdPartyMappedObservations.push(observation);
            });
          }
        }
      }
    } catch (error) {
      console.error("patientId An error occurred: " + error.message);
    }
  }
  return allThirdPartyMappedObservations;
};

const getSupplementalQuestionnaireResponses = async (launchURL: string, sdsClient: Client): Promise<QuestionnaireResponse[]> => {
  let allThirdParty: QuestionnaireResponse[] = [];

  if (sdsClient) {
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
            fhirHeaderRequestOption.url = 'QuestionnaireResponse?subject=' + item2.resource.reference;

            // Fetch third-party goals
            const response: fhirclient.JsonArray = await sdsClient.request(fhirHeaderRequestOption, fhirOptions);

            // Process third-party questionnaire responses
            const thirdPartyQuestionnaireResponses: QuestionnaireResponse[] = resourcesFrom(response) as QuestionnaireResponse[];
            allThirdParty.push(...thirdPartyQuestionnaireResponses);
            thirdPartyQuestionnaireResponses.forEach(qr => {
              qr.meta = {
                source: undefined // The valueUrl is too long to be used as a source.
              };
              allThirdParty.push(qr);
            });
          }
        }
      }
    } catch (error) {
      console.error("patientId An error occurred: " + error.message);
    }
  }
  return allThirdParty;
};

export const getAssessments = async (sdsURL: string, authURL: string, sdsScope: string, configuredQuestionnairesString: string): Promise<EcpAssessmentSummary[]> => {

  let assessments: EcpAssessmentSummary[] = []

  // Parse the configured questionnaires from a comma-separated string to an array
  const configuredQuestionnaires = configuredQuestionnairesString.split(',').map(q => q.trim());

  try {

    const client: Client = await FHIR.oauth2.ready();

    const queryPath = 'QuestionnaireResponse';
    const request: fhirclient.JsonArray = await client.patient.request(
      queryPath, fhirOptions
    );
  
    // QuestionnaireResponse resources from the main FHIR server
    const questionnaireResponses: QuestionnaireResponse[] = resourcesFrom(
      request
    ) as QuestionnaireResponse[];

    // Survey observations from the main FHIR server
    const surveyObservations = await getObservationsByCategory('survey');
    const observationalSurveyResponses = getQuestionnaireResponsesFromObservations(surveyObservations, configuredQuestionnaires);

    let sdsClient = await getSupplementalDataClient(client, sdsURL, authURL, sdsScope);

    let sdsQuestionnaireResponses: QuestionnaireResponse[] = [];
    if (sdsClient) {

        // See if there are 3rd party survey observations available from the SDS
        const thirdPartySurveyObservations = await getSupplementalSurveyObservations(client.state.serverUrl, sdsClient);
        const sdsSurveyResponses = getQuestionnaireResponsesFromObservations(thirdPartySurveyObservations, configuredQuestionnaires);
        observationalSurveyResponses.push(...sdsSurveyResponses);

        const sdsQuestionnaireResponse: fhirclient.JsonArray = await sdsClient.patient.request('QuestionnaireResponse', fhirOptions);

        const sdsQuestionnaireResponseArray: QuestionnaireResponse[] = resourcesFrom(
            sdsQuestionnaireResponse
        ) as QuestionnaireResponse[];

        // #28 - Replace the meta tag on resources from the SDS
        sdsQuestionnaireResponseArray.forEach(resource => {
            resource.meta = {
                source: "MyCarePlanner"
            };
        });
        
        sdsQuestionnaireResponses = filterQuestionnaireResponsesByConfigured(sdsQuestionnaireResponseArray as QuestionnaireResponse[], configuredQuestionnaires);
        questionnaireResponses.push(...sdsQuestionnaireResponses);

        const thirdPartyQuestionnaireResponses = await getSupplementalQuestionnaireResponses(client.state.serverUrl, sdsClient);
        questionnaireResponses.push(...thirdPartyQuestionnaireResponses);
    }

    const allResponses = [...observationalSurveyResponses, ...questionnaireResponses];

    const groupedByUrl = allResponses.reduce((acc, curr) => {
        const key = (curr as QuestionnaireResponse).questionnaire;
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
    }, {} as Record<string, Resource[]>);

    // Pass each resource array to the transformToAssessmentSummary function
    Object.values(groupedByUrl).forEach((resourcesToTransform: QuestionnaireResponse[]) => {
        if (resourcesToTransform.length > 0) {
            assessments.push(transformToAssessmentSummary(resourcesToTransform));
        }
    });

  } catch (error) {
    console.error(`getAssessments Error: ${error.message}`);
  } finally {
    console.log("Operation complete.");
    return assessments;
  }
}

