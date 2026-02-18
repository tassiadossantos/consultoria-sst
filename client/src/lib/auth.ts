import { apiRequest } from "./queryClient";
import { clearAuthToken, setAuthToken } from "./auth-token";

export type AuthUser = {
  id: string;
  username: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  const body = (await res.json()) as LoginResponse;
  setAuthToken(body.token);
  return body.user;
}

export async function register(username: string, password: string): Promise<AuthUser> {
  const res = await apiRequest("POST", "/api/auth/register", { username, password });
  const body = (await res.json()) as LoginResponse;
  setAuthToken(body.token);
  return body.user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("POST", "/api/auth/logout");
  } finally {
    clearAuthToken();
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await apiRequest("GET", "/api/auth/me");
  return (await res.json()) as AuthUser;
}
