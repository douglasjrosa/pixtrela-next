export const ACTIVITY_SUBTASK_PICKER_MIN_QUERY_LENGTH = 3;

export const ACTIVITY_SUBTASK_PICKER_RESULT_LIMIT = 50;

export function isActivitySubtaskPickerSearchReady(query: string): boolean {
  return query.trim().length >= ACTIVITY_SUBTASK_PICKER_MIN_QUERY_LENGTH;
}
