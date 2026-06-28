import { STRAPI_TAGS } from "./tags";

/** Tags + route paths that list pages must invalidate after mutations. */
export const LIST_CACHE_CONTRACT = {
  templateTasks: {
    tags: [STRAPI_TAGS.templateTasks],
    paths: ["/templates"],
  },
  tasks: {
    tags: [STRAPI_TAGS.tasks, STRAPI_TAGS.subTasks],
    paths: ["/tasks"],
  },
  board: {
    tags: [STRAPI_TAGS.tasks, STRAPI_TAGS.steps],
    paths: ["/board"],
  },
} as const;
