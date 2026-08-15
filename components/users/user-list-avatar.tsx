import { User } from "lucide-react";

import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

export interface UserListAvatarProps {
  name: string;
  avatarUrl?: string | null;
}

/** Circular avatar thumbnail for users list rows. */
export function UserListAvatar({ name, avatarUrl }: UserListAvatarProps) {
  const url = toBrowserMediaUrl(avatarUrl ?? null);

  return (
    <span
      className={
        "flex size-9 shrink-0 items-center justify-center overflow-hidden " +
        "rounded-full border bg-muted"
      }
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <User className="size-4 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}
