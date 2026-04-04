import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const createFunnelAction = createAction({
  name: 'create_funnel',
  displayName: 'Create Funnel',
  description: 'Creates a new funnel draft.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Funnel name',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('funnels/create', {
      name: context.propsValue.name,
    });
  },
});
