import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMailMock = vi.fn();

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: (...args: unknown[]) => sendMailMock(...args),
    })),
  },
}));

describe("sendMail", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMailMock.mockReset();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.FROM_EMAIL;
  });

  it("skips delivery when SMTP is not configured", async () => {
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const { sendMail } = await import("./send-mail");
    await sendMail({
      to: "ana@example.com",
      subject: "Test",
      text: "Hello",
    });

    expect(sendMailMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("sends mail when SMTP env vars are set", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_USER = "smtp-user";
    process.env.SMTP_PASS = "smtp-pass";
    process.env.FROM_EMAIL = "noreply@example.com";

    const { sendMail } = await import("./send-mail");
    await sendMail({
      to: "ana@example.com",
      subject: "Reset",
      text: "Reset link",
      html: "<p>Reset link</p>",
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "ana@example.com",
      subject: "Reset",
      text: "Reset link",
      html: "<p>Reset link</p>",
    });
  });
});
