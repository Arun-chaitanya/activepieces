import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const whatsappSent = createOpplifyTrigger({
  name: 'whatsapp_sent',
  displayName: 'WhatsApp Sent',
  description: 'Triggers when a WhatsApp message (template or session) is sent to a lead.',
  eventType: 'whatsapp_sent',
  sampleData: SAMPLE_DATA.whatsapp_sent,
});
