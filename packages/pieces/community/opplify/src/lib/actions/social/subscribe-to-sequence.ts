import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { sequenceDropdown } from '../../common/props';
import { socialActionCtx } from './_shared';

export const subscribeToSequenceAction = createAction({
  name: 'subscribe_to_sequence',
  displayName: 'Add to Sequence',
  description:
    'Enrolls this person in a message series (a published flow that starts with "Sequence Started"). ' +
    'The series runs on its own from there. Someone already in the series is not enrolled twice ' +
    'and the series is not restarted. Put this step in the automation that FEEDS the sequence ' +
    '(e.g. your comment-to-DM flow) — a sequence cannot enroll people into itself.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The person to enroll (from the trigger: lead id)',
      required: true,
    }),
    communicationId: Property.ShortText({
      displayName: 'Communication ID',
      description:
        'The message that led to this enrollment (from the trigger: communication id). ' +
        'Lets the series reply in the same conversation and from the same account.',
      required: false,
    }),
    sequenceFlowId: sequenceDropdown,
    exitOnReply: Property.Checkbox({
      displayName: 'Stop the series if they reply',
      description:
        'On (recommended): the moment this person sends you a DM or story reply, ' +
        'they leave the series and the remaining messages are skipped — nobody ' +
        'keeps getting drip messages mid-conversation.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/subscribe-sequence', {
      leadId: context.propsValue.leadId,
      communicationId: context.propsValue.communicationId,
      sequenceFlowId: context.propsValue.sequenceFlowId,
      exitOnReply: context.propsValue.exitOnReply !== false,
      flowRunId: context.run.id,
    });
  },
});
