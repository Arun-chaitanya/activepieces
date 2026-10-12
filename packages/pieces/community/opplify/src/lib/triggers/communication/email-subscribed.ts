import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const emailSubscribed = createOpplifyTrigger({
  name: 'email_subscribed',
  displayName: 'Email Subscribed',
  description:
    'Triggers when a lead becomes subscribed to marketing email: a ticked form box, a confirmed double opt-in, an import or a teammate with a declared permission. A lead who was already subscribed does not trigger it again, and a double opt-in triggers it only once the lead confirms.',
  eventType: 'email_subscribed',
  sampleData: SAMPLE_DATA.email_subscribed,
});
