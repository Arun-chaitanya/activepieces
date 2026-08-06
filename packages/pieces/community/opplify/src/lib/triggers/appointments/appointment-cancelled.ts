import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  eventTypeFilterDropdown,
  formIdDropdown,
} from '../../common/props';

export const appointmentCancelled = createOpplifyTrigger({
  name: 'appointment_cancelled',
  displayName: 'Appointment Cancelled',
  description:
    'Triggers when an appointment is cancelled. Filter by event type and/or originating form (both optional).',
  eventType: 'appointment_cancelled',
  props: {
    eventTypeId: eventTypeFilterDropdown,
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.appointment_cancelled,
});
