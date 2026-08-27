/**
 * Payload returned by the legacy RBX `/produtos?templateData=<id>` endpoint
 * after the actions/presets rewrite.
 *
 * RBX knows subtask presets by name, not factory actions.
 * Extra-large variants are distinct preset names chosen by RBX.
 * Numeric fields may still arrive as strings.
 */

export type LegacyNumber = number | string | null | undefined;

export interface BoxTemplateSubtaskInput {
  presetName: string;
  qty: LegacyNumber;
  actionUnits: LegacyNumber;
}

export interface BoxTemplateData {
  prodId: number;
  empresaNome: string;
  boxName: string;
  subtasks: BoxTemplateSubtaskInput[];
}

export interface LegacyErrorResponse {
  error: string;
}

export function isLegacyErrorResponse(
  value: unknown,
): value is LegacyErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as LegacyErrorResponse).error === "string"
  );
}
