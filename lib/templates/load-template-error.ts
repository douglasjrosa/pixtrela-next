import { PRESET_NOT_FOUND_PREFIX } from "@/integrations/ribermax/box/template-from-box";

export type LoadTemplateErrorCode =
  | "generic"
  | "misconfigured"
  | "invalidCode"
  | "presetNotFound";

export type LoadTemplateErrorDetails = {
  code: LoadTemplateErrorCode;
  presetName?: string;
};

export function parseLoadTemplateError(
  error: unknown,
): LoadTemplateErrorDetails {
  if (!(error instanceof Error)) {
    return { code: "generic" };
  }

  if (error.message === "ribermaxMisconfigured") {
    return { code: "misconfigured" };
  }

  if (error.message === "invalidCode") {
    return { code: "invalidCode" };
  }

  if (error.message.startsWith(PRESET_NOT_FOUND_PREFIX)) {
    return {
      code: "presetNotFound",
      presetName: error.message.slice(PRESET_NOT_FOUND_PREFIX.length),
    };
  }

  return { code: "generic" };
}
