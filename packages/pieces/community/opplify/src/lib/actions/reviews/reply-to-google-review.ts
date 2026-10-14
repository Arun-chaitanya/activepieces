import { createAction, InputPropertyMap, PieceAuth, Property } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';
import { reviewIdProp } from './_shared';

const UNIT_MS: Record<string, number> = {
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
};

/**
 * The wait in ms: the replyDelay choice (minutes), or the amount and unit
 * that steps saved before 0.32.2 kept.
 */
function replyDelayMs(props: Record<string, unknown>): number {
  if (props['replyDelay'] !== undefined && props['replyDelay'] !== null) {
    const minutes = Number(props['replyDelay']);
    return Number.isFinite(minutes) && minutes > 0 ? minutes * UNIT_MS['minutes'] : 0;
  }
  const amount = Number(props['delayAmount'] ?? 0);
  const unitMs = UNIT_MS[String(props['delayUnit'] ?? 'hours')] ?? UNIT_MS['hours'];
  return Number.isFinite(amount) && amount > 0 ? amount * unitMs : 0;
}

/** Delays up to a minute run in-process; longer ones pause the run. */
const IN_PROCESS_DELAY_MS = 60 * 1000;

const DEFAULT_TONE = 'friendly';

const DEFAULT_TEMPLATE =
  'Thank you so much for taking the time to leave us a review! We really appreciate your feedback and hope to see you again soon.';

/** Starting guidance for the AI per tone, so the box is never empty. */
const DEFAULT_BRAND_NOTES: Record<string, string> = {
  friendly:
    'Sound friendly and relaxed. Thank the reviewer by name, mention something specific from their review, and invite them back. Keep it to 2-3 short sentences.',
  professional:
    'Sound polite and professional. Thank the reviewer, respond to the main point of their review, and keep it to 2-3 sentences. No emojis.',
  warm:
    'Sound warm and personal, like the owner replying. Thank the reviewer by name, show how much their visit means to us, and invite them back. Keep it to 2-3 sentences.',
  apologetic:
    'Apologise sincerely for what went wrong without making excuses, and invite them to get in touch so we can make it right. Do not invent contact details. Keep it calm and to 2-4 sentences.',
  enthusiastic:
    'Sound upbeat and excited. Thank the reviewer with energy, celebrate what they enjoyed, and invite them back. One emoji at most.',
};

/**
 * Only the chosen mode's box: brand voice for an AI reply, the text for a
 * template. Brand voice is keyed by tone so changing the tone brings that
 * tone's starting text instead of keeping the previous one.
 */
const replyContent = setupPanel(
  Property.DynamicProperties({
    auth: PieceAuth.None(),
    displayName: 'Reply',
    required: false,
    refreshers: ['replyMode', 'tone'],
    props: async ({ replyMode, tone }) => {
      const fields: InputPropertyMap = {};
      if ((replyMode as unknown as string) === 'template') {
        fields['template'] = Property.ShortText({
          displayName: 'Template',
          description:
            'The reply posted as written. Edit it freely; insert trigger data such as the reviewer first name from the data picker.',
          required: true,
          defaultValue: DEFAULT_TEMPLATE,
        });
        return fields;
      }
      const selected = (tone as unknown as string | undefined) || DEFAULT_TONE;
      fields[`brandNotes_${selected}`] = Property.ShortText({
        displayName: 'Brand voice and notes',
        description:
          'Guidance for the AI: how you talk, what to mention, how to sign off. Edit it to fit your business.',
        required: false,
        defaultValue: DEFAULT_BRAND_NOTES[selected] ?? DEFAULT_BRAND_NOTES[DEFAULT_TONE],
      });
      return fields;
    },
  })
);

export const replyToGoogleReviewAction = createAction({
  name: 'reply_to_google_review',
  displayName: 'Reply to Google Review',
  description:
    'Posts a public reply to the Google review from the trigger: your fixed text, or an AI reply in your tone and brand voice. ' +
    'Add a delay so replies do not look instant. Replies to 1-3 star reviews can wait for your approval in Business > Reviews instead of posting. ' +
    'If someone on your team replies first, nothing is posted.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    reviewId: reviewIdProp,
    replyMode: setupPanel(
      Property.StaticDropdown({
        displayName: 'Reply with',
        required: true,
        defaultValue: 'ai',
        options: {
          options: [
            { label: 'An AI-written reply', value: 'ai' },
            { label: 'A fixed template', value: 'template' },
          ],
        },
      })
    ),
    tone: setupPanel(
      Property.StaticDropdown({
        displayName: 'Tone',
        description: 'How the AI reply should sound (AI replies only)',
        required: false,
        defaultValue: DEFAULT_TONE,
        options: {
          options: [
            { label: 'Friendly', value: 'friendly' },
            { label: 'Professional', value: 'professional' },
            { label: 'Warm', value: 'warm' },
            { label: 'Apologetic', value: 'apologetic' },
            { label: 'Enthusiastic', value: 'enthusiastic' },
          ],
        },
      })
    ),
    replyContent,
    replyDelay: setupPanel(
      Property.StaticDropdown({
        displayName: 'Wait before replying',
        description: 'So the reply does not look instant.',
        required: false,
        defaultValue: '0',
        options: {
          options: [
            { label: 'Reply right away', value: '0' },
            { label: '30 minutes', value: '30' },
            { label: '1 hour', value: '60' },
            { label: '3 hours', value: '180' },
            { label: '1 day', value: '1440' },
            { label: '2 days', value: '2880' },
          ],
        },
      })
    ),
    requireApprovalForLowRatings: setupPanel(
      Property.Checkbox({
        displayName: 'Require approval for 1-3 star reviews',
        description:
          'The reply waits in Business > Reviews (Awaiting approval) and your admins are notified, instead of posting.',
        required: false,
        defaultValue: true,
      })
    ),
    skipIfReplied: Property.Checkbox({
      displayName: 'Skip if the review already has a reply',
      description: 'Never overwrite a reply your team already posted.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    if (context.executionType !== ExecutionType.RESUME) {
      const delayMs = replyDelayMs(props as unknown as Record<string, unknown>);
      if (delayMs > IN_PROCESS_DELAY_MS) {
        context.run.pause({
          pauseMetadata: {
            type: PauseType.DELAY,
            resumeDateTime: new Date(Date.now() + delayMs).toISOString(),
          },
        });
        return { status: 'waiting' };
      }
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const fields = (props.replyContent ?? {}) as Record<string, unknown>;
    // Steps saved before 0.32.2 kept template and brandNotes at the top level.
    const legacy = props as unknown as Record<string, unknown>;
    const tone = props.tone || DEFAULT_TONE;
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('google-business/reply', {
      reviewId: props.reviewId,
      mode: props.replyMode,
      template: fields['template'] ?? legacy['template'],
      tone: props.tone,
      brandNotes: fields[`brandNotes_${tone}`] ?? legacy['brandNotes'],
      approvalAtOrBelow: props.requireApprovalForLowRatings === false ? null : 3,
      skipIfReplied: props.skipIfReplied !== false,
      flowRunId: context.run.id,
    });
  },
});
