import { z } from "zod";

import { factoryActionListSortSchema } from "./factory-action-list-sort";

export const FACTORY_ACTION_LIST_PAGE_SIZE = 10;

export const factoryActionListFiltersSchema = factoryActionListSortSchema;

export type FactoryActionListFilters = z.infer<
  typeof factoryActionListFiltersSchema
>;
