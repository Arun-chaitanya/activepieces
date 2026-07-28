import { createAction } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { socialActionCtx, socialTargetProps } from './_shared';

export const reactToMessageAction = createAction({
  name: 'react_to_message',
  displayName: 'Heart the Message',
  description:
    'Reacts with a heart to the received DM or story reply — a light-touch way to acknowledge every story reply automatically.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    ...socialTargetProps,
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/react', {
      leadId: context.propsValue.leadId,
      communicationId: context.propsValue.communicationId,
    });
  },
});
