import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { ctxFromProperty } from '../../common/props';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';

/**
 * "Wait up to 3 days for a reply or a booking, whichever comes first"
 * (workflow-engine-waits S2.1). The server records the wait; the run parks
 * with the engine's webhook pause and is woken by the event bridge (one of
 * the chosen events for this lead) or by the timeout scanner. Resumed, the
 * step returns { outcome, event, data } for a router to branch on.
 */
export const waitForEventAction = createAction({
  name: 'wait_for_event',
  displayName: 'Wait for the Lead to Do Something',
  description:
    "Pauses this automation until the lead does one of the chosen things — replies, books, submits a form, clicks — or until the maximum wait passes, whichever comes first. Events from before this step do not count. The step's output is outcome: 'event' (with event = which one, and data = its details) or 'timeout'; a router on outcome decides what happens next.",
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
      description: 'The lead whose actions end the wait (from the trigger: lead id)',
      required: true,
    }),
    events: setupPanel(
      Property.MultiSelectDropdown({
        auth: PieceAuth.None(),
        displayName: 'Wait for any of',
        description: 'The first of these to happen for this lead continues the automation',
        required: true,
        refreshers: [],
        options: async (_propsValue, context) => {
          try {
            const ctx = await ctxFromProperty(context);
            const client = opplifyClient(ctx);
            const result = (await client.getMeta('lead-events')) as {
              events: Array<{ value: string; label: string }>;
            };
            return { disabled: false, options: result.events || [] };
          } catch {
            return { disabled: true, options: [], placeholder: 'Failed to load lead events' };
          }
        },
      })
    ),
    maxWaitAmount: setupPanel(
      Property.Number({
        displayName: 'Wait at most',
        description: 'After this long with none of the events, the automation continues with outcome: timeout. Up to 90 days.',
        required: true,
        defaultValue: 3,
      })
    ),
    maxWaitUnit: setupPanel(
      Property.StaticDropdown({
        displayName: 'Unit',
        required: true,
        defaultValue: 'days',
        options: {
          options: [
            { label: 'Minutes', value: 'minutes' },
            { label: 'Hours', value: 'hours' },
            { label: 'Days', value: 'days' },
          ],
        },
      })
    ),
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      const body = (context.resumePayload?.body ?? {}) as {
        outcome?: string;
        event?: string | null;
        data?: Record<string, unknown>;
      };
      return {
        outcome: body.outcome ?? 'timeout',
        event: body.event ?? null,
        data: body.data ?? {},
      };
    }

    const client = opplifyClient(await socialActionCtx(context));
    const result = (await client.callAction('wait/register', {
      runId: context.run.id,
      flowId: context.flows.current.id,
      leadId: context.propsValue.leadId,
      events: context.propsValue.events,
      maxWait: {
        amount: Number(context.propsValue.maxWaitAmount),
        unit: context.propsValue.maxWaitUnit,
      },
    })) as { waitId?: string; deadlineAt?: string; error?: string };

    if (!result.waitId) {
      throw new Error(result.error || 'Wait for event could not be registered');
    }

    context.run.pause({
      pauseMetadata: {
        type: PauseType.WEBHOOK,
        response: {},
      },
    });

    return { waiting: true, deadlineAt: result.deadlineAt, events: context.propsValue.events };
  },
});
