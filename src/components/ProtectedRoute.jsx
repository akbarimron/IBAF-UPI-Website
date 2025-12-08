import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();

  console.log('ProtectedRoute - currentUser:', currentUser);
  console.log('ProtectedRoute - userRole:', userRole);
  console.log('ProtectedRoute - requiredRole:', requiredRole);
  console.log('ProtectedRoute - loading:', loading);

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If role is required
  if (requiredRole) {
    // Admin can access everything
    if (userRole === 'admin') {
      console.log('Admin user - access granted');
      return children;
    }
    
    // For non-admin users, check if role matches
    if (userRole !== requiredRole) {
      console.log(`Role mismatch: ${userRole} !== ${requiredRole}, redirecting to home`);
      return <Navigate to="/" replace />;
    }
  }

  console.log('Access granted');
  return children;
};

export default ProtectedRoute;
