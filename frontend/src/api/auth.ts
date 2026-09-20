import { apiClient } from "@/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/login", request);
  return data;
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/register", request);
  return data;
}
