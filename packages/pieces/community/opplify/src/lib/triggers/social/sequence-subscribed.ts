import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

/**
 * The entry point of a drip sequence (S5.1). Fires once per person when an
 * "Add to Sequence" step (in any other automation) enrolls them into THIS
 * flow — scopeToOwnFlow pins the subscription to this flow's own id, so
 * every sequence only reacts to its own enrollments.
 */
export const sequenceSubscribed = createOpplifyTrigger({
  name: 'sequence_subscribed',
  displayName: 'Sequence Started (Someone Joins This Series)',
  description:
    'Starts this message series for one person the moment an "Add to Sequence" step enrolls them. ' +
    'Build the series as: send a message, then Smart Delay, then the next message. ' +
    'IMPORTANT — Instagram and Facebook only deliver messages inside an open 24-hour window ' +
    '(within a day of the person\'s last message to you). Turn ON "Skip if the reply window has closed" ' +
    'on every send in this series so a closed window skips that message instead of failing the series. ' +
    'If the person replies, they leave the series automatically (when enrolled with "stop if they reply"). ' +
    'End the series with a "Remove from Sequence" step marked "Finished the series".',
  eventType: 'sequence_subscribed',
  scopeToOwnFlow: true,
  sampleData: SAMPLE_DATA.sequence_subscribed,
});
