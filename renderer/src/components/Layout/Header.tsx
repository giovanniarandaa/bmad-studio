import { Menu } from 'lucide-react';

export interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header
      className="h-[60px] flex items-center px-4 border-b"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <button
        onClick={onMenuClick}
        className="p-2 rounded hover:bg-[var(--color-sidebar-hover)] transition-colors"
        title="Open menu"
      >
        <Menu size={24} />
      </button>
      <h1 className="ml-4 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
        BMAD Studio
      </h1>
    </header>
  );
}
