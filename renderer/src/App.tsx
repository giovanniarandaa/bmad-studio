/**
 * App Component
 *
 * Root component for BMAD Studio renderer process
 * Placeholder for Phase 1 - will be expanded in future modules
 */

import { useState, useEffect } from 'react';
import type { FC } from 'react';

const App: FC = () => {
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Get platform info from Electron API
    if (window.electronAPI) {
      setPlatform(window.electronAPI.platform);
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        BMAD Studio
      </h1>
      <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>
        Ready for Development
      </p>
      {platform && (
        <p style={{ fontSize: '1rem', marginTop: '2rem', opacity: 0.7 }}>
          Platform: {platform}
        </p>
      )}
      <div
        style={{
          marginTop: '3rem',
          padding: '1rem 2rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          ✅ Electron + React 19 + TypeScript
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
          ✅ Hot Module Replacement enabled
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
          ✅ Context Isolation + Sandbox
        </p>
      </div>
    </div>
  );
};

export default App;
