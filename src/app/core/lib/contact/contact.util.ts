import { CareTeamParticipant, Practitioner, Reference, Resource } from 'fhir/r4';

import { MccPatientContact } from '../../types/mcc-types';
import { getConceptDisplayString } from '../goal/goal.util';

function resolve(ref?: Reference, members?: Map<string, Practitioner>) {
  let resourceID: string | undefined = ref?.reference?.split('/').reverse()?.[0]
  return members?.get(resourceID ?? 'missing id')
}

export const transformToMccContact = (careTeamParticipant: CareTeamParticipant, careTeamMembers: Map<string, Practitioner>): MccPatientContact => {
  const theRole = careTeamParticipant?.role ? getConceptDisplayString(careTeamParticipant?.role[0]) : ''

  const theParticipation = resolve(careTeamParticipant.member, careTeamMembers);

  const thePhone = theParticipation?.telecom?.find((t) => t?.system === 'phone');
  const theEmail = theParticipation?.telecom?.find((t) => t?.system === 'email');

  var theAddress = '';
  if (theParticipation) {
    if (theParticipation.address) {
      var theLine = (theParticipation.address[0].line ? theParticipation.address[0].line[0] : '');
      var theCity = (theParticipation.address[0].city ? theParticipation.address[0].city : '');
      var theState = (theParticipation.address[0].state ? theParticipation.address[0].state : '');
      var theZip = (theParticipation.address[0].postalCode ? theParticipation.address[0].postalCode : '');
      theAddress = `${theLine} ${theCity} ${theState} ${theZip}`
    }
  }


  const theName = theParticipation?.name?.[0].text ?? careTeamParticipant.member?.display ?? careTeamParticipant.member?.reference ?? "No name";

  return {
    type: 'person',
    role: theRole,
    name: theName,
    hasImage: false,
    phone: thePhone ? thePhone?.value : '',
    email: theEmail ? theEmail?.value : '',
    address: theAddress ? theAddress : '',
    relFhirId: 'relation'
  };
}
