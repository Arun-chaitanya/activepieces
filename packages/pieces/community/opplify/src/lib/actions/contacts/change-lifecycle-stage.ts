import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const changeLifecycleStageAction = createAction({
  name: 'change_lifecycle_stage',
  displayName: 'Change Lifecycle Stage',
  description: "Changes a lead's lifecycle stage in the sales funnel.",
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    stage: Property.Dropdown({
      auth: PieceAuth.None(),
      displayName: 'Lifecycle Stage',
      description: 'New lifecycle stage',
      required: true,
      refreshers: [],
      options: async (_propsValue, context) => {
        try {
          const externalId = await context.project.externalId() || '';
          const ctx = { projectId: context.project.id, externalId, baseUrl: process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001' };
          const client = opplifyClient(ctx);
          const result = await client.getMeta('lifecycle-stages') as { stages: Array<{ label: string; value: string }> };
          return { disabled: false, options: result.stages || [] };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load lifecycle stages' };
        }
      },
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('leads/change-lifecycle', {
      leadId: context.propsValue.leadId,
      stage: context.propsValue.stage,
    });
  },
});
