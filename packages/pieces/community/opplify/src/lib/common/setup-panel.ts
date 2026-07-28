import { InputProperty } from '@activepieces/pieces-framework';

/**
 * Marks a property for the builder's aggregated automation setup panel (D6).
 *
 * The flag is an extra key on the property object: Property.X() factories
 * spread their request through, piece.metadata() returns trigger/action
 * objects verbatim, and publishing JSON-round-trips them into
 * wf_piece_metadata — so `setupPanel: true` survives all the way to the
 * builder, which aggregates flagged props across every step of a chat
 * automation into one human-language form.
 */
export type SetupPanelProperty<T extends InputProperty> = T & {
  setupPanel: true;
};

export function setupPanel<T extends InputProperty>(
  prop: T
): SetupPanelProperty<T> {
  const flagged: SetupPanelProperty<T> = { ...prop, setupPanel: true };
  return flagged;
}
