import { createAction, Property } from '@activepieces/pieces-framework';
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

/** Delays up to a minute run in-process; longer ones pause the run. */
const IN_PROCESS_DELAY_MS = 60 * 1000;

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
    template: setupPanel(
      Property.LongText({
        displayName: 'Template',
        description:
          `Used when replying with a fixed template. Insert trigger data such as the reviewer first name, e.g. "Thank you, {{trigger['data']['reviewer_first_name']}}!"`,
        required: false,
      })
    ),
    tone: setupPanel(
      Property.StaticDropdown({
        displayName: 'Tone',
        description: 'How the AI reply should sound',
        required: false,
        defaultValue: 'friendly',
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
    brandNotes: Property.LongText({
      displayName: 'Brand voice and notes',
      description:
        'Optional guidance for the AI: how you talk, what to mention (e.g. "We are a family-run bakery. Invite unhappy customers to email hello@example.com"), how to sign off.',
      required: false,
    }),
    delayAmount: setupPanel(
      Property.Number({
        displayName: 'Wait before replying',
        description: 'So the reply does not look instant. 0 replies right away.',
        required: false,
        defaultValue: 0,
      })
    ),
    delayUnit: Property.StaticDropdown({
      displayName: 'Wait unit',
      required: false,
      defaultValue: 'hours',
      options: {
        options: [
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' },
          { label: 'Days', value: 'days' },
        ],
      },
    }),
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
      const amount = Number(props.delayAmount ?? 0);
      const unitMs = UNIT_MS[props.delayUnit ?? 'hours'] ?? UNIT_MS['hours'];
      const delayMs = Number.isFinite(amount) && amount > 0 ? amount * unitMs : 0;
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

    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('google-business/reply', {
      reviewId: props.reviewId,
      mode: props.replyMode,
      template: props.template,
      tone: props.tone,
      brandNotes: props.brandNotes,
      approvalAtOrBelow: props.requireApprovalForLowRatings === false ? null : 3,
      skipIfReplied: props.skipIfReplied !== false,
      flowRunId: context.run.id,
    });
  },
});
