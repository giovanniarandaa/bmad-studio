/**
 * React Entry Point
 *
 * Mounts the React application to the DOM using React 19 API
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * Get root element and ensure it exists
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Failed to find the root element. Make sure index.html contains <div id="root"></div>'
  );
}

/**
 * Create React root and render app
 */
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
