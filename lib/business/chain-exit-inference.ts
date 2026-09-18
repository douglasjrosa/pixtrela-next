import type { AllocationSharingType, ChainStopAnswer } from
  "@/lib/business/subtask-chain-allocation";

export const CHAIN_STOP_INCONSISTENT = "chainStopInconsistent";
export const DURATION_FINISHED_STOP_QTY = 1;

export type ChainExitMember = {
  documentId: string;
  index: number;
  sharingType: AllocationSharingType;
  targetQty: number;
  completedQty: number;
  dependencyIds: readonly string[];
  /** Stopped qty already on this run from other peers. */
  recordedQtyThisRun?: number;
};

export type ChainExitRecomputeOptions = {
  changedMemberId?: string;
  workedMemberIds?: readonly string[];
  othersStillActive?: boolean;
};

export type DependencyEdge = {
  consumerId: string;
  supplierId: string;
};

export type ChainExitStep = {
  documentId: string;
  visible: boolean;
  reason?: "inferred" | "independent";
};

export type ChainExitFieldConstraints = {
  min: number;
  max: number;
  defaultQty: number;
};

export type ChainExitState = {
  steps: ChainExitStep[];
  answers: Record<string, ChainStopAnswer>;
  fieldConstraints: Record<string, ChainExitFieldConstraints>;
};

export function remainingTargetQty(member: ChainExitMember): number {
  return Math.max(0, member.targetQty - Math.max(0, member.completedQty));
}

export function dependencyEdgesWithinChain(
  members: readonly ChainExitMember[],
): DependencyEdge[] {
  const memberIds = new Set(members.map((item) => item.documentId));
  const edges: DependencyEdge[] = [];
  for (const member of members) {
    for (const supplierId of member.dependencyIds) {
      if (!memberIds.has(supplierId) || supplierId === member.documentId) {
        continue;
      }
      edges.push({ consumerId: member.documentId, supplierId });
    }
  }
  return edges;
}

export function chainExitMembersFromQueue(
  members: readonly {
    documentId: string;
    index: number;
    sharingType: AllocationSharingType;
    targetQty: number;
    completedQty: number;
    dependencyIds?: readonly string[];
    recordedQtyThisRun?: number;
  }[],
): ChainExitMember[] {
  return members.map((member) => ({
    documentId: member.documentId,
    index: member.index,
    sharingType: member.sharingType,
    targetQty: member.targetQty,
    completedQty: member.completedQty,
    dependencyIds: member.dependencyIds ?? [],
    ...(typeof member.recordedQtyThisRun === "number"
      ? { recordedQtyThisRun: member.recordedQtyThisRun }
      : {}),
  }));
}

export function recordedStockQty(member: ChainExitMember): number {
  if (typeof member.recordedQtyThisRun === "number") {
    return Math.max(0, member.recordedQtyThisRun);
  }
  return Math.max(0, member.completedQty);
}

export function peerRemainingQty(member: ChainExitMember): number {
  return remainingTargetQty(member);
}

export function requiredSupplierSessionMin(
  consumer: ChainExitMember,
  supplier: ChainExitMember,
  consumerSessionQty: number,
): number {
  const needed = Math.max(
    0,
    recordedStockQty(consumer) + consumerSessionQty - recordedStockQty(supplier),
  );
  return Math.min(peerRemainingQty(supplier), needed);
}

export function isChainExitMemberFinished(
  member: ChainExitMember,
  answer: ChainStopAnswer | undefined,
): boolean {
  if (!answer) return false;
  if (member.sharingType === "duration") {
    return answer.completed === true;
  }
  if (typeof answer.qty !== "number" || !Number.isInteger(answer.qty)) {
    return false;
  }
  return answer.qty >= remainingTargetQty(member);
}

function sessionQtyFromAnswer(
  member: ChainExitMember,
  answer: ChainStopAnswer | undefined,
): number | undefined {
  if (!answer) return undefined;
  if (member.sharingType === "duration") {
    if (typeof answer.completed !== "boolean") return undefined;
    return answer.completed ? remainingTargetQty(member) : 0;
  }
  if (typeof answer.qty !== "number" || !Number.isInteger(answer.qty)) {
    return undefined;
  }
  return Math.max(0, answer.qty);
}

export function resolveChainExitWizardOrder(
  members: readonly ChainExitMember[],
  edges: readonly DependencyEdge[],
): string[] {
  const byId = new Map(members.map((item) => [item.documentId, item]));
  const connected = new Set<string>();
  for (const edge of edges) {
    connected.add(edge.consumerId);
    connected.add(edge.supplierId);
  }

  const independent = members
    .filter((item) => !connected.has(item.documentId))
    .sort((left, right) => left.index - right.index)
    .map((item) => item.documentId);

  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const id of connected) {
    outgoing.set(id, []);
    indegree.set(id, 0);
  }
  for (const edge of edges) {
    outgoing.get(edge.consumerId)?.push(edge.supplierId);
    indegree.set(edge.supplierId, (indegree.get(edge.supplierId) ?? 0) + 1);
  }

  const ready = [...connected]
    .filter((id) => (indegree.get(id) ?? 0) === 0)
    .sort((left, right) => (byId.get(left)?.index ?? 0) - (byId.get(right)?.index ?? 0));
  const ordered: string[] = [];
  while (ready.length > 0) {
    const current = ready.shift()!;
    ordered.push(current);
    for (const next of outgoing.get(current) ?? []) {
      const nextDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree !== 0) continue;
      ready.push(next);
      ready.sort(
        (left, right) => (byId.get(left)?.index ?? 0) - (byId.get(right)?.index ?? 0),
      );
    }
  }

  const leftover = [...connected]
    .filter((id) => !ordered.includes(id))
    .sort((left, right) => (byId.get(left)?.index ?? 0) - (byId.get(right)?.index ?? 0));

  return [...ordered, ...leftover, ...independent];
}

function reachableSuppliers(
  startId: string,
  edges: readonly DependencyEdge[],
): Set<string> {
  const result = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.consumerId !== current || result.has(edge.supplierId)) continue;
      result.add(edge.supplierId);
      queue.push(edge.supplierId);
    }
  }
  return result;
}

function inferredAnswer(
  documentId: string,
  patch: Omit<ChainStopAnswer, "documentId">,
): ChainStopAnswer {
  return {
    documentId,
    inferred: true,
    semBandeira: true,
    ...patch,
  };
}

function stripInferredAnswers(
  draft: Record<string, ChainStopAnswer>,
): Record<string, ChainStopAnswer> {
  const next: Record<string, ChainStopAnswer> = {};
  for (const [id, answer] of Object.entries(draft)) {
    if (answer.inferred === true) continue;
    next[id] = answer;
  }
  return next;
}

export function recomputeChainExitState(
  members: readonly ChainExitMember[],
  edges: readonly DependencyEdge[],
  answersDraft: Record<string, ChainStopAnswer>,
  options?: ChainExitRecomputeOptions,
): ChainExitState {
  const byId = new Map(members.map((item) => [item.documentId, item]));
  const worked = new Set(
    options?.workedMemberIds ?? members.map((item) => item.documentId),
  );
  const othersStillActive = options?.othersStillActive === true;
  const order = resolveChainExitWizardOrder(members, edges).filter((id) =>
    worked.has(id),
  );
  const answers = stripInferredAnswers(answersDraft);
  if (options?.changedMemberId) {
    for (const supplierId of reachableSuppliers(options.changedMemberId, edges)) {
      if (worked.has(supplierId)) delete answers[supplierId];
    }
  }

  const fieldConstraints: Record<string, ChainExitFieldConstraints> = {};
  const hidden = new Set<string>();
  const connected = new Set(
    edges.flatMap((edge) => [edge.consumerId, edge.supplierId]),
  );

  for (const documentId of resolveChainExitWizardOrder(members, edges)) {
    const member = byId.get(documentId);
    if (!member) continue;
    const consumers = edges
      .filter((edge) => edge.supplierId === documentId)
      .map((edge) => byId.get(edge.consumerId))
      .filter((item): item is ChainExitMember => Boolean(item));
    if (consumers.length === 0) continue;

    let anyFinished = false;
    let anyAnswered = false;
    let neededFromConsumers = 0;
    for (const consumer of consumers) {
      const answer = answers[consumer.documentId];
      const sessionQty = sessionQtyFromAnswer(consumer, answer);
      if (sessionQty === undefined) continue;
      anyAnswered = true;
      if (isChainExitMemberFinished(consumer, answer)) anyFinished = true;
      if (member.sharingType !== "qty" || consumer.sharingType !== "qty") {
        continue;
      }
      neededFromConsumers += recordedStockQty(consumer) + sessionQty;
    }
    const mins = [
      Math.max(0, neededFromConsumers - recordedStockQty(member)),
    ];

    if (!anyAnswered) continue;

    if (member.sharingType === "qty") {
      const max = peerRemainingQty(member);
      const needed = Math.min(max, Math.max(0, ...mins, 0));
      const min = othersStillActive ? 0 : needed;
      const workedSupplier = worked.has(documentId);
      if (!workedSupplier && min === 0) {
        answers[documentId] = inferredAnswer(documentId, { qty: 0 });
        hidden.add(documentId);
        continue;
      }
      if (!workedSupplier) continue;
      fieldConstraints[documentId] = { min, max, defaultQty: min };
      if (!othersStillActive && min === max) {
        answers[documentId] = inferredAnswer(documentId, { qty: min });
        hidden.add(documentId);
        continue;
      }
      const currentQty = answers[documentId]?.qty;
      const nextQty =
        typeof currentQty === "number"
          ? Math.min(max, Math.max(min, currentQty))
          : min;
      answers[documentId] = {
        documentId,
        qty: nextQty,
        flagIds: answers[documentId]?.flagIds,
        semBandeira: answers[documentId]?.semBandeira,
        availableFlagCount: answers[documentId]?.availableFlagCount,
      };
      continue;
    }

    if (!othersStillActive && anyFinished && worked.has(documentId)) {
      answers[documentId] = inferredAnswer(documentId, { completed: true });
      hidden.add(documentId);
    }
  }

  const steps: ChainExitStep[] = order.map((documentId) => {
    const independent = !connected.has(documentId);
    if (hidden.has(documentId)) {
      return { documentId, visible: false, reason: "inferred" };
    }
    return {
      documentId,
      visible: true,
      ...(independent ? { reason: "independent" as const } : {}),
    };
  });

  return { steps, answers, fieldConstraints };
}

export function validateChainStopCoherence(
  members: readonly ChainExitMember[],
  edges: readonly DependencyEdge[],
  answers: readonly ChainStopAnswer[] | Record<string, ChainStopAnswer>,
  options?: ChainExitRecomputeOptions,
): void {
  const draft = Array.isArray(answers)
    ? Object.fromEntries(answers.map((answer) => [answer.documentId, answer]))
    : answers;
  const expected = recomputeChainExitState(members, edges, draft, options);
  const othersStillActive = options?.othersStillActive === true;

  for (const member of members) {
    const answer = draft[member.documentId] ?? expected.answers[member.documentId];
    if (!answer) continue;
    const remaining = peerRemainingQty(member);
    if (member.sharingType === "qty") {
      if (typeof answer.qty !== "number" || !Number.isInteger(answer.qty)) {
        throw new Error(CHAIN_STOP_INCONSISTENT);
      }
      if (answer.qty < 0 || answer.qty > remaining) {
        throw new Error(CHAIN_STOP_INCONSISTENT);
      }
      const constraints = expected.fieldConstraints[member.documentId];
      if (constraints && (answer.qty < constraints.min || answer.qty > constraints.max)) {
        throw new Error(CHAIN_STOP_INCONSISTENT);
      }
      continue;
    }
    if (typeof answer.completed !== "boolean") {
      throw new Error(CHAIN_STOP_INCONSISTENT);
    }
    const inferred = expected.answers[member.documentId];
    if (inferred?.inferred === true && answer.completed !== true) {
      throw new Error(CHAIN_STOP_INCONSISTENT);
    }
  }

  if (othersStillActive) return;

  for (const edge of edges) {
    const supplier = members.find((item) => item.documentId === edge.supplierId);
    const consumer = members.find((item) => item.documentId === edge.consumerId);
    if (!supplier || !consumer) continue;
    if (supplier.sharingType !== "qty" || consumer.sharingType !== "qty") {
      continue;
    }
    const supplierQty =
      draft[supplier.documentId]?.qty ??
      expected.answers[supplier.documentId]?.qty ??
      0;
    const consumerQty =
      draft[consumer.documentId]?.qty ??
      expected.answers[consumer.documentId]?.qty ??
      0;
    const totalS = recordedStockQty(supplier) + supplierQty;
    const totalC = recordedStockQty(consumer) + consumerQty;
    if (totalC > totalS) throw new Error(CHAIN_STOP_INCONSISTENT);
  }
}

export function principalDeclaredFinishFromStopQty(input: {
  sharingType: AllocationSharingType;
  targetQty: number;
  completedQtyBefore: number;
  principalStopQty: number;
}): boolean {
  if (input.sharingType === "duration") {
    return input.principalStopQty > 0;
  }
  return (
    input.completedQtyBefore + Math.max(0, input.principalStopQty) >=
    Math.max(1, input.targetQty)
  );
}

export function isDurationOnlySharing(
  members: readonly { sharingType: AllocationSharingType }[],
): boolean {
  return (
    members.length > 0 &&
    members.every((item) => item.sharingType === "duration")
  );
}
