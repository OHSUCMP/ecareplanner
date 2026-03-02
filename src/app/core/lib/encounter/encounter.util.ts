import { Encounter, CodeableConcept } from 'fhir/r4';
import { MccEncounter } from '../../types/mcc-types';
import { displayDate } from '../../utils/date.utils';
import { displayConcept } from '../../utils/fhir';

export const transformToEncounter = (encounter: Encounter): MccEncounter => {
  return {
    startDateText: displayDate(encounter?.period?.start),
    endDateText: displayDate(encounter?.period?.end),
    apptType: (encounter.type && encounter.type[0]) ? displayConcept(encounter.type[0]) : undefined,
    serviceType: displayConcept(encounter.serviceType),
    status: encounter.status,
    reason: (encounter.reasonCode && encounter.reasonCode[0]) ? displayConcept(encounter.reasonCode[0]) : undefined,
    participant: displayParticipant(encounter)
  };
}

function displayParticipant(encounter: Encounter): string | undefined {
    let participant: string | undefined = undefined;
    if (encounter.participant) {
        for (let p of encounter.participant) {
            if (p.individual && p.individual.display && p.type && !isEncounterParticipantTypeAReferrer(p.type)) {
                participant = p.individual.display;
                break;
            }

        }
    }
    return participant;
}

function isEncounterParticipantTypeAReferrer(type: CodeableConcept[]): boolean {
    if (type && type.length > 0) {
        for (let codeable of type) {
            if (codeable.coding) {
                for (let code of codeable.coding) {
                    if (code.system === 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType' &&
                        code.code === 'REF') {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}