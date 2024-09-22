// RouteGuard.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';

const RouteGuard = ({ children }) => {
  const { userLoggedIn, userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userLoggedIn && currentUser) {
      const contribuinte = userData?.contribuinte;
      if (!contribuinte && location.pathname !== '/perfil' && location.pathname !== '/perfil/edit' && location.pathname !== '/perfil/edit/password' && location.pathname !== '/login' && location.pathname !== '/register') {
        navigate('/perfil');
      }
    }
  }, [userLoggedIn, userData, currentUser, navigate, location.pathname]);

  return children;
};

export default RouteGuard;
