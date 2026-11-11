import { createContext } from 'react';

export interface User {
  nome: string;
  email?: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
