import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import * as auth from './auth';
import { setUnauthorizedHandler } from './http';

type AuthState = {
  /** `false` tant que le token stocké n'a pas été relu : ne RIEN rediriger avant. */
  pret: boolean;
  token: string | null;
  connecte: boolean;
  roles: string[];
  seConnecter: (username: string, password: string) => Promise<void>;
  seDeconnecter: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    auth.setup().then((stocke) => {
      setToken(stocke);
      setPret(true);
    });
  }, []);

  useEffect(() => {
    // Le back n'a pas de refresh token et le JWT dure une heure : un 401 ne se rattrape
    // pas, il se constate. On vide la session, la garde de `app/_layout` fait le reste.
    setUnauthorizedHandler(() => {
      auth.logout().finally(() => setToken(null));
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      pret,
      token,
      connecte: !!token,
      roles: auth.getRoles(token),
      seConnecter: async (username, password) => {
        setToken(await auth.authenticate({ username, password }));
      },
      seDeconnecter: async () => {
        await auth.logout();
        setToken(null);
      },
    }),
    [pret, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth() hors de <AuthProvider>');
  return value;
}
