interface ListLoadingMessageProps {
  children: string;
}

/** Shared loading copy for list Suspense fallbacks. */
export function ListLoadingMessage({ children }: ListLoadingMessageProps) {
  return (
    <div
      className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center text-sm"
      role="status"
    >
      {children}
    </div>
  );
}
