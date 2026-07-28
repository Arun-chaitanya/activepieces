import { createAction, Property } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { socialActionCtx } from './_shared';

export const smartDelayAction = createAction({
  name: 'smart_delay',
  displayName: 'Smart Delay (Waking Hours)',
  description:
    "Waits the given time, but never resumes in the middle of the night: if the wait would end outside 9:00-21:00, it resumes at 9:00 the next morning instead. Times use YOUR COMPANY's timezone (from your default availability schedule) as an approximation for everyone — leads' own timezones are not known.",
  auth: opplifyAuth,
  requireAuth: true,
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
  props: {
    amount: Property.Number({
      displayName: 'Wait for',
      description: 'How long to wait (e.g. 20)',
      required: true,
    }),
    unit: Property.StaticDropdown({
      displayName: 'Unit',
      required: true,
      defaultValue: 'hours',
      options: {
        options: [
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' },
          { label: 'Days', value: 'days' },
        ],
      },
    }),
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      return { success: true, resumed: true };
    }
    const client = opplifyClient(await socialActionCtx(context));
    const result = (await client.callAction('social/smart-delay', {
      amount: context.propsValue.amount,
      unit: context.propsValue.unit,
    })) as { resumeAt?: string; timezone?: string };
    if (!result.resumeAt) {
      throw new Error('Smart delay could not compute a resume time');
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
