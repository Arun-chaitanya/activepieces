import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  formIdDropdown,
  funnelIdDropdown,
  websiteIdDropdown,
} from '../../common/props';

export const formSubmitted = createOpplifyTrigger({
  name: 'form_submitted',
  displayName: 'Form Submitted',
  description:
    'Triggers when a form is submitted — funnel-hosted, website-hosted, or standalone. Filter by a specific form, or scope to a whole funnel or website (pick at most one surface).',
  eventType: 'form_submitted',
  sourceType: 'funnel',
  props: {
    formId: formIdDropdown,
    funnelId: funnelIdDropdown,
    websiteId: websiteIdDropdown,
  },
  sampleData: SAMPLE_DATA.form_submitted,
});
