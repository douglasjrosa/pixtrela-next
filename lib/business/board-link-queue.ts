export type BoardSubtaskLinkResult = {
  documentId: string;
  linkedToPrevious: boolean;
  assignedTo: { documentId: string; name: string }[];
};

export function shouldFlushBoardLink(
  desired: boolean | undefined,
  inFlight: boolean,
  acked: boolean | undefined,
): boolean {
  if (inFlight) return false;
  if (desired === undefined) return false;
  return acked !== desired;
}
