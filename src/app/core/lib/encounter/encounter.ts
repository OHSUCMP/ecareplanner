import FHIR from 'fhirclient';
import { DocumentReference, Encounter } from 'fhir/r4';
import { fhirclient } from 'fhirclient/lib/types';

import { MccDocumentReference, MccEncounter } from '../../types/mcc-types';
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

  const encounterResource: Encounter[] = resourcesFrom(
    request
  ) as Encounter[];

  let sdsEncounterResource: Encounter[] = [];
  if (sdsClient) {
    const sdsRequest: fhirclient.JsonArray = await sdsClient.patient.request(
      queryPath, fhirOptions
    );
    log.debug({ serviceName: 'getSummaryEncounter', result: { request } });

    sdsEncounterResource = resourcesFrom(
      sdsRequest
    ) as Encounter[];
  }

  log.info(
    `getEncounters - successful`
  );
  const summaryEncounter = [...encounterResource, ...sdsEncounterResource]
  // TODO: Transform these ahead of time and organize them by their encounter ids
  const exampleDocReference: MccDocumentReference = {
    encounterId: "eLmoRaZ6HbiPUkDvlzEzUtw3",
    date: "2024-01-30",
    type: "Transfer Note",
    author: "Dr. Jane Smith",
    contentUrl: "Binary/144302"
  }
  const exampleDocReference2: MccDocumentReference = {
    encounterId: "eaNMp7Loy9mJ0DzjTzbgtNg3",
    date: "2024-06-03",
    type: "Discharge Note",
    author: "Dr. Carl Jung",
    contentUrl: "Binary/8675309"
  }
  const exampleDocReference3: MccDocumentReference = {
    encounterId: "eaNMp7Loy9mJ0DzjTzbgtNg3",
    date: "2024-05-19",
    type: "Progress Note",
    author: "Nurse Ratched",
    contentUrl: "Binary/345678"
  }
  
  let docReferences: MccDocumentReference[] = [exampleDocReference, exampleDocReference2, exampleDocReference3];
  const mappedEncounter = summaryEncounter.map(encounter => {
  const encounterDocRefs = docReferences.filter(ref => ref.encounterId === encounter.id);
  return transformToEncounter(encounter, encounterDocRefs);
})
  log.debug({ serviceName: 'getSummaryEncounter', result: mappedEncounter });

  return mappedEncounter;
};
