import { Property } from '@activepieces/pieces-framework';
import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

/**
 * Standing-criteria enrollment (parity S5.1) — HubSpot's filter-criteria
 * trigger class. No CRM event is picked: the server watches every lead
 * write and fires when a lead STARTS matching the conditions saved in this
 * trigger's "Only continue when…" panel (false→true transition only; a
 * lead that keeps matching never re-fires, and one that falls out and
 * re-crosses fires again). The conditions themselves travel through the
 * wf_trigger_conditions channel, not through props — so this trigger has
 * no inputs beyond the explainer.
 */
export const leadMatchesCriteria = createOpplifyTrigger({
  name: 'lead_matches_criteria',
  displayName: 'Lead Starts Matching Criteria (No Event Needed)',
  description:
    'Runs the moment a lead starts matching the conditions you set — no specific ' +
    'event required. Set the conditions in the "Only continue when…" panel on this ' +
    'trigger (for example "Lead score is at least 80" or "Budget is Enterprise"). ' +
    'Each lead runs once when they start matching; if they stop matching and later ' +
    'match again, they run again.',
  eventType: 'lead_matches_criteria',
  props: {
    markdown: Property.MarkDown({
      value:
        'This trigger has no inputs. Open **Only continue when…** below to set ' +
        'the conditions a lead must start matching — without conditions, this ' +
        'trigger never runs.',
    }),
  },
  sampleData: SAMPLE_DATA.lead_matches_criteria,
});
