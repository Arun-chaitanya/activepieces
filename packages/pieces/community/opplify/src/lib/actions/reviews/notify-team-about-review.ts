import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { setupPanel } from '../../common/setup-panel';
import { socialActionCtx } from '../social/_shared';
import { reviewIdProp } from './_shared';

export const notifyTeamAboutReviewAction = createAction({
  name: 'notify_team_about_review',
  displayName: 'Notify Team About Review',
  description:
    'Alerts your team about the Google review from the trigger, e.g. when a negative review arrives: an in-app notification, an email to your admins (and any extra addresses), ' +
    'and an optional WhatsApp message to team phone numbers. Every alert links straight to the review.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    reviewId: reviewIdProp,
    message: setupPanel(
      Property.LongText({
        displayName: 'Note for the team',
        description: 'Optional line shown above the review, e.g. "Please call this customer today."',
        required: false,
      })
    ),
    email: setupPanel(
      Property.Checkbox({
        displayName: 'Email the admins',
        description: 'Sent through your connected email. The in-app notification lands either way.',
        required: false,
        defaultValue: true,
      })
    ),
    extraEmails: Property.Array({
      displayName: 'Also email',
      description: 'More addresses to email, e.g. the store manager.',
      required: false,
    }),
    whatsappPhones: setupPanel(
      Property.Array({
        displayName: 'WhatsApp numbers',
        description: 'Team phone numbers in international format, e.g. +919999999999. Leave empty for no WhatsApp alert.',
        required: false,
      })
    ),
    whatsappTemplateName: Property.ShortText({
      displayName: 'WhatsApp template name',
      description:
        'An APPROVED WhatsApp template (required for WhatsApp alerts: WhatsApp only allows templates for messages you start).',
      required: false,
    }),
    whatsappTemplateParams: Property.Array({
      displayName: 'WhatsApp template parameters',
      description:
        'Values for {{1}}, {{2}}, ... in order. Leave empty to send: 1 star rating, 2 location, 3 reviewer, 4 review text, 5 link to the review.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const client = opplifyClient(await socialActionCtx(context));
    return await client.callAction('google-business/notify', {
      reviewId: props.reviewId,
      message: props.message,
      email: props.email !== false,
      extraEmails: (props.extraEmails ?? []).map(String),
      whatsappPhones: (props.whatsappPhones ?? []).map(String),
      whatsappTemplateName: props.whatsappTemplateName,
      whatsappTemplateParams: (props.whatsappTemplateParams ?? []).map(String),
    });
  },
});
