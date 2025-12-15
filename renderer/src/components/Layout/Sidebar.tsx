import { useLocation } from 'react-router-dom';
import { FolderOpen, FileText, Code, FileSearch, Settings, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { ROUTES, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '../../utils/constants';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { icon: <FolderOpen size={20} />, label: 'Projects', path: ROUTES.projects },
    { icon: <FileText size={20} />, label: 'Features', path: ROUTES.features },
    { icon: <Code size={20} />, label: 'BMAD', path: ROUTES.bmad },
    { icon: <FileSearch size={20} />, label: 'Reviews', path: ROUTES.reviews },
    { icon: <Settings size={20} />, label: 'Settings', path: ROUTES.settings },
    { icon: <HelpCircle size={20} />, label: 'Help', path: ROUTES.help },
  ];

  return (
    <div
      className="h-screen flex flex-col transition-all duration-200"
      style={{
        width: collapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
        backgroundColor: 'var(--color-sidebar-bg)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo/Título */}
      {!collapsed && (
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            BMAD Studio
          </h2>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
            isCollapsed={collapsed}
          />
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded hover:bg-[var(--color-sidebar-hover)] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
}
