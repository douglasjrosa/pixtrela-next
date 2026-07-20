import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const revalidateStrapiTags = vi.fn();
const loadCurrencyForSubtasks = vi.fn();
const strapiUpload = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: {
    currencies: "strapi:currencies",
    currencyForSubtasks: "strapi:currency-for-subtasks",
  },
  strapiFetch,
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags,
}));

vi.mock("@/lib/strapi/upload", () => ({
  strapiUpload: (...args: unknown[]) => strapiUpload(...args),
}));

vi.mock("@/lib/strapi/currency-for-subtasks", () => ({
  CURRENCY_FOR_SUBTASKS_API_PATH: "/currency-for-subtasks",
  loadCurrencyForSubtasks: (...args: unknown[]) =>
    loadCurrencyForSubtasks(...args),
  toCurrencyForSubtasksPayload: (values: { currencyDocumentId: string }) => ({
    currency: values.currencyDocumentId || null,
  }),
}));

describe("settings/currency/actions", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
    revalidateStrapiTags.mockReset();
    loadCurrencyForSubtasks.mockReset();
    strapiUpload.mockReset();
    vi.resetModules();
  });

  it("createCurrency POSTs currency payload with iconMedia id", async () => {
    strapiFetch.mockResolvedValue({ data: { documentId: "cur-1" } });
    const { createCurrency } = await import("./actions");

    await createCurrency({
      name: "star",
      title: "Estrela",
      pluralTitle: "Estrelas",
      iconMediaId: 42,
      currencyPerSecond: 2,
    });

    expect(strapiFetch).toHaveBeenCalledWith(
      "/currencies",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          data: {
            name: "star",
            title: "Estrela",
            pluralTitle: "Estrelas",
            currencyPerSecond: 2,
            iconMedia: 42,
          },
        }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:currencies");
  });

  it("uploadCurrencyIcon uploads the file and returns media id", async () => {
    strapiUpload.mockResolvedValue(7);
    const { uploadCurrencyIcon } = await import("./actions");
    const formData = new FormData();
    formData.append(
      "file",
      new File(["x"], "star.png", { type: "image/png" }),
    );

    await expect(uploadCurrencyIcon(formData)).resolves.toBe(7);
    expect(strapiUpload).toHaveBeenCalled();
  });

  it("deleteCurrency clears active currency when needed", async () => {
    loadCurrencyForSubtasks.mockResolvedValue({
      currencyDocumentId: "cur-star",
      currencyName: "star",
      currencyTitle: "Estrela",
      currencyPluralTitle: "Estrelas",
      currencyIconUrl: "https://cdn.example/star.png",
      currencyPerSecond: 2,
    });
    strapiFetch.mockResolvedValue({});
    const { deleteCurrency } = await import("./actions");

    await deleteCurrency("cur-star");

    expect(strapiFetch).toHaveBeenCalledWith(
      "/currency-for-subtasks",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ data: { currency: null } }),
      }),
    );
    expect(strapiFetch).toHaveBeenCalledWith(
      "/currencies/cur-star",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
