import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const leadScoreChanged = createOpplifyTrigger({
  name: 'lead_score_changed',
  displayName: 'Lead Score Changed',
  description:
    "Triggers when a lead's score is adjusted — by tag rules, manual update, or workflow action. To react to a score threshold (e.g. at least 50), add rules in the Filters panel.",
  eventType: 'score_changed',
  props: {},
  sampleData: SAMPLE_DATA.score_changed,
});
