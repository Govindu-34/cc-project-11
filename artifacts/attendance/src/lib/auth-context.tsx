import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authMe, type AuthSession } from "@workspace/api-client-react";

type Employee = AuthSession["employee"];

type AuthContextValue = {
  user: Employee | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await authMe();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const value: AuthContextValue = {
    user: data?.employee ?? null,
    isLoading,
    refresh: async () => {
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    signOut: () => {
      qc.setQueryData(["auth", "me"], null);
      qc.clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
