import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import Sidebar from './Sidebar';
import Header from './Header';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mobile = useMediaQuery('(max-width:1024px)');
  const { pathname } = useLocation();
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => { setSidebarOpen(false); }, [mobile, pathname]);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Ir al contenido</a>
      {mobile ? (
        <Drawer open={sidebarOpen} onClose={closeSidebar}
          slotProps={{ paper: { className: 'mobile-sidebar-paper' } }}>
          <Sidebar onNavigate={closeSidebar} onClose={closeSidebar} />
        </Drawer>
      ) : <Sidebar />}
      <div className="app-main">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((value) => !value)} />
        <main id="main-content" className="content fade-in" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
