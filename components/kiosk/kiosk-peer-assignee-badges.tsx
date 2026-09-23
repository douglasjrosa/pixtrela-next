import { CardBadge } from "@/components/ui/card";
import type { KioskPeerAssignee } from "@/lib/business/kiosk-peer-assignees";
import { cn } from "@/lib/utils";

export interface KioskPeerAssigneeBadgesProps {
  peers: readonly KioskPeerAssignee[];
  className?: string;
}

export function KioskPeerAssigneeBadges({
  peers,
  className,
}: KioskPeerAssigneeBadgesProps) {
  if (peers.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {peers.map((peer) => (
        <CardBadge
          key={peer.colaboratorId}
          className={cn(
            "max-w-full truncate text-xs font-medium",
            peer.isActive
              ? "border-success/30 bg-success text-success-foreground"
              : "border-muted bg-muted text-muted-foreground",
          )}
        >
          {peer.name}
        </CardBadge>
      ))}
    </div>
  );
}
