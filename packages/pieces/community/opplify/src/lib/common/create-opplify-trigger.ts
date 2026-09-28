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
  /**
   * The event-bridge event type this trigger subscribes to. A trigger that
   * spans several platform events (the unified social triggers: one
   * "Comment received" listening on instagram_comment_received AND
   * facebook_comment_received) lists them all in `eventTypes` instead; one
   * event_subscriptions row is created per type, with identical filters.
   */
  eventType?: string;
  eventTypes?: string[];
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

/**
 * Surface-scoping props (D8): whichever of these a trigger exposes maps onto
 * the polymorphic {sourceType, sourceId} pair the dispatcher matches on. A
 * trigger may offer several (Funnel AND Website dropdowns) — the user picks
 * at most one. Every other prop name (formId, eventTypeId, …) passes through
 * verbatim and is matched against the event payload directly.
 */
const SURFACE_ID_PROPS: Record<string, OpplifySourceType> = {
  funnelId: 'funnel',
  websiteId: 'website',
};

function buildFilters(
  propsValue: Record<string, unknown>,
  sourceType?: OpplifySourceType
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(propsValue)) {
    if (key === 'auth' || key === 'markdown') continue;
    if (value === undefined || value === null || value === '') continue;
    // An empty account list means "every connected account" — the same as
    // not filtering at all, so it never reaches the subscription.
    if (Array.isArray(value) && value.length === 0) continue;
    filters[key] = value;
  }

  // Translate surface id props into the polymorphic pair. Subscriptions that
  // omit every surface prop stay surface-unscoped — every event of this type
  // fires (other pass-through filters like formId still apply).
  const surfaceKeys = Object.keys(SURFACE_ID_PROPS).filter(
    (key) => filters[key] !== undefined
  );
  if (surfaceKeys.length > 1) {
    throw new Error(
      'Pick at most one surface filter (Funnel OR Website) — a flow can only be scoped to a single surface.'
    );
  }
  const surfaceKey = surfaceKeys[0];
  if (surfaceKey) {
    filters['sourceType'] = SURFACE_ID_PROPS[surfaceKey];
    filters['sourceId'] = filters[surfaceKey];
    delete filters[surfaceKey];
  } else if (sourceType && !(sourceType in { funnel: 1, website: 1 })) {
    // Legacy path for non-surface sourceTypes: `<sourceType>Id` rewrites to
    // the pair (no trigger uses this today; funnel/website are handled above).
    const idKey = `${sourceType}Id`;
    const idValue = filters[idKey];
    if (idValue !== undefined) {
      filters['sourceType'] = sourceType;
      filters['sourceId'] = idValue;
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

function eventTypesOf(config: OpplifyTriggerConfig): string[] {
  const types = config.eventTypes ?? (config.eventType ? [config.eventType] : []);
  if (types.length === 0) {
    throw new Error(`Trigger ${config.name} declares no event type`);
  }
  return types;
}

export function createOpplifyTrigger(config: OpplifyTriggerConfig) {
  const eventTypes = eventTypesOf(config);

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
      const subscriptionIds: string[] = [];
      try {
        for (const eventType of eventTypes) {
          const subscriptionId = await client.subscribe({
            eventType,
            webhookUrl: context.webhookUrl,
            flowId: context.flows.current.id,
            triggerName: config.name,
            filters,
          });
          subscriptionIds.push(subscriptionId);
        }
      } catch (err) {
        // All or nothing: a row created before the failure would keep
        // delivering to a flow that never enabled. Undo, then surface.
        for (const subscriptionId of subscriptionIds) {
          try {
            await client.unsubscribe({ subscriptionId });
          } catch {
            // best effort — the enable error below is the one to report
          }
        }
        throw err;
      }
      await context.store.put('subscriptionIds', subscriptionIds);
      // Single-event triggers published before the multi-event store key
      // existed read `subscriptionId`; keep writing it so a downgrade or an
      // older worker can still unsubscribe.
      await context.store.put('subscriptionId', subscriptionIds[0]);
    },

    async onDisable(context) {
      const stored = await context.store.get<string[]>('subscriptionIds');
      const legacy = await context.store.get<string>('subscriptionId');
      const ids = new Set<string>([...(stored ?? []), ...(legacy ? [legacy] : [])]);
      const ctx = await getClientContext(context);
      const client = opplifyClient(ctx);
      for (const subscriptionId of ids) {
        await client.unsubscribe({ subscriptionId });
      }
      // Belt and braces: whatever the store says, no row of this flow for
      // any of this trigger's event types may outlive the disable (an
      // interrupted enable can leave one without a stored id).
      for (const eventType of eventTypes) {
        await client.unsubscribe({ flowId: context.flows.current.id, eventType });
      }
    },

    async run(context) {
      return [context.payload.body];
    },

    async test(context) {
      const ctx = await getClientContext(context);
      const client = opplifyClient(ctx);
      const testData = await client.testTrigger({
        eventType: eventTypes[0],
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
