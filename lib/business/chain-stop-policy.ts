export const CHAIN_STOP_ANSWERS_REQUIRED = "chainStopAnswersRequired";

export type GroupLeaveDecision = "peerLeave" | "answersRequired" | "close";

/**
 * A group stays open while another person is still in the session.
 * Activities are written only when the last person closes with answers.
 */
export function resolveGroupLeave(input: {
  openUserIds: readonly string[];
  colaboratorId: string;
  answerCount: number;
}): GroupLeaveDecision {
  const othersRemain = input.openUserIds.some(
    (userId) => userId !== input.colaboratorId,
  );
  if (othersRemain) return "peerLeave";
  if (input.answerCount <= 0) return "answersRequired";
  return "close";
}
