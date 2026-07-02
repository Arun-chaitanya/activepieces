import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const whatsappFailed = createOpplifyTrigger({
  name: 'whatsapp_failed',
  displayName: 'WhatsApp Failed',
  description: 'Triggers when an outbound WhatsApp message fails to deliver.',
  eventType: 'whatsapp_failed',
  sampleData: SAMPLE_DATA.whatsapp_failed,
});
