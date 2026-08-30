import { createAction, Property } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { atHourDropdown, dateFieldDropdown } from '../../common/props';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';

/**
 * "7 days before Renewal Date at 09:00", inside a running flow
 * (workflow-engine-waits S2.2). Sibling of wait_until: the server computes
 * the instant from the lead's own date field and the run pauses with the
 * engine's delay mechanism. An empty field or a date already behind us does
 * not pause — the step says so in `outcome` and the flow continues.
 */
export const waitUntilLeadDateAction = createAction({
  name: 'wait_until_lead_date',
  displayName: 'Wait Until a Date on the Lead',
  description:
    "Pauses this automation until a date stored on the lead — for example 7 days before their Renewal Date at 09:00, or 1 day after their appointment date. Times use YOUR COMPANY's timezone. The step's output is outcome: 'reached' (it waited and the moment came), 'past' (the moment was already behind, no wait) or 'unknown' (the lead has no value in that field, no wait) — a router on outcome decides what happens next. Waits are capped at 90 days.",
  auth: opplifyAuth,
  requireAuth: true,
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
  props: {
    leadId: Property.ShortText({
      defaultValue: "{{trigger['lead']['id']}}",
      displayName: 'Lead ID',
      description: 'The lead whose date field is read (from the trigger: lead id)',
      required: true,
    }),
    fieldName: setupPanel(dateFieldDropdown),
    direction: setupPanel(
      Property.StaticDropdown({
        displayName: 'When, relative to that date',
        required: true,
        defaultValue: 'before',
        options: {
          options: [
            { label: 'Some days before the date', value: 'before' },
            { label: 'On the date itself', value: 'on' },
            { label: 'Some days after the date', value: 'after' },
          ],
        },
      })
    ),
    offsetDays: setupPanel(
      Property.Number({
        displayName: 'How many days before/after',
        description: 'Ignored for "On the date itself". Up to 365.',
        required: false,
        defaultValue: 0,
      })
    ),
    atHour: setupPanel(atHourDropdown),
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      return { outcome: 'reached' };
    }
    const client = opplifyClient(await socialActionCtx(context));
    const result = (await client.callAction('wait/compute', {
      mode: 'date_property',
      leadId: context.propsValue.leadId,
      fieldName: context.propsValue.fieldName,
      direction: context.propsValue.direction,
      offsetDays:
        context.propsValue.direction === 'on' ? 0 : Number(context.propsValue.offsetDays ?? 0),
      atHour: context.propsValue.atHour,
    })) as {
      resumeAt?: string;
      timezone?: string;
      unknown?: boolean;
      past?: boolean;
      error?: string;
    };

    if (result.unknown) {
      return { outcome: 'unknown', timezone: result.timezone };
    }
    if (result.past) {
      return { outcome: 'past', resumeAt: result.resumeAt, timezone: result.timezone };
    }
    if (!result.resumeAt) {
      throw new Error(result.error || 'Wait Until a Date on the Lead could not compute a resume time');
    }

    const resumeAt = new Date(result.resumeAt);
    const delayInMs = resumeAt.getTime() - Date.now();
    if (delayInMs <= 60 * 1000) {
      // Same short-delay carve-out as the official Delay piece.
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, delayInMs)));
      return { outcome: 'reached', resumeAt: result.resumeAt, timezone: result.timezone };
    }
    context.run.pause({
      pauseMetadata: {
        type: PauseType.DELAY,
        resumeDateTime: resumeAt.toISOString(),
      },
    });
    return { outcome: 'reached', resumeAt: result.resumeAt, timezone: result.timezone };
  },
});
