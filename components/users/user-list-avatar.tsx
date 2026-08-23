import { User } from "lucide-react";

import { ListCircleThumb } from "@/components/ui/list-circle-thumb";

export interface UserListAvatarProps {
  name: string;
  avatarUrl?: string | null;
}

/** Circular avatar thumbnail for users list rows. */
export function UserListAvatar({ name, avatarUrl }: UserListAvatarProps) {
  return (
    <ListCircleThumb
      label={name}
      imageUrl={avatarUrl}
      fallback={<User className="size-4 text-muted-foreground" aria-hidden />}
    />
  );
}
