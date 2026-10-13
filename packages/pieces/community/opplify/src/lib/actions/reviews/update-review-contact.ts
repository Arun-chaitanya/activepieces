import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { statusDropdown } from '../../common/props';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';
import { reviewIdProp } from './_shared';

export const updateReviewContactAction = createAction({
  name: 'update_review_contact',
  displayName: 'Tag or Update Review Contact',
  description:
    'Adds tags to (and optionally sets the status of) the contact the Google review is linked to. ' +
    'Google only shares the reviewer name, so an unlinked review can be matched by name: it links when exactly one contact has that name. ' +
    'Returns status "no_contact" when there is no contact to update, so later steps can branch on it.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    reviewId: reviewIdProp,
    matchByName: setupPanel(
      Property.Checkbox({
        displayName: 'Match by name when not linked',
        description: 'Link the review to the only contact whose name equals the reviewer name.',
        required: false,
        defaultValue: true,
      })
    ),
    tags: setupPanel(
      Property.Array({
        displayName: 'Tags to add',
        description: 'e.g. google-reviewer, happy-customer',
        required: false,
      })
    ),
    status: statusDropdown,
  },
  async run(context) {
    const props = context.propsValue;
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('google-business/contact', {
      reviewId: props.reviewId,
      matchByName: props.matchByName !== false,
      tags: (props.tags ?? []).map(String),
      status: props.status,
    });
  },
});
