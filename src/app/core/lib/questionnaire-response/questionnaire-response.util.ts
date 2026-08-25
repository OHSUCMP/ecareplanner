import { Observation, Questionnaire, QuestionnaireItem, QuestionnaireResponse, QuestionnaireResponseItem, QuestionnaireResponseItemAnswer } from 'fhir/r4';
import { EcpAssessment, EcpAssessmentSummary, EcpScore, MCCAssessmentResponseItem } from '../../types/mcc-types';
import { QuestionnaireMetadata, questionnaireMetadata } from './questionnaire-metadata';
import { displayDate } from '../../utils/date.utils';

function getAnswer(item: QuestionnaireResponseItem): MCCAssessmentResponseItem {
    return {
        question: item.text ?? '',
        answer: item.answer && item.answer.length > 0 ? extractAnswerValue(item.answer[0]) : ''
    };
}

function extractAnswerValue(answer: QuestionnaireResponseItemAnswer): string {

    return (
        answer.valueCoding?.display ??
        answer.valueString ??
        answer.valueInteger?.toString() ??
        answer.valueDecimal?.toString() ??
        (answer.valueBoolean !== undefined ? (answer.valueBoolean ? 'True' : 'False') : undefined) ??
        answer.valueDate ??
        answer.valueDateTime ??
        answer.valueTime ??
        answer.valueQuantity?.value?.toString() ??
        JSON.stringify(answer)
    );
}

function getMetadataByDefinitionUrl(definitionUrl: string): QuestionnaireMetadata | undefined {
    return questionnaireMetadata.find(metadata =>
        metadata.definition.some(def => def.url === definitionUrl)
    );
}

function isScoreQuestion(item: QuestionnaireItem) {
    return item?.extension?.some(
        (ext) =>
            ext.url === "http://hl7.org/fhir/StructureDefinition/questionnaire-unit" &&
            ext.valueCoding?.code === "care-plan-score"
    ) ?? false;
}

/**
 * 
 * @param items Return the score question in the questionnaire definition
 * @returns 
 */
function findScoreItem(items: QuestionnaireItem[]): QuestionnaireItem | undefined {
    for (const item of items) {
        if (isScoreQuestion(item)) {
            return item;
        }

        // Recurse into nested items
        if (item.item && item.item.length > 0) {
            const found = findScoreItem(item.item);
            if (found) return found;
        }
    }

    return undefined;
}

/**
 * Return the value of the score question in the questionnaire response
 * @param items 
 * @param targetLinkId 
 * @returns 
 */
function findScoreValueByLinkId(items: QuestionnaireResponseItem[], targetLinkId: string): string | undefined {
    for (const item of items) {
        if (item.linkId === targetLinkId && item.answer && item.answer.length > 0) {
            // Return the actual value (valueInteger, valueDecimal, etc.)
            const answer = item.answer[0];
            return extractAnswerValue(answer);
        }

        // Recurse into nested items
        if (item.item && item.item.length > 0) {
            const result = findScoreValueByLinkId(item.item, targetLinkId);
            if (result !== undefined) {
                return result;
            }
        }
    }

    return undefined;
}

function interpretScore(questionnaireDefinition: Questionnaire, score: number): string | undefined {
    const scoreItem = findScoreItem(questionnaireDefinition.item || []);
    if (scoreItem) {
        const rangeInterpretations = scoreItem.extension?.filter(ext => ext.url === 'range-score-interpretation');
        if (rangeInterpretations) {
            for (const rangeInterpretation of rangeInterpretations) {
                const range = rangeInterpretation.extension?.find(e => e.url === 'range' && e.valueRange && e.valueRange.low && e.valueRange.high);
                if (range && range?.valueRange?.low?.value != null && range.valueRange.low.value <= score && range?.valueRange?.high?.value != null && range.valueRange.high.value >= score) {
                    return rangeInterpretation.extension?.find(e => e.url === 'interpretation')?.valueString;
                }
            }
        }
    }

    return undefined;
}

export function getScore(response: QuestionnaireResponse, questionnaireDefinition: Questionnaire): EcpScore | undefined {
    const scoreItem = findScoreItem(questionnaireDefinition.item || []);
    if (scoreItem) {
        const scoreValue = findScoreValueByLinkId(response.item || [], scoreItem.linkId);
        if (scoreValue === undefined) return undefined;
        return {
            value: scoreValue,
            interpretation: !isNaN(parseFloat(scoreValue)) ? interpretScore(questionnaireDefinition, parseFloat(scoreValue)) || null : null
        };
    }
    return undefined;
}

/**
 * Flatten matching items into responseItems array. Only certain answer types are supported.
 * @param questionnaireItems
 * @param members 
 * @param responseItems 
 */
function collectMatchingItems(questionnaireItems: QuestionnaireItem[], members: (Observation | undefined)[], responseItems: QuestionnaireResponseItem[]) {
    for (const item of questionnaireItems) {
        // Assuming the first code in the array is the one we want to match
        const code = item.code?.[0]?.code;
        if (!code) {
            continue;
        }

        const observation = members.find((o) => o?.code.coding?.some((c) => c.code === code));

        if (observation) {
            const responseItem: QuestionnaireResponseItem = {
                linkId: item.linkId,
                text: item.text,
                answer: []
            };

            if (observation.valueCodeableConcept) {
                observation.valueCodeableConcept.coding?.forEach((coding) => {
                    responseItem.answer?.push({
                        valueCoding: {
                            system: coding.system,
                            code: coding.code,
                            display: coding.display
                        }
                    });
                });
            } else if (observation.valueQuantity) {
                responseItem.answer?.push({ valueString: observation.valueQuantity.value?.toString() });
            } else if (observation.valueInteger) {
                responseItem.answer?.push({ valueString: observation.valueInteger?.toString() });
            } else if (observation.valueString) {
                responseItem.answer?.push({ valueString: observation.valueString })
            }
            else {
                console.warn(`Unsupported observation value type for observation with code ${code}: `, observation);
            }

            responseItems.push(responseItem); // ** push flat into the top-level array **
        }

        // Still check child items recursively
        if (item.item) {
            collectMatchingItems(item.item, members, responseItems);
        }
    }
}

/**
 * Given a questionnaire definition and a list of observations, find all the top-level observations
 * relevant to the questionnaire and construct a QuestionnaireResponse for each top-level observation and its members. 
 * @param questionnaireDef 
 * @param surveyObservations 
 * @returns An array of QuestionnaireResponse resources constructed from observations related to the questionnaire.
 */
function convertObservations(questionnaireDef: Questionnaire, surveyObservations: Observation[]): QuestionnaireResponse[] {
    const questionnaireResponses: QuestionnaireResponse[] = [];
    const topLevelCode = questionnaireDef.code?.[0]?.code; // Assumes the first code in the questionnaireDef is the one we'll find in observations
    const topLevelObservations = surveyObservations.filter(o =>
        o.code.coding?.some(e => e.code === topLevelCode)
    );

    if (topLevelObservations.length > 0) {
        for (const obs of topLevelObservations) {
            const members = (obs.hasMember ?? []).map((member) => {
                const referenceId = member.reference?.split('/')[1];
                return surveyObservations.find((o) => o.id === referenceId);
            }).filter((o): o is Observation => o !== undefined); // remove undefineds

            const questionnaireResponse: QuestionnaireResponse = {
                meta: obs.meta,
                resourceType: 'QuestionnaireResponse',
                status: 'completed',
                questionnaire: questionnaireDef.url,
                authored: obs.effectiveDateTime,
                item: []
            };

            const responseItems: QuestionnaireResponseItem[] = [];

            // Recursively search questionnaire items
            collectMatchingItems(questionnaireDef.item ?? [], members, responseItems);

            questionnaireResponse.item = responseItems;

            questionnaireResponses.push(questionnaireResponse);
        }
    }

    return questionnaireResponses;
}

export function filterQuestionnaireResponsesByConfigured(questionnaireResponses: QuestionnaireResponse[], configuredQuestionnaires: string[]): QuestionnaireResponse[] {
    return questionnaireResponses.filter(qr => {
        if (!qr.questionnaire) {
            return false;
        }
        const metadata = getMetadataByDefinitionUrl(qr.questionnaire);
        return metadata && configuredQuestionnaires.includes(metadata.id);
    });
}

export function getQuestionnaireResponsesFromObservations(surveyObservations: Observation[], configuredQuestionnaires: string[]): QuestionnaireResponse[] {
    const questionnaireResponses: QuestionnaireResponse[] = [];
    
    // Filter to only configured questionnaires
    const filteredQuestionnaireMetadata = configuredQuestionnaires.map(id =>
        questionnaireMetadata.find(metadata => metadata.id === id)
    ).filter((metadata): metadata is QuestionnaireMetadata => metadata !== undefined);

    console.log(`Processing ${filteredQuestionnaireMetadata.length} configured questionnaires from observations.`);

    // Iterate through each questionnaire definition
    for (const metadata of filteredQuestionnaireMetadata) {
        // The first definition in the array is the one used for survey observations
        const responses = convertObservations(metadata.definition[0], surveyObservations);
        questionnaireResponses.push(...responses);
    }

    return questionnaireResponses;
}

export function groupQuestionnaireResponsesById(questionnaireResponses: QuestionnaireResponse[]): Record<string, QuestionnaireResponse[]> {
    // First, create a lookup map from definition URL to metadata id
    const definitionToMetadataId = new Map<string, string>();

    questionnaireMetadata.forEach(metadata => {
        metadata.definition.forEach(def => {
            if (def.url) {
                definitionToMetadataId.set(def.url, metadata.id);
            }
        });
    });

    // Then group responses using the metadata id
    const groupedById = questionnaireResponses.reduce((acc, curr) => {
        const response = curr as QuestionnaireResponse;
        const definitionUrl = response?.questionnaire;

        // Skip if no questionnaire URL
        if (!definitionUrl) return acc;

        // Look up which metadata this definition belongs to
        const metadataId = definitionToMetadataId.get(definitionUrl);

        if (!metadataId) {
            console.warn(`No metadata found for questionnaire definition URL: ${definitionUrl}`);
            return acc;
        }

        if (!acc[metadataId]) {
            acc[metadataId] = [];
        }
        acc[metadataId].push(curr);
        return acc;
    }, {} as Record<string, QuestionnaireResponse[]>);
    return groupedById;
}

export function transformToAssessmentSummary(resourcesToTransform: QuestionnaireResponse[]): EcpAssessmentSummary | null {
     // Validate input
    if (!resourcesToTransform || resourcesToTransform.length === 0) {
        return null;
    }

    const firstQuestionnaire = resourcesToTransform[0]?.questionnaire;
    if (!firstQuestionnaire) {
        return null;
    }

    // Get the metadata entry for the questionnaire
    const metadata = getMetadataByDefinitionUrl(firstQuestionnaire);
    if (!metadata) {
        return null;
    }
    let assessmentSummary: EcpAssessmentSummary = {
        title: metadata.display,
        isScored: metadata.isScored,
        canBeCharted: metadata.canBeCharted,
        responses: []
    }

    resourcesToTransform.forEach((response: QuestionnaireResponse) => {

        if (!response.questionnaire || !response.item) return;

        const questionnaireDefinition = metadata.definition.find(
            def => def.url === response?.questionnaire
        );

        const assessment: EcpAssessment = {
            date: displayDate(response.authored) || '',
            source: response.meta?.source || '',
            score: metadata.isScored && questionnaireDefinition ? getScore(response, questionnaireDefinition) : undefined,
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






