// src/lib/stores/auth.ts
// ✅ SECURITY: Authentication store with reactive state

import { writable, derived, get } from 'svelte/store';
import { goto } from '$app/navigation';
import { apiClient } from '$lib/api/client';
import type { User, LoginCredentials } from '$lib/api/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginState {
  isLoading: boolean;
  error: string | null;
}

// src/lib/stores/auth.ts
// ... (imports and interfaces remain the same)

// Stores
export const authState = writable<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
});

export const loginState = writable<LoginState>({
  isLoading: false,
  error: null,
});

// Derived stores
export const userRole = derived(authState, ($auth) => ({
  name: $auth.user?.roleName || null,
  isSuperuser: $auth.user?.roleName === 'SUPERUSER',
  isAdmin: $auth.user?.roleName === 'ADMIN',
  isUser: $auth.user?.roleName === 'USER',
}));

// Actions
export async function initializeAuth(): Promise<void> {
  console.log('DEBUG (auth.ts): initializeAuth() called.');
  try {
    authState.update(state => ({ ...state, isLoading: true }));
    
    const response = await apiClient.getProfile();
    
    if (response.success && response.data) {
      authState.update(state => ({
        ...state,
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
      console.log('DEBUG (auth.ts): initializeAuth successful. AuthState:', get(authState));
    } else {
      console.log('DEBUG (auth.ts): initializeAuth failed (response not success or no data). Response:', response);
      authState.update(state => ({
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: response.message || null,
      }));
    }
  } catch (error) {
    console.error('DEBUG (auth.ts): initializeAuth caught an error:', error);
    authState.update(state => ({
      ...state,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: (error instanceof Error) ? error.message : 'Unknown error during initializeAuth.',
    }));
  }
}

export async function login(credentials: LoginCredentials): Promise<boolean> {
  console.log('DEBUG (auth.ts): login() called with username:', credentials.username);
  try {
    loginState.update(state => ({ ...state, isLoading: true, error: null }));
    
    const response = await apiClient.login(credentials);

    // *** เพิ่มการตรวจสอบแบบละเอียดและ console.log เพิ่มเติม ***
    console.log('DEBUG (auth.ts): Raw API response:', response);
    console.log('DEBUG (auth.ts): response.success:', response.success);
    console.log('DEBUG (auth.ts): typeof response.data:', typeof response.data, 'response.data:', response.data);
    if (response.data) {
        console.log('DEBUG (auth.ts): typeof response.data.user:', typeof response.data.user, 'response.data.user:', response.data.user);
    }
    // *** สิ้นสุดการตรวจสอบแบบละเอียด ***

    // แก้ไขเงื่อนไขการตรวจสอบ: ใช้ && เพื่อตรวจสอบแต่ละส่วนอย่างชัดเจน
    // เรากำลังยืนยันว่า success เป็น true และ data เป็น object และ data.user เป็น object
    if (response.success === true && typeof response.data === 'object' && response.data !== null && typeof response.data.user === 'object' && response.data.user !== null) {
      authState.update(state => ({
        ...state,
        user: response.data.user,
        isAuthenticated: true,
        error: null,
      }));
      console.log('DEBUG (auth.ts): Login SUCCESS path taken. Current authState:', get(authState));
      loginState.update(state => ({ ...state, isLoading: false, error: null }));
      return true;
    } else {
      // ถ้าไม่ตรงตามเงื่อนไขที่คาดหวังว่าสำเร็จ
      const errorMessage = response.message || 'Login failed: API response structure unexpected.';
      console.warn('DEBUG (auth.ts): Login API response indicates failure or unexpected structure:', errorMessage, 'Full Response:', response);
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    const errorMessage = error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ (Unknown)';
    console.error('DEBUG (auth.ts): Login caught an error:', errorMessage, 'Error object:', error);
    
    loginState.update(state => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    
    return false;
  }
}

// ... (logout and clearAuthError functions remain the same)

export async function logout(): Promise<void> {
  console.log('DEBUG (auth.ts): logout() called.');
  try {
    await apiClient.logout();
    console.log('DEBUG (auth.ts): API logout successful.');
  } catch (error) {
    console.warn('DEBUG (auth.ts): Logout API failed, clearing local state anyway. Error:', error);
  } finally {
    authState.update(state => ({
      ...state,
      user: null,
      isAuthenticated: false,
      error: null,
    }));
    
    loginState.update(state => ({ ...state, error: null }));
    console.log('DEBUG (auth.ts): Local auth state cleared. Redirecting to /login.');
    goto('/login');
  }
}

export function clearAuthError(): void {
  console.log('DEBUG (auth.ts): clearAuthError() called.');
  authState.update(state => ({ ...state, error: null }));
  loginState.update(state => ({ ...state, error: null }));
}