import {
  listActivitySessions,
  type ActivitySession,
  type ActivitySessionRef,
  type SharingType,
} from "@/lib/business/task-progress";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

interface StrapiList<T> {
  data: T[];
}

interface ActivityEntity {
  action: "started" | "stoped";
  timestamp?: string | null;
  qty?: number | null;
  subTask?: { documentId?: string } | null;
  colaborator?: { documentId?: string; name?: string | null } | null;
}

const ACTIVITY_PAGE_SIZE = 500;

function toSessionRefs(
  subTaskDocumentId: string,
  activities: ActivityEntity[],
): ActivitySessionRef[] {
  return activities.flatMap((activity) => {
    const colaboratorDocumentId = activity.colaborator?.documentId;
    const timestamp = activity.timestamp;
    if (!colaboratorDocumentId || !timestamp) return [];
    return [
      {
        subTaskDocumentId,
        colaboratorDocumentId,
        colaboratorName: activity.colaborator?.name ?? "",
        action: activity.action,
        timestamp,
        qty: Number(activity.qty ?? 0),
      },
    ];
  });
}

export async function loadSubTaskSessions(
  subTaskDocumentId: string,
): Promise<ActivitySession[]> {
  const res = await strapiFetch<StrapiList<ActivityEntity>>(
    "/activities",
    {
      strapiCache: {
        tags: [STRAPI_TAGS.activities, STRAPI_TAGS.subTasks],
        revalidate: 30,
      },
    },
    {
      fields: ["action", "timestamp", "qty"],
      filters: {
        subTask: { documentId: { $eq: subTaskDocumentId } },
        action: { $in: ["started", "stoped"] },
      },
      populate: {
        subTask: { fields: ["documentId"] },
        colaborator: { fields: ["documentId", "name"] },
      },
      sort: "timestamp:asc",
      pagination: { pageSize: ACTIVITY_PAGE_SIZE },
    },
  );

  return listActivitySessions(toSessionRefs(subTaskDocumentId, res.data));
}

export type { ActivitySession, SharingType };
