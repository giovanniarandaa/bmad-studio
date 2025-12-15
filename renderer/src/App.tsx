/**
 * App Component
 *
 * Root component for BMAD Studio renderer process
 * Feature 004: Layout Principal y Navegación
 */

import { useEffect } from 'react';
import type { FC } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { useAppStore } from './stores/appStore';
import './styles/theme.css';

const App: FC = () => {
  const initializeFromLocalStorage = useAppStore((state) => state.initializeFromLocalStorage);

  useEffect(() => {
    // Initialize store from localStorage on app start
    initializeFromLocalStorage();
  }, [initializeFromLocalStorage]);

  return <AppRoutes />;
};

export default App;
