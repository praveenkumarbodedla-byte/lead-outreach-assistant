import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const isAuth = localStorage.getItem('auth_pin_success') === 'true';
  const location = useLocation();

  if (!isAuth) {
    // Redirect to login page, saving the current location they tried to visit
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
