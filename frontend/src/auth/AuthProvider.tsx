import { useState, type ReactNode } from 'react';
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

  const login = (newUser: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
