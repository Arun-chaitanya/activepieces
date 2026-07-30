import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import type { InputPropertyMap } from '@activepieces/pieces-framework';
import { opplifyAuth } from './auth';
import { opplifyClient } from './client';

const BASE_URL = process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001';

type OpplifySourceType = 'funnel' | 'website' | 'appointment' | 'form' | 'invoice';

interface OpplifyTriggerConfig {
  name: string;
  displayName: string;
  description: string;
  eventType: string;
  props?: InputPropertyMap;
  sampleData: unknown;
  /**
   * If set, the dropdown prop named `<sourceType>Id` (e.g. `funnelId`) is
   * translated into a polymorphic `{sourceType, sourceId}` filter pair so it
   * matches the new dispatcher contract on the Opplify side. Without this,
   * funnelId / websiteId props would silently produce no matches.
   */
  sourceType?: OpplifySourceType;
  /**
   * S5.1 sequences: the trigger subscribes with a `sequenceFlowId` filter set
   * to ITS OWN flow id, so only enrollments into this exact sequence start a
   * run — the subscribe verb dispatches one `sequence_subscribed` event per
   * enrollment and every other sequence's trigger ignores it.
   */
  scopeToOwnFlow?: boolean;
}

function buildFilters(
  propsValue: Record<string, unknown>,
  sourceType?: OpplifySourceType
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(propsValue)) {
    if (key === 'auth' || key === 'markdown') continue;
    if (value === undefined || value === null || value === '') continue;
    filters[key] = value;
  }

  // Translate `<sourceType>Id` (funnelId, websiteId, …) into the polymorphic
  // pair the dispatcher actually matches on. Subscriptions that omit the id
  // prop stay unscoped — every event of this type fires.
  if (sourceType) {
    const idKey = `${sourceType}Id`;
    const idValue = filters[idKey];
    if (idValue !== undefined) {
      filters.sourceType = sourceType;
      filters.sourceId = idValue;
      delete filters[idKey];
    }
  }

  return filters;
}

async function getClientContext(context: { project: { id: string; externalId: () => Promise<string | undefined> } }) {
  const externalId = await context.project.externalId() || '';
  return {
    projectId: context.project.id,
    externalId,
    baseUrl: BASE_URL,
  };
}

export function createOpplifyTrigger(config: OpplifyTriggerConfig) {
  return createTrigger({
    auth: opplifyAuth,
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    type: TriggerStrategy.WEBHOOK,
    props: config.props ?? {},

    async onEnable(context) {
      const ctx = await getClientContext(context);
      const client = opplifyClient(ctx);
      const filters = buildFilters(
        context.propsValue as Record<string, unknown>,
        config.sourceType
      );
      if (config.scopeToOwnFlow) {
        filters['sequenceFlowId'] = context.flows.current.id;
      }
      const subscriptionId = await client.subscribe({
        eventType: config.eventType,
        webhookUrl: context.webhookUrl,
        flowId: context.flows.current.id,
        triggerName: config.name,
        filters,
      });
      await context.store.put('subscriptionId', subscriptionId);
    },

    async onDisable(context) {
      const subscriptionId = await context.store.get<string>('subscriptionId');
      if (subscriptionId) {
        const ctx = await getClientContext(context);
        const client = opplifyClient(ctx);
        await client.unsubscribe({ subscriptionId });
      }
    },

    async run(context) {
      return [context.payload.body];
    },

    async test(context) {
      const ctx = await getClientContext(context);
      const client = opplifyClient(ctx);
      const testData = await client.testTrigger({
        eventType: config.eventType,
        filters: buildFilters(
          context.propsValue as Record<string, unknown>,
          config.sourceType
        ),
      });
      return [testData];
    },

    sampleData: config.sampleData,
  });
}
