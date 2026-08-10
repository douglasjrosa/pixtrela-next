import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

type DrizzleActivation = "inactive" | "active" | "blocked";

export function toDrizzleActivationStatus(
  status: SubTaskFormInput["activationStatus"],
): DrizzleActivation {
  if (status === "unlocked") return "active";
  if (status === "disabled") return "blocked";
  return "inactive";
}

export function fromDrizzleActivationStatus(
  status: string | null | undefined,
): SubTaskFormInput["activationStatus"] {
  if (status === "active") return "unlocked";
  if (status === "blocked") return "disabled";
  return "locked";
}
