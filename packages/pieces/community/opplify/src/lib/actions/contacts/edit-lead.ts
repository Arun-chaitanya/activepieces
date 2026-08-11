import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

interface LeadFieldOption {
  label: string;
  value: string;
}

interface LeadFieldsResponse {
  fields: Array<{ key: string; label: string; group: string }>;
}

async function leadFieldOptions(context: {
  project: { id: string; externalId: () => Promise<string | undefined> };
}): Promise<LeadFieldOption[]> {
  const externalId = (await context.project.externalId()) || '';
  const ctx = {
    projectId: context.project.id,
    externalId,
    baseUrl: process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001',
  };
  const client = opplifyClient(ctx);
  const result = (await client.getMeta('lead-fields')) as LeadFieldsResponse;
  return (result.fields || [])
    .filter((field) => field.key !== 'tags' && field.group !== 'engagement')
    .map((field) => ({ label: field.label, value: field.key }));
}

export const editLeadAction = createAction({
  name: 'edit_lead',
  displayName: 'Edit Lead Property',
  description:
    'Set, copy, or clear any lead property — standard or custom — in one step.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    property: Property.Dropdown({
      auth: PieceAuth.None(),
      displayName: 'Property',
      description: 'The lead property to change',
      required: true,
      refreshers: [],
      options: async (_propsValue, context) => {
        try {
          const options = await leadFieldOptions(context as never);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load properties' };
        }
      },
    }),
    mode: Property.StaticDropdown({
      displayName: 'What to do',
      required: true,
      defaultValue: 'set',
      options: {
        options: [
          { label: 'Set a value', value: 'set' },
          { label: 'Copy from another property', value: 'copy' },
          { label: 'Clear the value', value: 'clear' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The value to set (only for "Set a value")',
      required: false,
    }),
    sourceProperty: Property.Dropdown({
      auth: PieceAuth.None(),
      displayName: 'Copy from',
      description: 'The property to copy the value from (only for "Copy")',
      required: false,
      refreshers: [],
      options: async (_propsValue, context) => {
        try {
          const options = await leadFieldOptions(context as never);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load properties' };
        }
      },
    }),
  },
  async run(context) {
    const externalId = (await context.project.externalId()) || '';
    const ctx = {
      projectId: context.project.id,
      externalId,
      baseUrl: process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001',
    };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/edit', {
      leadId: context.propsValue.leadId,
      property: context.propsValue.property,
      mode: context.propsValue.mode,
      value: context.propsValue.value,
      sourceProperty: context.propsValue.sourceProperty,
    });
  },
});
