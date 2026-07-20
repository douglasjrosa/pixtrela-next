"use client";

import {
  useState,
  useTransition,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RouteThemeFormInput } from "@/lib/schemas/route-theme";
import {
  BACKGROUND_MOTIONS,
  BACKGROUND_POSITIONS,
  BACKGROUND_REPEATS,
  BACKGROUND_SIZES,
  DEFAULT_BACKGROUND_COLOR_OPACITY,
  DEFAULT_BACKGROUND_MOTION,
  DEFAULT_BACKGROUND_POSITION,
  DEFAULT_BACKGROUND_REPEAT,
  DEFAULT_BACKGROUND_SIZE,
  DEFAULT_PAGE_MARGIN_DESKTOP,
  DEFAULT_PAGE_MARGIN_MOBILE,
  DEFAULT_PARALLAX_BLEED,
  DEFAULT_PARALLAX_DIRECTION,
  DEFAULT_PARALLAX_INTENSITY,
  DEFAULT_FOREGROUND_COLOR,
  DEFAULT_SURFACE_COLOR,
  DEFAULT_SURFACE_COLOR_OPACITY,
  FULLY_TRANSPARENT_OPACITY,
  hexToRgba,
  MAX_PARALLAX_BLEED,
  MAX_PARALLAX_INTENSITY,
  MIN_PARALLAX_BLEED,
  MIN_PARALLAX_INTENSITY,
  PAGE_MARGINS,
  PARALLAX_DIRECTIONS,
  type BackgroundMotion,
  type BackgroundPosition,
  type BackgroundRepeat,
  type BackgroundSize,
  type PageMargin,
  type ParallaxDirection,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";
import { cn } from "@/lib/utils";

export interface ThemeSettingsManagerProps {
  themes: RouteThemeView[];
  onSave: (documentId: string, values: RouteThemeFormInput) => Promise<void>;
  onUploadImage: (formData: FormData) => Promise<number>;
}

interface ThemeDraft {
  color: string;
  opacity: number;
  imageId: number | null;
  previewUrl: string | null;
  clearImage: boolean;
  size: BackgroundSize;
  position: BackgroundPosition;
  repeat: BackgroundRepeat;
  motion: BackgroundMotion;
  parallaxIntensity: number;
  parallaxDirection: ParallaxDirection;
  parallaxBleed: number;
  contentMarginMobile: PageMargin;
  contentMarginDesktop: PageMargin;
  foregroundColor: string;
  surfaceColor: string;
  surfaceOpacity: number;
  message: string | null;
}

function draftFromTheme(theme: RouteThemeView): ThemeDraft {
  return {
    color: theme.backgroundColor ?? "",
    opacity: theme.backgroundColorOpacity,
    imageId: null,
    previewUrl: theme.backgroundImageUrl,
    clearImage: false,
    size: theme.backgroundSize || DEFAULT_BACKGROUND_SIZE,
    position: theme.backgroundPosition || DEFAULT_BACKGROUND_POSITION,
    repeat: theme.backgroundRepeat || DEFAULT_BACKGROUND_REPEAT,
    motion: theme.backgroundMotion || DEFAULT_BACKGROUND_MOTION,
    parallaxIntensity: theme.parallaxIntensity ?? DEFAULT_PARALLAX_INTENSITY,
    parallaxDirection: theme.parallaxDirection || DEFAULT_PARALLAX_DIRECTION,
    parallaxBleed: theme.parallaxBleed ?? DEFAULT_PARALLAX_BLEED,
    contentMarginMobile:
      theme.contentMarginMobile || DEFAULT_PAGE_MARGIN_MOBILE,
    contentMarginDesktop:
      theme.contentMarginDesktop || DEFAULT_PAGE_MARGIN_DESKTOP,
    foregroundColor: theme.foregroundColor || DEFAULT_FOREGROUND_COLOR,
    surfaceColor: theme.surfaceColor || DEFAULT_SURFACE_COLOR,
    surfaceOpacity: theme.surfaceColorOpacity ?? DEFAULT_SURFACE_COLOR_OPACITY,
    message: null,
  };
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm";

const CHECKERBOARD =
  "repeating-conic-gradient(#d4d4d4 0% 25%, #fafafa 0% 50%) 50% / 10px 10px";

function ColorSwatch({
  color,
  opacity,
  transparentLabel,
}: {
  color: string;
  opacity: number;
  transparentLabel: string;
}) {
  const isTransparent =
    !color || opacity === FULLY_TRANSPARENT_OPACITY;
  const rgba = !isTransparent ? hexToRgba(color, opacity) : null;

  return (
    <span
      aria-label={isTransparent ? transparentLabel : color}
      className="inline-block h-8 w-12 shrink-0 rounded-md border border-border"
      style={{
        background: isTransparent ? CHECKERBOARD : (rgba ?? color),
      }}
    />
  );
}

function ImagePreviewRect({
  url,
  emptyLabel,
}: {
  url: string | null;
  emptyLabel: string;
}) {
  return (
    <span
      aria-label={url ? undefined : emptyLabel}
      className={cn(
        "inline-block h-10 w-16 shrink-0 overflow-hidden rounded-md border",
        "border-border bg-muted",
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : null}
    </span>
  );
}

export function ThemeSettingsManager({
  themes,
  onSave,
  onUploadImage,
}: ThemeSettingsManagerProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [committed, setCommitted] = useState<Record<string, ThemeDraft>>(() =>
    Object.fromEntries(themes.map((theme) => [theme.documentId, draftFromTheme(theme)])),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ThemeDraft | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const busy = isPending || isSaving;

  const editingTheme =
    themes.find((theme) => theme.documentId === editingId) ?? null;

  function openTheme(theme: RouteThemeView): void {
    const base = committed[theme.documentId] ?? draftFromTheme(theme);
    setEditingId(theme.documentId);
    setDraft({ ...base, message: null });
  }

  function closeModal(): void {
    if (busy) return;
    setEditingId(null);
    setDraft(null);
  }

  function patchDraft(patch: Partial<ThemeDraft>): void {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>): void {
    if (!editingId || !draft) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    patchDraft({ previewUrl: preview, message: null });
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const id = await onUploadImage(formData);
        patchDraft({
          imageId: id,
          clearImage: false,
          message: t("themesImageSelected"),
        });
      } catch {
        const theme = themes.find((entry) => entry.documentId === editingId);
        const fallback =
          committed[editingId]?.previewUrl ?? theme?.backgroundImageUrl ?? null;
        patchDraft({
          previewUrl: fallback,
          imageId: null,
          message: t("themesImageUploadFailed"),
        });
      }
    });
  }

  async function handleSave(): Promise<void> {
    if (!editingId || !draft || isSaving) return;
    const documentId = editingId;
    const values = draft;
    setIsSaving(true);
    try {
      await onSave(documentId, {
        backgroundColor: values.color,
        backgroundColorOpacity: values.opacity,
        backgroundImageId: values.imageId,
        clearBackgroundImage: values.clearImage,
        backgroundSize: values.size,
        backgroundPosition: values.position,
        backgroundRepeat: values.repeat,
        backgroundMotion: values.motion,
        parallaxIntensity: values.parallaxIntensity,
        parallaxDirection: values.parallaxDirection,
        parallaxBleed: values.parallaxBleed,
        contentMarginMobile: values.contentMarginMobile,
        contentMarginDesktop: values.contentMarginDesktop,
        foregroundColor: values.foregroundColor,
        surfaceColor: values.surfaceColor,
        surfaceColorOpacity: values.surfaceOpacity,
      });
      setCommitted((current) => ({
        ...current,
        [documentId]: {
          ...values,
          imageId: null,
          clearImage: false,
          message: null,
          previewUrl: values.clearImage ? null : values.previewUrl,
        },
      }));
      setEditingId(null);
      setDraft(null);
    } catch {
      patchDraft({ message: t("error") });
    } finally {
      setIsSaving(false);
    }
  }

  function rowInteraction(theme: RouteThemeView) {
    return {
      tabIndex: 0 as const,
      role: "button" as const,
      "aria-label": t("themesOpenRow", { name: theme.label }),
      onClick: () => openTheme(theme),
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTheme(theme);
        }
      },
    };
  }

  const showImageOptions = Boolean(draft?.previewUrl && !draft.clearImage);
  const formId = "route-theme-form";

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("themesHelp")}</p>

      {themes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("themesEmpty")}</p>
      ) : (
        <>
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium">{t("themesColumnRoute")}</th>
                <th className="py-2 pr-4 font-medium">{t("themesColumnColor")}</th>
                <th className="py-2 font-medium">{t("themesColumnImage")}</th>
              </tr>
            </thead>
            <tbody>
              {themes.map((theme) => {
                const row = committed[theme.documentId] ?? draftFromTheme(theme);
                return (
                  <tr
                    key={theme.documentId}
                    className={cn(
                      "border-b cursor-pointer hover:bg-muted/40",
                      "focus-visible:bg-muted/40 focus-visible:outline-none",
                    )}
                    {...rowInteraction(theme)}
                  >
                    <td className="py-3 pr-4">
                      <span className="font-medium">{theme.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {theme.routeKey}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <ColorSwatch
                        color={row.color}
                        opacity={row.opacity}
                        transparentLabel={t("themesTransparent")}
                      />
                    </td>
                    <td className="py-3">
                      <ImagePreviewRect
                        url={row.clearImage ? null : row.previewUrl}
                        emptyLabel={t("themesNoImage")}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <ul className="space-y-2 md:hidden">
            {themes.map((theme) => {
              const row = committed[theme.documentId] ?? draftFromTheme(theme);
              return (
                <li
                  key={theme.documentId}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border",
                      "p-3 hover:bg-muted/40",
                      "focus-visible:bg-muted/40 focus-visible:outline-none",
                    )}
                  {...rowInteraction(theme)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{theme.label}</p>
                    <p className="text-xs text-muted-foreground">{theme.routeKey}</p>
                  </div>
                  <ColorSwatch
                    color={row.color}
                    opacity={row.opacity}
                    transparentLabel={t("themesTransparent")}
                  />
                  <ImagePreviewRect
                    url={row.clearImage ? null : row.previewUrl}
                    emptyLabel={t("themesNoImage")}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}

      {editingTheme && draft ? (
        <FormModalShell
          open
          title={editingTheme.label}
          onClose={closeModal}
          disabled={busy}
          size="lg"
          fillBody={false}
          footerEnd={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={closeModal}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                form={formId}
                disabled={busy}
              >
                {tCommon("save")}
              </Button>
            </>
          }
        >
          <form
            id={formId}
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <p className="text-sm text-muted-foreground">{editingTheme.routeKey}</p>

            <div className="space-y-2">
              <Label htmlFor="theme-foreground">{t("themesForegroundColor")}</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="theme-foreground"
                  type="color"
                  className="h-12 w-16 cursor-pointer p-1"
                  value={
                    /^#([0-9A-Fa-f]{6})$/.test(draft.foregroundColor)
                      ? draft.foregroundColor
                      : DEFAULT_FOREGROUND_COLOR
                  }
                  disabled={busy}
                  onChange={(event) =>
                    patchDraft({
                      foregroundColor: event.target.value,
                      message: null,
                    })
                  }
                />
                <Input
                  value={draft.foregroundColor}
                  placeholder={DEFAULT_FOREGROUND_COLOR}
                  disabled={busy}
                  onChange={(event) =>
                    patchDraft({
                      foregroundColor: event.target.value,
                      message: null,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    patchDraft({
                      foregroundColor: DEFAULT_FOREGROUND_COLOR,
                      message: null,
                    })
                  }
                >
                  {t("themesForegroundReset")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme-surface">{t("themesSurfaceColor")}</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="theme-surface"
                  type="color"
                  className="h-12 w-16 cursor-pointer p-1"
                  value={
                    /^#([0-9A-Fa-f]{6})$/.test(draft.surfaceColor)
                      ? draft.surfaceColor
                      : DEFAULT_SURFACE_COLOR
                  }
                  disabled={
                    busy || draft.surfaceOpacity === FULLY_TRANSPARENT_OPACITY
                  }
                  onChange={(event) =>
                    patchDraft({
                      surfaceColor: event.target.value,
                      surfaceOpacity:
                        draft.surfaceOpacity === FULLY_TRANSPARENT_OPACITY
                          ? DEFAULT_SURFACE_COLOR_OPACITY
                          : draft.surfaceOpacity,
                      message: null,
                    })
                  }
                />
                <Input
                  value={
                    draft.surfaceOpacity === FULLY_TRANSPARENT_OPACITY
                      ? t("themesTransparent")
                      : draft.surfaceColor
                  }
                  placeholder={DEFAULT_SURFACE_COLOR}
                  disabled={
                    busy || draft.surfaceOpacity === FULLY_TRANSPARENT_OPACITY
                  }
                  onChange={(event) =>
                    patchDraft({
                      surfaceColor: event.target.value,
                      message: null,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    patchDraft({
                      surfaceOpacity: FULLY_TRANSPARENT_OPACITY,
                      message: null,
                    })
                  }
                >
                  {t("themesTransparent")}
                </Button>
              </div>
              <div className="space-y-1">
                <Label htmlFor="theme-surface-opacity">
                  {t("themesSurfaceOpacity")}
                </Label>
                <Input
                  id="theme-surface-opacity"
                  type="range"
                  min={0}
                  max={100}
                  value={draft.surfaceOpacity}
                  disabled={busy}
                  onChange={(event) =>
                    patchDraft({
                      surfaceOpacity: Number(event.target.value),
                      message: null,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("themesSurfaceOpacityValue", {
                    value: draft.surfaceOpacity,
                  })}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="theme-margin-mobile">
                  {t("themesMarginMobile")}
                </Label>
                <select
                  id="theme-margin-mobile"
                  className={selectClassName}
                  value={draft.contentMarginMobile}
                  disabled={busy}
                  onChange={(event) =>
                    patchDraft({
                      contentMarginMobile: event.target.value as PageMargin,
                      message: null,
                    })
                  }
                >
                  {PAGE_MARGINS.map((value) => (
                    <option key={value} value={value}>
                      {t(`themesMargin.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme-margin-desktop">
                  {t("themesMarginDesktop")}
                </Label>
                <select
                  id="theme-margin-desktop"
                  className={selectClassName}
                  value={draft.contentMarginDesktop}
                  disabled={busy}
                  onChange={(event) =>
                    patchDraft({
                      contentMarginDesktop: event.target.value as PageMargin,
                      message: null,
                    })
                  }
                >
                  {PAGE_MARGINS.map((value) => (
                    <option key={value} value={value}>
                      {t(`themesMargin.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="theme-color">{t("themesBackgroundColor")}</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="theme-color"
                    type="color"
                    className="h-12 w-16 cursor-pointer p-1"
                    value={
                      /^#([0-9A-Fa-f]{6})$/.test(draft.color)
                        ? draft.color
                        : "#ffffff"
                    }
                    disabled={
                      busy || draft.opacity === FULLY_TRANSPARENT_OPACITY
                    }
                    onChange={(event) =>
                      patchDraft({
                        color: event.target.value,
                        opacity:
                          draft.opacity === FULLY_TRANSPARENT_OPACITY
                            ? DEFAULT_BACKGROUND_COLOR_OPACITY
                            : draft.opacity,
                        message: null,
                      })
                    }
                  />
                  <Input
                    value={
                      draft.opacity === FULLY_TRANSPARENT_OPACITY
                        ? t("themesTransparent")
                        : draft.color
                    }
                    placeholder="#F4F1EA"
                    disabled={
                      busy || draft.opacity === FULLY_TRANSPARENT_OPACITY
                    }
                    onChange={(event) =>
                      patchDraft({ color: event.target.value, message: null })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      patchDraft({
                        opacity: FULLY_TRANSPARENT_OPACITY,
                        message: null,
                      })
                    }
                  >
                    {t("themesTransparent")}
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="theme-opacity">{t("themesColorOpacity")}</Label>
                  <Input
                    id="theme-opacity"
                    type="range"
                    min={0}
                    max={100}
                    value={draft.opacity}
                    disabled={busy}
                    onChange={(event) =>
                      patchDraft({
                        opacity: Number(event.target.value),
                        message: null,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("themesColorOpacityValue", { value: draft.opacity })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme-image">{t("themesBackgroundImage")}</Label>
                <Input
                  id="theme-image"
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={handleImageChange}
                />
                {showImageOptions ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.previewUrl ?? ""}
                    alt=""
                    className="mt-2 h-24 w-full rounded-xl object-cover"
                  />
                ) : null}
                {showImageOptions ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      patchDraft({
                        clearImage: true,
                        previewUrl: null,
                        imageId: null,
                        message: null,
                      })
                    }
                  >
                    {t("themesClearImage")}
                  </Button>
                ) : null}
              </div>
            </div>

            {showImageOptions ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-size">{t("themesImageSize")}</Label>
                  <select
                    id="theme-size"
                    className={selectClassName}
                    value={draft.size}
                    disabled={busy}
                    onChange={(event) =>
                      patchDraft({
                        size: event.target.value as BackgroundSize,
                        message: null,
                      })
                    }
                  >
                    {BACKGROUND_SIZES.map((value) => (
                      <option key={value} value={value}>
                        {t(`themesSize.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-position">
                    {t("themesImagePosition")}
                  </Label>
                  <select
                    id="theme-position"
                    className={selectClassName}
                    value={draft.position}
                    disabled={busy}
                    onChange={(event) =>
                      patchDraft({
                        position: event.target.value as BackgroundPosition,
                        message: null,
                      })
                    }
                  >
                    {BACKGROUND_POSITIONS.map((value) => (
                      <option key={value} value={value}>
                        {t(`themesPosition.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-repeat">{t("themesImageRepeat")}</Label>
                  <select
                    id="theme-repeat"
                    className={selectClassName}
                    value={draft.repeat}
                    disabled={busy}
                    onChange={(event) =>
                      patchDraft({
                        repeat: event.target.value as BackgroundRepeat,
                        message: null,
                      })
                    }
                  >
                    {BACKGROUND_REPEATS.map((value) => (
                      <option key={value} value={value}>
                        {t(`themesRepeat.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-motion">{t("themesImageMotion")}</Label>
                  <select
                    id="theme-motion"
                    className={selectClassName}
                    value={draft.motion}
                    disabled={busy}
                    onChange={(event) =>
                      patchDraft({
                        motion: event.target.value as BackgroundMotion,
                        message: null,
                      })
                    }
                  >
                    {BACKGROUND_MOTIONS.map((value) => (
                      <option key={value} value={value}>
                        {t(`themesMotion.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {showImageOptions && draft.motion === "parallax" ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="theme-parallax-intensity">
                    {t("themesParallaxIntensity")}
                  </Label>
                  <Input
                    id="theme-parallax-intensity"
                    type="range"
                    min={MIN_PARALLAX_INTENSITY}
                    max={MAX_PARALLAX_INTENSITY}
                    value={draft.parallaxIntensity}
                    disabled={busy}
                    onChange={(event) =>
                      patchDraft({
                        parallaxIntensity: Number(event.target.value),
                        message: null,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("themesParallaxIntensityValue", {
                      value: draft.parallaxIntensity,
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-parallax-direction">
                    {t("themesParallaxDirection")}
                  </Label>
                  <select
                    id="theme-parallax-direction"
                    className={selectClassName}
                    value={draft.parallaxDirection}
                    disabled={busy}
                    onChange={(event) =>
                      patchDraft({
                        parallaxDirection: event.target
                          .value as ParallaxDirection,
                        message: null,
                      })
                    }
                  >
                    {PARALLAX_DIRECTIONS.map((value) => (
                      <option key={value} value={value}>
                        {t(`themesParallaxDirectionOption.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-parallax-bleed">
                    {t("themesParallaxBleed")}
                  </Label>
                  <Input
                    id="theme-parallax-bleed"
                    type="range"
                    min={MIN_PARALLAX_BLEED}
                    max={MAX_PARALLAX_BLEED}
                    value={draft.parallaxBleed}
                    disabled={busy}
                    onChange={(event) =>
                      patchDraft({
                        parallaxBleed: Number(event.target.value),
                        message: null,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("themesParallaxBleedValue", {
                      value: draft.parallaxBleed,
                    })}
                  </p>
                </div>
              </div>
            ) : null}

            {draft.message ? (
              <p role="status" className="text-sm text-muted-foreground">
                {draft.message}
              </p>
            ) : null}
          </form>
        </FormModalShell>
      ) : null}
    </div>
  );
}
