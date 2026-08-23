import { UserListRowView } from "./user-list-row";
import type { UserRow } from "./types";

export interface UsersListMobileListProps {
  users: UserRow[];
  showCheckboxColumn?: boolean;
}

export async function UsersListMobileList({
  users,
  showCheckboxColumn = false,
}: UsersListMobileListProps) {
  return (
    <ul className="md:hidden">
      {users.map((user) => (
        <UserListRowView
          key={user.documentId}
          user={user}
          variant="mobile"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </ul>
  );
}
