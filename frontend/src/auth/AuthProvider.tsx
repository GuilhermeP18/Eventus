import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { http } from '../api/http';
import { lerErro } from '../api/erros';
import type { Perfil } from '../types/usuario';
import { AuthContext, type User } from './AuthContext';
import { TOKEN_KEY, USER_KEY } from './storage';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const hasToken = localStorage.getItem(TOKEN_KEY);
    return raw && hasToken ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const login = (newUser: User, newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setToken(newToken);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  // Com token guardado, busca o nome e os demais dados. Eles ficam só em memória
  // (no localStorage continua apenas o e-mail), então até a resposta chegar não há nome.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    http
      .get<Perfil>('/auth/me', { signal: controller.signal })
      .then((response) => setUser(response.data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (lerErro(err).status === 401) logout(); // token expirado ou inválido
      });
    return () => controller.abort();
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
