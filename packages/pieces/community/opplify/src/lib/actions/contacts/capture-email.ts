import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

const BASE_URL = process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001';

export const captureEmailAction = createAction({
  name: 'capture_email',
  displayName: 'Capture Email from Message',
  description:
    "Reads an email address out of the person's message and saves it onto their contact. " +
    'Returns captured (true/false) and the email — use a Router on captured to thank them, ' +
    'sync to your email list, or ask again when the address is not valid. ' +
    'An existing different email on the contact is never overwritten.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The person (from the trigger: lead id)',
      required: true,
    }),
    content: Property.ShortText({
      displayName: 'Message text',
      description: "The message to read the email from (from the trigger: data content)",
      required: true,
    }),
  },
  async run(context) {
    const externalId = (await context.project.externalId()) || '';
    const client = opplifyClient({
      projectId: context.project.id,
      externalId,
      baseUrl: BASE_URL,
    });
    return await client.callAction('leads/capture-email', {
      leadId: context.propsValue.leadId,
      content: context.propsValue.content,
    });
  },
});
