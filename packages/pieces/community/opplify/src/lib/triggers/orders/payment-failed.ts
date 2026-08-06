import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { formIdDropdown } from '../../common/props';

export const paymentFailed = createOpplifyTrigger({
  name: 'payment_failed',
  displayName: 'Payment Failed',
  description:
    'Triggers when a payment fails (card declined, insufficient funds, etc.). Filter by the form whose submission created the order (optional).',
  eventType: 'payment_failed',
  props: {
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.payment_failed,
});
