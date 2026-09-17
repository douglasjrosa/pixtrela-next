"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SubTaskCategoryOption } from "@/lib/subtasks/category-options";

const SubTaskCategoryOptionsContext = createContext<SubTaskCategoryOption[]>(
  [],
);

export function SubTaskCategoryOptionsProvider({
  options,
  children,
}: {
  options: SubTaskCategoryOption[];
  children: ReactNode;
}) {
  return (
    <SubTaskCategoryOptionsContext.Provider value={options}>
      {children}
    </SubTaskCategoryOptionsContext.Provider>
  );
}

export function useSubTaskCategoryOptions(): SubTaskCategoryOption[] {
  return useContext(SubTaskCategoryOptionsContext);
}
