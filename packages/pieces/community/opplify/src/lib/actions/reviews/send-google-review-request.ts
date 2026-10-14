import { createAction, InputPropertyMap, PieceAuth, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { googleLocationDropdown } from '../../common/props';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';

// Same copy the Opplify server falls back to (review-request-template.ts),
// shown up front so the step starts with a ready, editable message.
const DEFAULT_EMAIL_SUBJECT = 'How did we do, {first_name}?';
const DEFAULT_EMAIL_MESSAGE =
  'Hi {first_name}, thank you for choosing {business}! Would you share your experience in a quick Google review? It only takes a minute: {link}';
/** Short enough that names and the link still fit one 160-character SMS. */
const DEFAULT_SMS_MESSAGE =
  'Hi {first_name}, how was {business}? A quick Google review would mean a lot: {link}';
const DEFAULT_REMINDER_MESSAGE =
  'Hi {first_name}, a gentle reminder: a review of {business} would mean a lot to us. {link}';

const TOKENS_HELP = '{link} is your review link. Also: {first_name} {business} {location}.';

/**
 * Only the chosen channel's fields. Email and SMS keep separate keys so
 * switching channel never carries a long email message into an SMS.
 */
const channelFields = setupPanel(
  Property.DynamicProperties({
    auth: PieceAuth.None(),
    displayName: 'Message',
    required: false,
    refreshers: ['channel'],
    props: async ({ channel }) => {
      const fields: InputPropertyMap = {};
      const selected = (channel as unknown as string | undefined) ?? 'email';
      if (selected === 'email') {
        fields['emailSubject'] = Property.ShortText({
          displayName: 'Email subject',
          required: false,
          defaultValue: DEFAULT_EMAIL_SUBJECT,
        });
        fields['emailMessage'] = Property.ShortText({
          displayName: 'Email message',
          description: TOKENS_HELP,
          required: false,
          defaultValue: DEFAULT_EMAIL_MESSAGE,
        });
        fields['emailReminderMessage'] = Property.ShortText({
          displayName: 'Reminder message',
          description: 'Used only when reminders are on. Same tokens.',
          required: false,
          defaultValue: DEFAULT_REMINDER_MESSAGE,
        });
      } else if (selected === 'sms') {
        fields['smsMessage'] = Property.ShortText({
          displayName: 'SMS message',
          description: `${TOKENS_HELP} Keep it under 160 characters once filled in.`,
          required: false,
          defaultValue: DEFAULT_SMS_MESSAGE,
        });
        fields['smsReminderMessage'] = Property.ShortText({
          displayName: 'Reminder message',
          description: 'Used only when reminders are on. Same tokens.',
          required: false,
          defaultValue: DEFAULT_REMINDER_MESSAGE,
        });
      } else if (selected === 'whatsapp') {
        fields['whatsappTemplateName'] = Property.ShortText({
          displayName: 'WhatsApp template name',
          description:
            'Needs a template WhatsApp has APPROVED: WhatsApp blocks free text in messages you start. Create and get it approved in your WhatsApp provider first.',
          required: true,
        });
        fields['whatsappTemplateParams'] = Property.Array({
          displayName: 'Template values',
          description:
            'One per template variable, in order, then one per "Visit website" button. Leave empty for {{1}} first name, {{2}} review link. Tokens: {first_name} {business} {location} {link}, and {link_code} for a button URL ending in /l/{{1}}.',
          required: false,
        });
      }
      return fields;
    },
  })
);

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
    channelFields,
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
    skipRecentlyAsked: Property.Checkbox({
      displayName: 'Skip contacts asked in the last 30 days or who already reviewed',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const fields = (props.channelFields ?? {}) as Record<string, unknown>;
    // Steps saved before 0.32.1 kept these at the top level.
    const legacy = props as unknown as Record<string, unknown>;
    const pick = (key: string, legacyKey = key) => fields[key] ?? legacy[legacyKey];
    const isSms = props.channel === 'sms';
    const templateParams = (pick('whatsappTemplateParams') ?? []) as unknown[];
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('google-business/review-request', {
      leadId: props.leadId,
      integrationId: props.integrationId,
      channel: props.channel,
      message: pick(isSms ? 'smsMessage' : 'emailMessage', 'message'),
      emailSubject: pick('emailSubject'),
      whatsappTemplateName: pick('whatsappTemplateName'),
      whatsappTemplateParams: templateParams.map(String),
      maxReminders: Number(props.maxReminders ?? 0),
      reminderDays: props.reminderDays ?? 3,
      reminderMessage: pick(isSms ? 'smsReminderMessage' : 'emailReminderMessage', 'reminderMessage'),
      skipRecentlyAsked: props.skipRecentlyAsked !== false,
      flowRunId: context.run.id,
    });
  },
});
