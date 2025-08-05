import { Coding, Observation, Questionnaire, QuestionnaireItem, QuestionnaireResponse, QuestionnaireResponseItem, QuestionnaireResponseItemAnswer } from 'fhir/r4';
import { EcpScore } from '../../types/mcc-types';

export interface QuestionnaireMetadata {
    display: string, // The label of the questionnaire to display to users.
    url: string, // The url of the questionnaire. This is what the QuestionnaireResponse will reference in the questionnaire field.
    definition: Questionnaire // The code associated with the questionnaire. This will be the top-level code for questionnaire responses represented as observations.
}

export const scoredQuestionnaireMetadata: QuestionnaireMetadata[] = [
    {
        "display": "PHQ-9",
        "url": "PHQ-9",
        "definition":
        {
            "resourceType": "Questionnaire",
            "id": "44249-1",
            "meta": {
                "versionId": "1",
                "lastUpdated": "2025-03-03T02:09:23.000-05:00",
                "source": "#A9ftYtknikFekkjR",
                "profile": [
                    "http://hl7.org/fhir/4.0/StructureDefinition/Questionnaire"
                ],
                "tag": [
                    {
                        "code": "lformsVersion: 36.3.3"
                    }
                ]
            },
            "url": "PHQ-9",
            "title": "PHQ-9 quick depression assessment panel [Reported.PHQ]",
            "status": "draft",
            "copyright": "Copyright © Pfizer Inc. All rights reserved. Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute.",
            "code": [
                {
                    "system": "http://loinc.org",
                    "code": "44249-1",
                    "display": "PHQ-9 quick depression assessment panel [Reported.PHQ]"
                }
            ],
            "item": [
                {
                    "linkId": "phq9",
                    "code": [
                        {
                            "code": "no-code",
                            "display": "No code"
                        }
                    ],
                    "text": "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
                    "type": "group",
                    "item": [
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44250-9",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44250-9",
                                    "display": "Little interest or pleasure in doing things"
                                }
                            ],
                            "text": "Little interest or pleasure in doing things",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44255-8",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44255-8",
                                    "display": "Feeling down, depressed, or hopeless"
                                }
                            ],
                            "text": "Feeling down, depressed, or hopeless",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44259-0",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44259-0",
                                    "display": "Trouble falling or staying asleep, or sleeping too much"
                                }
                            ],
                            "text": "Trouble falling or staying asleep, or sleeping too much",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44254-1",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44254-1",
                                    "display": "Feeling tired or having little energy"
                                }
                            ],
                            "text": "Feeling tired or having little energy",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44251-7",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44251-7",
                                    "display": "Poor appetite or overeating"
                                }
                            ],
                            "text": "Poor appetite or overeating",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44258-2",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44258-2",
                                    "display": "Feeling bad about yourself-or that you are a failure or have let yourself or your family down"
                                }
                            ],
                            "text": "Feeling bad about yourself-or that you are a failure or have let yourself or your family down",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44252-5",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44252-5",
                                    "display": "Trouble concentrating on things, such as reading the newspaper or watching television"
                                }
                            ],
                            "text": "Trouble concentrating on things, such as reading the newspaper or watching television",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44253-3",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44253-3",
                                    "display": "Moving or speaking so slowly that other people could have noticed. Or the opposite – being so fidgety or restless that you were moving around a lot more than usual"
                                }
                            ],
                            "text": "Moving or speaking so slowly that other people could have noticed. Or the opposite – being so fidgety or restless that you were moving around a lot more than usual",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/44260-8",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44260-8",
                                    "display": "Thoughts that you would be better off dead, or of hurting yourself in some way"
                                }
                            ],
                            "text": "Thoughts that you would be better off dead, or of hurting yourself in some way",
                            "type": "choice",
                            "required": true,
                            "answerOption": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "0"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 0
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6568-5",
                                        "display": "Not at all"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "1"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 1
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6569-3",
                                        "display": "Several days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "2"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 2
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6570-1",
                                        "display": "More than half the days"
                                    }
                                },
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-optionPrefix",
                                            "valueString": "3"
                                        },
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/ordinalValue",
                                            "valueDecimal": 3
                                        }
                                    ],
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6571-9",
                                        "display": "Nearly every day"
                                    }
                                }
                            ]
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-displayCategory",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "display": "The PHQ-9 is the standard (and most commonly used) depression measure, and it ranges from 0-27 Scoring: Add up all checked boxes on PHQ-9. For every check: Not at all = 0; Several days = 1; More than half the days = 2; Nearly every day = 3 (the scores are the codes that appear in the answer list for each of the PHQ-9 problem panel terms). Interpretation: 1-4 = Minimal depression; 5-9 = Mild depression; 10-14 = Moderate depression; 15-19 = Moderately severe depression; 20-27 = Severed depression."
                                            }
                                        ],
                                        "text": "The PHQ-9 is the standard (and most commonly used) depression measure, and it ranges from 0-27 Scoring: Add up all checked boxes on PHQ-9. For every check: Not at all = 0; Several days = 1; More than half the days = 2; Nearly every day = 3 (the scores are the codes that appear in the answer list for each of the PHQ-9 problem panel terms). Interpretation: 1-4 = Minimal depression; 5-9 = Mild depression; 10-14 = Moderate depression; 15-19 = Moderately severe depression; 20-27 = Severed depression."
                                    }
                                },
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-unit",
                                    "valueCoding": {
                                        "code": "care-plan-score",
                                        "display": "{score}"
                                    }
                                },
                                {
                                    "url": "range-score-interpretation",
                                    "extension": [
                                        {
                                            "url": "range",
                                            "valueRange": {
                                                "low": {
                                                    "value": 0
                                                },
                                                "high": {
                                                    "value": 4
                                                }
                                            }
                                        },
                                        {
                                            "url": "interpretation",
                                            "valueString": "Minimal"
                                        }
                                    ]
                                },
                                {
                                    "url": "range-score-interpretation",
                                    "extension": [
                                        {
                                            "url": "range",
                                            "valueRange": {
                                                "low": {
                                                    "value": 5
                                                },
                                                "high": {
                                                    "value": 9
                                                }
                                            }
                                        },
                                        {
                                            "url": "interpretation",
                                            "valueString": "Mild"
                                        }
                                    ]
                                },
                                {
                                    "url": "range-score-interpretation",
                                    "extension": [
                                        {
                                            "url": "range",
                                            "valueRange": {
                                                "low": {
                                                    "value": 10
                                                },
                                                "high": {
                                                    "value": 14
                                                }
                                            }
                                        },
                                        {
                                            "url": "interpretation",
                                            "valueString": "Moderate"
                                        }
                                    ]
                                },
                                {
                                    "url": "range-score-interpretation",
                                    "extension": [
                                        {
                                            "url": "range",
                                            "valueRange": {
                                                "low": {
                                                    "value": 15
                                                },
                                                "high": {
                                                    "value": 19
                                                }
                                            }
                                        },
                                        {
                                            "url": "interpretation",
                                            "valueString": "Moderately Severe"
                                        }
                                    ]
                                },
                                {
                                    "url": "range-score-interpretation",
                                    "extension": [
                                        {
                                            "url": "range",
                                            "valueRange": {
                                                "low": {
                                                    "value": 20
                                                },
                                                "high": {
                                                    "value": 27
                                                }
                                            }
                                        },
                                        {
                                            "url": "interpretation",
                                            "valueString": "Severe"
                                        }
                                    ]
                                }
                            ],
                            "linkId": "/44261-6",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "44261-6",
                                    "display": "Patient health questionnaire 9 item total score"
                                }
                            ],
                            "text": "Patient health questionnaire 9 item total score",
                            "type": "quantity",
                            "required": false
                        },
                        {
                            "extension": [
                                {
                                    "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                    "valueCodeableConcept": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                "code": "drop-down",
                                                "display": "Drop down"
                                            }
                                        ],
                                        "text": "Drop down"
                                    }
                                }
                            ],
                            "linkId": "/69722-7",
                            "code": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "69722-7",
                                    "display": "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?"
                                }
                            ],
                            "text": "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
                            "type": "choice",
                            "required": false,
                            "answerOption": [
                                {
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6572-7",
                                        "display": "Not difficult at all"
                                    }
                                },
                                {
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6573-5",
                                        "display": "Somewhat difficult"
                                    }
                                },
                                {
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6575-0",
                                        "display": "Very difficult"
                                    }
                                },
                                {
                                    "valueCoding": {
                                        "system": "http://loinc.org",
                                        "code": "LA6574-3",
                                        "display": "Extremely difficult"
                                    }
                                }
                            ],
                            "item": [
                                {
                                    "extension": [
                                        {
                                            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
                                            "valueCodeableConcept": {
                                                "coding": [
                                                    {
                                                        "system": "http://hl7.org/fhir/questionnaire-item-control",
                                                        "code": "help",
                                                        "display": "Help-Button"
                                                    }
                                                ],
                                                "text": "Help-Button"
                                            }
                                        }
                                    ],
                                    "linkId": "/69722-7-help",
                                    "text": "If you checked off any problems on this questionnaire",
                                    "type": "display"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
];

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
function findScoreValueByLinkId(items: QuestionnaireResponseItem[], targetLinkId: string): number | undefined {
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

function extractAnswerValue(answer: QuestionnaireResponseItemAnswer): number | undefined {
  if ('valueInteger' in answer) return answer.valueInteger;
  if ('valueDecimal' in answer) return answer.valueDecimal;
  if ('valueQuantity' in answer) return answer.valueQuantity?.value;
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

export function getScore(response: QuestionnaireResponse, metadata: QuestionnaireMetadata): EcpScore | undefined {
    const scoreItem = findScoreItem(metadata.definition.item || []);
    if (scoreItem) {
        const scoreValue = findScoreValueByLinkId(response.item || [], scoreItem.linkId);
        if (scoreValue === undefined) return undefined;
    

        return {
            value: scoreValue,
            interpretation: interpretScore(metadata.definition, scoreValue) || 'No interpretation available'
        };
    }
    return undefined;
}

/**
 *  Flatten matching items into responseItems array. Only certain answer types are supported.
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
                        }});
                });
            } else if (observation.valueQuantity) {
                responseItem.answer?.push({
                    valueQuantity: {
                        value: observation.valueQuantity.value
                    }
                });
            } else if (observation.valueInteger) {
                responseItem.answer?.push({valueInteger: observation.valueInteger})
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

export function getQuestionnaireResponsesFromObservations(surveyObservations: Observation[]): QuestionnaireResponse[] {
    const questionnaireResponses: QuestionnaireResponse[] = [];
    
    // Iterate through each questionnaire definition
    for (const metadata of scoredQuestionnaireMetadata) {
        const responses = convertObservations(metadata.definition, surveyObservations);
        questionnaireResponses.push(...responses);
    }

    return questionnaireResponses;
}







