"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { SettingsSectionHeading } from "@/components/settings/settings-section-heading";
import { AddNewButton } from "@/components/ui/add-new-button";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  LoadMoreButton,
  LoadMoreButtonRow,
} from "@/components/ui/load-more-button";
import { isImageMime } from "@/lib/media/media-mime";
import type { MediaAssetRecord, MediaMimeFilter } from "@/lib/repos/media";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

export interface MediaFilesManagerProps {
  initialItems: MediaAssetRecord[];
  initialTotal: number;
  onList: (input: {
    q?: string;
    mimeFilter?: MediaMimeFilter;
    page?: number;
    pageSize?: number;
  }) => Promise<{ items: MediaAssetRecord[]; total: number }>;
  onUpload: (formData: FormData) => Promise<MediaAssetRecord>;
  onReplace: (mediaId: string, formData: FormData) => Promise<MediaAssetRecord>;
  onDelete: (
    mediaId: string,
  ) => Promise<{ ok: true } | { ok: false; reason: string; refs: string[] }>;
}

function formatBytes(size: number | null): string {
  if (size == null || size <= 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaFilesManager({
  initialItems,
  initialTotal,
  onList,
  onUpload,
  onReplace,
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
  const [message, setMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasMore = items.length < total;

  function refreshFromStart(nextQ = q, nextFilter = mimeFilter): void {
    startTransition(async () => {
      setMessage(null);
      const result = await onList({
        q: nextQ || undefined,
        mimeFilter: nextFilter,
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

  function handleDeleteConfirm(): void {
    const mediaId = deleteId;
    if (!mediaId) return;
    startTransition(async () => {
      setMessage(null);
      try {
        const result = await onDelete(mediaId);
        if (!result.ok) {
          const detail =
            result.reason === "inUse" && result.refs.length > 0
              ? t("mediaInUseWithRefs", { refs: result.refs.join(", ") })
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
              refreshFromStart(q, value);
            }}
          >
            {t(labelKey)}
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
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => {
            const title =
              item.originalFilename?.trim() || item.storageKey;
            const image = isImageMime(item.mimeType) && item.browserUrl;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-lg border bg-card",
                )}
              >
                <div className="flex aspect-square items-center justify-center bg-muted">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.browserUrl!}
                      alt={title}
                      className="size-full object-cover"
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
                    {item.mimeType ?? "—"} · {formatBytes(item.byteSize)}
                  </p>
                  <div className="flex flex-wrap gap-1">
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
    </div>
  );
}
