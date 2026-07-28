import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { buildMessageBody, buttonProps, socialActionCtx, socialTargetProps, trackLinksProp } from './_shared';

export const sendPrivateReplyAction = createAction({
  name: 'send_private_reply',
  displayName: 'DM the Commenter (Private Reply)',
  description:
    'Sends a private DM to someone who commented on your post — the comment-to-DM move. Meta allows exactly ONE private reply per comment, within 7 days.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    ...socialTargetProps,
    text: Property.LongText({
      displayName: 'Message',
      description: 'What to DM the commenter',
      required: true,
    }),
    ...buttonProps,
    trackLinks: trackLinksProp,
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/reply', {
      leadId: context.propsValue.leadId,
      communicationId: context.propsValue.communicationId,
      mode: 'private_reply',
      message: buildMessageBody(context.propsValue.text, context.propsValue),
      trackLinks: context.propsValue.trackLinks === true,
      flowRunId: context.run.id,
    });
  },
});
