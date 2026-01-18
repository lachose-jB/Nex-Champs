import { useEffect, useState } from "react";
import { authService } from "@/lib/authService";
import { apiClient } from "@/lib/apiClient";

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier s'il y a un token existant
    const token = localStorage.getItem("access_token");
    if (token) {
      apiClient.setAuthHeader(token);
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      apiClient.setAuthHeader(response.access_token);
      // Charger les données utilisateur si disponible
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // L'endpoint n'existe peut-être pas
        console.error("Could not fetch user data:", error);
        setUser({ id: "unknown", email: username });
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, loading, isAuthenticated, login, logout };
}
