import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  googleLocationsMultiDropdown,
  reviewKeywordsProp,
  reviewMatchTypeDropdown,
  reviewRatingsMultiDropdown,
} from '../../common/props';

export const googleReviewUpdated = createOpplifyTrigger({
  name: 'google_review_updated',
  displayName: 'Google review updated',
  description:
    'Triggers when a reviewer edits their Google review (new star rating or text). The previous rating and text are included. Your own replies never trigger it.',
  eventType: 'google_review_updated',
  props: {
    ratings: reviewRatingsMultiDropdown,
    keywords: reviewKeywordsProp,
    matchType: reviewMatchTypeDropdown,
    integrationIds: googleLocationsMultiDropdown,
  },
  sampleData: SAMPLE_DATA['google_review_updated'],
});
