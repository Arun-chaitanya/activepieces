import { createAction, Property } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';

/**
 * "Wait until Monday 09:00" (parity S5.3). The server computes the exact
 * resume instant in the company timezone (DST-safe); the run pauses with the
 * engine's own delay mechanism, so the wait survives worker restarts.
 *
 * "Some time before a date" (0.30.0, email Story 4.4): with Wait for = a
 * date, the step waits until that date minus the offset, e.g. 24 hours
 * before a webinar's startTime. It never acts late: a moment already behind
 * (or a wake long after it) answers outcome 'past' without waiting, and an
 * empty date answers 'unknown'; only 'reached' means the moment came. A
 * router on outcome decides what happens next. Steps saved without Wait for
 * keep the day-and-time behaviour unchanged.
 */
export const waitUntilAction = createAction({
  name: 'wait_until',
  displayName: 'Wait Until a Day & Time',
  description:
    "Pauses this automation until the next occurrence of a day and time — for example Monday at 09:00, or simply the next 09:00 with 'Any day'. Times use YOUR COMPANY's timezone (from your default availability schedule). Or, with Wait for set to a date, until some time before that date (for example 24 hours before the webinar's startTime): the output is outcome 'reached' (the moment came), 'past' (it was already behind or the wait woke too late, so act on nothing) or 'unknown' (no date).",
  auth: opplifyAuth,
  requireAuth: true,
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
  props: {
    waitFor: Property.StaticDropdown({
      displayName: 'Wait for',
      required: false,
      defaultValue: 'day_time',
      options: {
        options: [
          { label: 'A day and time', value: 'day_time' },
          { label: 'Some time before a date', value: 'before_date' },
        ],
      },
    }),
    dateTime: Property.ShortText({
      displayName: 'Date',
      description:
        "Some time before a date: the date and time to count back from, e.g. the trigger's startTime (ISO). Empty means outcome 'unknown'.",
      required: false,
    }),
    offsetAmount: Property.Number({
      displayName: 'How long before',
      description: 'Some time before a date: the amount (0 = at the date itself).',
      required: false,
      defaultValue: 0,
    }),
    offsetUnit: Property.StaticDropdown({
      displayName: 'Unit',
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
    weekday: setupPanel(
      Property.StaticDropdown({
        displayName: 'Day',
        required: true,
        defaultValue: 'any',
        options: {
          options: [
            { label: 'Any day (the next time this time comes around)', value: 'any' },
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' },
          ],
        },
      })
    ),
    hour: setupPanel(
      Property.StaticDropdown({
        displayName: 'At what time',
        required: true,
        defaultValue: 9,
        options: {
          options: Array.from({ length: 24 }, (_, h) => ({
            label: `${String(h).padStart(2, '0')}:00`,
            value: h,
          })),
        },
      })
    ),
    minute: Property.StaticDropdown({
      displayName: 'Minutes past the hour',
      required: false,
      defaultValue: 0,
      options: {
        options: [0, 15, 30, 45].map((m) => ({
          label: `:${String(m).padStart(2, '0')}`,
          value: m,
        })),
      },
    }),
  },
  async run(context) {
    if (context.propsValue.waitFor === 'before_date') {
      return await waitBeforeDate(context);
    }
    if (context.executionType === ExecutionType.RESUME) {
      return { success: true, resumed: true };
    }
    const client = opplifyClient(await socialActionCtx(context));
    const result = (await client.callAction('wait/compute', {
      mode: 'until',
      weekday: context.propsValue.weekday,
      hour: context.propsValue.hour,
      minute: context.propsValue.minute ?? 0,
    })) as { resumeAt?: string; timezone?: string };
    if (!result.resumeAt) {
      throw new Error('Wait Until could not compute a resume time');
    }
    const resumeAt = new Date(result.resumeAt);
    const delayInMs = resumeAt.getTime() - Date.now();
    if (delayInMs <= 0) {
      return { success: true, resumeAt: result.resumeAt, timezone: result.timezone };
    }
    if (delayInMs <= 60 * 1000) {
      // Same short-delay carve-out as the official Delay piece.
      await new Promise((resolve) => setTimeout(resolve, delayInMs));
      return { success: true, resumeAt: result.resumeAt, timezone: result.timezone };
    }
    context.run.pause({
      pauseMetadata: {
        type: PauseType.DELAY,
        resumeDateTime: resumeAt.toISOString(),
      },
    });
    return { success: true, resumeAt: result.resumeAt, timezone: result.timezone };
  },
});

type BeforeDateResult = {
  resumeAt?: string;
  timezone?: string;
  unknown?: boolean;
  past?: boolean;
  reached?: boolean;
  error?: string;
};

async function waitBeforeDate(context: {
  executionType: ExecutionType;
  project: { id: string; externalId: () => Promise<string | undefined> };
  propsValue: {
    dateTime?: string;
    offsetAmount?: number;
    offsetUnit?: string;
  };
  run: { pause: (req: { pauseMetadata: { type: PauseType.DELAY; resumeDateTime: string } }) => void };
}) {
  const client = opplifyClient(await socialActionCtx(context));
  const compute = async (phase: 'start' | 'resume') =>
    (await client.callAction('wait/compute', {
      mode: 'before_time',
      dateTime: context.propsValue.dateTime ?? '',
      offsetAmount: Number(context.propsValue.offsetAmount ?? 0),
      offsetUnit: context.propsValue.offsetUnit ?? 'hours',
      phase,
    })) as BeforeDateResult;

  if (context.executionType === ExecutionType.RESUME) {
    // Woken by the delay: the server says whether this is still on time.
    const result = await compute('resume');
    return { outcome: result.reached ? 'reached' : 'past', resumeAt: result.resumeAt };
  }

  const result = await compute('start');
  if (result.unknown) {
    return { outcome: 'unknown', timezone: result.timezone };
  }
  if (result.past) {
    return { outcome: 'past', resumeAt: result.resumeAt, timezone: result.timezone };
  }
  if (!result.resumeAt) {
    throw new Error(result.error || 'Wait Until could not compute a resume time');
  }
  const delayInMs = new Date(result.resumeAt).getTime() - Date.now();
  if (delayInMs <= 60 * 1000) {
    // Same short-delay carve-out as the official Delay piece.
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, delayInMs)));
    return { outcome: 'reached', resumeAt: result.resumeAt, timezone: result.timezone };
  }
  context.run.pause({
    pauseMetadata: {
      type: PauseType.DELAY,
      resumeDateTime: result.resumeAt,
    },
  });
  return { outcome: 'reached', resumeAt: result.resumeAt, timezone: result.timezone };
}
