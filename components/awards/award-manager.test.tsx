import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { AwardManager } from "./award-manager";

const currencies = [
  { documentId: "c1", name: "star", title: "Estrela" },
];

const awards = [
  {
    documentId: "a1",
    name: "Arroz",
    values: [{ numberOf: 50, currencyDocumentId: "c1" }],
  },
];

const noopUpload = vi.fn().mockResolvedValue(1);

describe("AwardManager", () => {
  it("renders award list with values", () => {
    renderWithIntl(
      <AwardManager
        awards={awards}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );
    expect(screen.getByText("Arroz")).toBeInTheDocument();
    expect(screen.getByText("50 Estrela")).toBeInTheDocument();
  });

  it("shows values form fields and currency select", () => {
    renderWithIntl(
      <AwardManager
        awards={[]}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );
    expect(screen.getByText("Valores")).toBeInTheDocument();
    expect(screen.getByLabelText("Moeda")).toBeInTheDocument();
  });

  it("shows warnings and image fields aligned with Strapi schema", () => {
    renderWithIntl(
      <AwardManager
        awards={[]}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );
    expect(screen.getByLabelText("Avisos")).toBeInTheDocument();
    expect(screen.getByLabelText("Imagem")).toBeInTheDocument();
  });

  it("shows new award form title", () => {
    renderWithIntl(
      <AwardManager
        awards={[]}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );
    expect(screen.getByRole("heading", { name: "Novo prêmio" })).toBeInTheDocument();
  });
});
