"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { UserRow } from "./types";

type UserListContextValue = {
  openEdit: (user: UserRow) => void;
  canEdit: (user: UserRow) => boolean;
};

const UserListContext = createContext<UserListContextValue | null>(null);

export function UserListProvider({
  children,
  openEdit,
  canEdit,
}: {
  children: ReactNode;
  openEdit: (user: UserRow) => void;
  canEdit: (user: UserRow) => boolean;
}) {
  return (
    <UserListContext.Provider value={{ openEdit, canEdit }}>
      {children}
    </UserListContext.Provider>
  );
}

export function useUserList(): UserListContextValue {
  const value = useContext(UserListContext);
  if (!value) {
    throw new Error("useUserList must be used within UserListProvider");
  }
  return value;
}
