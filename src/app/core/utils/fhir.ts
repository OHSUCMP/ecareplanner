import { Resource } from 'fhir/r4';
import { fhirclient } from 'fhirclient/lib/types';

export const fhirOptions: fhirclient.FhirOptions = {
  pageLimit: 0,
};

/**
 * Transform the FHIR response into an array of resources, removing any OperationOutcome resources.
 * @param response 
 * @returns 
 */
export const resourcesFrom = (response: fhirclient.JsonArray): Resource[] => {
    const entries = response?.flatMap(r => (r as fhirclient.JsonObject)?.entry as fhirclient.JsonObject[] || []);
    return entries
        .map((entry: fhirclient.JsonObject) => entry?.resource as any)
        .filter(
            (resource: Resource) => resource.resourceType !== 'OperationOutcome'
        );
};

// TODO: This method may also need to be refactor since it assumes only one entry, but I will leave it alone until we can do a deep dive
export const resourcesFromObject = (
  response: fhirclient.JsonObject
): Resource => {
  const entry: fhirclient.JsonObject = response?.entry ? response?.entry[0] : undefined;

  const resource: any = entry ? entry?.resource : undefined;

  if (resource && resource.resourceType === 'OperationOutcome') {
    return {} as any;
  }

  return resource;
};

export const notFoundResponse = (code?: string) => ({
  code,
  status: 'notfound',
  value: {
    stringValue: 'No Data Available',
    valueType: 'string',
  },
});