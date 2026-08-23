import { afterEach, describe, expect, it, vi } from "vitest";

const closeOpenCartsForCycle = vi.fn();
const ensureBatchesReady = vi.fn();

vi.mock("@/lib/repos/exchange-close", () => ({
  closeOpenCartsForCycle: (...args: unknown[]) =>
    closeOpenCartsForCycle(...args),
}));

vi.mock("@/lib/repos/exchange-batches", () => ({
  ensureBatchesReady: (...args: unknown[]) => ensureBatchesReady(...args),
}));

describe("GET /api/cron/close-exchange-carts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    closeOpenCartsForCycle.mockReset();
    ensureBatchesReady.mockReset();
  });

  it("rejects unauthorized requests", async () => {
    vi.stubEnv("CRON_SECRET", "secret-token");
    const { GET } = await import("@/app/api/cron/close-exchange-carts/route");
    const response = await GET(new Request("http://localhost/api/cron/x"));
    expect(response.status).toBe(401);
    expect(closeOpenCartsForCycle).not.toHaveBeenCalled();
  });

  it("closes carts when bearer secret matches", async () => {
    vi.stubEnv("CRON_SECRET", "secret-token");
    closeOpenCartsForCycle.mockResolvedValue({ closed: 2, abandoned: 1 });
    ensureBatchesReady.mockResolvedValue(undefined);

    const { GET } = await import("@/app/api/cron/close-exchange-carts/route");
    const response = await GET(
      new Request("http://localhost/api/cron/x", {
        headers: { authorization: "Bearer secret-token" },
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.closed).toBe(2);
    expect(body.abandoned).toBe(1);
    expect(closeOpenCartsForCycle).toHaveBeenCalledOnce();
    expect(ensureBatchesReady).toHaveBeenCalledOnce();
  });
});
