import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  googleLocationsMultiDropdown,
  reviewKeywordsProp,
  reviewMatchTypeDropdown,
  reviewRatingsMultiDropdown,
} from '../../common/props';

export const googleReviewReceived = createOpplifyTrigger({
  name: 'google_review_received',
  displayName: 'New Google review',
  description:
    'Triggers when a new review arrives on a connected Google Business Profile location. Filter by star rating, words in the review and location to reply automatically or alert your team about negative reviews.',
  eventType: 'google_review_received',
  props: {
    ratings: reviewRatingsMultiDropdown,
    keywords: reviewKeywordsProp,
    matchType: reviewMatchTypeDropdown,
    integrationIds: googleLocationsMultiDropdown,
  },
  sampleData: SAMPLE_DATA['google_review_received'],
});
