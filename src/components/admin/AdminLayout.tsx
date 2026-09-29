import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const COLLAPSE_KEY = 'olympia.admin.sidebarCollapsed';

const AdminLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const { pathname } = useLocation();

  // Close the mobile drawer whenever the route changes — otherwise it stays
  // over the page after tapping a nav item.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <AdminSidebar
        isOpen={drawerOpen}
        setIsOpen={setDrawerOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar
          onMenu={() => setDrawerOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1500px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
