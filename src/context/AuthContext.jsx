/**
 * AuthContext.jsx
 * Contexto de autenticación. Expone el usuario actual y las acciones login/logout.
 * Usa auth.service (simulado en esta fase, sustituible por backend real).
 */
import { createContext, useState, useCallback, useMemo } from 'react';
import authService from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());

  const login = useCallback(async (credentials) => {
    const { user: loggedUser } = await authService.login(credentials);
    setUser(loggedUser);
    setIsAuthenticated(true);
    return loggedUser;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout }),
    [user, isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
