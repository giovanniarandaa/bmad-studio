export interface ContentAreaProps {
  children: React.ReactNode;
}

export function ContentArea({ children }: ContentAreaProps) {
  return (
    <div
      className="flex-1 overflow-auto"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {children}
    </div>
  );
}
