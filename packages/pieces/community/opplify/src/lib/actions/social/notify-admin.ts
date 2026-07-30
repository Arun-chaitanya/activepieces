import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from './_shared';

export const notifyAdminAction = createAction({
  name: 'notify_admin',
  displayName: 'Notify a Team Member (Human Takeover)',
  description:
    'Summons a human: sends your team an in-app notification and an email (when email is connected), ' +
    'both linking straight to this person\'s conversation. Use it when someone asks to talk to a human ' +
    'or when a conversation needs judgment. Once a team member pauses the conversation from the inbox, ' +
    'ALL automated messages to this person stop until it is resumed.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The person whose conversation needs a human (from the trigger: lead id)',
      required: true,
    }),
    message: setupPanel(
      Property.LongText({
        displayName: 'What should the team know?',
        description:
          'Shown in the notification, e.g. "Asked about enterprise pricing". Leave empty for a generic hand-off.',
        required: false,
      })
    ),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/notify-admin', {
      leadId: context.propsValue.leadId,
      message: context.propsValue.message,
    });
  },
});
