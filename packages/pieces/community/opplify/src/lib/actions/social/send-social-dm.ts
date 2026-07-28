import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { setupPanel } from '../../common/setup-panel';
import { buildMessageBody, buttonProps, socialActionCtx, socialTargetProps, trackLinksProp } from './_shared';

export const sendSocialDmAction = createAction({
  name: 'send_social_dm',
  displayName: 'Send Instagram/Facebook DM',
  description:
    'Sends a direct message to the person from the trigger. Add link buttons or quick replies for a richer message. Only works inside the 24-hour reply window after their last message or story reply.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    ...socialTargetProps,
    text: setupPanel(
      Property.LongText({
        displayName: 'Message',
        description: 'What to say',
        required: true,
      })
    ),
    ...buttonProps,
    trackLinks: trackLinksProp,
    quickReplies: setupPanel(
      Property.Array({
        displayName: 'Quick replies',
        description:
          'Tappable answer chips shown under the message (used only when no buttons are set; max 13, 20 characters each)',
        required: false,
      })
    ),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/reply', {
      leadId: context.propsValue.leadId,
      communicationId: context.propsValue.communicationId,
      mode: 'dm',
      message: buildMessageBody(
        context.propsValue.text,
        context.propsValue,
        context.propsValue.quickReplies
      ),
      trackLinks: context.propsValue.trackLinks === true,
      flowRunId: context.run.id,
    });
  },
});
