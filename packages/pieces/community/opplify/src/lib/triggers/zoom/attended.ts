import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { zoomMeetingFilterDropdown } from '../../common/props';

export const zoomAttended = createOpplifyTrigger({
  name: 'zoom_attended',
  displayName: 'Zoom Attendance Recorded',
  description:
    'Triggers after a Zoom meeting/webinar ends, once per lead the post-event report marks as attended. Payload data carries durationMinutes, attendancePercentage, pollsAnswered, questionsAsked — use them in conditions (e.g. "attended under 20% -> send the replay").',
  eventType: 'zoom_attended',
  props: {
    meetingId: zoomMeetingFilterDropdown,
  },
  sampleData: SAMPLE_DATA.zoom_attended,
});
