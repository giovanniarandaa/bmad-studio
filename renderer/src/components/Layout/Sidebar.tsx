import { useLocation } from 'react-router-dom';
import { FolderOpen, FileText, Code, FileSearch, Settings, HelpCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { ProjectList } from '../Projects';
import { useProjectStore } from '../../stores/projectStore';
import { ROUTES, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '../../utils/constants';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { projects, projectPathsStatus, addProject, removeProject } = useProjectStore();

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
      style={{
        width: collapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease',
        margin: '16px 0 16px 16px',
        height: 'calc(100vh - 32px)',
      }}
    >
      {/* Logo/Título */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#10B981',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          ⚡
        </div>
        {!collapsed && (
          <span style={{ fontWeight: '600', fontSize: '18px', color: '#1F2937' }}>
            BMAD Studio
          </span>
        )}
      </div>

      {/* Projects Section */}
      {!collapsed && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingLeft: '4px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Proyectos
            </span>
            <button
              onClick={() => addProject()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: '#10B981',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Agregar Proyecto"
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            <ProjectList
              projects={projects}
              projectPathsStatus={projectPathsStatus}
              onProjectRemove={removeProject}
              onAddProject={() => addProject()}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              backgroundColor: '#E5E7EB',
              marginBottom: '16px',
            }}
          />
        </>
      )}

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
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

      {/* Bottom Section - Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        <button
          onClick={onToggleCollapse}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: collapsed ? '0' : '12px',
            padding: collapsed ? '12px' : '12px 16px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: '#6B7280',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={24} />
          ) : (
            <>
              <ChevronLeft size={20} />
              Collapse
            </>
          )}
        </button>
      </div>
    </div>
  );
}
