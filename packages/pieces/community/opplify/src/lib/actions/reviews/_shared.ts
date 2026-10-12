import { Property } from '@activepieces/pieces-framework';

/** The review every review action works on, wired from the trigger. */
export const reviewIdProp = Property.ShortText({
  defaultValue: "{{trigger['data']['review_id']}}",
  displayName: 'Review ID',
  description: 'The Google review to act on (from the trigger: data review_id)',
  required: true,
});
