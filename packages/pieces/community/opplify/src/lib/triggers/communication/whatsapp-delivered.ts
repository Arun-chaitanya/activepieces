import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const whatsappDelivered = createOpplifyTrigger({
  name: 'whatsapp_delivered',
  displayName: 'WhatsApp Delivered',
  description: 'Triggers when an outbound WhatsApp message is delivered to the lead's device.',
  eventType: 'whatsapp_delivered',
  sampleData: SAMPLE_DATA.whatsapp_delivered,
});
