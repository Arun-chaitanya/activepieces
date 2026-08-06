import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { formIdDropdown } from '../../common/props';

export const paymentCompleted = createOpplifyTrigger({
  name: 'payment_completed',
  displayName: 'Payment Completed',
  description:
    'Triggers when payment is successfully processed for an order. Filter by the form whose submission created the order (optional).',
  eventType: 'payment_completed',
  props: {
    formId: formIdDropdown,
  },
  sampleData: SAMPLE_DATA.payment_completed,
});
