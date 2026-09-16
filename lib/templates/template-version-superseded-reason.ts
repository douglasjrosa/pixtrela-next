/** Stored on reason_for_deactivation when a versioned template is superseded. */
export function buildTemplateVersionSupersededReason(newCode: string): string {
  return (
    "Modelo arquivado devido a atualização de versão. " +
    `Substituído pelo Modelo de código ${newCode.trim()}.`
  );
}
