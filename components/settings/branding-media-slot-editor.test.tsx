import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { BrandingMediaSlotEditor } from "./branding-media-slot-editor";

describe("BrandingMediaSlotEditor", () => {
  it("saves menu logo media through the picker", async () => {
    const user = userEvent.setup();
    const onSaveMedia = vi.fn().mockResolvedValue(undefined);
    const onSaveConfig = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <BrandingMediaSlotEditor
        slotKey="menu_logo"
        titleKey="menuLogoLabel"
        savedKey="menuLogoSaved"
        noneKey="menuLogoNone"
        chooseKey="menuLogoChoose"
        removeKey="menuLogoRemove"
        backgroundColorKey="menuLogoBackgroundColor"
        backgroundOpacityKey="menuLogoBackgroundOpacity"
        backgroundOpacityValueKey="menuLogoBackgroundOpacityValue"
        backgroundSavedKey="menuLogoBackgroundSaved"
        initialMediaId={null}
        initialMediaUrl={null}
        initialConfig={{}}
        supportsBackground
        supportsDisplay={false}
        onListImages={async () => []}
        onUploadImage={async () => {
          throw new Error("not used");
        }}
        onSaveMedia={onSaveMedia}
        onSaveConfig={onSaveConfig}
      />,
    );

    expect(screen.getByTestId("branding-slot-menu_logo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover" }));
    expect(onSaveMedia).not.toHaveBeenCalled();
  });
});
