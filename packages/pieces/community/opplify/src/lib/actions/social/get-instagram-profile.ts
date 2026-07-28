import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { socialActionCtx } from './_shared';

export const getInstagramProfileAction = createAction({
  name: 'get_instagram_profile',
  displayName: 'Get Instagram Profile (Do They Follow You?)',
  description:
    "Looks up this person's Instagram profile: name, username, follower count, and followsYou — whether they follow your account. Use a Router after this step to send followers and non-followers different messages. If the profile cannot be read, found is false (branch on that as your fallback).",
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The person to look up (from the trigger: lead id)',
      required: true,
    }),
    communicationId: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The received message from the trigger (data communication_id) — makes sure the lookup uses the account that received it',
      required: false,
    }),
  },
  async run(context) {
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('social/instagram-profile', {
      leadId: context.propsValue.leadId,
      communicationId: context.propsValue.communicationId || undefined,
    });
  },
});
