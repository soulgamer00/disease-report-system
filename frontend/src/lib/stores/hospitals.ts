// src/lib/stores/hospitals.ts
// ✅ SECURITY: Hospital state management with error handling improvements

import { writable, derived } from 'svelte/store';
import { apiClient, ApiClientError } from '$lib/api/client';
import { authState } from '$lib/stores/auth';
import type { 
  Hospital, 
  CreateHospitalData, 
  UpdateHospitalData,
  HospitalQueryParams,
  HospitalStats 
} from '$lib/api/types';

interface HospitalState {
  hospitals: Hospital[];
  currentHospital: Hospital | null;
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
    organizationType?: string;
    healthServiceType?: string;
    affiliation?: string;
    isActive?: boolean;
  };
}

interface HospitalFormState {
  isLoading: boolean;
  error: string | null;
  isCodeAvailable: boolean | null;
  isCheckingCode: boolean;
}

interface HospitalStatsState {
  stats: HospitalStats | null;
  isLoading: boolean;
  error: string | null;
}

// ===== Main Hospital Store =====
export const hospitalState = writable<HospitalState>({
  hospitals: [],
  currentHospital: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {},
});

// ===== Hospital Form Store =====
export const hospitalFormState = writable<HospitalFormState>({
  isLoading: false,
  error: null,
  isCodeAvailable: null,
  isCheckingCode: false,
});

// ===== Hospital Stats Store =====
export const hospitalStatsState = writable<HospitalStatsState>({
  stats: null,
  isLoading: false,
  error: null,
});

// ===== Derived Stores =====
export const totalHospitals = derived(hospitalState, ($state) => 
  $state.pagination?.total || 0
);

export const activeHospitals = derived(hospitalStatsState, ($state) => 
  $state.stats?.activeHospitals || 0
);

export const hasPermissionToManage = derived(
  authState,
  ($auth) => {
    return $auth.user?.roleName === 'SUPERUSER';
  }
);

// ===== Helper Functions =====
function handleApiError(error: unknown): string {
  if (error instanceof ApiClientError) {
    switch (error.status) {
      case 401:
        return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
      case 403:
        return 'คุณไม่มีสิทธิ์ในการดำเนินการนี้';
      case 404:
        return 'ไม่พบข้อมูลที่ต้องการ';
      case 409:
        return 'ข้อมูลซ้ำกับที่มีอยู่แล้วในระบบ';
      case 422:
        return 'ข้อมูลที่ส่งมาไม่ถูกต้อง';
      case 500:
        return 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง';
      default:
        return error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}

// ===== Hospital Actions =====

/**
 * Load hospitals with pagination and filters
 */
export async function loadHospitals(params?: HospitalQueryParams): Promise<void> {
  console.log('DEBUG (hospitals.ts): loadHospitals called with params:', params);
  
  try {
    hospitalState.update(state => ({ ...state, isLoading: true, error: null }));
    
    const response = await apiClient.getHospitals(params);
    
    if (response.success && response.data) {
      hospitalState.update(state => ({
        ...state,
        hospitals: response.data.hospitals,
        pagination: response.data.pagination,
        filters: response.data.filters,
        isLoading: false,
        error: null,
      }));
      console.log('DEBUG (hospitals.ts): loadHospitals successful. Total hospitals:', response.data.hospitals.length);
    } else {
      throw new Error(response.message || 'Failed to load hospitals');
    }
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('DEBUG (hospitals.ts): loadHospitals error:', error);
    
    hospitalState.update(state => ({
      ...state,
      hospitals: [],
      pagination: null,
      isLoading: false,
      error: errorMessage,
    }));
  }
}

/**
 * Load single hospital by ID
 */
export async function loadHospitalById(id: number): Promise<Hospital | null> {
  console.log('DEBUG (hospitals.ts): loadHospitalById called with ID:', id);
  
  try {
    hospitalState.update(state => ({ ...state, isLoading: true, error: null }));
    
    const response = await apiClient.getHospitalById(id);
    
    if (response.success && response.data) {
      const hospital = response.data;
      hospitalState.update(state => ({
        ...state,
        currentHospital: hospital,
        isLoading: false,
        error: null,
      }));
      console.log('DEBUG (hospitals.ts): loadHospitalById successful:', hospital.hospitalName);
      return hospital;
    } else {
      throw new Error(response.message || 'Hospital not found');
    }
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('DEBUG (hospitals.ts): loadHospitalById error:', error);
    
    hospitalState.update(state => ({
      ...state,
      currentHospital: null,
      isLoading: false,
      error: errorMessage,
    }));
    return null;
  }
}

/**
 * Create new hospital
 */
export async function createHospital(data: CreateHospitalData): Promise<boolean> {
  console.log('DEBUG (hospitals.ts): createHospital called with data:', data.hospitalCode5Digit);
  
  try {
    hospitalFormState.update(state => ({ ...state, isLoading: true, error: null }));
    
    const response = await apiClient.createHospital(data);
    
    if (response.success && response.data) {
      hospitalFormState.update(state => ({
        ...state,
        isLoading: false,
        error: null,
      }));
      
      // Add to local state
      hospitalState.update(state => ({
        ...state,
        hospitals: [response.data, ...state.hospitals],
      }));
      
      console.log('DEBUG (hospitals.ts): createHospital successful:', response.data.hospitalName);
      return true;
    } else {
      throw new Error(response.message || 'Failed to create hospital');
    }
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('DEBUG (hospitals.ts): createHospital error:', error);
    
    hospitalFormState.update(state => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    return false;
  }
}

/**
 * Update hospital
 */
export async function updateHospital(id: number, data: UpdateHospitalData): Promise<boolean> {
  console.log('DEBUG (hospitals.ts): updateHospital called with ID:', id);
  
  try {
    hospitalFormState.update(state => ({ ...state, isLoading: true, error: null }));
    
    const response = await apiClient.updateHospital(id, data);
    
    if (response.success && response.data) {
      hospitalFormState.update(state => ({
        ...state,
        isLoading: false,
        error: null,
      }));
      
      // Update local state
      hospitalState.update(state => ({
        ...state,
        hospitals: state.hospitals.map(h => h.id === id ? response.data : h),
        currentHospital: state.currentHospital?.id === id ? response.data : state.currentHospital,
      }));
      
      console.log('DEBUG (hospitals.ts): updateHospital successful:', response.data.hospitalName);
      return true;
    } else {
      throw new Error(response.message || 'Failed to update hospital');
    }
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('DEBUG (hospitals.ts): updateHospital error:', error);
    
    hospitalFormState.update(state => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    return false;
  }
}

/**
 * Delete hospital
 */
export async function deleteHospital(id: number): Promise<boolean> {
  console.log('DEBUG (hospitals.ts): deleteHospital called with ID:', id);
  
  try {
    const response = await apiClient.deleteHospital(id);
    
    if (response.success) {
      // Remove from local state
      hospitalState.update(state => ({
        ...state,
        hospitals: state.hospitals.filter(h => h.id !== id),
      }));
      
      console.log('DEBUG (hospitals.ts): deleteHospital successful');
      return true;
    } else {
      throw new Error(response.message || 'Failed to delete hospital');
    }
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('DEBUG (hospitals.ts): deleteHospital error:', error);
    return false;
  }
}

/**
 * Check hospital code availability
 */
export async function checkHospitalCodeAvailability(code: string, excludeId?: number): Promise<void> {
  if (!code || code.length !== 5) {
    hospitalFormState.update(state => ({
      ...state,
      isCodeAvailable: null,
      isCheckingCode: false,
    }));
    return;
  }
  
  console.log('DEBUG (hospitals.ts): checkHospitalCodeAvailability called with code:', code);
  
  try {
    hospitalFormState.update(state => ({ ...state, isCheckingCode: true }));
    
    const response = await apiClient.checkHospitalCodeAvailability(code, excludeId);
    
    if (response.success && response.data) {
      hospitalFormState.update(state => ({
        ...state,
        isCodeAvailable: response.data.isAvailable,
        isCheckingCode: false,
      }));
      console.log('DEBUG (hospitals.ts): Code availability:', response.data.isAvailable);
    } else {
      throw new Error('Failed to check code availability');
    }
  } catch (error) {
    console.error('DEBUG (hospitals.ts): checkHospitalCodeAvailability error:', error);
    hospitalFormState.update(state => ({
      ...state,
      isCodeAvailable: null,
      isCheckingCode: false,
    }));
  }
}

/**
 * Load hospital statistics
 */
export async function loadHospitalStats(): Promise<void> {
  console.log('DEBUG (hospitals.ts): loadHospitalStats called');
  
  try {
    hospitalStatsState.update(state => ({ ...state, isLoading: true, error: null }));
    
    const response = await apiClient.getHospitalStats();
    
    if (response.success && response.data) {
      hospitalStatsState.update(state => ({
        ...state,
        stats: response.data,
        isLoading: false,
        error: null,
      }));
      console.log('DEBUG (hospitals.ts): loadHospitalStats successful. Total hospitals:', response.data.totalHospitals);
    } else {
      throw new Error(response.message || 'Failed to load hospital statistics');
    }
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('DEBUG (hospitals.ts): loadHospitalStats error:', error);
    
    hospitalStatsState.update(state => ({
      ...state,
      stats: null,
      isLoading: false,
      error: errorMessage,
    }));
  }
}

/**
 * Search hospitals (for autocomplete)
 */
export async function searchHospitals(query: string, limit: number = 10): Promise<Hospital[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await apiClient.searchHospitals(query, limit);
    
    if (response.success && response.data) {
      console.log('DEBUG (hospitals.ts): searchHospitals found:', response.data.count, 'results');
      // Transform search results to Hospital format
      return response.data.results.map(result => ({
        id: result.id,
        hospitalName: result.hospitalName,
        hospitalCode5Digit: result.hospitalCode5Digit,
        hospitalCode9eDigit: null,
        hospitalCode9Digit: null,
        organizationType: result.organizationType,
        healthServiceType: null,
        affiliation: null,
        departmentDivision: null,
        isActive: true,
      }));
    }
    return [];
  } catch (error) {
    console.error('DEBUG (hospitals.ts): searchHospitals error:', error);
    return [];
  }
}

/**
 * Get active hospitals (for dropdowns)
 */
export async function getActiveHospitals(): Promise<Hospital[]> {
  try {
    const response = await apiClient.getActiveHospitals();
    
    if (response.success && response.data) {
      console.log('DEBUG (hospitals.ts): getActiveHospitals found:', response.data.length, 'hospitals');
      // Transform active hospitals to Hospital format
      return response.data.map(hospital => ({
        id: hospital.id,
        hospitalName: hospital.hospitalName,
        hospitalCode5Digit: hospital.hospitalCode5Digit,
        hospitalCode9eDigit: null,
        hospitalCode9Digit: null,
        organizationType: hospital.organizationType,
        healthServiceType: null,
        affiliation: null,
        departmentDivision: null,
        isActive: true,
        _count: {
          users: hospital.userCount,
          patientVisits: hospital.patientCount,
          populations: 0,
        }
      }));
    }
    return [];
  } catch (error) {
    console.error('DEBUG (hospitals.ts): getActiveHospitals error:', error);
    return [];
  }
}

/**
 * Clear hospital errors
 */
export function clearHospitalErrors(): void {
  console.log('DEBUG (hospitals.ts): clearHospitalErrors called');
  hospitalState.update(state => ({ ...state, error: null }));
  hospitalFormState.update(state => ({ ...state, error: null }));
  hospitalStatsState.update(state => ({ ...state, error: null }));
}

/**
 * Clear current hospital
 */
export function clearCurrentHospital(): void {
  console.log('DEBUG (hospitals.ts): clearCurrentHospital called');
  hospitalState.update(state => ({ ...state, currentHospital: null }));
}

/**
 * Reset form state
 */
export function resetHospitalFormState(): void {
  console.log('DEBUG (hospitals.ts): resetHospitalFormState called');
  hospitalFormState.update(state => ({
    ...state,
    isLoading: false,
    error: null,
    isCodeAvailable: null,
    isCheckingCode: false,
  }));
}