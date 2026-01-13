import { api, apiClient } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  User,
} from "./types";

export const authApi = {
  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    // Store tokens
    apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  },

  // Login user
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    // Store tokens
    apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      // Always clear tokens, even if request fails
      apiClient.clearTokens();
    }
  },

  // Get current user profile
  async getProfile(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>("/auth/profile");
    return response.data;
  },

  // Request password reset
  async requestPasswordReset(data: RequestPasswordResetRequest): Promise<void> {
    await api.post("/auth/password/request-reset", data);
  },

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post("/auth/password/reset", data);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  },
};
