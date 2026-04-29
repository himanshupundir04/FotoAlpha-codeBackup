import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')); 

  if (!token) {
    return <Navigate to="/" />;
  } 

  if (user && user.role === '') {
    return <Navigate to="/admin/dashboard" />;
  }

  if (user && user.role === 'photographer') {
    return <Navigate to="/photographer/dashboard" />;
  }
  
  if (user && user.role === 'organizer') {
    return <Navigate to="/organizer/dashboard" />;
  }


    return children;
};

export default ProtectedRoute;
