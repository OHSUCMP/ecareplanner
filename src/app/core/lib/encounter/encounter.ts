import FHIR from 'fhirclient';
import { DocumentReference, Encounter } from 'fhir/r4';
import { fhirclient } from 'fhirclient/lib/types';
import Client from 'fhirclient/lib/Client';

import { MccDocumentReference, MccEncounter } from '../../types/mcc-types';
import log from '../../utils/loglevel';
import { fhirOptions, resourcesFrom, getSupplementalDataClient } from '../../utils/fhir';

import {
  transformToEncounter,
} from './encounter.util';

async function transformDocumentReferences(
  docResource: DocumentReference[],
  client: Client
): Promise<MccDocumentReference[]> {
  
  const transformPromises = docResource.map(doc => transformSingleDocument(doc, client));
  return Promise.all(transformPromises);
}

async function transformSingleDocument(
  doc: DocumentReference,
  client: Client
): Promise<MccDocumentReference> {

  const { content, contentType, mimeType } = await extractContent(doc, client);
  
  return {
    encounterId: extractEncounterId(doc),
    date: extractDate(doc),
    type: extractType(doc),
    author: extractAuthor(doc),
    content: content,
    contentType: contentType,
    mimeType: mimeType
  };
}

function extractEncounterId(doc: DocumentReference): string {
  const encounter = doc.context?.encounter?.[0];
  if (encounter?.reference) {
    // Extract just the ID from "Encounter/123" format
    return encounter.reference.split('/').pop() || '';
  }
  return '';
}

function extractDate(doc: DocumentReference): string {
  // Try date in this order: date, context.period.start
  return doc.date || 
         doc.context?.period?.start || 
         '';
}

function extractType(doc: DocumentReference): string {
  // Get the display text from type coding
  if (doc.type?.coding?.[0]) {
    return doc.type.coding[0].display || 
           doc.type.coding[0].code || 
           'Unknown Type';
  }
  return doc.type?.text || 'Unknown Type';
}

function extractAuthor(doc: DocumentReference): string {
  if (!doc.author || doc.author.length === 0) {
    return 'Unknown Author';
  }
  
  // Get the first author
  const author = doc.author[0];
  
  if (author.display) {
    return author.display;
  }
  
  if (author.reference) {
    // Extract readable part from reference like "Practitioner/123"
    const parts = author.reference.split('/');
    return parts.length > 1 ? `${parts[0]} ${parts[1]}` : author.reference;
  }
  
  return 'Unknown Author';
}

async function extractContent(
  doc: DocumentReference,
  client: Client
): Promise<{ 
  content: string; 
  contentType: 'html' | 'text' | 'binary' | 'unavailable';
  mimeType?: string;
}> {
  
  // TODO: I think we want to process in priority order of content type (html > text > binary) rather than just taking the first one.

  if (!doc.content || doc.content.length === 0) {
    return { 
      content: 'No content available', 
      contentType: 'unavailable' 
    };
  }
  
  // Try each content attachment
  for (const content of doc.content) {
    const attachment = content.attachment;
    if (!attachment || !attachment.contentType) continue;
    
    const mimeType = attachment.contentType.toLowerCase();
    
    // Determine content type category
    let contentType: 'html' | 'text' | 'binary';
    if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml') {
      contentType = 'html';
    } else if (mimeType === 'text/plain') {
      contentType = 'text';
    } else {
      // Everything else is binary (PDF, images, RTF, etc.)
      contentType = 'binary';
    }
    
    // Get the content
    let base64Data: string | null = null;
    
    // Try inline data first
    if (attachment.data) {
      base64Data = attachment.data;
    }
    // Try fetching from URL
    else if (attachment.url) {
      try {
        base64Data = await fetchBinaryAsBase64(attachment.url, client);
      } catch (e) {
        console.error('Error fetching content from URL:', e);
        continue; // Try next content attachment
      }
    }
    
    if (!base64Data) continue;
    
    // For HTML and text, decode the base64
    if (contentType === 'html' || contentType === 'text') {
      try {
        return {
          content: atob(base64Data),
          contentType: contentType,
          mimeType: attachment.contentType
        };
      } catch (e) {
        console.error('Error decoding text content:', e);
        continue;
      }
    }
    
    // For binary, keep as base64
    return {
      content: base64Data,
      contentType: 'binary',
      mimeType: attachment.contentType
    };
  }
  
  // No supported content found
  const availableTypes = doc.content
    .map(c => c.attachment?.contentType)
    .filter(Boolean)
    .join(', ');
  
  return {
    content: `Unable to parse content type${availableTypes ? ': ' + availableTypes : ''}`,
    contentType: 'unavailable'
  };
}

async function fetchBinaryAsBase64(
  url: string,
  client: Client
): Promise<string> {
  
  try {
    const binary = await client.request(url);
    
    // If it's a FHIR Binary resource with data field
    if (binary.data) {
      return binary.data; // Already base64
    }
    
    // If the server returned raw binary data as a string
    if (typeof binary === 'string') {
      // Try to determine if it's already base64 or needs encoding
      try {
        atob(binary); // Test if it's valid base64
        return binary;
      } catch {
        // Not base64, encode it
        return btoa(binary);
      }
    }
    
    throw new Error('Unable to extract base64 data from Binary resource');
    
  } catch (error) {
    console.error('Error fetching Binary resource:', error);
    throw error;
  }
}

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
    sdsEncounterResource = resourcesFrom(
      sdsRequest
    ) as Encounter[];
  }

  log.info(
    `getEncounters - successful`
  );
  const summaryEncounter = [...encounterResource, ...sdsEncounterResource]

  const docQueryPath = 'DocumentReference?category=clinical-note';
  const docRequest: fhirclient.JsonArray = await client.patient.request(
    docQueryPath,
    fhirOptions
  );

  const docResource: DocumentReference[] = resourcesFrom(
    docRequest
  ) as DocumentReference[];

  let sdsDocResource: DocumentReference[] = [];
  if (sdsClient) {
    const sdsRequest: fhirclient.JsonArray = await sdsClient.patient.request(
      docQueryPath,
      fhirOptions
    );
    sdsDocResource = resourcesFrom(
      sdsRequest
    ) as DocumentReference[];
  }

  log.info(
    `getDocs - successful`
  );
  const summaryDocs = [...docResource, ...sdsDocResource]

  const docReferences = await transformDocumentReferences(summaryDocs, client);
  const mappedEncounter = summaryEncounter.map(encounter => {
    const encounterDocRefs = docReferences.filter(ref => ref.encounterId === encounter.id);
    return transformToEncounter(encounter, encounterDocRefs);
  });
  log.debug({ serviceName: 'getSummaryEncounters', result: mappedEncounter });

  return mappedEncounter;
};
