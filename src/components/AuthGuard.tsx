import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from './Loader';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
