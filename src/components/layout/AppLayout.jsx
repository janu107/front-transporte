/**
 * AppLayout.jsx
 * Estructura administrativa: Sidebar + Header + área de contenido (Outlet).
 * Gestiona la apertura del sidebar en móvil.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggle = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onNavigate={closeSidebar} />
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      <div className="app-main">
        <Header onToggleSidebar={toggle} />
        <main className="content fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
