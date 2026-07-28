import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx, socialTargetProps } from './_shared';

export const replyToCommentAction = createAction({
  name: 'reply_to_comment',
  displayName: 'Reply to the Comment (Public)',
  description:
    'Posts a public reply under the comment from the trigger — visible to everyone. Often paired with a private reply.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    ...socialTargetProps,
    text: setupPanel(
      Property.LongText({
        displayName: 'Reply',
        description: 'The public reply text',
        required: true,
      })
    ),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/reply', {
      leadId: context.propsValue.leadId,
      communicationId: context.propsValue.communicationId,
      mode: 'comment_reply',
      message: context.propsValue.text,
    });
  },
});
