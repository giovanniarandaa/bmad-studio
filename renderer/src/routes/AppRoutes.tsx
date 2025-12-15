import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/Layout/AppLayout';
import { ProjectsView } from '../components/Placeholders/ProjectsView';
import { FeaturesView } from '../components/Placeholders/FeaturesView';
import { BMADView } from '../components/Placeholders/BMADView';
import { ReviewsView } from '../components/Placeholders/ReviewsView';
import { SettingsView } from '../components/Placeholders/SettingsView';
import { HelpView } from '../components/Placeholders/HelpView';
import { ROUTES } from '../utils/constants';

function NotFoundRedirect() {
  // TODO: Replace with toast notification when toast system is implemented
  console.warn('Ruta no encontrada - Redirecting to /projects');
  return <Navigate to={ROUTES.projects} replace />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Default redirect */}
          <Route index element={<Navigate to={ROUTES.projects} replace />} />

          {/* Main routes */}
          <Route path={ROUTES.projects} element={<ProjectsView />} />
          <Route path={ROUTES.features} element={<FeaturesView />} />
          <Route path={ROUTES.bmad} element={<BMADView />} />
          <Route path={ROUTES.reviews} element={<ReviewsView />} />
          <Route path={ROUTES.settings} element={<SettingsView />} />
          <Route path={ROUTES.help} element={<HelpView />} />

          {/* Catch-all for invalid routes */}
          <Route path="*" element={<NotFoundRedirect />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
