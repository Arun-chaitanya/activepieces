import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx, socialTargetProps } from './_shared';

/**
 * One reply per comment, chosen uniformly at random from the main Reply plus
 * every non-empty variation. Blank rows in the list are ignored, so a half
 * filled list never sends an empty reply.
 */
export function pickReply(text: string, variations: unknown[] | undefined): string {
  const pool = [text, ...(variations ?? [])]
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
  if (pool.length === 0) return text;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const replyToCommentAction = createAction({
  name: 'reply_to_comment',
  displayName: 'Reply to the Comment (Public)',
  description:
    'Posts a public reply under the comment from the trigger — visible to everyone. Often paired with a private reply. ' +
    'Add reply variations and one is picked at random per comment, so repeated identical replies do not read as automated.',
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
    variations: setupPanel(
      Property.Array({
        displayName: 'More reply variations',
        description:
          'Optional alternative wordings of the reply. Each comment gets ONE of them at random (the Reply above counts as one). ' +
          '3 to 5 variations with different wording and punctuation keep Meta from flagging identical automated replies.',
        required: false,
      })
    ),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/reply', {
      leadId: context.propsValue.leadId,
      communicationId: context.propsValue.communicationId,
      mode: 'comment_reply',
      message: pickReply(context.propsValue.text, context.propsValue.variations),
    });
  },
});
