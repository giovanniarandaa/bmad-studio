import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ContentArea } from './ContentArea';
import { useAppStore } from '../../stores/appStore';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useTheme } from '../../hooks/useTheme';
import { BREAKPOINT_MOBILE, BREAKPOINT_TABLET } from '../../utils/constants';

export function AppLayout() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);
  const activeProjectName = useAppStore((state) => state.activeProjectName);
  const activityStatus = useAppStore((state) => state.activityStatus);

  const { width } = useWindowSize();

  // Initialize theme detection
  useTheme();

  // Auto-collapse sidebar on tablet breakpoint
  useEffect(() => {
    if (width < BREAKPOINT_TABLET && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [width, sidebarCollapsed, setSidebarCollapsed]);

  // Update window title (Electron IPC - placeholder for now)
  useEffect(() => {
    let title = 'BMAD Studio';
    if (activeProjectName) {
      title += ` - ${activeProjectName}`;
    }
    if (activityStatus) {
      title += ` ⚙️ ${activityStatus}`;
    }

    document.title = title;

    // TODO: Add IPC call when main process handler is implemented
    // window.electron?.invoke('window:set-title', { title });
  }, [activeProjectName, activityStatus]);

  // Mobile view (<240px) - Show Header only
  if (width < BREAKPOINT_MOBILE) {
    return (
      <div className="h-screen flex flex-col">
        <Header onMenuClick={() => console.log('TODO: Open mobile menu overlay')} />
        <ContentArea>
          <Outlet />
        </ContentArea>
      </div>
    );
  }

  // Desktop/Tablet view - Show Sidebar
  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <ContentArea>
        <Outlet />
      </ContentArea>
    </div>
  );
}
