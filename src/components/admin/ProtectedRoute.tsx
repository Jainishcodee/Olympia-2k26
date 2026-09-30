import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading, isAdmin, admin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1264FF] border-t-transparent"></div>
          <p className="text-xs uppercase font-black tracking-widest text-slate-500">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // Strict check: Must have user, cannot be anonymous, must have verified admin claim, must not be inactive
  const isAuthorized = !!user && !user.isAnonymous && isAdmin === true && (!admin || admin.active !== false);

  if (!isAuthorized) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;