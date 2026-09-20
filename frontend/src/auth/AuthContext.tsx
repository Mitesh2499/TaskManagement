import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "@/api/auth";
import { TOKEN_STORAGE_KEY, setUnauthorizedHandler } from "@/api/client";
import { AuthContext, type AuthContextValue } from "@/auth/auth-context";
import type { LoginRequest, RegisterRequest } from "@/types/auth";

const EMAIL_STORAGE_KEY = "taskmanagement.email";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_STORAGE_KEY));

  const applySession = useCallback((nextToken: string, nextEmail: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(EMAIL_STORAGE_KEY, nextEmail);
    setToken(nextToken);
    setEmail(nextEmail);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EMAIL_STORAGE_KEY);
    setToken(null);
    setEmail(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(
    async (request: LoginRequest) => {
      const response = await authApi.login(request);
      applySession(response.token, response.email);
    },
    [applySession],
  );

  const register = useCallback(
    async (request: RegisterRequest) => {
      const response = await authApi.register(request);
      applySession(response.token, response.email);
    },
    [applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ token, email, isAuthenticated: token !== null, login, register, logout }),
    [token, email, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
