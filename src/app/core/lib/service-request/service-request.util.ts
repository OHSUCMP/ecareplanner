import { ServiceRequest } from 'fhir/r4';
import { MccServiceRequestSummary } from '../../types/mcc-types';
import { getConceptDisplayString } from '../goal/goal.util';
import { displayDate, displayTiming, displayPeriod } from '../../utils/date.utils';
import { displayConcept } from '../../utils/fhir';

export const transformToServiceRequest = function (serviceRequest: ServiceRequest, referenceDisplay: Map<string, string>): MccServiceRequestSummary {
  const where = serviceRequest.locationReference ? serviceRequest.locationReference[0].display : '';
  return {
    topic: { text: displayConcept(serviceRequest.code) },
    type: serviceRequest.category ? serviceRequest.category[0].text : 'missing',
    status: serviceRequest.status,
    displayDate: serviceRequest.occurrenceTiming ? displayTiming(serviceRequest.occurrenceTiming) : (serviceRequest.occurrencePeriod ? displayPeriod(serviceRequest.occurrencePeriod) : (serviceRequest.occurrenceDateTime ? displayDate(serviceRequest.occurrenceDateTime) : serviceRequest.intent.charAt(0).toUpperCase() + serviceRequest.intent.slice(1))),
    reasons: serviceRequest.reasonCode ? getConceptDisplayString(serviceRequest.reasonCode[0]) : (serviceRequest.reasonReference ? referenceDisplay.get(serviceRequest.reasonReference[0].reference) : 'Unknown'),
    performer: serviceRequest.performer ? serviceRequest.performer[0].display : '',
    source: where
  };
}