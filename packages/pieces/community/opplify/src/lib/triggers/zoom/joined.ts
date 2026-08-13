import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { zoomMeetingFilterDropdown } from '../../common/props';

export const zoomJoined = createOpplifyTrigger({
  name: 'zoom_joined',
  displayName: 'Zoom Participant Joined',
  description:
    'Triggers the moment a lead joins a live Zoom meeting/webinar — the one window a during-event automation can act. A rejoin may re-fire; journey gating prevents re-enrollment.',
  eventType: 'zoom_joined',
  props: {
    meetingId: zoomMeetingFilterDropdown,
  },
  sampleData: SAMPLE_DATA.zoom_joined,
});
