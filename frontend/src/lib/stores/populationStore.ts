// src/lib/stores/populationStore.ts
// ✅ SECURITY: Complete Population store with proper error handling

import { writable, derived, get } from 'svelte/store';
import { apiClient } from '$lib/api/client';
import type { 
  Population,
  CreatePopulationData,
  UpdatePopulationData,
  PopulationQueryParams,
  PaginatedPopulationResponse,
  PopulationStats,
  IncidenceRateParams,
  IncidenceRateResult,
  AccessibleHospitalForPopulation
} from '$lib/api/types';

// ===== State Interfaces =====
interface PopulationState {
  populations: Population[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  filters: PopulationQueryParams;
  isLoading: boolean;
  error: string | null;
}

interface PopulationStatsState {
  stats: PopulationStats | null;
  isLoading: boolean;
  error: string | null;
}

interface PopulationFormState {
  isSubmitting: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
}

interface AccessibleHospitalsState {
  hospitals: AccessibleHospitalForPopulation[];
  isLoading: boolean;
  error: string | null;
}

interface IncidenceRateState {
  results: IncidenceRateResult[];
  parameters: IncidenceRateParams | null;
  isLoading: boolean;
  error: string | null;
}

// ===== Store Definitions =====
export const populationState = writable<PopulationState>({
  populations: [],
  pagination: null,
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'year',
    sortOrder: 'desc'
  },
  isLoading: false,
  error: null,
});

export const populationStatsState = writable<PopulationStatsState>({
  stats: null,
  isLoading: false,
  error: null,
});

export const populationFormState = writable<PopulationFormState>({
  isSubmitting: false,
  error: null,
  validationErrors: {},
});

export const accessibleHospitalsState = writable<AccessibleHospitalsState>({
  hospitals: [],
  isLoading: false,
  error: null,
});

export const incidenceRateState = writable<IncidenceRateState>({
  results: [],
  parameters: null,
  isLoading: false,
  error: null,
});

// ===== Derived Stores =====
export const populationSummary = derived(populationState, ($state) => ({
  isEmpty: $state.populations.length === 0 && !$state.isLoading,
  hasData: $state.populations.length > 0,
  totalRecords: $state.pagination?.total || 0,
  currentPage: $state.pagination?.page || 1,
  totalPages: $state.pagination?.pages || 0,
}));

export const canManagePopulations = derived([populationState], () => ({
  canView: true, // All ADMIN+ can view
  canCreate: true, // All ADMIN+ can create
  canEdit: true, // All ADMIN+ can edit
  canDelete: true, // Only SUPERUSER (enforced by route permissions)
  canExport: true, // All ADMIN+ can export
}));

// ===== Actions =====

/**
 * Load populations with filters
 */
export async function loadPopulations(customFilters?: Partial<PopulationQueryParams>): Promise<void> {
  try {
    populationState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    // Merge current filters with custom filters
    const currentState = get(populationState);
    const filters = { 
      ...currentState.filters, 
      ...customFilters 
    };

    const response = await apiClient.getPopulations(filters);

    if (response.success && response.data) {
      populationState.update(state => ({
        ...state,
        populations: response.data.populations,
        pagination: response.data.pagination,
        filters,
        isLoading: false,
        error: null,
      }));
    } else {
      throw new Error(response.message || 'Failed to load populations');
    }
  } catch (error) {
    console.error('Load populations error:', error);
    populationState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load populations',
    }));
  }
}

/**
 * Update filters and reload data
 */
export async function updateFilters(newFilters: Partial<PopulationQueryParams>): Promise<void> {
  const currentState = get(populationState);
  const updatedFilters = { ...currentState.filters, ...newFilters };
  
  populationState.update(state => ({
    ...state,
    filters: updatedFilters,
  }));
  
  await loadPopulations(updatedFilters);
}

/**
 * Load population by ID
 */
export async function loadPopulationById(id: number): Promise<Population | null> {
  try {
    const response = await apiClient.getPopulationById(id);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'Population not found');
    }
  } catch (error) {
    console.error('Load population by ID error:', error);
    return null;
  }
}

/**
 * Create new population
 */
export async function createPopulation(data: CreatePopulationData): Promise<Population | null> {
  try {
    populationFormState.update(state => ({ 
      ...state, 
      isSubmitting: true, 
      error: null,
      validationErrors: {}
    }));

    const response = await apiClient.createPopulation(data);

    if (response.success && response.data) {
      populationFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {},
      }));

      // Reload the list to show new population
      await loadPopulations();
      
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to create population');
    }
  } catch (error) {
    console.error('Create population error:', error);
    
    let errorMessage = 'Failed to create population';
    let validationErrors: Record<string, string> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle validation errors
      if (error.message.includes('already exists')) {
        validationErrors.general = 'ข้อมูลประชากรสำหรับปีและโรงพยาบาลนี้มีอยู่แล้ว';
      } else if (error.message.includes('not found')) {
        validationErrors.hospitalCode = 'ไม่พบโรงพยาบาลที่เลือก';
      }
    }

    populationFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: errorMessage,
      validationErrors,
    }));

    return null;
  }
}

/**
 * Update existing population
 */
export async function updatePopulation(id: number, data: UpdatePopulationData): Promise<Population | null> {
  try {
    populationFormState.update(state => ({ 
      ...state, 
      isSubmitting: true, 
      error: null,
      validationErrors: {}
    }));

    const response = await apiClient.updatePopulation(id, data);

    if (response.success && response.data) {
      populationFormState.update(state => ({
        ...state,
        isSubmitting: false,
        error: null,
        validationErrors: {},
      }));

      // Update the population in the list
      populationState.update(state => ({
        ...state,
        populations: state.populations.map(pop => 
          pop.id === id ? response.data : pop
        ),
      }));
      
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to update population');
    }
  } catch (error) {
    console.error('Update population error:', error);
    
    let errorMessage = 'Failed to update population';
    let validationErrors: Record<string, string> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('not found')) {
        validationErrors.general = 'ไม่พบข้อมูลประชากรที่ต้องการแก้ไข';
      } else if (error.message.includes('already exists')) {
        validationErrors.general = 'ข้อมูลประชากรสำหรับปีและโรงพยาบาลนี้มีอยู่แล้ว';
      }
    }

    populationFormState.update(state => ({
      ...state,
      isSubmitting: false,
      error: errorMessage,
      validationErrors,
    }));

    return null;
  }
}

/**
 * Delete population
 */
export async function deletePopulation(id: number): Promise<boolean> {
  try {
    const response = await apiClient.deletePopulation(id);

    if (response.success) {
      // Remove from the list
      populationState.update(state => ({
        ...state,
        populations: state.populations.filter(pop => pop.id !== id),
      }));
      
      // Update pagination if needed
      await loadPopulations();
      
      return true;
    } else {
      throw new Error(response.message || 'Failed to delete population');
    }
  } catch (error) {
    console.error('Delete population error:', error);
    
    populationState.update(state => ({
      ...state,
      error: error instanceof Error ? error.message : 'Failed to delete population',
    }));
    
    return false;
  }
}

/**
 * Load population statistics
 */
export async function loadPopulationStats(): Promise<void> {
  try {
    populationStatsState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const response = await apiClient.getPopulationStats();

    if (response.success && response.data) {
      populationStatsState.update(state => ({
        ...state,
        stats: response.data,
        isLoading: false,
        error: null,
      }));
    } else {
      throw new Error(response.message || 'Failed to load population statistics');
    }
  } catch (error) {
    console.error('Load population stats error:', error);
    populationStatsState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load statistics',
    }));
  }
}

/**
 * Load accessible hospitals for population management
 */
export async function loadAccessibleHospitals(): Promise<void> {
  try {
    accessibleHospitalsState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const response = await apiClient.getAccessibleHospitalsForPopulation();

    if (response.success && response.data) {
      accessibleHospitalsState.update(state => ({
        ...state,
        hospitals: response.data,
        isLoading: false,
        error: null,
      }));
    } else {
      throw new Error(response.message || 'Failed to load hospitals');
    }
  } catch (error) {
    console.error('Load accessible hospitals error:', error);
    accessibleHospitalsState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to load hospitals',
    }));
  }
}

/**
 * Calculate incidence rate
 */
export async function calculateIncidenceRate(params: IncidenceRateParams): Promise<IncidenceRateResult[]> {
  try {
    incidenceRateState.update(state => ({ 
      ...state, 
      isLoading: true, 
      error: null 
    }));

    const response = await apiClient.calculateIncidenceRate(params);

    if (response.success && response.data) {
      incidenceRateState.update(state => ({
        ...state,
        results: response.data.results,
        parameters: response.data.parameters,
        isLoading: false,
        error: null,
      }));
      
      return response.data.results;
    } else {
      throw new Error(response.message || 'Failed to calculate incidence rate');
    }
  } catch (error) {
    console.error('Calculate incidence rate error:', error);
    
    incidenceRateState.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to calculate incidence rate',
    }));
    
    return [];
  }
}

/**
 * Get population trends for a hospital
 */
export async function getPopulationTrends(
  hospitalCode: string, 
  startYear?: number, 
  endYear?: number
): Promise<Population[]> {
  try {
    const response = await apiClient.getPopulationTrends(hospitalCode, startYear, endYear);

    if (response.success && response.data) {
      return response.data.trends;
    } else {
      throw new Error(response.message || 'Failed to get population trends');
    }
  } catch (error) {
    console.error('Get population trends error:', error);
    return [];
  }
}

/**
 * Search populations
 */
export async function searchPopulations(query: string, limit: number = 10): Promise<Population[]> {
  try {
    const response = await apiClient.searchPopulations(query, limit);

    if (response.success && response.data) {
      return response.data.results;
    } else {
      throw new Error(response.message || 'Failed to search populations');
    }
  } catch (error) {
    console.error('Search populations error:', error);
    return [];
  }
}

/**
 * Export populations to CSV
 */
export async function exportPopulationsCSV(params?: PopulationQueryParams): Promise<boolean> {
  try {
    const blob = await apiClient.exportPopulationsCSV(params);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `populations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export populations CSV error:', error);
    return false;
  }
}

// ===== Error Clearing Functions =====
export function clearPopulationErrors(): void {
  populationState.update(state => ({ ...state, error: null }));
}

export function clearPopulationFormErrors(): void {
  populationFormState.update(state => ({ 
    ...state, 
    error: null, 
    validationErrors: {} 
  }));
}

export function clearStatsErrors(): void {
  populationStatsState.update(state => ({ ...state, error: null }));
}

export function clearHospitalErrors(): void {
  accessibleHospitalsState.update(state => ({ ...state, error: null }));
}

export function clearIncidenceRateErrors(): void {
  incidenceRateState.update(state => ({ ...state, error: null }));
}

export function clearAllPopulationErrors(): void {
  clearPopulationErrors();
  clearPopulationFormErrors();
  clearStatsErrors();
  clearHospitalErrors();
  clearIncidenceRateErrors();
}

// ===== Reset Functions =====
export function resetPopulationState(): void {
  populationState.set({
    populations: [],
    pagination: null,
    filters: {
      page: 1,
      limit: 20,
      sortBy: 'year',
      sortOrder: 'desc'
    },
    isLoading: false,
    error: null,
  });
}

export function resetPopulationForm(): void {
  populationFormState.set({
    isSubmitting: false,
    error: null,
    validationErrors: {},
  });
}

// ===== Utility Functions =====
export function formatPopulationNumber(num: number): string {
  return new Intl.NumberFormat('th-TH').format(num);
}

export function formatPopulationDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getPopulationYearOptions(yearsBack: number = 10): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from(
    { length: yearsBack + 2 }, 
    (_, i) => currentYear + 1 - i
  );
}

export function validatePopulationData(data: CreatePopulationData): Record<string, string> {
  const errors: Record<string, string> = {};
  const currentYear = new Date().getFullYear();

  // Year validation
  if (!data.year) {
    errors.year = 'กรุณาเลือกปี';
  } else if (data.year < 2000 || data.year > currentYear + 1) {
    errors.year = `ปีต้องอยู่ระหว่าง 2000 - ${currentYear + 1}`;
  }

  // Population validation
  if (!data.population || data.population <= 0) {
    errors.population = 'กรุณาใส่จำนวนประชากรที่มากกว่า 0';
  } else if (data.population > 100000000) {
    errors.population = 'จำนวนประชากรต้องไม่เกิน 100 ล้านคน';
  }

  // Hospital code validation - ✅ รองรับ 5-10 ตัว
  if (!data.hospitalCode) {
    errors.hospitalCode = 'กรุณาเลือกโรงพยาบาล';
  } else if (data.hospitalCode.length < 5 || data.hospitalCode.length > 10) {
    errors.hospitalCode = 'รหัสโรงพยาบาลต้องมี 5-10 ตัวอักษร';
  } else if (!/^[A-Z0-9]{5,10}$/.test(data.hospitalCode)) {
    errors.hospitalCode = 'รหัสโรงพยาบาลต้องเป็นตัวอักษรและตัวเลขเท่านั้น';
  }

  console.log('Frontend validation errors:', errors);
  console.log('Validation data:', data);

  return errors;
}