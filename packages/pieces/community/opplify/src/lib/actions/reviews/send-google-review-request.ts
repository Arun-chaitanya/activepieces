import { createAction, InputPropertyMap, PieceAuth, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { ctxFromProperty, googleLocationDropdown } from '../../common/props';
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

/** An approved template from the connected WhatsApp, with the values it needs. */
interface ApprovedTemplate {
  name: string;
  label: string;
  language: string | null;
  defaultParams: string[];
}

async function loadApprovedTemplates(
  client: ReturnType<typeof opplifyClient>
): Promise<{ templates: ApprovedTemplate[]; reason?: string }> {
  const result = (await client.getMeta('whatsapp-templates')) as {
    templates?: ApprovedTemplate[];
    reason?: string;
  };
  return { templates: result.templates ?? [], reason: result.reason };
}

const TOKENS_HELP = '{link} is your review link. Also: {first_name} {business} {location}.';

/** The connected WhatsApp's approved templates, or a disabled box saying why there are none. */
async function whatsappTemplateDropdown(context: {
  project: { id: string; externalId: () => Promise<string | undefined> };
}) {
  const field = {
    displayName: 'WhatsApp template',
    description:
      'Your approved templates from the connected WhatsApp. The first name and the review link are filled in for you.',
    required: true,
  } as const;
  try {
    const { templates, reason } = await loadApprovedTemplates(
      opplifyClient(await ctxFromProperty(context))
    );
    if (templates.length === 0) {
      return Property.StaticDropdown({
        ...field,
        options: {
          disabled: true,
          options: [],
          placeholder: reason
            ? reason.substring(0, 100)
            : 'No approved WhatsApp templates yet. Create one and wait for WhatsApp to approve it',
        },
      });
    }
    return Property.StaticDropdown({
      ...field,
      options: {
        options: templates.map((template) => ({
          label: template.language ? `${template.label} (${template.language})` : template.label,
          value: template.name,
        })),
      },
    });
  } catch {
    return Property.StaticDropdown({
      ...field,
      options: { disabled: true, options: [], placeholder: 'Failed to load WhatsApp templates' },
    });
  }
}

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
    props: async ({ channel }, context) => {
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
        fields['whatsappTemplateName'] = await whatsappTemplateDropdown(context);
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
    const client = opplifyClient(await socialActionCtx(context));
    const templateName = pick('whatsappTemplateName') as string | undefined;
    let templateParams = ((pick('whatsappTemplateParams') ?? []) as unknown[]).map(String);
    // The step shows no values box: fill them from the template, as the
    // send panel does. Older steps that listed values keep theirs.
    if (props.channel === 'whatsapp' && templateName && templateParams.length === 0) {
      try {
        const { templates } = await loadApprovedTemplates(client);
        templateParams = templates.find((t) => t.name === templateName)?.defaultParams ?? [];
      } catch {
        templateParams = [];
      }
    }
    return await client.callAction('google-business/review-request', {
      leadId: props.leadId,
      integrationId: props.integrationId,
      channel: props.channel,
      message: pick(isSms ? 'smsMessage' : 'emailMessage', 'message'),
      emailSubject: pick('emailSubject'),
      whatsappTemplateName: templateName,
      whatsappTemplateParams: templateParams,
      maxReminders: Number(props.maxReminders ?? 0),
      reminderDays: props.reminderDays ?? 3,
      reminderMessage: pick(isSms ? 'smsReminderMessage' : 'emailReminderMessage', 'reminderMessage'),
      skipRecentlyAsked: props.skipRecentlyAsked !== false,
      flowRunId: context.run.id,
    });
  },
});
