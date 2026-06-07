import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('codeai_token'));
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('codeai_token'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('codeai_token', newToken);
    setToken(newToken);
    setLocation('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('codeai_token');
    setToken(null);
    setLocation('/login');
  };

  return { token, login, logout, isAuthenticated: !!token };
}
