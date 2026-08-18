"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Pencil, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { SettingsSectionHeading } from "@/components/settings/settings-section-heading";
import { AddNewButton } from "@/components/ui/add-new-button";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LoadMoreButton,
  LoadMoreButtonRow,
} from "@/components/ui/load-more-button";
import { Textarea } from "@/components/ui/textarea";
import { isImageMime } from "@/lib/media/media-mime";
import type {
  MediaAssetMetadataInput,
  MediaAssetRecord,
  MediaCategory,
  MediaMimeFilter,
  MediaReferenceSummary,
} from "@/lib/repos/media";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import {
  MEDIA_THUMBNAIL_FRAME_CLASS,
  MEDIA_THUMBNAIL_IMAGE_CLASS,
} from "@/lib/media/media-thumbnail-styles";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

const LIBRARY_CATEGORY_OPTIONS: MediaCategory[] = [
  "other",
  "award",
  "currency",
  "branding",
  "route_theme",
  "avatar",
  "document",
];

export interface MediaFilesManagerProps {
  initialItems: MediaAssetRecord[];
  initialTotal: number;
  onList: (input: {
    q?: string;
    mimeFilter?: MediaMimeFilter;
    category?: MediaCategory;
    page?: number;
    pageSize?: number;
  }) => Promise<{ items: MediaAssetRecord[]; total: number }>;
  onUpload: (formData: FormData) => Promise<MediaAssetRecord>;
  onReplace: (mediaId: string, formData: FormData) => Promise<MediaAssetRecord>;
  onUpdateMetadata: (
    mediaId: string,
    input: MediaAssetMetadataInput,
  ) => Promise<MediaAssetRecord>;
  onDelete: (
    mediaId: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; reason: string; refs: MediaReferenceSummary[] }
  >;
}

const BRANDING_REF_LABEL_KEYS: Record<
  string,
  | "mediaRefBrandingLabels.menuLogo"
  | "mediaRefBrandingLabels.rankingFirst"
  | "mediaRefBrandingLabels.rankingSecond"
  | "mediaRefBrandingLabels.rankingThird"
> = {
  menuLogo: "mediaRefBrandingLabels.menuLogo",
  rankingFirst: "mediaRefBrandingLabels.rankingFirst",
  rankingSecond: "mediaRefBrandingLabels.rankingSecond",
  rankingThird: "mediaRefBrandingLabels.rankingThird",
};

function formatMediaReferenceLabel(
  ref: MediaReferenceSummary,
  t: ReturnType<typeof useTranslations<"settings">>,
): string {
  if (ref.sectionKey === "preferences") {
    const brandingKey = BRANDING_REF_LABEL_KEYS[ref.label];
    if (brandingKey) {
      return t(brandingKey);
    }
  }
  return ref.label;
}

function formatMediaInUseMessage(
  refs: MediaReferenceSummary[],
  t: ReturnType<typeof useTranslations<"settings">>,
): string {
  if (refs.length === 0) {
    return t("mediaInUse");
  }
  const entries = refs.map((ref) =>
    t("mediaRefEntry", {
      label: formatMediaReferenceLabel(ref, t),
      section: t(`mediaRefSections.${ref.sectionKey}`),
    }),
  );
  return t("mediaInUseWithRefs", { refs: entries.join(", ") });
}

function formatBytes(size: number | null): string {
  if (size == null || size <= 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function assetLabel(item: MediaAssetRecord): string {
  return (
    item.displayName?.trim() ||
    item.originalFilename?.trim() ||
    item.storageKey
  );
}

export function MediaFilesManager({
  initialItems,
  initialTotal,
  onList,
  onUpload,
  onReplace,
  onUpdateMetadata,
  onDelete,
}: MediaFilesManagerProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [mimeFilter, setMimeFilter] = useState<MediaMimeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<MediaCategory | "all">(
    "all",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaAssetRecord | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<MediaCategory>("other");
  const [isPending, startTransition] = useTransition();

  const hasMore = items.length < total;

  function refreshFromStart(
    nextQ = q,
    nextMime = mimeFilter,
    nextCategory = categoryFilter,
  ): void {
    startTransition(async () => {
      setMessage(null);
      const result = await onList({
        q: nextQ || undefined,
        mimeFilter: nextMime,
        category: nextCategory === "all" ? undefined : nextCategory,
        page: 1,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
      setPage(1);
    });
  }

  function handleUploadClick(): void {
    fileInputRef.current?.click();
  }

  function handleFileSelected(fileList: FileList | null): void {
    const file = fileList?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    if (categoryFilter !== "all") {
      formData.set("category", categoryFilter);
    }
    startTransition(async () => {
      setMessage(null);
      try {
        await onUpload(formData);
        refreshFromStart();
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        setMessage(
          code === "unsupportedType"
            ? t("mediaUnsupportedType")
            : tCommon("errorGeneric"),
        );
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleReplaceSelected(fileList: FileList | null): void {
    const file = fileList?.[0];
    const mediaId = replaceId;
    if (!file || !mediaId) return;
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      setMessage(null);
      try {
        const updated = await onReplace(mediaId, formData);
        setItems((current) =>
          current.map((item) => (item.id === mediaId ? updated : item)),
        );
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        setMessage(
          code === "unsupportedType"
            ? t("mediaUnsupportedType")
            : tCommon("errorGeneric"),
        );
      } finally {
        setReplaceId(null);
      }
    });
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  }

  function openEdit(item: MediaAssetRecord): void {
    setEditing(item);
    setEditDisplayName(item.displayName ?? "");
    setEditDescription(item.description ?? "");
    setEditAltText(item.altText ?? "");
    setEditTitle(item.title ?? "");
    setEditCategory(item.category === "face" ? "other" : item.category);
  }

  function handleSaveMetadata(): void {
    const mediaId = editing?.id;
    if (!mediaId) return;
    startTransition(async () => {
      setMessage(null);
      try {
        const updated = await onUpdateMetadata(mediaId, {
          displayName: editDisplayName.trim() || null,
          description: editDescription.trim() || null,
          altText: editAltText.trim() || null,
          title: editTitle.trim() || null,
          category: editCategory,
        });
        setItems((current) =>
          current.map((item) => (item.id === mediaId ? updated : item)),
        );
        setEditing(null);
        showSuccessToast(t("mediaMetadataSaved"));
      } catch {
        const detail = tCommon("errorGeneric");
        setMessage(detail);
        showErrorToast(detail);
      }
    });
  }

  function handleDeleteConfirm(): void {
    const mediaId = deleteId;
    if (!mediaId) return;
    startTransition(async () => {
      setMessage(null);
      try {
        const result = await onDelete(mediaId);
        if (!result.ok) {
          const detail =
            result.reason === "inUse"
              ? formatMediaInUseMessage(result.refs, t)
              : t("mediaInUse");
          setMessage(detail);
          showErrorToast(detail);
          return;
        }
        setItems((current) => current.filter((item) => item.id !== mediaId));
        setTotal((current) => Math.max(0, current - 1));
        setDeleteId(null);
        showSuccessToast(t("mediaDeleted"));
      } catch {
        const detail = tCommon("errorGeneric");
        setMessage(detail);
        showErrorToast(detail);
      }
    });
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      const result = await onList({
        q: q || undefined,
        mimeFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setItems((current) => [...current, ...result.items]);
      setTotal(result.total);
      setPage(nextPage);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <SettingsSectionHeading title={t("mediaFilesTitle")} />
          <p className="text-sm text-muted-foreground">{t("mediaFilesHelp")}</p>
        </div>
        <AddNewButton label={t("mediaUpload")} onClick={handleUploadClick} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => handleFileSelected(event.target.files)}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => handleReplaceSelected(event.target.files)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") refreshFromStart();
          }}
          placeholder={t("mediaSearchPlaceholder")}
          className="max-w-xs"
          disabled={isPending}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => refreshFromStart()}
        >
          {tCommon("search")}
        </Button>
        {(
          [
            ["all", "mediaFilterAll"],
            ["image", "mediaFilterImages"],
            ["pdf", "mediaFilterPdf"],
          ] as const
        ).map(([value, labelKey]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={mimeFilter === value ? "default" : "outline"}
            disabled={isPending}
            onClick={() => {
              setMimeFilter(value);
              refreshFromStart(q, value, categoryFilter);
            }}
          >
            {t(labelKey)}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={categoryFilter === "all" ? "default" : "outline"}
          disabled={isPending}
          onClick={() => {
            setCategoryFilter("all");
            refreshFromStart(q, mimeFilter, "all");
          }}
        >
          {t("mediaCategories.all")}
        </Button>
        {LIBRARY_CATEGORY_OPTIONS.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={categoryFilter === value ? "default" : "outline"}
            disabled={isPending}
            onClick={() => {
              setCategoryFilter(value);
              refreshFromStart(q, mimeFilter, value);
            }}
          >
            {t(`mediaCategories.${value}`)}
          </Button>
        ))}
      </div>

      {message ? (
        <p role="status" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("mediaFilesEmpty")}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item) => {
            const title = assetLabel(item);
            const image = isImageMime(item.mimeType) && item.browserUrl;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-lg border bg-card",
                )}
              >
                <div className={MEDIA_THUMBNAIL_FRAME_CLASS}>
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.browserUrl!}
                      alt={item.altText?.trim() || title}
                      title={item.title?.trim() || undefined}
                      className={MEDIA_THUMBNAIL_IMAGE_CLASS}
                    />
                  ) : (
                    <FileText
                      className="size-10 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="space-y-2 p-2">
                  <p className="truncate text-xs font-medium" title={title}>
                    {title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t(`mediaCategories.${item.category}`)} ·{" "}
                    {item.mimeType ?? "—"} · {formatBytes(item.byteSize)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      disabled={isPending}
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      <span className="sr-only">{t("mediaEdit")}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      disabled={isPending}
                      onClick={() => {
                        setReplaceId(item.id);
                        replaceInputRef.current?.click();
                      }}
                    >
                      <Upload className="size-3.5" aria-hidden />
                      <span className="sr-only">{t("mediaReplace")}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      disabled={isPending}
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      <span className="sr-only">{t("mediaDelete")}</span>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore ? (
        <LoadMoreButtonRow>
          <LoadMoreButton
            label={t("mediaLoadMore")}
            loadingLabel={tCommon("loading")}
            loading={isPending}
            disabled={isPending}
            onClick={handleLoadMore}
          />
        </LoadMoreButtonRow>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t("mediaDelete")}
        description={t("mediaDeleteConfirm")}
        disabled={isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteId(null)}
      />

      <FormModalShell
        open={Boolean(editing)}
        title={t("mediaEditTitle")}
        onClose={() => setEditing(null)}
        size="md"
        fillBody={false}
        disabled={isPending}
        footerStart={
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setEditing(null)}
          >
            {tCommon("cancel")}
          </Button>
        }
        footerEnd={
          <Button
            type="button"
            disabled={isPending}
            onClick={handleSaveMetadata}
          >
            {tCommon("save")}
          </Button>
        }
      >
        <div className="space-y-3 p-1">
          <div className="space-y-1.5">
            <Label htmlFor="media-display-name">{t("mediaDisplayName")}</Label>
            <Input
              id="media-display-name"
              value={editDisplayName}
              onChange={(event) => setEditDisplayName(event.target.value)}
              spellCheck={false}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-description">{t("mediaDescription")}</Label>
            <Textarea
              id="media-description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-alt">{t("mediaAltText")}</Label>
            <Input
              id="media-alt"
              value={editAltText}
              onChange={(event) => setEditAltText(event.target.value)}
              spellCheck={false}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-title">{t("mediaTitleAttr")}</Label>
            <Input
              id="media-title"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              spellCheck={false}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-category">{t("mediaCategory")}</Label>
            <select
              id="media-category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editCategory}
              disabled={isPending}
              onChange={(event) =>
                setEditCategory(event.target.value as MediaCategory)
              }
            >
              {LIBRARY_CATEGORY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`mediaCategories.${value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormModalShell>
    </div>
  );
}
