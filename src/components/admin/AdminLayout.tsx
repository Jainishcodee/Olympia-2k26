import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { BRAND } from '@/components/arena/BrandAssets';

const COLLAPSE_KEY = 'olympia.admin.sidebarCollapsed';

const AdminLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const location = useLocation();

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#050C18] text-slate-100 font-sans">
      {/* Background Stadium Glow & Ambient Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle arena stadium photo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.08] mix-blend-screen"
          style={{ backgroundImage: `url(${BRAND.arena})` }}
        />
        {/* Cyan/Blue orbital glow */}
        <div 
          className="absolute -top-[15%] left-[20%] w-[55vw] h-[450px] rounded-full blur-[140px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1264FF 0%, #1747B8 50%, transparent 80%)' }}
        />
        {/* Gold arena floodlight */}
        <div 
          className="absolute -bottom-[10%] right-[10%] w-[45vw] h-[400px] rounded-full blur-[130px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D9A441 0%, #FFD21F 40%, transparent 80%)' }}
        />
        {/* Digital field line overlay */}
        <div className="absolute inset-0 ol-night-field opacity-60" />
      </div>

      <AdminSidebar
        isOpen={drawerOpen}
        setIsOpen={setDrawerOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar
          onMenu={() => setDrawerOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-7 hide-scrollbar scroll-smooth">
          <div className="mx-auto w-full max-w-[1540px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
