import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";

import { successSentence } from "@/lib/logs/audit-sentence";
import { formatBugDetail, isSkippableLogError } from "@/lib/logs/log-error";
import {
  persistLog,
  runScheduledLog,
  type LogStore,
} from "@/lib/logs/persist-log";

type MemoryRow = {
  id: string;
  userId: string | null;
  route: string;
  description: string;
  detail: string | null;
  count: number;
  createdAt: Date;
};

function memoryStore(): LogStore & { rows: MemoryRow[] } {
  const rows: MemoryRow[] = [];
  return {
    rows,
    async findRecent(input) {
      const match = [...rows].reverse().find((row) => {
        if (row.route !== input.route || row.createdAt < input.since) {
          return false;
        }
        return (
          row.detail === input.dedupeKey ||
          (row.detail?.startsWith(`${input.dedupeKey}|`) ?? false)
        );
      });
      if (!match) return null;
      return {
        id: match.id,
        count: match.count,
        description: match.description,
      };
    },
    async insert(row) {
      rows.push({
        ...row,
        id: `log-${rows.length + 1}`,
        createdAt: new Date(),
      });
    },
    async increment(id, count, description) {
      const row = rows.find((item) => item.id === id);
      if (!row) return;
      row.count = count;
      row.description = description;
    },
  };
}

describe("persistLog", () => {
  it("does not surface an insert failure from the scheduled runner", async () => {
    const store: LogStore = {
      async findRecent() {
        return null;
      },
      async insert() {
        throw new Error("db down");
      },
      async increment() {
        return undefined;
      },
    };
    await expect(
      runScheduledLog(
        {
          userId: "user-1",
          route: "/tasks",
          detail: null,
          dedupe: false,
          refreshDescription: false,
          describe: () => "Criou a tarefa Pedido.",
        },
        store,
      ),
    ).resolves.toBeUndefined();
  });

  it("increments a repeated bug without rewriting the description", async () => {
    const store = memoryStore();
    const input = {
      userId: null,
      route: "/board",
      detail: "moveTask|TypeError|taskId=abc",
      dedupe: true,
      dedupeKey: "moveTask|TypeError",
      refreshDescription: false,
      describe: () => "Erro inesperado em moveTask.",
    };
    await persistLog(input, store);
    await persistLog(input, store);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]?.count).toBe(2);
    expect(store.rows[0]?.description).toBe("Erro inesperado em moveTask.");
  });

  it("refreshes a deduped success description with the new count", async () => {
    const store = memoryStore();
    const input = {
      userId: null,
      route: "/api/tasks",
      detail: "crm|tasks",
      dedupe: true,
      dedupeKey: "crm|tasks",
      refreshDescription: true,
      describe: (count: number) => `CRM criou ou atualizou ${count} tarefas.`,
    };
    await persistLog(input, store);
    await persistLog(input, store);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]?.count).toBe(2);
    expect(store.rows[0]?.description).toBe(
      "CRM criou ou atualizou 2 tarefas.",
    );
  });
});

describe("bug detail", () => {
  it("omits passwords and stacks", () => {
    const secret = "super-secret-value";
    const detail = formatBugDetail("saveUser", "TypeError", {
      userId: "user-1",
      password: secret,
      token: "abc",
    });
    expect(detail).toBe("saveUser|TypeError|userId=user-1");
    expect(detail).not.toContain(secret);
    expect(detail).not.toContain("at ");
  });

  it("skips validation, forbidden, and notFound", () => {
    expect(isSkippableLogError(new Error("forbidden"))).toBe(true);
    expect(isSkippableLogError(new Error("notFound"))).toBe(true);
    expect(isSkippableLogError(new ZodError([]))).toBe(true);
    expect(isSkippableLogError(new Error("Cannot read properties of null"))).toBe(
      false,
    );
    expect(() => z.string().parse(1)).toThrow(ZodError);
  });
});

describe("success sentences", () => {
  it("writes one bulk line that includes the quantity", () => {
    expect(
      successSentence({
        verb: "bulkArchived",
        entity: "tasks",
        quantity: 4,
      }),
    ).toBe("Arquivou 4 tarefas.");
  });
});
