import { useNavigate } from 'react-router-dom';

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  isCollapsed: boolean;
}

export function SidebarItem({ icon, label, path, isActive, isCollapsed }: SidebarItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(path);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3
        transition-all duration-200
        hover:bg-[var(--color-sidebar-hover)]
        ${isActive ? 'bg-[var(--color-sidebar-active-bg)] border-l-4 border-[var(--color-sidebar-active-border)]' : 'border-l-4 border-transparent'}
        ${isCollapsed ? 'justify-center' : ''}
      `}
      title={isCollapsed ? label : undefined}
    >
      <span className="flex-shrink-0" style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
        {icon}
      </span>
      {!isCollapsed && (
        <span
          className="font-medium text-sm"
          style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
