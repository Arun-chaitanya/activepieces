import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const unpublishFunnelAction = createAction({
  name: 'unpublish_funnel',
  displayName: 'Unpublish Funnel',
  description: 'Takes a published funnel offline.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    funnelId: Property.Dropdown({
      auth: PieceAuth.None(),
      displayName: 'Funnel',
      description: 'Select a funnel to unpublish',
      required: true,
      refreshers: [],
      options: async (_propsValue, context) => {
        try {
          const externalId = await context.project.externalId() || '';
          const baseUrl = process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001';
          const ctx = { projectId: context.project.id, externalId, baseUrl };
          const client = opplifyClient(ctx);
          const result = await client.getMeta('funnels') as { funnels: Array<{ id: string; name: string }> };
          return {
            disabled: false,
            options: (result.funnels || []).map((f) => ({ label: f.name, value: f.id })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load funnels' };
        }
      },
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('funnels/unpublish', {
      funnelId: context.propsValue.funnelId,
    });
  },
});
