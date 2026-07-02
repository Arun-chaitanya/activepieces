import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const whatsappReceived = createOpplifyTrigger({
  name: 'whatsapp_received',
  displayName: 'WhatsApp Received',
  description: 'Triggers when an inbound WhatsApp message is received from a lead (via AISensy).',
  eventType: 'whatsapp_received',
  sampleData: SAMPLE_DATA.whatsapp_received,
});
