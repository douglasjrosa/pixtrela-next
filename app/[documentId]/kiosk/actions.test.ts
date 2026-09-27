import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const cookieSet = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("@/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

import { setPersonalTotemMode } from "./actions";

describe("setPersonalTotemMode", () => {
  beforeEach(() => {
    authMock.mockReset();
    cookieSet.mockReset();
    redirectMock.mockClear();
  });

  it("locks a colaborator to their personal queue", async () => {
    authMock.mockResolvedValue({
      user: { id: "col-1", role: "colaborator" },
    });

    await expect(setPersonalTotemMode(true)).rejects.toThrow(
      "REDIRECT:/col-1/kiosk",
    );
    expect(cookieSet).toHaveBeenCalledWith(
      "pixtrela-totem-mode",
      "col-1",
      expect.objectContaining({ httpOnly: true, path: "/", sameSite: "lax" }),
    );
  });

  it("locks a leader to their personal queue", async () => {
    authMock.mockResolvedValue({
      user: { id: "lead-1", role: "leader" },
    });

    await expect(setPersonalTotemMode(true)).rejects.toThrow(
      "REDIRECT:/lead-1/kiosk",
    );
    expect(cookieSet).toHaveBeenCalledWith(
      "pixtrela-totem-mode",
      "lead-1",
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("clears the cookie and returns a colaborator home", async () => {
    authMock.mockResolvedValue({
      user: { id: "col-1", role: "colaborator" },
    });

    await expect(setPersonalTotemMode(false)).rejects.toThrow("REDIRECT:/col-1");
    expect(cookieSet).toHaveBeenCalledWith(
      "pixtrela-totem-mode",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("clears the cookie and returns a leader home", async () => {
    authMock.mockResolvedValue({
      user: { id: "lead-1", role: "leader" },
    });

    await expect(setPersonalTotemMode(false)).rejects.toThrow("REDIRECT:/");
  });

  it("rejects staff who cannot use personal totem mode", async () => {
    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });

    await expect(setPersonalTotemMode(true)).rejects.toThrow("forbidden");
    expect(cookieSet).not.toHaveBeenCalled();
  });
});
