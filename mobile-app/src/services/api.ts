import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getCurrentLanguage } from '../i18n/i18n';

const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8080/api'
  : 'http://localhost:8080/api';
const TOKEN_KEY = 'auth_token';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface ApiResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  if (typeof err === 'string') return err;
  return '';
}

export function getFieldErrors(err: unknown): Record<string, string> | undefined {
  if (typeof err === 'object' && err !== null && 'errors' in err) {
    return (err as { errors: Record<string, string> }).errors;
  }
  return undefined;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  accountNonLocked: boolean;
  roles: string[];
  createdAt: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': getCurrentLanguage(),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw data as ApiResponse;
  }

  return data as T;
}

export async function register(body: RegisterRequest): Promise<ApiResponse> {
  return request<ApiResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
  return data;
}

export async function getMe(): Promise<UserDto> {
  return request<UserDto>('/user/me');
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ---- Health types ----

export interface HealthComponent {
  status: string;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  components: Record<string, HealthComponent>;
}

// ---- Admin types ----

export interface VerificationTokenDto {
  id: number;
  token: string;
  expiryDate: string;
  expired: boolean;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
}

// ---- Health endpoints ----

export async function adminGetHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/admin/health');
}

// ---- Admin endpoints ----

export async function adminGetUsers(): Promise<UserDto[]> {
  return request<UserDto[]>('/admin/users');
}

export async function adminGetUser(id: number): Promise<UserDto> {
  return request<UserDto>(`/admin/users/${id}`);
}

export async function adminUpdateUser(
  id: number,
  body: UpdateUserRequest,
): Promise<UserDto> {
  return request<UserDto>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function adminToggleEnabled(id: number): Promise<UserDto> {
  return request<UserDto>(`/admin/users/${id}/toggle-enabled`, {
    method: 'PUT',
  });
}

export async function adminToggleLocked(id: number): Promise<UserDto> {
  return request<UserDto>(`/admin/users/${id}/toggle-locked`, {
    method: 'PUT',
  });
}

export async function adminDeleteUser(id: number): Promise<ApiResponse> {
  return request<ApiResponse>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

export async function adminGetToken(
  id: number,
): Promise<VerificationTokenDto | null> {
  const data = await request<VerificationTokenDto | ApiResponse>(
    `/admin/users/${id}/token`,
  );
  // Backend returns ApiResponse when no token exists
  if ('success' in data) return null;
  return data as VerificationTokenDto;
}

export async function adminDeleteToken(id: number): Promise<ApiResponse> {
  return request<ApiResponse>(`/admin/users/${id}/token`, {
    method: 'DELETE',
  });
}

export async function adminRegenerateToken(
  id: number,
): Promise<VerificationTokenDto> {
  return request<VerificationTokenDto>(`/admin/users/${id}/token`, {
    method: 'POST',
  });
}
