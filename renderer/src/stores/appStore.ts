import { create } from 'zustand';
import { getItem, setItem } from '../utils/localStorage';

export interface AppStore {
  // Estado
  theme: 'light' | 'dark' | 'auto';
  effectiveTheme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeProjectId: number | null;
  activeProjectName: string | null;
  activityStatus: string | null;

  // Acciones
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setEffectiveTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveProject: (id: number | null, name: string | null) => void;
  setActivityStatus: (status: string | null) => void;

  // Inicialización
  initializeFromLocalStorage: () => void;
  persistToLocalStorage: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Estado inicial
  theme: 'auto',
  effectiveTheme: 'light',
  sidebarCollapsed: false,
  activeProjectId: null,
  activeProjectName: null,
  activityStatus: null,

  // Acciones
  setTheme: (theme) => {
    set({ theme });
    setItem('bmad-studio:theme', theme);
  },

  setEffectiveTheme: (effectiveTheme) => {
    set({ effectiveTheme });
    // Aplicar a <html> data-theme
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  },

  toggleSidebar: () => {
    const { sidebarCollapsed } = get();
    const newValue = !sidebarCollapsed;
    set({ sidebarCollapsed: newValue });
    setItem('bmad-studio:sidebar-collapsed', newValue);
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    setItem('bmad-studio:sidebar-collapsed', collapsed);
  },

  setActiveProject: (id, name) => {
    set({ activeProjectId: id, activeProjectName: name });
  },

  setActivityStatus: (status) => {
    set({ activityStatus: status });
  },

  initializeFromLocalStorage: () => {
    const theme = getItem<'light' | 'dark' | 'auto'>('bmad-studio:theme', 'auto');
    const collapsed = getItem<boolean>('bmad-studio:sidebar-collapsed', false);
    set({ theme, sidebarCollapsed: collapsed });
  },

  persistToLocalStorage: () => {
    const { theme, sidebarCollapsed } = get();
    setItem('bmad-studio:theme', theme);
    setItem('bmad-studio:sidebar-collapsed', sidebarCollapsed);
  },
}));
