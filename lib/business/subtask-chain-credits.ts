import {
  calculateDurationCurrencyCredits,
  calculateQtySessionCurrency,
  type WorkSharingType,
} from "@/lib/domain/work-currency";

export type ChainCreditMember = {
  documentId: string;
  sharingType: WorkSharingType;
  expectedTime: number;
  qty: number;
  taskQty: number;
  finishedThisRun: boolean;
};

export type ChainParticipation = {
  colaboratorId: string;
  subTaskId: string;
  timeSpentSeconds: number;
  qty: number;
};

export type ChainCreditAward = {
  colaboratorId: string;
  subTaskId: string;
  amount: number;
};

export type ChainCreditDelta = ChainCreditAward & {
  previousAmount: number;
  delta: number;
};

export function calculateChainRunCredits(input: {
  members: readonly ChainCreditMember[];
  participations: readonly ChainParticipation[];
  currencyPerSecond: number;
}): ChainCreditAward[] {
  const rate = { currencyPerSecond: input.currencyPerSecond };
  const awards: ChainCreditAward[] = [];

  for (const member of input.members) {
    const context = {
      expectedTime: member.expectedTime,
      qty: member.qty,
      taskQty: member.taskQty,
      sharingType: member.sharingType,
    };
    const rows = input.participations.filter(
      (row) => row.subTaskId === member.documentId,
    );

    if (member.sharingType === "qty") {
      for (const row of rows) {
        if (row.qty <= 0) continue;
        const amount = calculateQtySessionCurrency(
          context,
          { sessionQty: row.qty },
          rate,
        );
        if (amount <= 0) continue;
        awards.push({
          colaboratorId: row.colaboratorId,
          subTaskId: member.documentId,
          amount,
        });
      }
      continue;
    }

    if (!member.finishedThisRun) continue;
    const credits = calculateDurationCurrencyCredits(
      context,
      rows.map((row) => ({
        colaboratorId: row.colaboratorId,
        timeSpentSeconds: row.timeSpentSeconds,
      })),
      rate,
    );
    for (const credit of credits) {
      if (credit.amount <= 0) continue;
      awards.push({
        colaboratorId: credit.colaboratorId,
        subTaskId: member.documentId,
        amount: credit.amount,
      });
    }
  }

  return awards;
}

export function diffChainRunCredits(
  next: readonly ChainCreditAward[],
  previous: readonly ChainCreditAward[],
): ChainCreditDelta[] {
  const previousByKey = new Map<string, number>();
  for (const row of previous) {
    const key = `${row.subTaskId}:${row.colaboratorId}`;
    previousByKey.set(key, (previousByKey.get(key) ?? 0) + row.amount);
  }

  const seen = new Set<string>();
  const deltas: ChainCreditDelta[] = [];

  for (const row of next) {
    const key = `${row.subTaskId}:${row.colaboratorId}`;
    seen.add(key);
    const previousAmount = previousByKey.get(key) ?? 0;
    deltas.push({
      ...row,
      previousAmount,
      delta: row.amount - previousAmount,
    });
  }

  for (const [key, previousAmount] of previousByKey) {
    if (seen.has(key)) continue;
    const [subTaskId, colaboratorId] = key.split(":");
    if (!subTaskId || !colaboratorId) continue;
    deltas.push({
      colaboratorId,
      subTaskId,
      amount: 0,
      previousAmount,
      delta: -previousAmount,
    });
  }

  return deltas;
}
