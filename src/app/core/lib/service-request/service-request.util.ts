import { TimingRepeat } from 'fhir/r4';
import { Period } from 'fhir/r4';
import { CodeableConcept, Resource, ServiceRequest, Timing } from 'fhir/r4';
import { MccServiceRequestSummary } from '../../types/mcc-types';
import { getConceptDisplayString } from '../goal/goal.util';
import { displayDate } from '../../utils/date.utils';

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



function displayTiming(timing: Timing | undefined): string | undefined {
  const boundsPeriod = (timing?.repeat as TimingRepeat)?.boundsPeriod
  const startDate = displayDate(boundsPeriod?.start)
  const endDate = displayDate(boundsPeriod?.end)
  return (startDate ?? '') + ((endDate !== undefined) ? ` until ${endDate}` : '')
}

export function displayPeriod(period: Period | undefined): string | undefined {
  const startDate = displayDate(period?.start)
  const endDate = displayDate(period?.end)
  return (startDate ?? '') + ((endDate !== undefined) ? ` until ${endDate}` : '')
}

export function displayConcept(codeable: CodeableConcept | undefined): string | undefined {
  if (codeable?.text !== undefined) {
    return codeable?.text
  }
  else {
    // use the first codeing.display that has a value
    return codeable?.coding?.filter((c) => c.display !== undefined)?.[0]?.display
  }
}
