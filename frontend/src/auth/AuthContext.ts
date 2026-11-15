import { createContext } from 'react';
import type { Perfil } from '../types/usuario';

/** Logo após o login só o e-mail é conhecido; o restante chega com GET /auth/me. */
export type User = Partial<Perfil>;

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  /** Atualiza os dados em memória (ex.: depois de salvar o perfil). */
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
