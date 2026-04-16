/**
 * Protected Route Component
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthController';
import Navbar from './Navbar';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { token, user, isAdmin, isVendeur, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-state">Chargement...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin() && !isVendeur()) {
    return <Navigate to="/products" replace />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default ProtectedRoute;