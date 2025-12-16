import React from 'react';
import './AppLayout.css';

export interface AppLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  rightPanel?: React.ReactNode;
  backgroundColor?: 'vibrant-green' | 'light-gray';
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  sidebar,
  rightPanel,
  backgroundColor = 'light-gray',
}) => {
  const bgClass = `app-layout--${backgroundColor}`;

  return (
    <div className={`app-layout ${bgClass}`.trim()}>
      <aside className="app-layout__sidebar">{sidebar}</aside>
      <main className="app-layout__content">
        <div className="app-layout__content-card">{children}</div>
      </main>
      {rightPanel && <aside className="app-layout__right-panel">{rightPanel}</aside>}
    </div>
  );
};
