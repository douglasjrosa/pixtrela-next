import type {
  BoxTemplateData,
  LegacyAdesivo,
  LegacyFramedPart,
  LegacyNumber,
} from "@/lib/legacy/rbx-types";
import type {
  TemplateSubTaskComponentInput,
  TemplateTaskFormInput,
} from "@/lib/schemas/template-task";

import {
  TEMPLATE_SARRAFOS_CUT_NAME,
  applyTemplateSubTaskDependencies,
} from "./template-subtask-dependencies";

const CUT_SECONDS = 60;
const ADHESIVE_SECONDS = 30;
const MAX_WORKERS_SINGLE = 1;
const MAX_WORKERS_DUAL = 2;
const QTY_BASE = 1;
const QTY_TAMPA = 1;
const QTY_LATERAIS = 2;
const QTY_CABECEIRAS = 2;
const MIN_PES = 1;

/** Assembly count codes inside the legacy `montagem` array (index 0 is null). */
const MONTAGEM_CODE = {
  pe: 1,
  base: 2,
  lateralQuadros: 3,
  lateralChapa: 4,
  cabeceiraQuadros: 7,
  cabeceiraChapa: 8,
  tampaQuadros: 10,
  tampaChapa: 11,
} as const;

function toNumber(value: LegacyNumber): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toSeconds(value: LegacyNumber): number {
  return Math.max(0, Math.round(toNumber(value)));
}

function montagemSeconds(
  montagem: BoxTemplateData["montagem"],
  code: number,
): number {
  return toSeconds(montagem[code]);
}

function isPresent(component: unknown): boolean {
  return typeof component === "object" && component !== null;
}

function countAdhesives(part: LegacyFramedPart | null | undefined): number {
  if (!part) return 0;
  let count = 0;
  if (isPresent(part.fragil as LegacyAdesivo)) count += 1;
  if (isPresent(part.adExtra as LegacyAdesivo)) count += 1;
  return count;
}

type SubTaskDraft = {
  name: string;
  qty: number;
  sharingType: TemplateSubTaskComponentInput["sharingType"];
  expectedTime: number;
  include: boolean;
};

function cutDraft(name: string, present: boolean): SubTaskDraft {
  return {
    name,
    qty: 1,
    sharingType: "duration",
    expectedTime: CUT_SECONDS,
    include: present,
  };
}

function chapaCutDraft(name: string, qty: number, present: boolean): SubTaskDraft {
  return {
    name,
    qty,
    sharingType: "qty",
    expectedTime: CUT_SECONDS,
    include: present,
  };
}

function qtyDraft(name: string, qty: number, expectedTime: number): SubTaskDraft {
  return {
    name,
    qty,
    sharingType: "qty",
    expectedTime,
    include: expectedTime > 0,
  };
}

function buildTemplateName(empresaNome: string, boxName: string): string {
  const company = empresaNome.trim();
  const box = boxName.trim();
  return company ? `${company} - ${box}` : box;
}

function maxSameTimeWorkersFor(name: string): number {
  if (
    name === "Montagem dos pés" ||
    name === "Montagem dos quadros das laterais" ||
    name === "Montagem dos quadros das cabeceiras" ||
    name === "Montagem dos quadros da tampa" ||
    name === "Corte das chapas das laterais" ||
    name === "Corte das chapas das cabeceiras" ||
    name === "Corte da chapa da tampa" ||
    name.startsWith("Fixação dos adesivos")
  ) {
    return MAX_WORKERS_SINGLE;
  }
  return MAX_WORKERS_DUAL;
}

/**
 * Turns a legacy box payload into a Pixtrela TemplateTask form input.
 *
 * Cut subtasks are time-based (fixed 60s); assembly/fixation subtasks are
 * quantity-based with expectedTime = nails/staples (1s each) or 30s per
 * adhesive. Subtasks for absent parts (count 0) are omitted. Part quantities
 * follow the box anatomy: 1 base, 1 tampa, 2 laterais, 2 cabeceiras.
 */
export function buildTemplateFromBox(
  data: BoxTemplateData,
): TemplateTaskFormInput {
  const { montagem, base, lateral, cabeceira, tampa } = data;

  const hasBaseFeet = isPresent(base?.pe) || isPresent(base?.toco);
  const hasBaseBoards = isPresent(base?.tabua);
  const hasFrames =
    isPresent(lateral) || isPresent(cabeceira) || isPresent(tampa);
  const qPes = Math.max(MIN_PES, Math.round(toNumber(data.info?.qPes)));

  const lateralAdhesives = countAdhesives(lateral);
  const cabeceiraAdhesives = countAdhesives(cabeceira);
  const tampaAdhesives = countAdhesives(tampa);

  const drafts: SubTaskDraft[] = [
    cutDraft("Corte dos pés da base", hasBaseFeet),
    cutDraft("Corte das tábuas da base", hasBaseBoards),
    cutDraft(TEMPLATE_SARRAFOS_CUT_NAME, hasFrames),
    chapaCutDraft(
      "Corte das chapas das laterais",
      QTY_LATERAIS,
      isPresent(lateral),
    ),
    chapaCutDraft(
      "Corte das chapas das cabeceiras",
      QTY_CABECEIRAS,
      isPresent(cabeceira),
    ),
    chapaCutDraft("Corte da chapa da tampa", QTY_TAMPA, isPresent(tampa)),
    qtyDraft("Montagem dos pés", qPes, montagemSeconds(montagem, MONTAGEM_CODE.pe)),
    qtyDraft(
      "Montagem da base",
      QTY_BASE,
      montagemSeconds(montagem, MONTAGEM_CODE.base),
    ),
    qtyDraft(
      "Montagem dos quadros das laterais",
      QTY_LATERAIS,
      montagemSeconds(montagem, MONTAGEM_CODE.lateralQuadros),
    ),
    qtyDraft(
      "Fixação das chapas das laterais",
      QTY_LATERAIS,
      montagemSeconds(montagem, MONTAGEM_CODE.lateralChapa),
    ),
    qtyDraft(
      "Fixação dos adesivos das laterais",
      QTY_LATERAIS,
      lateralAdhesives * ADHESIVE_SECONDS,
    ),
    qtyDraft(
      "Montagem dos quadros das cabeceiras",
      QTY_CABECEIRAS,
      montagemSeconds(montagem, MONTAGEM_CODE.cabeceiraQuadros),
    ),
    qtyDraft(
      "Fixação das chapas das cabeceiras",
      QTY_CABECEIRAS,
      montagemSeconds(montagem, MONTAGEM_CODE.cabeceiraChapa),
    ),
    qtyDraft(
      "Fixação dos adesivos das cabeceiras",
      QTY_CABECEIRAS,
      cabeceiraAdhesives * ADHESIVE_SECONDS,
    ),
    qtyDraft(
      "Montagem dos quadros da tampa",
      QTY_TAMPA,
      montagemSeconds(montagem, MONTAGEM_CODE.tampaQuadros),
    ),
    qtyDraft(
      "Fixação das chapas da tampa",
      QTY_TAMPA,
      montagemSeconds(montagem, MONTAGEM_CODE.tampaChapa),
    ),
    qtyDraft(
      "Fixação dos adesivos da tampa",
      QTY_TAMPA,
      tampaAdhesives * ADHESIVE_SECONDS,
    ),
  ];

  const subTask: TemplateSubTaskComponentInput[] = applyTemplateSubTaskDependencies(
    drafts
      .filter((draft) => draft.include)
      .map((draft, index) => ({
        name: draft.name,
        qty: draft.qty,
        sharingType: draft.sharingType,
        maxSameTimeWorkers: maxSameTimeWorkersFor(draft.name),
        index,
        expectedTime: draft.expectedTime,
        dependencies: null,
      })),
  );
  return {
    name: buildTemplateName(data.empresaNome, data.boxName),
    code: String(data.prodId),
    subTask,
  };
}
