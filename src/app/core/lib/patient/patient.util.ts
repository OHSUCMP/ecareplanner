import { MccPatient, MccPatientSummary } from '../../types/mcc-types';
import { displayDate } from '../../utils/date.utils';

export const transformToPatientSummary = (patient: MccPatient): MccPatientSummary => {
  const raceExtension = patient.extension ? patient.extension.find(ext => ext.url.includes('StructureDefinition/us-core-race')) : undefined;
  const race = raceExtension ? raceExtension.extension.find(ext => ext.url === "text")?.valueString : '';


  const id = patient.identifier ? patient.identifier.find(id => (id.system) && id.system.includes('NamingSystem/identifier'))?.value : '';



  const fhirid = patient.id;

  const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'U';

  const dob = new Date(patient.birthDate);
  const ageDiffMs = Date.now() - dob.getTime();
  const ageDate = new Date(ageDiffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970).toString();

  const ethnicityExtension = patient.extension ? patient.extension.find(ext => ext.url === "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity") : undefined;
  const ethnicity = ethnicityExtension ? ethnicityExtension.extension.find(ext => ext.url === "text")?.valueString : undefined;

  const name = patient.name ? patient.name[0].text : '';

  return { race, id, fhirid, gender, age, dateOfBirth: displayDate(patient.birthDate), ethnicity, name }
}
