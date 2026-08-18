import { z } from "zod";

import {
  DEFAULT_SEMANTIC_TOKENS,
  SEMANTIC_TOKEN_KEYS,
  isValidSemanticHexColor,
  mergeSemanticTokens,
  type SemanticTokenKey,
  type SemanticTokens,
} from "@/lib/themes/semantic-tokens";

const semanticTokenValueSchema = z
  .string()
  .trim()
  .refine(isValidSemanticHexColor, { message: "invalid hex color" });

const semanticTokensShape = Object.fromEntries(
  SEMANTIC_TOKEN_KEYS.map((key) => [key, semanticTokenValueSchema]),
) as Record<SemanticTokenKey, typeof semanticTokenValueSchema>;

export const semanticTokensSchema = z
  .object(semanticTokensShape)
  .partial()
  .transform((partial) => mergeSemanticTokens(partial));

export type SemanticTokensInput = Partial<SemanticTokens>;

export function parseSemanticTokens(raw: unknown): SemanticTokens {
  return semanticTokensSchema.parse(raw);
}

export function parseSemanticTokensPartial(
  raw: unknown,
): Partial<SemanticTokens> {
  const partialSchema = z.object(semanticTokensShape).partial();
  return partialSchema.parse(raw);
}

export { DEFAULT_SEMANTIC_TOKENS };
