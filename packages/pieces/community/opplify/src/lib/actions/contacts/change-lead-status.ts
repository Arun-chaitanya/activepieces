import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const changeLeadStatusAction = createAction({
  name: 'change_lead_status',
  displayName: 'Change Lead Status',
  description:
    'Changes a lead\'s status (e.g., new to contacted, qualified to converted).',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    status: Property.Dropdown({
      auth: PieceAuth.None(),
      displayName: 'Status',
      description: 'New lead status',
      required: true,
      refreshers: [],
      options: async (_propsValue, context) => {
        try {
          const externalId = await context.project.externalId() || '';
          const ctx = { projectId: context.project.id, externalId, baseUrl: process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001' };
          const client = opplifyClient(ctx);
          const result = await client.getMeta('statuses') as { statuses: Array<{ label: string; value: string }> };
          return { disabled: false, options: result.statuses || [] };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load statuses' };
        }
      },
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/change-status', {
      leadId: context.propsValue.leadId,
      status: context.propsValue.status,
    });
  },
});
