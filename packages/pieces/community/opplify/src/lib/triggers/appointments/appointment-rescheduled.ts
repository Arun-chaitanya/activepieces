import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  eventTypeFilterDropdown,
  formIdDropdown,
} from '../../common/props';

export const appointmentRescheduled = createOpplifyTrigger({
  name: 'appointment_rescheduled',
  displayName: 'Appointment Rescheduled',
  description:
    'Triggers when an appointment is rescheduled to a new time. Filter by event type and/or originating form (both optional).',
  eventType: 'appointment_rescheduled',
  props: {
    eventTypeId: eventTypeFilterDropdown,
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.appointment_rescheduled,
});
