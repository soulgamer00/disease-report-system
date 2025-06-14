// src/lib/api/endpoints.ts - ✅ COMPLETE Patient & All Endpoints
// ✅ SECURITY: API endpoints constants - NO hardcoded URLs

export const API_ENDPOINTS = {
  // ===== Authentication =====
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    REGISTER: '/api/auth/register'
  },

  // ===== Users =====
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    GET: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    ME: '/api/users/me',
    CHANGE_PASSWORD: (id: string) => `/api/users/${id}/change-password`,
    RESET_PASSWORD: '/api/users/reset-password',
    SEARCH: '/api/users/search',
    STATS: '/api/users/stats',
    BULK_ACTION: '/api/users/bulk-action',
    CHECK_USERNAME: '/api/users/check-username',
    CHECK_EMAIL: '/api/users/check-email',
    ACCESSIBLE_HOSPITALS: '/api/users/accessible-hospitals'
  },

  // ===== Hospitals =====
  HOSPITALS: {
    LIST: '/api/hospitals',
    CREATE: '/api/hospitals',
    GET: (id: number) => `/api/hospitals/${id}`,
    UPDATE: (id: number) => `/api/hospitals/${id}`,
    DELETE: (id: number) => `/api/hospitals/${id}`,
    BY_CODE: (code: string) => `/api/hospitals/code/${code}`,
    ACTIVE: '/api/hospitals/active',
    SEARCH: '/api/hospitals/search',
    STATS: '/api/hospitals/stats',
    CHECK_CODE: '/api/hospitals/check-code',
    BULK_CREATE: '/api/hospitals/bulk',
    ASSIGN_USER: '/api/hospitals/assign-user',
    EXPORT_CSV: '/api/hospitals/export/csv'
  },

  // ===== 🚀 DISEASES - Complete Endpoints =====
  DISEASES: {
    // CRUD Operations
    LIST: '/api/diseases',
    CREATE: '/api/diseases',
    GET: (id: number) => `/api/diseases/${id}`,
    UPDATE: (id: number) => `/api/diseases/${id}`,
    DELETE: (id: number) => `/api/diseases/${id}`,
    
    // Public/Read-only Endpoints (for dropdowns)
    ACTIVE: '/api/diseases/active',
    SEARCH: '/api/diseases/search',
    
    // Administrative Endpoints
    STATS: '/api/diseases/stats',
    CHECK_NAME: '/api/diseases/check-name',
    TOGGLE_STATUS: (id: number) => `/api/diseases/${id}/toggle-status`,
    
    // Import/Export Operations
    BULK_CREATE: '/api/diseases/bulk',
    EXPORT_CSV: '/api/diseases/export/csv',
    IMPORT_CSV: '/api/diseases/import/csv',
    
    // Analytics
    USAGE_ANALYTICS: '/api/diseases/analytics/usage',
    PATIENT_DISTRIBUTION: '/api/diseases/analytics/patient-distribution',
    
    // Advanced Search
    ADVANCED_SEARCH: '/api/diseases/advanced-search',
    AUTOCOMPLETE: '/api/diseases/autocomplete',
    
    // Related Data
    WITH_SYMPTOMS: '/api/diseases/with-symptoms',
    WITHOUT_SYMPTOMS: '/api/diseases/without-symptoms',
    MOST_COMMON: '/api/diseases/most-common',
    RECENTLY_ADDED: '/api/diseases/recently-added'
  },

  // ===== 🚀 SYMPTOMS - Complete Endpoints =====
  SYMPTOMS: {
    // CRUD Operations
    LIST: '/api/symptoms',
    CREATE: '/api/symptoms',
    GET: (id: number) => `/api/symptoms/${id}`,
    UPDATE: (id: number) => `/api/symptoms/${id}`,
    DELETE: (id: number) => `/api/symptoms/${id}`,
    
    // Disease-specific Endpoints (for patient forms)
    BY_DISEASE: (diseaseId: number) => `/api/symptoms/by-disease/${diseaseId}`,
    SEARCH: '/api/symptoms/search',
    
    // Administrative Endpoints
    STATS: '/api/symptoms/stats',
    CHECK_NAME: '/api/symptoms/check-name',
    TOGGLE_STATUS: (id: number) => `/api/symptoms/${id}/toggle-status`,
    
    // Bulk Operations
    BULK_CREATE: '/api/symptoms/bulk',
    BULK_UPDATE: '/api/symptoms/bulk-update',
    BULK_DELETE: '/api/symptoms/bulk-delete',
    
    // Import/Export Operations
    EXPORT_CSV: '/api/symptoms/export/csv',
    IMPORT_CSV: '/api/symptoms/import/csv',
    EXPORT_BY_DISEASE: (diseaseId: number) => `/api/symptoms/export/disease/${diseaseId}`,
    
    // Advanced Search & Filtering
    ADVANCED_SEARCH: '/api/symptoms/advanced-search',
    AUTOCOMPLETE: '/api/symptoms/autocomplete',
    FILTER_BY_DISEASE: '/api/symptoms/filter/disease',
    
    // Analytics
    USAGE_ANALYTICS: '/api/symptoms/analytics/usage',
    DISEASE_COVERAGE: '/api/symptoms/analytics/disease-coverage',
    COMMON_SYMPTOMS: '/api/symptoms/analytics/common',
    PATIENT_SYMPTOMS: '/api/symptoms/analytics/patient-usage',
    
    // Utility Endpoints
    VALIDATE_BULK: '/api/symptoms/validate-bulk',
    DUPLICATE_CHECK: '/api/symptoms/duplicate-check',
    MERGE_SUGGESTIONS: '/api/symptoms/merge-suggestions'
  },

  // ===== 🚀 PATIENTS - Complete Endpoints =====
  PATIENTS: {
    // CRUD Operations
    LIST: '/api/patients',
    CREATE: '/api/patients',
    GET: (id: string) => `/api/patients/${id}`,
    UPDATE: (id: string) => `/api/patients/${id}`,
    DELETE: (id: string) => `/api/patients/${id}`,
    
    // Search & Filter Operations
    SEARCH: '/api/patients/search',
    ADVANCED_SEARCH: '/api/patients/advanced-search',
    
    // Analytics & Statistics
    STATS: '/api/patients/stats',
    RECENT: '/api/patients/recent',
    BY_HOSPITAL: (hospitalCode: string) => `/api/patients/hospital/${hospitalCode}`,
    BY_DISEASE: (diseaseId: number) => `/api/patients/disease/${diseaseId}`,
    
    // Data Validation
    CHECK_ID_CARD: (idCard: string) => `/api/patients/check/${idCard}`,
    VALIDATE_PATIENT: '/api/patients/validate',
    
    // Import/Export Operations
    TEMPLATE: '/api/patients/template',
    EXPORT: '/api/patients/export',
    IMPORT: '/api/patients/import',
    EXPORT_CSV: '/api/patients/export/csv',
    EXPORT_EXCEL: '/api/patients/export/excel',
    BULK_IMPORT: '/api/patients/bulk',
    
    // Advanced Features
    DUPLICATE_CHECK: '/api/patients/duplicate-check',
    MERGE_PATIENTS: '/api/patients/merge',
    ARCHIVE: '/api/patients/archive',
    RESTORE: '/api/patients/restore',
    
    // Analytics
    DISEASE_DISTRIBUTION: '/api/patients/analytics/disease-distribution',
    HOSPITAL_DISTRIBUTION: '/api/patients/analytics/hospital-distribution',
    CONDITION_TRENDS: '/api/patients/analytics/condition-trends',
    AGE_GENDER_ANALYSIS: '/api/patients/analytics/age-gender',
    GEOGRAPHICAL_ANALYSIS: '/api/patients/analytics/geographical',
    TREATMENT_OUTCOMES: '/api/patients/analytics/treatment-outcomes'
  },

  // ===== Populations =====
  POPULATIONS: {
    LIST: '/api/populations',
    CREATE: '/api/populations',
    GET: (id: number) => `/api/populations/${id}`,
    UPDATE: (id: number) => `/api/populations/${id}`,
    DELETE: (id: number) => `/api/populations/${id}`,
    STATS: '/api/populations/stats',
    INCIDENCE_RATE: '/api/populations/incidence-rate',
    TRENDS: (hospitalCode: string) => `/api/populations/trends/${hospitalCode}`,
    BY_HOSPITAL_YEAR: (hospitalCode: string, year: number) => `/api/populations/hospital/${hospitalCode}/year/${year}`,
    ACCESSIBLE_HOSPITALS: '/api/populations/accessible-hospitals',
    SEARCH: '/api/populations/search',
    BULK_IMPORT: '/api/populations/bulk',
    EXPORT_CSV: '/api/populations/export/csv'
  }
} as const;

// ===== 🚀 Type-safe endpoint builders =====
export class EndpointBuilder {
  /**
   * Build disease endpoint with parameters
   */
  static disease = {
    withSymptoms: (includeInactive = false) => 
      `${API_ENDPOINTS.DISEASES.WITH_SYMPTOMS}?includeInactive=${includeInactive}`,
    
    mostCommon: (limit = 10, timeframe = '1year') => 
      `${API_ENDPOINTS.DISEASES.MOST_COMMON}?limit=${limit}&timeframe=${timeframe}`,
    
    recentlyAdded: (days = 30, limit = 10) => 
      `${API_ENDPOINTS.DISEASES.RECENTLY_ADDED}?days=${days}&limit=${limit}`,
    
    autocomplete: (query: string, limit = 5) => 
      `${API_ENDPOINTS.DISEASES.AUTOCOMPLETE}?q=${encodeURIComponent(query)}&limit=${limit}`,
    
    exportCsv: (filters?: Record<string, any>) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      return `${API_ENDPOINTS.DISEASES.EXPORT_CSV}?${params.toString()}`;
    }
  };

  /**
   * Build symptom endpoint with parameters
   */
  static symptom = {
    search: (query: string, diseaseId?: number, limit = 10) => {
      const params = new URLSearchParams();
      params.append('q', query);
      if (diseaseId) params.append('diseaseId', diseaseId.toString());
      params.append('limit', limit.toString());
      return `${API_ENDPOINTS.SYMPTOMS.SEARCH}?${params.toString()}`;
    },
    
    autocomplete: (query: string, diseaseId?: number, limit = 5) => {
      const params = new URLSearchParams();
      params.append('q', query);
      if (diseaseId) params.append('diseaseId', diseaseId.toString());
      params.append('limit', limit.toString());
      return `${API_ENDPOINTS.SYMPTOMS.AUTOCOMPLETE}?${params.toString()}`;
    },
    
    checkName: (diseaseId: number, name: string, excludeId?: number) => {
      const params = new URLSearchParams();
      params.append('diseaseId', diseaseId.toString());
      params.append('name', name);
      if (excludeId) params.append('excludeId', excludeId.toString());
      return `${API_ENDPOINTS.SYMPTOMS.CHECK_NAME}?${params.toString()}`;
    },
    
    filterByDisease: (diseaseIds: number[], includeInactive = false) => {
      const params = new URLSearchParams();
      diseaseIds.forEach(id => params.append('diseaseId', id.toString()));
      params.append('includeInactive', includeInactive.toString());
      return `${API_ENDPOINTS.SYMPTOMS.FILTER_BY_DISEASE}?${params.toString()}`;
    },
    
    exportCsv: (filters?: Record<string, any>) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      return `${API_ENDPOINTS.SYMPTOMS.EXPORT_CSV}?${params.toString()}`;
    },
    
    commonSymptoms: (limit = 20, timeframe = '1year') => 
      `${API_ENDPOINTS.SYMPTOMS.COMMON_SYMPTOMS}?limit=${limit}&timeframe=${timeframe}`,
    
    mergeSuggestions: (symptomIds: number[]) => {
      const params = new URLSearchParams();
      symptomIds.forEach(id => params.append('symptomId', id.toString()));
      return `${API_ENDPOINTS.SYMPTOMS.MERGE_SUGGESTIONS}?${params.toString()}`;
    }
  };

  /**
   * ✅ NEW: Build patient endpoint with parameters
   */
  static patient = {
    search: (query: string, limit = 10) => {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('limit', limit.toString());
      return `${API_ENDPOINTS.PATIENTS.SEARCH}?${params.toString()}`;
    },

    advancedSearch: (criteria: Record<string, any>) => {
      const params = new URLSearchParams();
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(key, item.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      return `${API_ENDPOINTS.PATIENTS.ADVANCED_SEARCH}?${params.toString()}`;
    },

    byHospital: (hospitalCode: string, filters?: Record<string, any>) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      return `${API_ENDPOINTS.PATIENTS.BY_HOSPITAL(hospitalCode)}?${params.toString()}`;
    },

    byDisease: (diseaseId: number, filters?: Record<string, any>) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      return `${API_ENDPOINTS.PATIENTS.BY_DISEASE(diseaseId)}?${params.toString()}`;
    },

    template: (format: 'excel' | 'csv') => 
      `${API_ENDPOINTS.PATIENTS.TEMPLATE}?format=${format}`,

    exportWithFilters: (format: 'excel' | 'csv', filters?: Record<string, any>) => {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      return `${API_ENDPOINTS.PATIENTS.EXPORT}?${params.toString()}`;
    },

    checkIdCard: (idCard: string) => 
      `${API_ENDPOINTS.PATIENTS.CHECK_ID_CARD(idCard)}`,

    duplicateCheck: (criteria: Record<string, any>) => {
      const params = new URLSearchParams();
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      return `${API_ENDPOINTS.PATIENTS.DUPLICATE_CHECK}?${params.toString()}`;
    },

    analytics: {
      diseaseDistribution: (timeframe = '1year') => 
        `${API_ENDPOINTS.PATIENTS.DISEASE_DISTRIBUTION}?timeframe=${timeframe}`,
      
      hospitalDistribution: (timeframe = '1year') => 
        `${API_ENDPOINTS.PATIENTS.HOSPITAL_DISTRIBUTION}?timeframe=${timeframe}`,
      
      conditionTrends: (timeframe = '1year') => 
        `${API_ENDPOINTS.PATIENTS.CONDITION_TRENDS}?timeframe=${timeframe}`,
      
      ageGenderAnalysis: (hospitalCode?: string) => {
        const params = new URLSearchParams();
        if (hospitalCode) params.append('hospitalCode', hospitalCode);
        return `${API_ENDPOINTS.PATIENTS.AGE_GENDER_ANALYSIS}?${params.toString()}`;
      },
      
      geographicalAnalysis: (level: 'province' | 'district' | 'subdistrict' = 'province') => 
        `${API_ENDPOINTS.PATIENTS.GEOGRAPHICAL_ANALYSIS}?level=${level}`,
      
      treatmentOutcomes: (diseaseId?: number, hospitalCode?: string) => {
        const params = new URLSearchParams();
        if (diseaseId) params.append('diseaseId', diseaseId.toString());
        if (hospitalCode) params.append('hospitalCode', hospitalCode);
        return `${API_ENDPOINTS.PATIENTS.TREATMENT_OUTCOMES}?${params.toString()}`;
      }
    }
  };

  /**
   * Build general endpoint with query parameters
   */
  static withParams(endpoint: string, params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }
}

// ===== 🚀 Endpoint validation utilities =====
export class EndpointValidator {
  /**
   * Validate disease ID parameter
   */
  static validateDiseaseId(id: any): number {
    const diseaseId = typeof id === 'string' ? parseInt(id) : id;
    if (!diseaseId || isNaN(diseaseId) || diseaseId <= 0) {
      throw new Error('Invalid disease ID');
    }
    return diseaseId;
  }

  /**
   * Validate symptom ID parameter
   */
  static validateSymptomId(id: any): number {
    const symptomId = typeof id === 'string' ? parseInt(id) : id;
    if (!symptomId || isNaN(symptomId) || symptomId <= 0) {
      throw new Error('Invalid symptom ID');
    }
    return symptomId;
  }

  /**
   * ✅ NEW: Validate patient ID parameter
   */
  static validatePatientId(id: any): number {
    const patientId = typeof id === 'string' ? parseInt(id) : id;
    if (!patientId || isNaN(patientId) || patientId <= 0) {
      throw new Error('Invalid patient ID');
    }
    return patientId;
  }

  /**
   * Validate search query parameter
   */
  static validateSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      throw new Error('Search query is required');
    }
    
    if (query.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }
    
    if (query.length > 100) {
      throw new Error('Search query must be less than 100 characters');
    }
    
    return query.trim();
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page?: any, limit?: any): { page: number; limit: number } {
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    
    return { page: validatedPage, limit: validatedLimit };
  }

  /**
   * Validate sort parameters
   */
  static validateSort(sortBy?: string, sortOrder?: string, allowedFields: string[] = []): {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  } {
    const validSortBy = allowedFields.includes(sortBy || '') ? sortBy! : allowedFields[0] || 'id';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder || '') ? sortOrder as 'asc' | 'desc' : 'asc';
    
    return { sortBy: validSortBy, sortOrder: validSortOrder };
  }

  /**
   * ✅ NEW: Validate Thai ID card format
   */
  static validateThaiIdCard(idCard: string): boolean {
    if (!/^\d{13}$/.test(idCard)) return false;

    const digits = idCard.split('').map(Number);
    const checkDigit = digits[12];
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (13 - i);
    }

    const remainder = sum % 11;
    const calculatedCheckDigit = remainder < 2 ? (1 - remainder) : (11 - remainder);

    return calculatedCheckDigit === checkDigit;
  }

  /**
   * ✅ NEW: Validate Thai phone number format
   */
  static validateThaiPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^(\+66|0)[0-9]{8,9}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * ✅ NEW: Validate date string format
   */
  static validateDateString(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const parsed = new Date(dateStr);
    return !isNaN(parsed.getTime());
  }

  /**
   * ✅ NEW: Validate hospital code format
   */
  static validateHospitalCode(code: string): boolean {
    return /^[A-Z0-9]{5,50}$/.test(code);
  }
}

// ===== 🚀 Endpoint constants for easy reference =====
export const DISEASE_SORT_FIELDS = ['thaiName', 'engName', 'createdAt', 'updatedAt'] as const;
export const SYMPTOM_SORT_FIELDS = ['name', 'createdAt', 'updatedAt'] as const;
export const PATIENT_SORT_FIELDS = ['patientName', 'illnessDate', 'createdAt', 'updatedAt'] as const;
export const HOSPITAL_SORT_FIELDS = ['hospitalName', 'hospitalCode5Digit', 'organizationType', 'createdAt', 'updatedAt'] as const;
export const POPULATION_SORT_FIELDS = ['year', 'population', 'hospitalCode', 'createdAt'] as const;

export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100] as const;
export const MAX_SEARCH_RESULTS = 100;
export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 100;

// ===== 🚀 Patient-specific constants =====
export const PATIENT_GENDERS = ['M', 'F'] as const;
export const PATIENT_CONDITIONS = [
  'ไม่ทราบ', 
  'เสียชีวิต', 
  'หายจากโรคแล้ว', 
  'ยังรักษาตัวอยู่'
] as const;
export const LAB_RESULTS = [
  'Positive', 
  'Negative', 
  'Pending', 
  'Inconclusive', 
  'Not Tested'
] as const;
export const PATIENT_TYPES = ['IPD', 'OPD', 'ACF'] as const;
export const TREATMENT_AREAS = ['เทศบาล', 'อบต.', 'ไม่ทราบ'] as const;
export const NAME_PREFIXES = [
  'นาย', 
  'นาง', 
  'นางสาว', 
  'เด็กหญิง', 
  'เด็กชาย'
] as const;
export const MARITAL_STATUSES = [
  'SINGLE', 
  'MARRIED', 
  'DIVORCED', 
  'WIDOWED', 
  'SEPARATED', 
  'OTHER'
] as const;

// ===== 🚀 Export everything =====
export default API_ENDPOINTS;