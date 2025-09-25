import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'apprentice' | 'company';
type User = { id: string; email: string; role: Role } | null;

type AuthCtx = {
  user: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

const TEST = { email: 'azubi@handwerkconnect.dev', password: 'Azubi!123', role: 'apprentice' as const };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  const login = async (email: string, password: string) => {
    if (email.trim().toLowerCase() === TEST.email && password === TEST.password) {
      setUser({ id: 'u_azubi_1', email: TEST.email, role: TEST.role });
      return;
    }
    throw new Error('E-Mail oder Passwort ist falsch (nutze den Test-User).');
  };

  const logout = () => setUser(null);

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within <AuthProvider>');
  return v;
}
