import { z } from "zod";

export const bulkDocumentIdsSchema = z
  .array(z.string().trim().min(1))
  .min(1, "emptySelection");
