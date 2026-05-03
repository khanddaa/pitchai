import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AUTH_KEY = "pitchai_user";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!email || !password) return { ok: false, error: "Имэйл болон нууц үгийг оруулна уу" };
    if (password.length < 6) return { ok: false, error: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой" };

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const newUser: User = { email, name };
    setUser(newUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
