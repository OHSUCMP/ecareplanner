import { Observation, QuestionnaireResponse, Resource } from 'fhir/r4';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { fhirclient } from 'fhirclient/lib/types';

import { EcpAssessmentSummary } from '../../types/mcc-types';
import {getObservationsByCategory} from '../observation/observation';
import { fhirOptions, resourcesFrom, getSupplementalDataClient, stripTrailingSlash} from '../../utils/fhir';
import {
    filterQuestionnaireResponsesByConfigured, getQuestionnaireResponsesFromObservations, groupQuestionnaireResponsesById, transformToAssessmentSummary
} from './questionnaire-response.util';

const getSupplementalSurveyObservations = async (launchURL: string, sdsClient: Client): Promise<Observation[]> => {
  let allThirdPartyMappedObservations: Observation[] = [];

  if (sdsClient) {
    try {
      const linkages = await sdsClient.request('Linkage?item=Patient/' + sdsClient.patient.id);
      const urlSet = new Set();

      urlSet.add(stripTrailingSlash(launchURL))
      // Loop through second set of linkages
      for (const entry2 of linkages.entry) {
        for (const item2 of entry2.resource.item) {
          const alternateUrl = stripTrailingSlash(item2.resource.extension[0].valueUrl);
          if (item2.type === 'alternate' && !urlSet.has(alternateUrl)) {
            urlSet.add(alternateUrl);
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

      urlSet.add(stripTrailingSlash(launchURL))
      // Loop through second set of linkages
      for (const entry2 of linkages.entry) {
        for (const item2 of entry2.resource.item) {
          const alternateUrl = stripTrailingSlash(item2.resource.extension[0].valueUrl);
          if (item2.type === 'alternate' && !urlSet.has(alternateUrl)) {
            urlSet.add(alternateUrl);
            // Prepare FHIR request headers
            const fhirHeaderRequestOption = {} as fhirclient.RequestOptions;
            const fhirHeaders = {
              'X-Partition-Name': item2.resource.extension[0].valueUrl
            };
            fhirHeaderRequestOption.headers = fhirHeaders;
            fhirHeaderRequestOption.url = 'QuestionnaireResponse?subject=' + item2.resource.reference;

            // Fetch third-party
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

    let allResponses = [...questionnaireResponses, ...observationalSurveyResponses];
    allResponses.forEach(resource => {
        resource.meta = {
            source: "Primary"
        };
    });

    let sdsClient = await getSupplementalDataClient(client, sdsURL, authURL, sdsScope);

    let sdsQuestionnaireResponses: QuestionnaireResponse[] = [];
    if (sdsClient) {

        // Look for QuestionnaireResponses in the default SDS partition (written by MyCarePlanner)
        const sdsQuestionnaireResponse: fhirclient.JsonArray = await sdsClient.patient.request('QuestionnaireResponse', fhirOptions);
        const sdsQuestionnaireResponseArray: QuestionnaireResponse[] = resourcesFrom(
            sdsQuestionnaireResponse
        ) as QuestionnaireResponse[];
        sdsQuestionnaireResponseArray.forEach(resource => {
            resource.meta = {
                source: "MyCarePlanner"
            };
        });

        // Look for 3rd party survey observations in the SDS
        const thirdPartySurveyObservations = await getSupplementalSurveyObservations(client.state.serverUrl, sdsClient);
        const thirdPartyObservationalSurveyResponses = getQuestionnaireResponsesFromObservations(thirdPartySurveyObservations, configuredQuestionnaires);
        thirdPartyObservationalSurveyResponses.forEach(resource => {
            resource.meta = {
                source: "External"
            };
        });

        // Look for third party QuestionnaireResponses in the SDS
        const thirdPartyQuestionnaireResponses = await getSupplementalQuestionnaireResponses(client.state.serverUrl, sdsClient);
        thirdPartyQuestionnaireResponses.forEach(resource => {
            resource.meta = {
                source: "External"
            };
        });

        allResponses.push(...thirdPartyObservationalSurveyResponses, ...sdsQuestionnaireResponses, ...thirdPartyQuestionnaireResponses);
    }

    // Look for the identifiers that indicates this is a Qualifacts survey and set the questionnaire field to the correct URL for the questionnaire.
    allResponses.forEach(response => {
      if (response.identifier?.value?.includes('PHQ9')) {
        response.questionnaire = 'http://ohsu.edu/fhir/Questionnaire/PHQ-9-qualifacts';
      } else if (response.identifier?.value?.includes('GAD7')) {
        response.questionnaire = 'http://ohsu.edu/fhir/Questionnaire/GAD-7-qualifacts';
      }
    });
    const configuredResponses = filterQuestionnaireResponsesByConfigured(allResponses, configuredQuestionnaires);  

    const groupedById = groupQuestionnaireResponsesById(configuredResponses);

    // Pass each resource array to the transformToAssessmentSummary function
    Object.values(groupedById).forEach((resourcesToTransform: QuestionnaireResponse[]) => {
        if (resourcesToTransform.length > 0) {
            const assessmentSummary = transformToAssessmentSummary(resourcesToTransform);
            if (assessmentSummary) {
                assessments.push(assessmentSummary);
            }
        }
    });

  } catch (error) {
    console.error(`getAssessments Error: ${error.message}`);
  } finally {
    console.log("Operation complete.");
    return assessments;
  }
}

