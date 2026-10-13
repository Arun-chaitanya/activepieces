import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { googleLocationDropdown } from '../../common/props';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';

export const sendGoogleReviewRequestAction = createAction({
  name: 'send_google_review_request',
  displayName: 'Send Google Review Request',
  description:
    'Asks the contact from the trigger for a Google review by email, SMS or WhatsApp, with a tracked link to your location’s review page. ' +
    'Use it after a form submission, a completed appointment, a deal stage change or a payment. ' +
    'When their review arrives it is linked to them, and optional reminders go out if they do not click. ' +
    'Returns status "sent", "skipped" (asked in the last 30 days or already reviewed) or fails with the reason.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      defaultValue: "{{trigger['lead']['id']}}",
      displayName: 'Lead ID',
      description: 'The contact to ask (from the trigger: lead id)',
      required: true,
    }),
    integrationId: googleLocationDropdown,
    channel: setupPanel(
      Property.StaticDropdown({
        displayName: 'Send by',
        required: true,
        defaultValue: 'email',
        options: {
          options: [
            { label: 'Email', value: 'email' },
            { label: 'SMS', value: 'sms' },
            { label: 'WhatsApp', value: 'whatsapp' },
          ],
        },
      })
    ),
    message: setupPanel(
      Property.LongText({
        displayName: 'Message',
        description:
          'Email and SMS text. {first_name}, {business}, {location} and {link} are filled in; without {link} the link is added at the end. Leave empty for a friendly default.',
        required: false,
      })
    ),
    emailSubject: Property.ShortText({
      displayName: 'Email subject',
      description: 'Default: "How did we do, {first_name}?"',
      required: false,
    }),
    whatsappTemplateName: Property.ShortText({
      displayName: 'WhatsApp template name',
      description:
        'Required for WhatsApp: an APPROVED template (WhatsApp only allows templates for messages you start).',
      required: false,
    }),
    whatsappTemplateParams: Property.Array({
      displayName: 'WhatsApp template parameters',
      description:
        'One value per template variable, in order: message variables first, then one per "Visit website" button. Tokens: {first_name} {business} {location} {link} (the tracked link) and {link_code} (only its code, for a button whose URL ends in /l/{{1}}). Leave empty to send {{1}} first name, {{2}} review link.',
      required: false,
    }),
    maxReminders: setupPanel(
      Property.StaticDropdown({
        displayName: 'Reminders if they do not click',
        required: false,
        defaultValue: '1',
        options: {
          options: [
            { label: 'No reminders', value: '0' },
            { label: '1 reminder', value: '1' },
            { label: '2 reminders', value: '2' },
          ],
        },
      })
    ),
    reminderDays: Property.Number({
      displayName: 'Days between reminders',
      required: false,
      defaultValue: 3,
    }),
    reminderMessage: Property.LongText({
      displayName: 'Reminder message',
      description: 'Email and SMS reminder text, same tokens. Leave empty for a gentle default.',
      required: false,
    }),
    skipRecentlyAsked: Property.Checkbox({
      displayName: 'Skip contacts asked in the last 30 days or who already reviewed',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('google-business/review-request', {
      leadId: props.leadId,
      integrationId: props.integrationId,
      channel: props.channel,
      message: props.message,
      emailSubject: props.emailSubject,
      whatsappTemplateName: props.whatsappTemplateName,
      whatsappTemplateParams: (props.whatsappTemplateParams ?? []).map(String),
      maxReminders: Number(props.maxReminders ?? 0),
      reminderDays: props.reminderDays ?? 3,
      reminderMessage: props.reminderMessage,
      skipRecentlyAsked: props.skipRecentlyAsked !== false,
      flowRunId: context.run.id,
    });
  },
});
