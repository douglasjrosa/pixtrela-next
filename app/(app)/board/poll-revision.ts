"use server";

import type { BoardRevision } from "@/lib/board/board-revision";
import { getBoardRevision } from "@/lib/repos/board-revision";

export async function pollBoardRevision(): Promise<BoardRevision> {
  return getBoardRevision();
}
