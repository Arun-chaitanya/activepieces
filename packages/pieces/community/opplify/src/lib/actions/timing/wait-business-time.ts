import { createAction, Property } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';

/**
 * Business-time waits (parity S5.3): duration counted only on Monday–Friday
 * (business days keep the wall-clock time; business hours count inside
 * 09:00–17:00 and spill across days). Server-computed in the company
 * timezone; the run pauses via the engine's delay mechanism, so the wait
 * survives worker restarts.
 */
export const waitBusinessTimeAction = createAction({
  name: 'wait_business_time',
  displayName: 'Wait (Business Days or Hours)',
  description:
    "Waits a duration counted only during business time, in YOUR COMPANY's timezone: business days skip weekends ('2 business days' on Friday resumes Tuesday), and business hours count only within 09:00-17:00 Monday-Friday ('2 business hours' on Friday 16:00 resumes Monday 10:00).",
  auth: opplifyAuth,
  requireAuth: true,
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
  props: {
    amount: setupPanel(
      Property.Number({
        displayName: 'Wait for',
        description: 'How long to wait (e.g. 2)',
        required: true,
      })
    ),
    unit: setupPanel(
      Property.StaticDropdown({
        displayName: 'Unit',
        required: true,
        defaultValue: 'business_days',
        options: {
          options: [
            { label: 'Business days (Mon-Fri)', value: 'business_days' },
            { label: 'Business hours (Mon-Fri, 09:00-17:00)', value: 'business_hours' },
          ],
        },
      })
    ),
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      return { success: true, resumed: true };
    }
    const client = opplifyClient(await socialActionCtx(context));
    const result = (await client.callAction('wait/compute', {
      mode: 'business',
      amount: context.propsValue.amount,
      unit: context.propsValue.unit,
    })) as { resumeAt?: string; timezone?: string };
    if (!result.resumeAt) {
      throw new Error('Business-time wait could not compute a resume time');
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
