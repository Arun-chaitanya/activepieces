import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  eventTypeFilterDropdown,
  formIdDropdown,
} from '../../common/props';

export const appointmentNoShow = createOpplifyTrigger({
  name: 'appointment_no_show',
  displayName: 'Appointment No Show',
  description:
    "Triggers when a lead doesn't show up for a scheduled appointment. Filter by event type and/or originating form (both optional).",
  eventType: 'appointment_no_show',
  props: {
    eventTypeId: eventTypeFilterDropdown,
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.appointment_no_show,
});
