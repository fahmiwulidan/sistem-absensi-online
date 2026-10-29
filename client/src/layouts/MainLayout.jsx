import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import './MainLayout.css';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="layout-wrapper">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="layout-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="layout-main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
