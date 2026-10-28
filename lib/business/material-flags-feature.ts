export const MATERIAL_FLAGS_DISABLED_ERROR = "materialFlagsDisabled";

export function areMaterialFlagsEnabled(enabled: boolean): boolean {
  return enabled === true;
}

export function assertMaterialFlagsEnabled(enabled: boolean): void {
  if (!areMaterialFlagsEnabled(enabled)) {
    throw new Error(MATERIAL_FLAGS_DISABLED_ERROR);
  }
}

export function isMaterialFlagsDisabledError(error: unknown): boolean {
  return (
    error instanceof Error && error.message === MATERIAL_FLAGS_DISABLED_ERROR
  );
}
