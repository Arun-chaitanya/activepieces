import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  eventTypeFilterDropdown,
  formIdDropdown,
} from '../../common/props';

export const appointmentCompleted = createOpplifyTrigger({
  name: 'appointment_completed',
  displayName: 'Appointment Completed',
  description:
    'Triggers when an appointment is marked as completed. Filter by event type and/or originating form (both optional).',
  eventType: 'appointment_completed',
  props: {
    eventTypeId: eventTypeFilterDropdown,
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.appointment_completed,
});
