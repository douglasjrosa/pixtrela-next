CREATE TABLE "actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(128) NOT NULL,
  "unit_time" numeric(12, 2) NOT NULL,
  "description" text NOT NULL,
  "qty_question" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO "actions" ("name", "unit_time", "description", "qty_question") VALUES
  (
    'Desengrossar madeira',
    '22.00',
    'Ato de passar um única madeira inteira no desengrosso, pode ser tábua, viga ou sarrafo, tanto faz, esta ação trata do tempo de passar uma única peça por vez na máquina.',
    'Quantas peças serão passadas no desengrosso?'
  ),
  (
    'Refilar madeira',
    '10.00',
    'Ato de passar um única madeira inteira na serra esquadrejadeira, pode ser tábua, viga ou sarrafo, tanto faz, esta ação trata do tempo de passar uma única peça por vez na máquina.',
    'Quantas peças serão passadas na serra?'
  ),
  (
    'Cortar tábua',
    '2.40',
    'Ato de cortar uma única TÁBUA inteira na serra destopadeira, pode ser na CNC-1, CNC-2, tanto faz, esta ação trata do tempo de passar uma única peça na máquina, mesmo que junto com outras em um mesmo corte.',
    'Quantas tábuas serão necessárias para esta sub-tarefa?'
  ),
  (
    'Cortar viga',
    '3.28',
    'Ato de cortar uma única VIGA inteira na serra destopadeira, pode ser na CNC-1, CNC-2, tanto faz, esta ação trata do tempo de passar uma única peça na máquina, mesmo que junto com outras em um mesmo corte.',
    'Quantas vigas serão necessárias para esta sub-tarefa?'
  ),
  (
    'Amarrar sarrafo - Inteiros',
    '40.00',
    'Ato de amarrar sarrafos inteiros antes de enviar para o corte. Não importa a quantidade por amarração, o tempo é definido por sarrafo.',
    'Quantos sarrafos serão amarrados? (não importa a quantidade de fardos nem a quantidade por fardo)'
  ),
  (
    'Amarrar sarrafo - Incompletos',
    '15.00',
    'Ato de amarrar sarrafos incompletos antes de enviar para o corte. Não importa a quantidade por amarração, o tempo é definido por sarrafo.',
    'Quantos sarrafos serão amarrados? (não importa a quantidade de fardos nem a quantidade por fardo)'
  ),
  (
    'Cortar compensado',
    '14.00',
    'Ato de cortar cada peça de compensado independentemente do tamanho da peça cortada (duas passagens na serra formando um retângulo).',
    'Quantas peças serão cortadas para esta sub-tarefa?'
  ),
  (
    'Sarrafear madeira c/ 3 cm',
    '8.00',
    'Ato de passar tábuas na serra múltipla. Aqui o tempo é medido por cada sarrafo de 3 cm cortado.',
    'Quantos sarrafos de 3 cm serão cortados para completar esta sub-tarefa?'
  ),
  (
    'Sarrafear madeira c/ 6 cm',
    '16.00',
    'Ato de passar tábuas na serra múltipla. Aqui o tempo é medido por cada sarrafo de 6 cm cortado.',
    'Quantos sarrafos de 6 cm serão cortados para completar esta sub-tarefa?'
  ),
  (
    'Cortar sarrafo amarrado',
    '1.66',
    'Ato de cortar fardinhos de sarrafos amarrados, seja sarrafos inteiros ou retalhos. O tempo é medido unidade mesmo que cortado em conjunto, ou seja, o tempo é relativo a cada sarrafo cortado na medida final.',
    'Quantas unidades de sarrafo serão cortados no total?'
  ),
  (
    'Tabicar tábua',
    '16.11',
    'Ato de mover madeiras (sarrafos, tábuas ou vigas) de um monte para outro. Tempo contabilizado por peça movida.',
    'Quantas peças (unidades) serão tabicadas?'
  ),
  (
    'Inspecionar lote completo',
    '74.00',
    'Ato de inspecionar todos os itens de um lote completo, não importa o tamanho do lote.',
    'Quantos lotes serão inspecionados?'
  ),
  (
    'Enfardar serragem',
    '182.00',
    'Ato de ensacar de maneira prensada a serragem no saco plástico.',
    'Quantos fardos serão ensacados?'
  ),
  (
    'Pregar tábua do palete',
    '5.00',
    'Ato de bater um único prego com um pregador pneumático na madeira de um palete de tamanho PEQUENO A MÉDIO-GRANDE. Não importa o tamanho do prego.',
    'Quantos pregos serão fixados no total?'
  ),
  (
    'Pregar palete - Extra Grande',
    '6.00',
    'Ato de bater um único prego com um pregador pneumático na madeira de um palete de tamanho GRANDE / EXTRA GRANDE. Não importa o tamanho do prego.',
    'Quantos pregos serão fixados no total?'
  ),
  (
    'Pregar toco no pé do palete',
    '2.60',
    'Ato de bater um único prego com um pregador pneumático fixando o toco no pé do palete. Não importa o tamanho do prego.',
    'Quantos pregos serão fixados no total?'
  ),
  (
    'Grampear quadro',
    '1.00',
    'Ato de bater um único grampo na montagem de um quadro com grampeador pneumático.',
    'Quantos grampos serão fixados no total?'
  ),
  (
    'Grampear quadro - Extra Grande',
    '8.00',
    'Ato de bater um único grampo na montagem de um quadro EXTRA GRANDE com grampeador pneumático.',
    'Quantos grampos serão fixados no total?'
  ),
  (
    'Grampear chapa',
    '1.00',
    'Ato de bater um único grampo para fixar uma chapa em um quadro com grampeador pneumático.',
    'Quantos grampos serão fixados no total?'
  ),
  (
    'Fechar caixa',
    '9.00',
    'Ato de fechar uma caixa seja com grampos, pregos ou parafusos.',
    'Quantas caixas serão fechadas?'
  ),
  (
    'Fechar caixa - Extra Grande',
    '83.00',
    'Ato de fechar uma caixa EXTRA GRANDE seja com grampos, pregos ou parafusos, inclusive instalando acessórios se for preciso.',
    'Quantas caixas serão fechadas?'
  ),
  (
    'Fixar adesivo',
    '52.00',
    'Ato de colar um adesivo PEQUENO ou MÉDIO (A5 ou menor) em uma das peças da caixa.',
    'Quantos adesivos serão fixados?'
  ),
  (
    'Fixar adesivo - Extra Grande',
    '133.00',
    'Ato de colar um adesivo GRANDE ou EXTRA GRANDE (A4 ou maior) em uma das peças da caixa.',
    'Quantos adesivos serão fixados?'
  ),
  (
    'Montar acessório - Pequeno',
    '28.00',
    'Ato de executar tudo o que envolve a montagem de um acessório PEQUENO inteiro, tal como furar, grampear, pregar, cortar e colar espuma EVA, etc.',
    'Quantos acessórios serão montados?'
  ),
  (
    'Montar acessório - Médio',
    '64.00',
    'Ato de executar tudo o que envolve a montagem de um acessório MÉDIO inteiro, tal como furar, grampear, pregar, cortar e colar espuma EVA, etc.',
    'Quantos acessórios serão montados?'
  ),
  (
    'Montar acessório - Grande',
    '1544.00',
    'Ato de executar tudo o que envolve a montagem de um acessório GRANDE inteiro, tal como furar, grampear, pregar, cortar e colar espuma EVA, etc.',
    'Quantos acessórios serão montados?'
  );

ALTER TABLE "sub_task_presets" ADD COLUMN "action_id" uuid;

UPDATE "sub_task_presets"
SET "action_id" = (
  SELECT "id" FROM "actions" WHERE "name" = 'Grampear quadro' LIMIT 1
)
WHERE "action_id" IS NULL;

ALTER TABLE "sub_task_presets"
  ALTER COLUMN "action_id" SET NOT NULL;

ALTER TABLE "sub_task_presets"
  ADD CONSTRAINT "sub_task_presets_action_id_actions_id_fk"
  FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE restrict;

ALTER TABLE "sub_task_presets" DROP COLUMN "expected_time";

DROP TABLE IF EXISTS "ribermax_box_template_settings";

CREATE TABLE "ribermax_connection_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "base_url" varchar(512) NOT NULL,
  "token" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "crm_connection_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "webhook_secret" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
