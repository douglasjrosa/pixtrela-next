import { UserListRowView } from "./user-list-row";
import type { UserRow } from "./types";

export interface UsersListTableBodyProps {
  users: UserRow[];
  showCheckboxColumn?: boolean;
}

export async function UsersListTableBody({
  users,
  showCheckboxColumn = false,
}: UsersListTableBodyProps) {
  return (
    <tbody>
      {users.map((user) => (
        <UserListRowView
          key={user.documentId}
          user={user}
          variant="table"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </tbody>
  );
}
