import { createContext, useContext, useState, type ReactNode } from "react";
import type { AdminPublic } from "../services/authService";

interface AuthContextValue {
  admin: AdminPublic | null;
  token: string | null;
  setSession: (token: string, admin: AdminPublic) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "oplab_admin_token";
const ADMIN_KEY = "oplab_admin_data";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState<AdminPublic | null>(() => {
    const stored = localStorage.getItem(ADMIN_KEY);
    return stored ? (JSON.parse(stored) as AdminPublic) : null;
  });

  function setSession(newToken: string, newAdmin: AdminPublic) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setToken(null);
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, token, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return ctx;
}
