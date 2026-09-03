"use client";

import { useEffect, useRef } from "react";

import { KioskQueueSkeletonList } from "./kiosk-queue-card-skeleton";

const SKELETON_COUNT = 3;

export function KioskQueueLoadMoreSentinel({
  hasMore,
  loading,
  disabled,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  disabled?: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loading || disabled) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "120px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, hasMore, loading, onLoadMore]);

  if (!hasMore && !loading) return null;

  return (
    <div ref={sentinelRef} className="pt-2">
      {loading ? <KioskQueueSkeletonList count={SKELETON_COUNT} /> : null}
    </div>
  );
}
