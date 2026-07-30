import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { sequenceDropdown } from '../../common/props';
import { socialActionCtx } from './_shared';

export const unsubscribeFromSequenceAction = createAction({
  name: 'unsubscribe_from_sequence',
  displayName: 'Remove from Sequence',
  description:
    'Ends this person\'s enrollment in a message series. Use "Finished the series" as the LAST step ' +
    'of the sequence itself, or "Left early" from any other automation to pull someone out. ' +
    'Ending an enrollment that is already over is fine — nothing fails.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The person to remove (from the trigger: lead id)',
      required: true,
    }),
    sequenceFlowId: sequenceDropdown,
    outcome: Property.StaticDropdown({
      displayName: 'How it ends',
      required: false,
      defaultValue: 'completed',
      options: {
        options: [
          { label: 'Finished the series', value: 'completed' },
          { label: 'Left early', value: 'exited' },
        ],
      },
    }),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/unsubscribe-sequence', {
      leadId: context.propsValue.leadId,
      sequenceFlowId: context.propsValue.sequenceFlowId,
      outcome: context.propsValue.outcome || 'completed',
    });
  },
});
