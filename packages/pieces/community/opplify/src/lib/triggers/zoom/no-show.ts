import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { zoomMeetingFilterDropdown } from '../../common/props';

export const zoomNoShow = createOpplifyTrigger({
  name: 'zoom_no_show',
  displayName: 'Zoom No-Show Recorded',
  description:
    'Triggers after a Zoom meeting/webinar ends, once per lead who registered but never joined (from the post-event report). The classic follow-up: "missed you — here\'s the replay/next session."',
  eventType: 'zoom_no_show',
  props: {
    meetingId: zoomMeetingFilterDropdown,
  },
  sampleData: SAMPLE_DATA.zoom_no_show,
});
