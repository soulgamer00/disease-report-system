// src/lib/stores/symptomStore.ts
// ✅ SECURITY: Complete symptom management store with validation

import { writable, derived, get } from 'svelte/store';
import { apiClient } from '$lib/api/client';
import type { 
  Symptom,
  CreateSymptomData,
  UpdateSymptomData,
  SymptomQueryParams,
  PaginatedSymptomResponse,
  SymptomStats,
  BulkCreateSymptomsData,
  SymptomsByDisease,
  SymptomSearchResult
} from '$lib/api/types';
import { authState } from './auth';

// ===== State Interfaces =====
interface SymptomState {
  symptoms: Symptom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  filters: SymptomQueryParams;
  isLoading: boolean;
  error: string | null;
}

interface SymptomStatsState {
  stats: SymptomStats | null;
  isLoading: boolean;
  error: string | null;
}

interface SymptomFormState {
  isSubmitting: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
}

interface SymptomByDiseaseState {
  data: Record<number, SymptomsByDisease[]>; // diseaseId -> symptoms
  isLoading: Record<number, boolean>;
  error: Record<number, string | null>;
}

// ===== Initial States =====
const initialSymptomState: SymptomState = {
  symptoms: [],
  pagination: null,
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  },
  isLoading: false,
  error: null,
};

const initialStatsState: SymptomStatsState = {
  stats: null,
  isLoading: false,
  error: null,
};

const initialFormState: SymptomFormState = {
  isSubmitting: false,
  error: null,
  validationErrors: {},
};

const initialByDiseaseState: SymptomByDiseaseState = {
  data: {},
  isLoading: {},
  error: {},
};

// ===== Stores =====
export const symptomState = writable<SymptomState>(initialSymptomState);
export const symptomStatsState = writable<SymptomStatsState>(initialStatsState);
export const symptomFormState = writable<SymptomFormState>(initialFormState);
export const symptomByDiseaseState = writable<SymptomByDiseaseState>(initialByDiseaseState);

// ===== Derived Stores =====
export const symptomSummary = derived(symptomState, ($state) => ({
  hasData: $state.symptoms.length > 0,
  isEmpty: $state.symptoms.length === 0 && !$state.isLoading,
  totalItems: $state.pagination?.total || 0,
  currentPage: $state.pagination?.page || 1,
  totalPages: $state.pagination?.pages || 0,
}));

export const canManageSymptoms = derived(authState, ($auth) => {
  const roleName = $auth.user?.roleName;
  return {
    canView: roleName === 'SUPERUSER',
    canCreate: roleName === 'SUPERUSER',
    canEdit: roleName === 'SUPERUSER',
    canDelete: roleName === 'SUPERUSER',
    isSuperuser: roleName === 'SUPERUSER',
  };
});

// ===== Validation Functions =====
export function validateSymptomData(data: Partial<CreateSymptomData | UpdateSymptomData>): Record<string, string> {
  const errors: Record<string, string> = {};

  // Disease ID validation
  if ('diseaseId' in data) {
    if (!data.diseaseId || data.diseaseId <= 0) {
      errors.diseaseId = 'กรุณาเลือกโรค';
    }
  }

  // Name validation
  if ('name' in data) {
    const name = data.name?.trim();
    if (!name) {
      errors.name = 'กรุณาระบุชื่ออาการ';
    } else if (name.length < 2) {
      errors.name = 'ชื่ออาการต้องมีอย่างน้อย 2 ตัวอักษร';
    } else if (name.length > 255) {
      errors.name = 'ชื่ออาการต้องไม่เกิน 255 ตัวอักษร';
    } else if (!/^[\u0E00-\u0E7Fa-zA-Z\s\-\(\)\.\,]+$/.test(name)) {
      errors.name = 'ชื่ออาการมีตัวอักษรที่ไม่อนุญาต';
    }
  }

  return errors;
}

export function validateBulkSymptomData(data: Partial<BulkCreateSymptomsData>): Record<string, string> {
  const errors: Record<string, string> = {};

  // Disease ID validation
  if (!data.diseaseId || data.diseaseId <= 0) {
    errors.diseaseId = 'กรุณาเลือกโรค';
  }

  // Symptoms validation
  if (!data.symptoms || !Array.isArray(data.symptoms) || data.symptoms.length === 0) {
    errors.symptoms = 'กรุณาระบุอาการอย่างน้อย 1 อาการ';
  } else {
    if (data.symptoms.length > 50) {
      errors.symptoms = 'ไม่สามารถเพิ่มอาการได้เกิน 50 อาการในครั้งเดียว';
    }

    // Check each symptom
    const symptomErrors: string[] = [];
    const names = new Set<string>();
    
    data.symptoms.forEach((symptom, index) => {
      const name = symptom.name?.trim();
      
      if (!name) {
        symptomErrors.push(`อาการที่ ${index + 1}: กรุณาระบุชื่ออาการ`);
      } else if (name.length < 2) {
        symptomErrors.push(`อาการที่ ${index + 1}: ชื่ออาการต้องมีอย่างน้อย 2 ตัวอักษร`);
      } else if (name.length > 255) {
        symptomErrors.push(`อาการที่ ${index + 1}: ชื่ออาการต้องไม่เกิน 255 ตัวอักษร`);
      } else if (!/^[\u0E00-\u0E7Fa-zA-Z\s\-\(\)\.\,]+$/.test(name)) {
        symptomErrors.push(`อาการที่ ${index + 1}: ชื่ออาการมีตัวอักษรที่ไม่อนุญาต`);
      } else if (names.has(name.toLowerCase())) {
        symptomErrors.push(`อาการที่ ${index + 1}: ชื่ออาการซ้ำกัน`);
      } else {
        names.add(name.toLowerCase());
      }
    });

    if (symptomErrors.length > 0) {
      errors.symptoms = symptomErrors.join(', ');
    }
  }

  return errors;
}

// ===== Action Functions =====

/**
 * Load symptoms with filters and pagination
 */
export async function loadSymptoms(params?: Partial<SymptomQueryParams>): Promise<boolean> {
  try {
    symptomState.update(state => ({
      ...state,
      isLoading: true,
      error: null
    }));

    const currentState = get(symptomState);
    const queryParams: SymptomQueryParams = {
      ...currentState.filters,
      ...params
    };

    const response = await apiClient.getSymptoms(queryParams);

    if (response.success && response.data) {
      symptomState.update(state => ({
        ...state,
        symptoms: response.data.symptoms,
        pagination: response.data.pagination,
        filters: { ...queryParams },
        isLoading: false,
        error: null
      }));

      return true;
    } else {
      throw new Error(response.message || 'ไม่สามารถโหลดข้อมูลอาการได้');
    }
  } catch (error) {
    console.error('Load symptoms error:', error);
    
    symptomState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
    }));

    return false;
  }
}

/**
 * Load symptom statistics
 */
export async function loadSymptomStats(): Promise<boolean> {
  try {
    symptomStatsState.update(state => ({
      ...state,
      isLoading: true,
      error: null
    }));

    const response = await apiClient.getSymptomStats();

    if (response.success && response.data) {
      symptomStatsState.update(state => ({
        ...state,
        stats: response.data,
        isLoading: false,
        error: null
      }));

      return true;
    } else {
      throw new Error(response.message || 'ไม่สามารถโหลดสถิติอาการได้');
    }
  } catch (error) {
    console.error('Load symptom stats error:', error);
    
    symptomStatsState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดสถิติ'
    }));

    return false;
  }
}

/**
 * Load symptom by ID
 */
export async function loadSymptomById(id: number): Promise<Symptom | null> {
  try {
    const response = await apiClient.getSymptomById(id);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'ไม่พบข้อมูลอาการ');
    }
  } catch (error) {
    console.error('Load symptom by ID error:', error);
    throw error;
  }
}

/**
 * Load symptoms by disease ID
 */
export async function loadSymptomsByDisease(diseaseId: number): Promise<SymptomsByDisease[]> {
  try {
    // Check if already loading this disease
    const currentState = get(symptomByDiseaseState);
    if (currentState.isLoading[diseaseId]) {
      return currentState.data[diseaseId] || [];
    }

    // Check if already loaded
    if (currentState.data[diseaseId]) {
      return currentState.data[diseaseId];
    }

    // Set loading state
    symptomByDiseaseState.update(state => ({
      ...state,
      isLoading: { ...state.isLoading, [diseaseId]: true },
      error: { ...state.error, [diseaseId]: null }
    }));

    const response = await apiClient.getSymptomsByDisease(diseaseId);

    if (response.success && response.data) {
      symptomByDiseaseState.update(state => ({
        ...state,
        data: { ...state.data, [diseaseId]: response.data },
        isLoading: { ...state.isLoading, [diseaseId]: false },
        error: { ...state.error, [diseaseId]: null }
      }));

      return response.data;
    } else {
      throw new Error(response.message || 'ไม่สามารถโหลดอาการของโรคได้');
    }
  } catch (error) {
    console.error('Load symptoms by disease error:', error);
    
    symptomByDiseaseState.update(state => ({
      ...state,
      isLoading: { ...state.isLoading, [diseaseId]: false },
      error: { 
        ...state.error, 
        [diseaseId]: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดอาการ'
      }
    }));

    throw error;
  }
}

/**
 * Create new symptom
 */
export async function createSymptom(data: CreateSymptomData): Promise<Symptom | null> {
  try {
    symptomFormState.update(state => ({
      ...state,
      isSubmitting: true,
      error: null,
      validationErrors: {}
    }));

    // Validate data
    const errors = validateSymptomData(data);
    if (Object.keys(errors).length > 0) {
      symptomFormState.update(state => ({
        ...state,
        isSubmitting: false,
        validationErrors: errors
      }));
      return null;
    }

    const response = await apiClient.createSymptom(data);

    if (response.success && response.data) {
      symptomFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {}
      }));

      // Invalidate cache for this disease
      symptomByDiseaseState.update(state => {
        const newData = { ...state.data };
        delete newData[data.diseaseId];
        return {
          ...state,
          data: newData
        };
      });

      // Reload current symptoms list if needed
      await loadSymptoms();
      await loadSymptomStats();

      return response.data;
    } else {
      throw new Error(response.message || 'ไม่สามารถเพิ่มอาการได้');
    }
  } catch (error) {
    console.error('Create symptom error:', error);
    
    symptomFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเพิ่มอาการ'
    }));

    return null;
  }
}

/**
 * Update symptom
 */
export async function updateSymptom(id: number, data: UpdateSymptomData): Promise<Symptom | null> {
  try {
    symptomFormState.update(state => ({
      ...state,
      isSubmitting: true,
      error: null,
      validationErrors: {}
    }));

    // Validate data
    const errors = validateSymptomData(data);
    if (Object.keys(errors).length > 0) {
      symptomFormState.update(state => ({
        ...state,
        isSubmitting: false,
        validationErrors: errors
      }));
      return null;
    }

    const response = await apiClient.updateSymptom(id, data);

    if (response.success && response.data) {
      symptomFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {}
      }));

      // Update local state
      symptomState.update(state => ({
        ...state,
        symptoms: state.symptoms.map(symptom => 
          symptom.id === id ? response.data : symptom
        )
      }));

      // Invalidate cache for this disease
      if (data.diseaseId) {
        symptomByDiseaseState.update(state => {
          const newData = { ...state.data };
          delete newData[data.diseaseId!];
          return {
            ...state,
            data: newData
          };
        });
      }

      await loadSymptomStats();

      return response.data;
    } else {
      throw new Error(response.message || 'ไม่สามารถแก้ไขอาการได้');
    }
  } catch (error) {
    console.error('Update symptom error:', error);
    
    symptomFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแก้ไขอาการ'
    }));

    return null;
  }
}

/**
 * Delete symptom
 */
export async function deleteSymptom(id: number): Promise<boolean> {
  try {
    const response = await apiClient.deleteSymptom(id);

    if (response.success) {
      // Remove from local state
      symptomState.update(state => ({
        ...state,
        symptoms: state.symptoms.filter(symptom => symptom.id !== id)
      }));

      // Clear all disease cache since we don't know which disease this symptom belongs to
      symptomByDiseaseState.update(state => ({
        ...state,
        data: {}
      }));

      await loadSymptomStats();

      return true;
    } else {
      throw new Error(response.message || 'ไม่สามารถลบอาการได้');
    }
  } catch (error) {
    console.error('Delete symptom error:', error);
    throw error;
  }
}

/**
 * Bulk create symptoms
 */
export async function bulkCreateSymptoms(data: BulkCreateSymptomsData): Promise<Symptom[] | null> {
  try {
    symptomFormState.update(state => ({
      ...state,
      isSubmitting: true,
      error: null,
      validationErrors: {}
    }));

    // Validate data
    const errors = validateBulkSymptomData(data);
    if (Object.keys(errors).length > 0) {
      symptomFormState.update(state => ({
        ...state,
        isSubmitting: false,
        validationErrors: errors
      }));
      return null;
    }

    const response = await apiClient.bulkCreateSymptoms(data);

    if (response.success && response.data) {
      symptomFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {}
      }));

      // Invalidate cache for this disease
      symptomByDiseaseState.update(state => {
        const newData = { ...state.data };
        delete newData[data.diseaseId];
        return {
          ...state,
          data: newData
        };
      });

      // Reload current symptoms list and stats
      await loadSymptoms();
      await loadSymptomStats();

      return response.data.createdSymptoms;
    } else {
      throw new Error(response.message || 'ไม่สามารถเพิ่มอาการแบบกลุ่มได้');
    }
  } catch (error) {
    console.error('Bulk create symptoms error:', error);
    
    symptomFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเพิ่มอาการแบบกลุ่ม'
    }));

    return null;
  }
}

/**
 * Search symptoms
 */
export async function searchSymptoms(
  query: string, 
  diseaseId?: number, 
  limit: number = 10
): Promise<SymptomSearchResult[]> {
  try {
    const response = await apiClient.searchSymptoms(query, diseaseId, limit);

    if (response.success && response.data) {
      return response.data.results;
    } else {
      throw new Error(response.message || 'ไม่สามารถค้นหาอาการได้');
    }
  } catch (error) {
    console.error('Search symptoms error:', error);
    return [];
  }
}

/**
 * Check symptom name availability
 */
export async function checkSymptomNameAvailability(
  diseaseId: number,
  name: string,
  excludeId?: number
): Promise<{
  diseaseId: number;
  name: string;
  excludeId: number | null;
  isAvailable: boolean;
} | null> {
  try {
    const response = await apiClient.checkSymptomNameAvailability(diseaseId, name, excludeId);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'ไม่สามารถตรวจสอบชื่ออาการได้');
    }
  } catch (error) {
    console.error('Check symptom name availability error:', error);
    return null;
  }
}

/**
 * Update filters and reload symptoms
 */
export async function updateSymptomFilters(newFilters: Partial<SymptomQueryParams>): Promise<boolean> {
  return await loadSymptoms(newFilters);
}

/**
 * Clear all errors
 */
export function clearSymptomErrors(): void {
  symptomState.update(state => ({
    ...state,
    error: null
  }));

  symptomStatsState.update(state => ({
    ...state,
    error: null
  }));
}

/**
 * Clear form errors
 */
export function clearSymptomFormErrors(): void {
  symptomFormState.update(state => ({
    ...state,
    error: null,
    validationErrors: {}
  }));
}

/**
 * Reset all states
 */
export function resetSymptomStores(): void {
  symptomState.set(initialSymptomState);
  symptomStatsState.set(initialStatsState);
  symptomFormState.set(initialFormState);
  symptomByDiseaseState.set(initialByDiseaseState);
}