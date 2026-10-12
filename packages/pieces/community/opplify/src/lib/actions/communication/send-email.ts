import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import {
  emailSenderDropdown,
  emailTemplateDropdown,
  emailTopicDropdown,
  emailTypeDropdown,
} from '../../common/props';

export const sendEmailAction = createAction({
  name: 'send_email',
  displayName: 'Send Email',
  description:
    "Sends an email to a lead: a saved template or a written body, as Marketing or Transactional, from the company's email address or a teammate's Gmail. Output: sent (true/false), sendId, and reason when the lead was not sent the email (unsubscribed, daily limit, ...). Not sending is not a step failure, so a following condition can branch on sent.",
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    sender: emailSenderDropdown,
    emailType: emailTypeDropdown,
    template: emailTemplateDropdown,
    topic: emailTopicDropdown,
    leadId: Property.ShortText({
      defaultValue: "{{trigger['lead']['id']}}",
      displayName: 'Lead ID',
      description: 'The ID of the lead to email',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: "Email subject line. Optional with a template (the template's subject is used when empty).",
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'HTML email body. Not used when a template is chosen.',
      required: false,
    }),
    fromName: Property.ShortText({
      displayName: 'From Name',
      description: 'Sender display name',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('communications/send-email', {
      leadId: context.propsValue.leadId,
      subject: context.propsValue.subject,
      body: context.propsValue.body,
      fromName: context.propsValue.fromName,
      // 'company' = send as the company (its address through Opplify);
      // anything else is the teammate whose Gmail sends. The server never
      // substitutes another account when this is absent — it errors instead.
      sender: context.propsValue.sender,
      // A 0.30.0 step without a value (one written by the workflow agent, which
      // does not fill prop defaults) is Marketing, the dropdown's default, so
      // it is never sent past the permission check by omission. Steps saved
      // before 0.30.0 run older code that sends no emailType; the server keeps
      // those transactional, as they always were.
      emailType: context.propsValue.emailType ?? 'marketing',
      template: context.propsValue.template,
      topic: context.propsValue.topic,
      // One email per run step: a retry of this step never sends twice.
      flowRunId: context.run.id,
      stepName: context.step.name,
    });
  },
});
