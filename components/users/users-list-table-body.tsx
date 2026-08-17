import { UserListRowView } from "./user-list-row";
import type { UserRow } from "./types";

export interface UsersListTableBodyProps {
  users: UserRow[];
}

export async function UsersListTableBody({ users }: UsersListTableBodyProps) {
  return (
    <tbody>
      {users.map((user) => (
        <UserListRowView
          key={user.documentId}
          user={user}
          variant="table"
        />
      ))}
    </tbody>
  );
}
