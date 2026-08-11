import { Property } from '@activepieces/pieces-framework';
import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  atHourDropdown,
  dateDirectionDropdown,
  dateFieldDropdown,
} from '../../common/props';

/**
 * Date-anchored automation (parity S5.2) — HubSpot's date-property schedule
 * trigger class. The Opplify server runs an hourly scanner: once the
 * company's local clock passes the chosen hour, every lead whose date field
 * lands exactly N days ahead (before) or behind (after) fires ONCE — the
 * server keeps a fired ledger per lead per date, so reruns never double-fire
 * and a yearly date fires again next year.
 */
export const datePropertyReached = createOpplifyTrigger({
  name: 'date_property_reached',
  displayName: 'Date Arrives (Days Before/After a Date Field)',
  description:
    "Runs for each lead when a chosen date field gets close — for example " +
    "'3 days before Renewal Date at 09:00' or '1 day after an appointment date'. " +
    'Each lead runs once per date; if the field holds a new date next year, they run again. ' +
    "Times use your company's timezone.",
  eventType: 'date_property_reached',
  props: {
    fieldName: dateFieldDropdown,
    direction: dateDirectionDropdown,
    offsetDays: Property.Number({
      displayName: 'How many days before/after',
      description: '0 means on the day itself. Up to 365.',
      required: true,
    }),
    atHour: atHourDropdown,
  },
  sampleData: SAMPLE_DATA.date_property_reached,
});
