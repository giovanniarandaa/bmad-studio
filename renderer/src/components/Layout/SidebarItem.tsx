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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: isActive ? '#10B981' : 'transparent',
        color: isActive ? '#FFFFFF' : '#6B7280',
        fontWeight: '500',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      title={isCollapsed ? label : undefined}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {!isCollapsed && label}
    </button>
  );
}
