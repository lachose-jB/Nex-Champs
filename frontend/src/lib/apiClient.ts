import axios, { AxiosInstance } from "axios";

const API_URL = "http://localhost:8000/api/v1";

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Charger le token du localStorage
    this.token = localStorage.getItem("access_token");
    if (this.token) {
      this.setAuthHeader(this.token);
    }

    // Intercepteur pour les réponses d'erreur
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré
          localStorage.removeItem("access_token");
          this.token = null;
          window.location.href = "/";
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthHeader(token: string) {
    this.token = token;
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("access_token", token);
  }

  getToken() {
    return this.token;
  }

  clearAuth() {
    this.token = null;
    delete this.client.defaults.headers.common["Authorization"];
    localStorage.removeItem("access_token");
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();
