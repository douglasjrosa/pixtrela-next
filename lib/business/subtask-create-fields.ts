import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

const FINISHED_STATUS = "finished";

type SubTaskStatusSibling = {
  documentId: string;
  status: SubTaskFormInput["status"];
};

export function resolveSubTaskCreateActivationStatus(
  dependencyIds: string[],
  siblings: SubTaskStatusSibling[],
): "locked" | "unlocked" {
  if (dependencyIds.length === 0) return "unlocked";

  const siblingsById = new Map(
    siblings.map((sibling) => [sibling.documentId, sibling]),
  );

  const allFinished = dependencyIds.every(
    (documentId) => siblingsById.get(documentId)?.status === FINISHED_STATUS,
  );

  return allFinished ? "unlocked" : "locked";
}

export function normalizeSubTaskCreateValues(
  values: SubTaskFormInput,
  siblings: SubTaskStatusSibling[],
): SubTaskFormInput {
  const dependencyIds = values.dependencyIds ?? [];

  return {
    ...values,
    status: "waiting",
    activationStatus: resolveSubTaskCreateActivationStatus(
      dependencyIds,
      siblings,
    ),
    reasonForDisabling: "",
  };
}
