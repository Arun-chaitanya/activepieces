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
 */
export const waitUntilAction = createAction({
  name: 'wait_until',
  displayName: 'Wait Until a Day & Time',
  description:
    "Pauses this automation until the next occurrence of a day and time — for example Monday at 09:00, or simply the next 09:00 with 'Any day'. Times use YOUR COMPANY's timezone (from your default availability schedule).",
  auth: opplifyAuth,
  requireAuth: true,
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
  props: {
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
