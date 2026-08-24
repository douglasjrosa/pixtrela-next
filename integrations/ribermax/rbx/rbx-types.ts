/**
 * Shapes returned by the legacy RBX `/produtos?templateData=<id>` endpoint.
 *
 * The legacy PHP serializes numbers as strings in several places, so numeric
 * fields are typed as `number | string` and must be coerced before use.
 */

export type LegacyNumber = number | string | null | undefined;

/** A cut piece (sarrafo) or board produced by `addSarrafo`. */
export interface LegacyComponent {
  qFix?: LegacyNumber;
  qPc?: LegacyNumber;
  qTot?: LegacyNumber;
  larg?: LegacyNumber;
  Fix?: string | null;
  mpVol?: LegacyNumber;
}

/** An adhesive label produced by `addAdesivo`; mere presence means it applies. */
export interface LegacyAdesivo {
  qtde?: LegacyNumber;
}

export interface LegacyBasePart {
  pe?: LegacyComponent | null;
  toco?: LegacyComponent | null;
  tabua?: LegacyComponent | null;
}

export interface LegacyFramedPart {
  E?: LegacyComponent | null;
  I?: LegacyComponent | null;
  II?: LegacyComponent | null;
  chapa?: LegacyComponent | null;
  fragil?: LegacyAdesivo | null;
  adExtra?: LegacyAdesivo | null;
}

export interface LegacyBoxInfo {
  empresa?: LegacyNumber;
  qPes?: LegacyNumber;
  comprimento?: LegacyNumber;
  largura?: LegacyNumber;
  altura?: LegacyNumber;
  modelo?: string;
  titulo?: string;
}

/**
 * Full payload for one box: company/name plus the raw calcCx parts and the
 * PHP-computed assembly counts (`montagem`, indexed by task code, [0] is null).
 */
export interface BoxTemplateData {
  prodId: number;
  empresaNome: string;
  boxName: string;
  info: LegacyBoxInfo | null;
  base: LegacyBasePart | null;
  lateral: LegacyFramedPart | null;
  cabeceira: LegacyFramedPart | null;
  tampa: LegacyFramedPart | null;
  montagem: Array<LegacyNumber>;
}

export interface LegacyErrorResponse {
  error: string;
}
