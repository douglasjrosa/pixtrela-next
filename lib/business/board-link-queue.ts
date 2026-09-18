import type { BoardSubTaskSummary } from "@/components/kanban/types";

export type BoardSubtaskLinkResult = {
  documentId: string;
  linkedToPrevious: boolean;
  assignedTo: { documentId: string; name: string }[];
};

export type BoardLinkDraftState = {
  pendingLinks: ReadonlyMap<string, boolean>;
  inFlightLinkIds: ReadonlySet<string>;
};

export function hasPendingLinkDraft(state: BoardLinkDraftState): boolean {
  return state.pendingLinks.size > 0 || state.inFlightLinkIds.size > 0;
}

export function resolveDraftLinkedToPrevious(
  loaded: boolean,
  documentId: string,
  draft: BoardSubTaskSummary | undefined,
  state: BoardLinkDraftState,
): boolean {
  const desired = state.pendingLinks.get(documentId);
  if (desired !== undefined) return desired;
  if (state.inFlightLinkIds.has(documentId) && draft) {
    return draft.linkedToPrevious;
  }
  return loaded;
}

/** Prefer last acked link when a stale list fetch lags behind a recent save. */
export function reconcileLoadedSubtaskLinks(
  loaded: readonly BoardSubTaskSummary[],
  ackedLinks: ReadonlyMap<string, boolean>,
): BoardSubTaskSummary[] {
  return loaded.map((item) => {
    const acked = ackedLinks.get(item.documentId);
    if (acked !== undefined && acked !== item.linkedToPrevious) {
      return { ...item, linkedToPrevious: acked };
    }
    return item;
  });
}

export function shouldFlushBoardLink(
  desired: boolean | undefined,
  inFlight: boolean,
  acked: boolean | undefined,
): boolean {
  if (inFlight) return false;
  if (desired === undefined) return false;
  return acked !== desired;
}
