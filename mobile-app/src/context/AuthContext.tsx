import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: api.RegisterRequest) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => '',
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await api.getStoredToken();
        if (token) {
          const me = await api.getMe();
          setUser({
            username: me.username,
            email: me.email,
            firstName: me.firstName,
            lastName: me.lastName,
            roles: me.roles,
          });
        }
      } catch {
        await api.clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login({ username, password });
    setUser({
      username: res.username,
      email: res.email,
      firstName: res.firstName,
      lastName: res.lastName,
      roles: res.roles,
    });
  }, []);

  const register = useCallback(async (data: api.RegisterRequest) => {
    const res = await api.register(data);
    return res.message;
  }, []);

  const logout = useCallback(async () => {
    await api.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
