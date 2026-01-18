import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.auth.getCurrentUser();
        setUser(currentUser);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          localStorage.removeItem('auth_token');
          setUser(null);
        } else {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    setUser,
  };
}
