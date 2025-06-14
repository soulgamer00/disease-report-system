// frontend/src/lib/stores/userManagement.ts
// ✅ User Management State

import { writable, derived, get } from 'svelte/store';
import { authState } from './auth';
import { config } from '$lib/config/env';
import type { 
  User, 
  CreateUserData, 
  UpdateUserData, 
  UserQueryParams,
  PaginatedUserResponse 
} from '$lib/api/types';

// ========== TYPES ==========
interface UserManagementState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  filters: {
    search?: string;
    roleId?: number;
    hospitalCode?: string;
    isActive?: boolean;
  };
}

interface UserFormState {
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  editingUser: User | null;
}

interface UserStatsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: Array<{
    roleId: number;
    roleName: string;
    count: number;
  }>;
  byHospital: Array<{
    hospitalCode: string;
    hospitalName: string | null;
    count: number;
  }>;
}

// ========== STORES ==========
export const userManagementState = writable<UserManagementState>({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {},
});

export const userFormState = writable<UserFormState>({
  isLoading: false,
  error: null,
  isOpen: false,
  mode: 'create',
  editingUser: null,
});

export const userStats = writable<UserStatsData | null>(null);

// ========== DERIVED STORES ==========
export const canManageUsers = derived(authState, ($auth) => {
  if (!$auth.user) return false;
  const role = $auth.user.roleName;
  return role === 'SUPERUSER' || role === 'ADMIN';
});

export const canCreateUsers = derived(authState, ($auth) => {
  if (!$auth.user) return false;
  const role = $auth.user.roleName;
  return role === 'SUPERUSER' || role === 'ADMIN';
});

export const canDeleteUsers = derived(authState, ($auth) => {
  if (!$auth.user) return false;
  return $auth.user.roleName === 'SUPERUSER';
});

export const currentUserRole = derived(authState, ($auth) => ({
  isSuperuser: $auth.user?.roleName === 'SUPERUSER',
  isAdmin: $auth.user?.roleName === 'ADMIN',
  isUser: $auth.user?.roleName === 'USER',
  roleName: $auth.user?.roleName || null,
}));

// ========== ACTIONS ==========

/**
 * 📋 Load users with pagination and filters
 */
export async function loadUsers(params?: Partial<UserQueryParams>) {
  try {
    userManagementState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const queryParams: UserQueryParams = {
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc',
      ...params,
    };

    // Call backend API with correct base URL
    const response = await fetch(`${config.API_BASE_URL}/api/users?` + new URLSearchParams({
      page: queryParams.page.toString(),
      limit: queryParams.limit.toString(),
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
      ...(queryParams.search && { search: queryParams.search }),
      ...(queryParams.roleId && { roleId: queryParams.roleId.toString() }),
      ...(queryParams.hospitalCode && { hospitalCode: queryParams.hospitalCode }),
      ...(queryParams.isActive !== undefined && { isActive: queryParams.isActive.toString() }),
    }), {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load users');
    }

    const data: { success: boolean; data: PaginatedUserResponse } = await response.json();

    if (data.success) {
      userManagementState.update(state => ({
        ...state,
        users: data.data.users,
        pagination: data.data.pagination,
        filters: data.data.filters,
        isLoading: false,
      }));
    } else {
      throw new Error('API returned error');
    }

  } catch (error) {
    console.error('Load users error:', error);
    userManagementState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load users',
    }));
  }
}

/**
 * 👤 Get user by ID
 */
export async function getUserById(id: string) {
  try {
    userManagementState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const response = await fetch(`${config.API_BASE_URL}/api/users/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load user');
    }

    const data = await response.json();

    if (data.success) {
      userManagementState.update(state => ({
        ...state,
        currentUser: data.data,
        isLoading: false,
      }));
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to load user');
    }

  } catch (error) {
    console.error('Get user error:', error);
    userManagementState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load user',
    }));
    return null;
  }
}

/**
 * ➕ Create new user
 */
export async function createUser(userData: CreateUserData) {
  try {
    userFormState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const response = await fetch(`${config.API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      userFormState.update(state => ({
        ...state,
        isLoading: false,
        isOpen: false,
      }));

      // Reload users list
      await loadUsers();
      
      return { success: true, data: data.data };
    } else {
      throw new Error(data.message || 'Failed to create user');
    }

  } catch (error) {
    console.error('Create user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    
    userFormState.update(state => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    
    return { success: false, error: errorMessage };
  }
}

/**
 * ✏️ Update user
 */
export async function updateUser(id: string, userData: UpdateUserData) {
  try {
    userFormState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const response = await fetch(`${config.API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      userFormState.update(state => ({
        ...state,
        isLoading: false,
        isOpen: false,
      }));

      // Reload users list
      await loadUsers();
      
      return { success: true, data: data.data };
    } else {
      throw new Error(data.message || 'Failed to update user');
    }

  } catch (error) {
    console.error('Update user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
    
    userFormState.update(state => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    
    return { success: false, error: errorMessage };
  }
}

/**
 * 🗑️ Delete user
 */
export async function deleteUser(id: string) {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Reload users list
      await loadUsers();
      return { success: true };
    } else {
      throw new Error(data.message || 'Failed to delete user');
    }

  } catch (error) {
    console.error('Delete user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
    return { success: false, error: errorMessage };
  }
}

/**
 * 📊 Load user statistics
 */
export async function loadUserStats() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/api/users/stats`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load user statistics');
    }

    const data = await response.json();

    if (data.success) {
      userStats.set(data.data);
    } else {
      throw new Error(data.message || 'Failed to load statistics');
    }

  } catch (error) {
    console.error('Load user stats error:', error);
    userStats.set(null);
  }
}

/**
 * 🔍 Search users
 */
export async function searchUsers(searchTerm: string, limit: number = 10) {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const response = await fetch(`${config.API_BASE_URL}/api/users/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();

    if (data.success) {
      return data.data.results;
    } else {
      throw new Error(data.message || 'Search failed');
    }

  } catch (error) {
    console.error('Search users error:', error);
    return [];
  }
}

// ========== FORM ACTIONS ==========

/**
 * 📝 Open create user form
 */
export function openCreateForm() {
  userFormState.update(state => ({
    ...state,
    isOpen: true,
    mode: 'create',
    editingUser: null,
    error: null,
  }));
}

/**
 * ✏️ Open edit user form
 */
export function openEditForm(user: User) {
  userFormState.update(state => ({
    ...state,
    isOpen: true,
    mode: 'edit',
    editingUser: user,
    error: null,
  }));
}

/**
 * 👁️ Open view user form
 */
export function openViewForm(user: User) {
  userFormState.update(state => ({
    ...state,
    isOpen: true,
    mode: 'view',
    editingUser: user,
    error: null,
  }));
}

/**
 * ❌ Close form
 */
export function closeForm() {
  userFormState.update(state => ({
    ...state,
    isOpen: false,
    editingUser: null,
    error: null,
  }));
}

/**
 * 🧹 Clear errors
 */
export function clearErrors() {
  userManagementState.update(state => ({ ...state, error: null }));
  userFormState.update(state => ({ ...state, error: null }));
}