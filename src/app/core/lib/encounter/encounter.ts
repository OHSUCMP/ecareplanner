import FHIR from 'fhirclient';
import { Encounter } from 'fhir/r4';
import { fhirclient } from 'fhirclient/lib/types';

import { MccEncounter } from '../../types/mcc-types';
import log from '../../utils/loglevel';
import { fhirOptions, resourcesFrom, getSupplementalDataClient } from '../../utils/fhir';

import {
  transformToEncounter,
} from './encounter.util';

export const getSummaryEncounters = async (sdsURL: string, authURL: string, sdsScope: string): Promise<MccEncounter[]> => {
  const client = await FHIR.oauth2.ready();

  let sdsClient = await getSupplementalDataClient(client, sdsURL, authURL, sdsScope)

  const queryPath = 'Encounter';
  const request: fhirclient.JsonArray = await client.patient.request(
    queryPath, fhirOptions
  );

  const sdsRequest: fhirclient.JsonArray = await sdsClient.patient.request(
    queryPath, fhirOptions
  );
  log.debug({ serviceName: 'getSummaryEncounter', result: { request } });

  const encounterResource: Encounter[] = resourcesFrom(
    request
  ) as Encounter[];

  // TODO: Fake data for now because MELD doesn't support Encounter.participant
  for (const encounter of encounterResource) {
    if (!encounter.participant) {
      encounter.participant = [];
    }

    let rand = Math.random();
    encounter.participant.push({
      type: [
        {
          coding: [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
              "code": "PART",
              "display": "Participation"
            }
          ],
          text: "Participation"
        }
      ],
      individual: {
        reference: "Practitioner/evR52Pjpj6wqy0xPS8e.hyA3",
        display: rand > 0.5 ? "Steven Kassakian" : "Emily Bronte"
      },
    });

  }

  const sdsEncounterResource: Encounter[] = resourcesFrom(
    sdsRequest
  ) as Encounter[];

  log.info(
    `getEncounters - successful`
  );
  const summaryEncounter = [...encounterResource, ...sdsEncounterResource]

  const mappedEncounter = summaryEncounter.map(transformToEncounter)
  log.debug({ serviceName: 'getSummaryEncounter', result: mappedEncounter });

  return mappedEncounter;
};
