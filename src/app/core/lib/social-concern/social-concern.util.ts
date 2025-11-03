import { MccCondition, MccSocialConcern } from '../../types/mcc-types';
import { displayDate } from '../../utils/date.utils';

export const transformToSocialConcern = (condition: MccCondition): MccSocialConcern => {
  return {
    name: condition.code.text,
    data: condition.clinicalStatus && condition.clinicalStatus.coding[0] ? condition.clinicalStatus.coding[0].code : '',
    description: null,
    date: condition.onsetDateTime ? displayDate(condition.onsetDateTime) : null,
    hovered: false,
  };
}
