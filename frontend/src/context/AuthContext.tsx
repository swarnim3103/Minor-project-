import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  users: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  const raw = localStorage.getItem("users");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [users, setUsers] = useState<User | null>(() => readStoredUser());

  function login(newToken: string, newUser: User) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUsers(newUser);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("users");
    setToken(null);
    setUsers(null);
  }

  return (
    <AuthContext.Provider
      value={{ users, token, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}
