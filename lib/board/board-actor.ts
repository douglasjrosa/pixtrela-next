import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks, canMoveBoardTasks } from "@/lib/auth/permissions";
import { isAuthenticatedSession } from "@/lib/auth/session";
import { assertKioskStaffActor } from "@/lib/business/kiosk-staff-access";

/**
 * Unified board actor for both the authenticated app board and the kiosk staff
 * board. The kiosk device session is always role "kiosk"; the acting staff
 * identity comes from the URL user id instead of the session.
 */
export type BoardActor =
  | { kind: "app"; userId: string; role: Role }
  | { kind: "kiosk-staff"; staffUserId: string; staffRole: Role };

/** Resolve the board actor from the current authenticated app session. */
export async function requireAppBoardActor(): Promise<BoardActor> {
  const session = await auth();
  if (!isAuthenticatedSession(session) || !session?.user) {
    throw new Error("unauthorized");
  }
  return {
    kind: "app",
    userId: session.user.id as string,
    role: session.user.role as Role,
  };
}

/** Resolve the board actor for a kiosk staff request identified by URL id. */
export async function requireKioskStaffBoardActor(
  staffUserId: string,
): Promise<BoardActor> {
  const actor = await assertKioskStaffActor(staffUserId);
  return {
    kind: "kiosk-staff",
    staffUserId: actor.staffUserId,
    staffRole: actor.staffRole,
  };
}

function boardActorRole(actor: BoardActor): Role {
  return actor.kind === "app" ? actor.role : actor.staffRole;
}

/** Assert the actor may move/reorder board tasks (leader and above). */
export function assertBoardActorCanMove(actor: BoardActor): void {
  if (!canMoveBoardTasks(boardActorRole(actor))) {
    throw new Error("forbidden");
  }
}

/** Assert the actor may manage board subtasks (leader and above). */
export function assertBoardActorCanManageSubtasks(actor: BoardActor): void {
  if (!canManageTasks(boardActorRole(actor))) {
    throw new Error("forbidden");
  }
}
