import { UserListRowView } from "./user-list-row";
import type { UserRow } from "./types";

export interface UsersListMobileListProps {
  users: UserRow[];
}

export async function UsersListMobileList({ users }: UsersListMobileListProps) {
  return (
    <ul className="md:hidden">
      {users.map((user) => (
        <UserListRowView
          key={user.documentId}
          user={user}
          variant="mobile"
        />
      ))}
    </ul>
  );
}
