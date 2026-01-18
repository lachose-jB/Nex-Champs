import { apiClient } from "./apiClient";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await apiClient.getClient().post<LoginResponse>(
      "/auth/token",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data.access_token) {
      apiClient.setAuthHeader(response.data.access_token);
    }

    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.getClient().get<User>("/auth/users/me");
    return response.data;
  }

  logout() {
    apiClient.clearAuth();
  }
}

export const authService = new AuthService();
