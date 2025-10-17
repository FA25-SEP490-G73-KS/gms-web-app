// AuthContext: Provides authentication state and actions across the app.
import * as React from "react";

type User = { id: string; name: string; role: string } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User>(null);
  const [loading, setLoading] = React.useState(false);

  async function login(_username: string, _password: string) {
    // TODO: Implement API login and set user
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      setUser({ id: "1", name: "Demo User", role: "Manager" });
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    // TODO: Implement API logout and clear user
    setUser(null);
  }

  const value: AuthContextValue = { user, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
