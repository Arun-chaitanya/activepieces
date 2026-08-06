import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { zoomHostDropdown } from '../../common/props';

export const registerZoomLeadAction = createAction({
  name: 'zoom_register_lead',
  displayName: 'Register Lead to Zoom Meeting',
  description:
    'Registers a lead into a Zoom webinar or meeting and returns their unique join URL. The meeting id typically comes from the trigger data (e.g. a form answer).',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to register (e.g. {{trigger.lead.id}})',
      required: true,
    }),
    meetingId: Property.ShortText({
      displayName: 'Meeting/Webinar ID',
      description:
        'Numeric Zoom event id — map it from the trigger, e.g. {{trigger.data.formAnswers.meeting}}',
      required: true,
    }),
    eventKind: Property.StaticDropdown({
      displayName: 'Event Kind',
      description:
        'Meetings must be scheduled with registration required. Defaults to webinar.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Webinar', value: 'webinar' },
          { label: 'Meeting', value: 'meeting' },
        ],
      },
    }),
    hostUserId: zoomHostDropdown,
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('zoom/register-lead', {
      leadId: context.propsValue.leadId,
      meetingId: context.propsValue.meetingId,
      eventKind: context.propsValue.eventKind,
      hostUserId: context.propsValue.hostUserId,
    });
  },
});
