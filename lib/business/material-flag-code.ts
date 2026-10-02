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
const FLAG_CODE_SEPARATOR = "-";

function splitMaterialFlagCode(code: string): {
  prefix: string;
  suffix: string;
} {
  const separatorIndex = code.indexOf(FLAG_CODE_SEPARATOR);
  if (separatorIndex < 0) {
    return { prefix: code, suffix: "" };
  }
  return {
    prefix: code.slice(0, separatorIndex),
    suffix: code.slice(separatorIndex + 1),
  };
}

function compareMaterialFlagSuffix(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const leftIsInteger = left !== "" && Number.isInteger(leftNumber);
  const rightIsInteger = right !== "" && Number.isInteger(rightNumber);
  if (leftIsInteger && rightIsInteger) {
    return leftNumber - rightNumber;
  }
  return left.localeCompare(right, FLAG_CODE_LOCALE);
}

export function sortMaterialFlagOptionsByCode<
  T extends { code: string },
>(flags: readonly T[]): T[] {
  return [...flags].sort((left, right) => {
    const leftParts = splitMaterialFlagCode(left.code);
    const rightParts = splitMaterialFlagCode(right.code);
    const prefixOrder = leftParts.prefix.localeCompare(
      rightParts.prefix,
      FLAG_CODE_LOCALE,
    );
    if (prefixOrder !== 0) return prefixOrder;
    return compareMaterialFlagSuffix(leftParts.suffix, rightParts.suffix);
  });
}
