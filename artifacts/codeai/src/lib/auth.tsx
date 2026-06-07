import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem("codeai_token")
  );
  const [, setLocation] = useLocation();

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("codeai_token", newToken);
    } else {
      localStorage.removeItem("codeai_token");
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
    setLocation("/login");
  };

  // Check auth validity by calling an endpoint, or rely on token existence
  // The API hooks will throw 401 if invalid, which we can catch globally, 
  // but let's pre-emptively fetch user info.
  const { isError, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      // Assuming 401
      const status = (error as any)?.status;
      if (status === 401) {
        logout();
      }
    }
  }, [isError, error]);

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
