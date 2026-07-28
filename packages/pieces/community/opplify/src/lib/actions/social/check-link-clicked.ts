import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { socialActionCtx } from './_shared';

export const checkLinkClickedAction = createAction({
  name: 'check_link_clicked',
  displayName: 'Did They Click the Link?',
  description:
    'Checks whether this person has clicked any tracked button link sent earlier in this workflow (from a send step with "Track button clicks" on). Place it after a Delay step, then use a Router to follow up with people who did not click. Returns clicked (true/false), clickedAt, and linksSent.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The person to check (from the trigger: lead id)',
      required: true,
    }),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/link-clicked', {
      leadId: context.propsValue.leadId,
      flowRunId: context.run.id,
    });
  },
});
