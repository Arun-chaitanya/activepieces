import { Property } from '@activepieces/pieces-framework';

/** Client context builder shared by the social actions. */
export async function socialActionCtx(context: {
  project: { id: string; externalId: () => Promise<string | undefined> };
}) {
  const externalId = (await context.project.externalId()) || '';
  return {
    projectId: context.project.id,
    externalId,
    baseUrl: process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001',
  };
}

/** The two ids every social action needs, wired from the trigger's payload. */
export const socialTargetProps = {
  leadId: Property.ShortText({
    displayName: 'Lead ID',
    description: 'The lead this conversation belongs to (from the trigger: lead id)',
    required: true,
  }),
  communicationId: Property.ShortText({
    displayName: 'Message ID',
    description:
      'The received message being replied to (from the trigger: data communication_id)',
    required: true,
  }),
};

/** Up to three optional link buttons (Meta caps button DMs at 3). */
export const buttonProps = {
  button1Label: Property.ShortText({ displayName: 'Button 1 label', description: 'Max 20 characters', required: false }),
  button1Url: Property.ShortText({ displayName: 'Button 1 link', required: false }),
  button2Label: Property.ShortText({ displayName: 'Button 2 label', description: 'Max 20 characters', required: false }),
  button2Url: Property.ShortText({ displayName: 'Button 2 link', required: false }),
  button3Label: Property.ShortText({ displayName: 'Button 3 label', description: 'Max 20 characters', required: false }),
  button3Url: Property.ShortText({ displayName: 'Button 3 link', required: false }),
};

interface ButtonPropsValue {
  button1Label?: string;
  button1Url?: string;
  button2Label?: string;
  button2Url?: string;
  button3Label?: string;
  button3Url?: string;
}

/**
 * Assemble the message body the ap-actions/social/reply route expects:
 * buttons win over quick replies; plain text otherwise.
 */
export function buildMessageBody(
  text: string,
  props: ButtonPropsValue,
  quickReplies?: unknown[]
): unknown {
  const buttons = [
    { label: props.button1Label, url: props.button1Url },
    { label: props.button2Label, url: props.button2Url },
    { label: props.button3Label, url: props.button3Url },
  ].filter((b) => b.label && b.url);
  if (buttons.length > 0) {
    return { kind: 'buttons', text, buttons };
  }
  const replies = (quickReplies || []).map(String).filter((r) => r.trim());
  if (replies.length > 0) {
    return { kind: 'quick_replies', text, quickReplies: replies };
  }
  return text;
}
