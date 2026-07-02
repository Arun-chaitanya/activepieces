import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const sendWhatsAppTemplateAction = createAction({
  name: 'send_whatsapp_template',
  displayName: 'Send WhatsApp Template',
  description:
    'Sends an approved WhatsApp template message to a lead via your AISensy connection. Template messages work regardless of the 24-hour session window.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead (leave empty to target by phone)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description:
        'Lead phone in E.164 format, e.g. +919999999999 (used when Lead ID is empty)',
      required: false,
    }),
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description:
        'Exact name of an APPROVED WhatsApp template in AISensy (Meta review must be complete)',
      required: true,
    }),
    templateParams: Property.Array({
      displayName: 'Template Parameters',
      description:
        'Values for the template placeholders ({{1}}, {{2}}, ...) in order',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('whatsapp/send-template', {
      leadId: context.propsValue.leadId || undefined,
      phone: context.propsValue.phone || undefined,
      templateName: context.propsValue.templateName,
      templateParams: (context.propsValue.templateParams || []).map(String),
    });
  },
});
