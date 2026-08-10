interface ListEmptyMessageProps {
  children: string;
}

/** Shared empty-state copy for management list views. */
export function ListEmptyMessage({ children }: ListEmptyMessageProps) {
  return (
    <p className="text-muted-foreground py-6 text-sm" role="status">
      {children}
    </p>
  );
}
