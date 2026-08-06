import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  eventTypeFilterDropdown,
  formIdDropdown,
} from '../../common/props';

export const appointmentBooked = createOpplifyTrigger({
  name: 'appointment_booked',
  displayName: 'Appointment Booked',
  description:
    'Triggers when a lead books an appointment. Filter by event type and/or the form the booking came from (both optional).',
  eventType: 'appointment_booked',
  props: {
    eventTypeId: eventTypeFilterDropdown,
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.appointment_booked,
});
