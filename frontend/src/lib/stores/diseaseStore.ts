// src/lib/stores/diseaseStore.ts
// ✅ SECURITY: Complete Disease store with proper error handling

import { writable, derived, get } from 'svelte/store';
import { apiClient } from '$lib/api/client';
import type { 
  Disease,
  CreateDiseaseData,
  UpdateDiseaseData,
  DiseaseQueryParams,
  PaginatedDiseaseResponse,
  DiseaseStats,
  DiseaseSearchResult,
  ActiveDisease,
  DiseaseNameAvailability,
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

// ===== State Interfaces =====
interface DiseaseState {
  diseases: Disease[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  filters: DiseaseQueryParams;
  isLoading: boolean;
  error: string | null;
}

interface DiseaseStatsState {
  stats: DiseaseStats | null;
  isLoading: boolean;
  error: string | null;
}

interface DiseaseFormState {
  isSubmitting: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
}

interface ActiveDiseasesState {
  diseases: ActiveDisease[];
  isLoading: boolean;
  error: string | null;
}

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

// ===== Store Definitions =====
export const diseaseState = writable<DiseaseState>({
  diseases: [],
  pagination: null,
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'thaiName',
    sortOrder: 'asc'
  },
  isLoading: false,
  error: null,
});

export const diseaseStatsState = writable<DiseaseStatsState>({
  stats: null,
  isLoading: false,
  error: null,
});

export const diseaseFormState = writable<DiseaseFormState>({
  isSubmitting: false,
  error: null,
  validationErrors: {},
});

export const activeDiseasesState = writable<ActiveDiseasesState>({
  diseases: [],
  isLoading: false,
  error: null,
});

export const symptomState = writable<SymptomState>({
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
});

export const symptomStatsState = writable<SymptomStatsState>({
  stats: null,
  isLoading: false,
  error: null,
});

export const symptomFormState = writable<SymptomFormState>({
  isSubmitting: false,
  error: null,
  validationErrors: {},
});

// ===== Derived Stores =====
export const diseaseSummary = derived(diseaseState, ($state) => ({
  isEmpty: $state.diseases.length === 0 && !$state.isLoading,
  hasData: $state.diseases.length > 0,
  totalRecords: $state.pagination?.total || 0,
  currentPage: $state.pagination?.page || 1,
  totalPages: $state.pagination?.pages || 0,
}));

export const symptomSummary = derived(symptomState, ($state) => ({
  isEmpty: $state.symptoms.length === 0 && !$state.isLoading,
  hasData: $state.symptoms.length > 0,
  totalRecords: $state.pagination?.total || 0,
  currentPage: $state.pagination?.page || 1,
  totalPages: $state.pagination?.pages || 0,
}));

export const canManageDiseases = derived([diseaseState], () => ({
  canView: true, // SUPERUSER only (enforced by route permissions)
  canCreate: true, // SUPERUSER only
  canEdit: true, // SUPERUSER only
  canDelete: true, // SUPERUSER only
  canExport: true, // SUPERUSER only
}));

export const canManageSymptoms = derived([symptomState], () => ({
  canView: true, // SUPERUSER only (enforced by route permissions)
  canCreate: true, // SUPERUSER only
  canEdit: true, // SUPERUSER only
  canDelete: true, // SUPERUSER only
  canBulkCreate: true, // SUPERUSER only
}));

// ===== Disease Actions =====

/**
 * Load diseases with filters
 */
export async function loadDiseases(customFilters?: Partial<DiseaseQueryParams>): Promise<void> {
  try {
    diseaseState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const currentState = get(diseaseState);
    const filters = { 
      ...currentState.filters, 
      ...customFilters 
    };

    const response = await apiClient.getDiseases(filters);

    if (response.success && response.data) {
      diseaseState.update(state => ({
        ...state,
        diseases: response.data.diseases,
        pagination: response.data.pagination,
        filters,
        isLoading: false,
        error: null,
      }));
    } else {
      throw new Error(response.message || 'Failed to load diseases');
    }
  } catch (error) {
    console.error('Load diseases error:', error);
    diseaseState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load diseases',
    }));
  }
}

/**
 * Update disease filters and reload data
 */
export async function updateDiseaseFilters(newFilters: Partial<DiseaseQueryParams>): Promise<void> {
  const currentState = get(diseaseState);
  const updatedFilters = { ...currentState.filters, ...newFilters };
  
  diseaseState.update(state => ({
    ...state,
    filters: updatedFilters,
  }));
  
  await loadDiseases(updatedFilters);
}

/**
 * Load disease by ID
 */
export async function loadDiseaseById(id: number): Promise<Disease | null> {
  try {
    const response = await apiClient.getDiseaseById(id);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'Disease not found');
    }
  } catch (error) {
    console.error('Load disease by ID error:', error);
    return null;
  }
}

/**
 * Create new disease
 */
export async function createDisease(data: CreateDiseaseData): Promise<Disease | null> {
  try {
    diseaseFormState.update(state => ({ 
      ...state, 
      isSubmitting: true, 
      error: null,
      validationErrors: {}
    }));

    const response = await apiClient.createDisease(data);

    if (response.success && response.data) {
      diseaseFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {},
      }));

      // Reload the list to show new disease
      await loadDiseases();
      
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to create disease');
    }
  } catch (error) {
    console.error('Create disease error:', error);
    
    let errorMessage = 'Failed to create disease';
    let validationErrors: Record<string, string> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('already exists')) {
        validationErrors.thaiName = 'ชื่อโรคนี้มีอยู่ในระบบแล้ว';
      }
    }

    diseaseFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: errorMessage,
      validationErrors,
    }));

    return null;
  }
}

/**
 * Update existing disease
 */
export async function updateDisease(id: number, data: UpdateDiseaseData): Promise<Disease | null> {
  try {
    diseaseFormState.update(state => ({ 
      ...state, 
      isSubmitting: true, 
      error: null,
      validationErrors: {}
    }));

    const response = await apiClient.updateDisease(id, data);

    if (response.success && response.data) {
      diseaseFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {},
      }));

      // Update the disease in the list
      diseaseState.update(state => ({
        ...state,
        diseases: state.diseases.map(disease => 
          disease.id === id ? response.data : disease
        ),
      }));
      
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to update disease');
    }
  } catch (error) {
    console.error('Update disease error:', error);
    
    let errorMessage = 'Failed to update disease';
    let validationErrors: Record<string, string> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('not found')) {
        validationErrors.general = 'ไม่พบโรคที่ต้องการแก้ไข';
      } else if (error.message.includes('already exists')) {
        validationErrors.thaiName = 'ชื่อโรคนี้มีอยู่ในระบบแล้ว';
      }
    }

    diseaseFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: errorMessage,
      validationErrors,
    }));

    return null;
  }
}

/**
 * Delete disease
 */
export async function deleteDisease(id: number): Promise<boolean> {
  try {
    const response = await apiClient.deleteDisease(id);

    if (response.success) {
      // Remove from the list
      diseaseState.update(state => ({
        ...state,
        diseases: state.diseases.filter(disease => disease.id !== id),
      }));
      
      // Update pagination if needed
      await loadDiseases();
      
      return true;
    } else {
      throw new Error(response.message || 'Failed to delete disease');
    }
  } catch (error) {
    console.error('Delete disease error:', error);
    
    diseaseState.update(state => ({
      ...state,
      error: error instanceof Error ? error.message : 'Failed to delete disease',
    }));
    
    return false;
  }
}

/**
 * Load disease statistics
 */
export async function loadDiseaseStats(): Promise<void> {
  try {
    diseaseStatsState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const response = await apiClient.getDiseaseStats();

    if (response.success && response.data) {
      diseaseStatsState.update(state => ({
        ...state,
        stats: response.data,
        isLoading: false,
        error: null,
      }));
    } else {
      throw new Error(response.message || 'Failed to load disease statistics');
    }
  } catch (error) {
    console.error('Load disease stats error:', error);
    diseaseStatsState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load statistics',
    }));
  }
}

/**
 * Load active diseases (for dropdowns)
 */
export async function loadActiveDiseases(): Promise<void> {
  try {
    activeDiseasesState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const response = await apiClient.getActiveDiseases();

    if (response.success && response.data) {
      activeDiseasesState.update(state => ({
        ...state,
        diseases: response.data,
        isLoading: false,
        error: null,
      }));
    } else {
      throw new Error(response.message || 'Failed to load active diseases');
    }
  } catch (error) {
    console.error('Load active diseases error:', error);
    activeDiseasesState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load active diseases',
    }));
  }
}

/**
 * Search diseases
 */
export async function searchDiseases(query: string, limit: number = 10): Promise<DiseaseSearchResult[]> {
  try {
    const response = await apiClient.searchDiseases(query, limit);

    if (response.success && response.data) {
      return response.data.results;
    } else {
      throw new Error(response.message || 'Failed to search diseases');
    }
  } catch (error) {
    console.error('Search diseases error:', error);
    return [];
  }
}

/**
 * Check disease name availability
 */
export async function checkDiseaseNameAvailability(
  thaiName: string, 
  engName?: string, 
  excludeId?: number
): Promise<DiseaseNameAvailability | null> {
  try {
    const response = await apiClient.checkDiseaseNameAvailability(thaiName, engName, excludeId);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to check name availability');
    }
  } catch (error) {
    console.error('Check disease name availability error:', error);
    return null;
  }
}

// ===== Symptom Actions =====

/**
 * Load symptoms with filters
 */
export async function loadSymptoms(customFilters?: Partial<SymptomQueryParams>): Promise<void> {
  try {
    symptomState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const currentState = get(symptomState);
    const filters = { 
      ...currentState.filters, 
      ...customFilters 
    };

    const response = await apiClient.getSymptoms(filters);

    if (response.success && response.data) {
      symptomState.update(state => ({
        ...state,
        symptoms: response.data.symptoms,
        pagination: response.data.pagination,
        filters,
        isLoading: false,
        error: null,
      }));
    } else {
      throw new Error(response.message || 'Failed to load symptoms');
    }
  } catch (error) {
    console.error('Load symptoms error:', error);
    symptomState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load symptoms',
    }));
  }
}

/**
 * Update symptom filters and reload data
 */
export async function updateSymptomFilters(newFilters: Partial<SymptomQueryParams>): Promise<void> {
  const currentState = get(symptomState);
  const updatedFilters = { ...currentState.filters, ...newFilters };
  
  symptomState.update(state => ({
    ...state,
    filters: updatedFilters,
  }));
  
  await loadSymptoms(updatedFilters);
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

    const response = await apiClient.createSymptom(data);

    if (response.success && response.data) {
      symptomFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {},
      }));

      // Reload the list to show new symptom
      await loadSymptoms();
      
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to create symptom');
    }
  } catch (error) {
    console.error('Create symptom error:', error);
    
    let errorMessage = 'Failed to create symptom';
    let validationErrors: Record<string, string> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('already exists')) {
        validationErrors.name = 'อาการนี้มีอยู่ในโรคนี้แล้ว';
      } else if (error.message.includes('not found')) {
        validationErrors.diseaseId = 'ไม่พบโรคที่เลือก';
      }
    }

    symptomFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: errorMessage,
      validationErrors,
    }));

    return null;
  }
}

/**
 * Bulk create symptoms for a disease
 */
export async function bulkCreateSymptoms(data: BulkCreateSymptomsData): Promise<Symptom[]> {
  try {
    symptomFormState.update(state => ({ 
      ...state, 
      isSubmitting: true, 
      error: null,
      validationErrors: {}
    }));

    const response = await apiClient.bulkCreateSymptoms(data);

    if (response.success && response.data) {
      symptomFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {},
      }));

      // Reload the list to show new symptoms
      await loadSymptoms();
      
      return response.data.createdSymptoms;
    } else {
      throw new Error(response.message || 'Failed to create symptoms');
    }
  } catch (error) {
    console.error('Bulk create symptoms error:', error);
    
    let errorMessage = 'Failed to create symptoms';
    let validationErrors: Record<string, string> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('already exist')) {
        validationErrors.symptoms = 'บางอาการมีอยู่ในโรคนี้แล้ว';
      } else if (error.message.includes('not found')) {
        validationErrors.diseaseId = 'ไม่พบโรคที่เลือก';
      }
    }

    symptomFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: errorMessage,
      validationErrors,
    }));

    return [];
  }
}

/**
 * Get symptoms by disease ID
 */
export async function getSymptomsByDisease(diseaseId: number): Promise<SymptomsByDisease[]> {
  try {
    const response = await apiClient.getSymptomsByDisease(diseaseId);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to get symptoms by disease');
    }
  } catch (error) {
    console.error('Get symptoms by disease error:', error);
    return [];
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
      throw new Error(response.message || 'Failed to search symptoms');
    }
  } catch (error) {
    console.error('Search symptoms error:', error);
    return [];
  }
}

/**
 * Load symptom statistics
 */
export async function loadSymptomStats(): Promise<void> {
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
        error: null,
      }));
    } else {
      throw new Error(response.message || 'Failed to load symptom statistics');
    }
  } catch (error) {
    console.error('Load symptom stats error:', error);
    symptomStatsState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load statistics',
    }));
  }
}

// ===== Error Clearing Functions =====
export function clearDiseaseErrors(): void {
  diseaseState.update(state => ({ ...state, error: null }));
}

export function clearDiseaseFormErrors(): void {
  diseaseFormState.update(state => ({ 
    ...state, 
    error: null, 
    validationErrors: {} 
  }));
}

export function clearSymptomErrors(): void {
  symptomState.update(state => ({ ...state, error: null }));
}

export function clearSymptomFormErrors(): void {
  symptomFormState.update(state => ({ 
    ...state, 
    error: null, 
    validationErrors: {} 
  }));
}

export function clearAllDiseaseErrors(): void {
  clearDiseaseErrors();
  clearDiseaseFormErrors();
  clearSymptomErrors();
  clearSymptomFormErrors();
}

// ===== Validation Functions =====
export function validateDiseaseData(data: CreateDiseaseData): Record<string, string> {
  const errors: Record<string, string> = {};

  // Thai name validation
  if (!data.thaiName?.trim()) {
    errors.thaiName = 'กรุณาใส่ชื่อโรคภาษาไทย';
  } else if (data.thaiName.length < 2) {
    errors.thaiName = 'ชื่อโรคต้องมีอย่างน้อย 2 ตัวอักษร';
  } else if (data.thaiName.length > 100) {
    errors.thaiName = 'ชื่อโรคต้องไม่เกิน 100 ตัวอักษร';
  }

  // English name validation (optional)
  if (data.engName && data.engName.length > 100) {
    errors.engName = 'ชื่อโรคภาษาอังกฤษต้องไม่เกิน 100 ตัวอักษร';
  }

  // Details validation (optional)
  if (data.details && data.details.length > 1000) {
    errors.details = 'รายละเอียดต้องไม่เกิน 1000 ตัวอักษร';
  }

  return errors;
}

export function validateSymptomData(data: CreateSymptomData): Record<string, string> {
  const errors: Record<string, string> = {};

  // Disease ID validation
  if (!data.diseaseId || data.diseaseId <= 0) {
    errors.diseaseId = 'กรุณาเลือกโรค';
  }

  // Symptom name validation
  if (!data.name?.trim()) {
    errors.name = 'กรุณาใส่ชื่ออาการ';
  } else if (data.name.length < 2) {
    errors.name = 'ชื่ออาการต้องมีอย่างน้อย 2 ตัวอักษร';
  } else if (data.name.length > 255) {
    errors.name = 'ชื่ออาการต้องไม่เกิน 255 ตัวอักษร';
  }

  return errors;
}