import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { BRAND } from '@/components/arena/BrandAssets';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

const COLLAPSE_KEY = 'olympia.admin.sidebarCollapsed';

const AdminLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const location = useLocation();
  const isDay = useTheme().theme === 'day';

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-page font-sans text-ink">
      {/* Ambient arena backdrop — kept extremely low so data stays legible */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className={cn(
            'absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700',
            isDay ? 'opacity-[0.035] mix-blend-multiply' : 'opacity-[0.07] mix-blend-screen',
          )}
          style={{ backgroundImage: `url(${BRAND.arena})` }}
        />
        <div
          className={cn(
            'absolute -top-[15%] left-[20%] h-[450px] w-[55vw] rounded-full blur-[140px] transition-opacity duration-700',
            isDay ? 'opacity-[0.04]' : 'opacity-[0.07]',
          )}
          style={{ background: 'radial-gradient(circle, #1264FF 0%, #1747B8 50%, transparent 80%)' }}
        />
        <div
          className={cn(
            'absolute -bottom-[10%] right-[10%] h-[400px] w-[45vw] rounded-full blur-[130px] transition-opacity duration-700',
            isDay ? 'opacity-[0.04]' : 'opacity-[0.06]',
          )}
          style={{ background: 'radial-gradient(circle, #D9A441 0%, #FFD21F 40%, transparent 80%)' }}
        />
        <div className={cn('absolute inset-0', isDay ? 'ol-day-field opacity-25' : 'ol-night-field opacity-25')} />
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

        <main className="hide-scrollbar flex-1 scroll-smooth overflow-y-auto p-3 sm:p-5 md:p-6">
          <div className="mx-auto w-full max-w-[1560px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
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
