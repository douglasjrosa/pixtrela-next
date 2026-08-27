export type DefaultActionSeed = {
  name: string;
  unitTime: string;
  description: string;
  qtyQuestion: string;
};

/**
 * Canonical factory-action catalog. Portuguese strings are user-facing
 * catalog data, not UI chrome.
 */
export const DEFAULT_FACTORY_ACTIONS: readonly DefaultActionSeed[] = [
  {
    name: "Desengrossar madeira",
    unitTime: "22.00",
    description:
      "Ato de passar um única madeira inteira no desengrosso, pode ser " +
      "tábua, viga ou sarrafo, tanto faz, esta ação trata do tempo de " +
      "passar uma única peça por vez na máquina.",
    qtyQuestion: "Quantas peças serão passadas no desengrosso?",
  },
  {
    name: "Refilar madeira",
    unitTime: "10.00",
    description:
      "Ato de passar um única madeira inteira na serra esquadrejadeira, " +
      "pode ser tábua, viga ou sarrafo, tanto faz, esta ação trata do " +
      "tempo de passar uma única peça por vez na máquina.",
    qtyQuestion: "Quantas peças serão passadas na serra?",
  },
  {
    name: "Cortar tábua",
    unitTime: "2.40",
    description:
      "Ato de cortar uma única TÁBUA inteira na serra destopadeira, pode " +
      "ser na CNC-1, CNC-2, tanto faz, esta ação trata do tempo de passar " +
      "uma única peça na máquina, mesmo que junto com outras em um mesmo " +
      "corte.",
    qtyQuestion: "Quantas tábuas serão necessárias para esta sub-tarefa?",
  },
  {
    name: "Cortar viga",
    unitTime: "3.28",
    description:
      "Ato de cortar uma única VIGA inteira na serra destopadeira, pode " +
      "ser na CNC-1, CNC-2, tanto faz, esta ação trata do tempo de passar " +
      "uma única peça na máquina, mesmo que junto com outras em um mesmo " +
      "corte.",
    qtyQuestion: "Quantas vigas serão necessárias para esta sub-tarefa?",
  },
  {
    name: "Amarrar sarrafo - Inteiros",
    unitTime: "40.00",
    description:
      "Ato de amarrar sarrafos inteiros antes de enviar para o corte. Não " +
      "importa a quantidade por amarração, o tempo é definido por sarrafo.",
    qtyQuestion:
      "Quantos sarrafos serão amarrados? (não importa a quantidade de " +
      "fardos nem a quantidade por fardo)",
  },
  {
    name: "Amarrar sarrafo - Incompletos",
    unitTime: "15.00",
    description:
      "Ato de amarrar sarrafos incompletos antes de enviar para o corte. " +
      "Não importa a quantidade por amarração, o tempo é definido por " +
      "sarrafo.",
    qtyQuestion:
      "Quantos sarrafos serão amarrados? (não importa a quantidade de " +
      "fardos nem a quantidade por fardo)",
  },
  {
    name: "Cortar compensado",
    unitTime: "14.00",
    description:
      "Ato de cortar cada peça de compensado independentemente do tamanho " +
      "da peça cortada (duas passagens na serra formando um retângulo).",
    qtyQuestion: "Quantas peças serão cortadas para esta sub-tarefa?",
  },
  {
    name: "Sarrafear madeira c/ 3 cm",
    unitTime: "8.00",
    description:
      "Ato de passar tábuas na serra múltipla. Aqui o tempo é medido por " +
      "cada sarrafo de 3 cm cortado.",
    qtyQuestion:
      "Quantos sarrafos de 3 cm serão cortados para completar esta " +
      "sub-tarefa?",
  },
  {
    name: "Sarrafear madeira c/ 6 cm",
    unitTime: "16.00",
    description:
      "Ato de passar tábuas na serra múltipla. Aqui o tempo é medido por " +
      "cada sarrafo de 6 cm cortado.",
    qtyQuestion:
      "Quantos sarrafos de 6 cm serão cortados para completar esta " +
      "sub-tarefa?",
  },
  {
    name: "Cortar sarrafo amarrado",
    unitTime: "1.66",
    description:
      "Ato de cortar fardinhos de sarrafos amarrados, seja sarrafos " +
      "inteiros ou retalhos. O tempo é medido unidade mesmo que cortado " +
      "em conjunto, ou seja, o tempo é relativo a cada sarrafo cortado na " +
      "medida final.",
    qtyQuestion: "Quantas unidades de sarrafo serão cortados no total?",
  },
  {
    name: "Tabicar tábua",
    unitTime: "16.11",
    description:
      "Ato de mover madeiras (sarrafos, tábuas ou vigas) de um monte " +
      "para outro. Tempo contabilizado por peça movida.",
    qtyQuestion: "Quantas peças (unidades) serão tabicadas?",
  },
  {
    name: "Inspecionar lote completo",
    unitTime: "74.00",
    description:
      "Ato de inspecionar todos os itens de um lote completo, não " +
      "importa o tamanho do lote.",
    qtyQuestion: "Quantos lotes serão inspecionados?",
  },
  {
    name: "Enfardar serragem",
    unitTime: "182.00",
    description:
      "Ato de ensacar de maneira prensada a serragem no saco plástico.",
    qtyQuestion: "Quantos fardos serão ensacados?",
  },
  {
    name: "Pregar tábua do palete",
    unitTime: "5.00",
    description:
      "Ato de bater um único prego com um pregador pneumático na madeira " +
      "de um palete de tamanho PEQUENO A MÉDIO-GRANDE. Não importa o " +
      "tamanho do prego.",
    qtyQuestion: "Quantos pregos serão fixados no total?",
  },
  {
    name: "Pregar palete - Extra Grande",
    unitTime: "6.00",
    description:
      "Ato de bater um único prego com um pregador pneumático na madeira " +
      "de um palete de tamanho GRANDE / EXTRA GRANDE. Não importa o " +
      "tamanho do prego.",
    qtyQuestion: "Quantos pregos serão fixados no total?",
  },
  {
    name: "Pregar toco no pé do palete",
    unitTime: "2.60",
    description:
      "Ato de bater um único prego com um pregador pneumático fixando o " +
      "toco no pé do palete. Não importa o tamanho do prego.",
    qtyQuestion: "Quantos pregos serão fixados no total?",
  },
  {
    name: "Grampear quadro",
    unitTime: "1.00",
    description:
      "Ato de bater um único grampo na montagem de um quadro com " +
      "grampeador pneumático.",
    qtyQuestion: "Quantos grampos serão fixados no total?",
  },
  {
    name: "Grampear quadro - Extra Grande",
    unitTime: "8.00",
    description:
      "Ato de bater um único grampo na montagem de um quadro EXTRA " +
      "GRANDE com grampeador pneumático.",
    qtyQuestion: "Quantos grampos serão fixados no total?",
  },
  {
    name: "Grampear chapa",
    unitTime: "1.00",
    description:
      "Ato de bater um único grampo para fixar uma chapa em um quadro " +
      "com grampeador pneumático.",
    qtyQuestion: "Quantos grampos serão fixados no total?",
  },
  {
    name: "Fechar caixa",
    unitTime: "9.00",
    description:
      "Ato de fechar uma caixa seja com grampos, pregos ou parafusos.",
    qtyQuestion: "Quantas caixas serão fechadas?",
  },
  {
    name: "Fechar caixa - Extra Grande",
    unitTime: "83.00",
    description:
      "Ato de fechar uma caixa EXTRA GRANDE seja com grampos, pregos ou " +
      "parafusos, inclusive instalando acessórios se for preciso.",
    qtyQuestion: "Quantas caixas serão fechadas?",
  },
  {
    name: "Fixar adesivo",
    unitTime: "52.00",
    description:
      "Ato de colar um adesivo PEQUENO ou MÉDIO (A5 ou menor) em uma " +
      "das peças da caixa.",
    qtyQuestion: "Quantos adesivos serão fixados?",
  },
  {
    name: "Fixar adesivo - Extra Grande",
    unitTime: "133.00",
    description:
      "Ato de colar um adesivo GRANDE ou EXTRA GRANDE (A4 ou maior) em " +
      "uma das peças da caixa.",
    qtyQuestion: "Quantos adesivos serão fixados?",
  },
  {
    name: "Montar acessório - Pequeno",
    unitTime: "28.00",
    description:
      "Ato de executar tudo o que envolve a montagem de um acessório " +
      "PEQUENO inteiro, tal como furar, grampear, pregar, cortar e colar " +
      "espuma EVA, etc.",
    qtyQuestion: "Quantos acessórios serão montados?",
  },
  {
    name: "Montar acessório - Médio",
    unitTime: "64.00",
    description:
      "Ato de executar tudo o que envolve a montagem de um acessório " +
      "MÉDIO inteiro, tal como furar, grampear, pregar, cortar e colar " +
      "espuma EVA, etc.",
    qtyQuestion: "Quantos acessórios serão montados?",
  },
  {
    name: "Montar acessório - Grande",
    unitTime: "1544.00",
    description:
      "Ato de executar tudo o que envolve a montagem de um acessório " +
      "GRANDE inteiro, tal como furar, grampear, pregar, cortar e colar " +
      "espuma EVA, etc.",
    qtyQuestion: "Quantos acessórios serão montados?",
  },
];

export const GRAMPEAR_QUADRO_ACTION_NAME = "Grampear quadro";

export function calculateExpectedTimeFromAction(
  unitTime: number,
  actionUnits: number,
): number {
  const time = Number(unitTime);
  const units = Number(actionUnits);
  if (!Number.isFinite(time) || !Number.isFinite(units) || units <= 0) {
    return 0;
  }
  return Math.round(time * units);
}
