import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const whatsappRead = createOpplifyTrigger({
  name: 'whatsapp_read',
  displayName: 'WhatsApp Read',
  description: 'Triggers when the lead reads an outbound WhatsApp message.',
  eventType: 'whatsapp_read',
  sampleData: SAMPLE_DATA.whatsapp_read,
});
