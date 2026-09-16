/** Canonical preset name → legacy Ribermax names accepted on import. */
export const PRESET_NAME_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "Corte dos sarrafos": [
    "Corte dos pés da base (sarrafos)",
    "Corte dos sarrafos da embalagem",
  ],
  "Corte das vigas": ["Corte dos pés da base (viga)"],
  "Corte das tábuas": ["Corte das tábuas da base"],
  "Corte dos pés da base": [
    "Corte das vigas",
    "Corte dos sarrafos",
    "Corte dos pés da base (viga)",
    "Corte dos pés da base (sarrafos)",
  ],
};
