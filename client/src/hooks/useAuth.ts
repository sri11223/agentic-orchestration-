import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      const userData = authService.getUser();
      
      setIsAuthenticated(isAuth);
      setUser(userData);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    loading,
    logout
  };
};