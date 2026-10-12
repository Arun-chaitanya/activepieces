import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { socialActionCtx } from '../social/_shared';

/**
 * Changes the lead's email status from a workflow, written to the lead's
 * permission history with basis "Set by a teammate" and this step's note. A
 * workflow can take permission away (unsubscribed, not opted in) but never
 * grant it: subscribing needs the lead's own consent, which a workflow cannot
 * show. Bounced and spam-marked leads are left as they are.
 */
export const setEmailStatusAction = createAction({
  name: 'set_email_status',
  displayName: 'Set Email Status',
  description:
    "Marks the lead as unsubscribed or not opted in to marketing email, with a note saved in their permission history. A workflow cannot subscribe a lead (that needs the lead's own consent). Output: changed (true/false) and the status before.",
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      defaultValue: "{{trigger['lead']['id']}}",
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Email status',
      required: true,
      defaultValue: 'unsubscribed',
      options: {
        options: [
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Not opted in', value: 'not_opted_in' },
        ],
      },
    }),
    note: Property.ShortText({
      displayName: 'Note',
      description: "Why, saved in the lead's permission history (for example: sunset)",
      required: false,
    }),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('leads/set-email-status', {
      leadId: context.propsValue.leadId,
      status: context.propsValue.status,
      note: context.propsValue.note,
      flowRunId: context.run.id,
    });
  },
});
