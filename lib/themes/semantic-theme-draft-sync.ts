import type { SemanticTokens } from "@/lib/themes/semantic-tokens";

function tokensKey(tokens: SemanticTokens): string {
  return JSON.stringify(tokens);
}

/**
 * After save, router.refresh() can still deliver a stale RSC snapshot of the
 * previous palette. Ignore that snapshot so the live preview stays coherent.
 */
export function shouldReplaceDraftFromServer(input: {
  serverTokens: SemanticTokens;
  draft: SemanticTokens;
  savedBaseline: SemanticTokens;
}): boolean {
  const serverKey = tokensKey(input.serverTokens);
  const baselineKey = tokensKey(input.savedBaseline);
  const draftKey = tokensKey(input.draft);
  const serverIsBehindSaved =
    serverKey !== baselineKey && draftKey === baselineKey;
  return !serverIsBehindSaved;
}
