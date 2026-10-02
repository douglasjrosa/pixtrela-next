export const MATERIAL_FLAG_REF_PATTERN = /^[A-Za-z]+$/;

export function formatMaterialFlagCode(ref: string, index: number): string {
  return `${ref}-${index}`;
}

export function isValidMaterialFlagRef(value: string): boolean {
  return MATERIAL_FLAG_REF_PATTERN.test(value.trim());
}

export function normalizeMaterialFlagRef(value: string): string {
  return value.trim().toUpperCase();
}

const FLAG_CODE_LOCALE = "pt-BR";

export function sortMaterialFlagOptionsByCode<
  T extends { code: string },
>(flags: readonly T[]): T[] {
  return [...flags].sort((left, right) =>
    left.code.localeCompare(right.code, FLAG_CODE_LOCALE),
  );
}
