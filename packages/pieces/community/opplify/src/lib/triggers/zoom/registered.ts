import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { zoomMeetingFilterDropdown } from '../../common/props';

export const zoomRegistered = createOpplifyTrigger({
  name: 'zoom_registered',
  displayName: 'Zoom Registration Created',
  description:
    'Triggers when a lead is registered into a Zoom webinar or meeting (via a workflow action or any registration path). Payload data carries meetingId, topic, eventKind, the registrant\'s personal joinUrl, and startTime (when the event starts, ISO UTC; null if Zoom did not say).',
  eventType: 'zoom_registered',
  props: {
    meetingId: zoomMeetingFilterDropdown,
  },
  sampleData: SAMPLE_DATA.zoom_registered,
});
