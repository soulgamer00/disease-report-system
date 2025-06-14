// src/lib/api/patients/endpoints.ts
// ✅ SECURITY: Patient API endpoints - NO hardcoded URLs

export const PATIENT_ENDPOINTS = {
  // ===== Basic CRUD Operations =====
  LIST: '/api/patients',
  CREATE: '/api/patients',
  GET: (id: number) => `/api/patients/${id}`,
  UPDATE: (id: number) => `/api/patients/${id}`,
  DELETE: (id: number) => `/api/patients/${id}`,

  // ===== Search & Filter =====
  SEARCH: '/api/patients/search',
  ADVANCED_SEARCH: '/api/patients/advanced-search',
  AUTOCOMPLETE: '/api/patients/autocomplete',

  // ===== Statistics & Analytics =====
  STATS: '/api/patients/stats',
  RECENT: '/api/patients/recent',
  DASHBOARD_SUMMARY: '/api/patients/dashboard-summary',

  // ===== Disease Surveillance Specific =====
  CHECK_ID_CARD: (idCard: string) => `/api/patients/check/${idCard}`,
  HISTORY_BY_ID: (idCard: string) => `/api/patients/history/${idCard}`,
  DISEASE_EPISODES: '/api/patients/episodes',
  DUPLICATE_CHECK: '/api/patients/duplicate-check',

  // ===== Filter by Relations =====
  BY_HOSPITAL: (hospitalCode: string) => `/api/patients/hospital/${hospitalCode}`,
  BY_DISEASE: (diseaseId: number) => `/api/patients/disease/${diseaseId}`,
  BY_DATE_RANGE: '/api/patients/date-range',
  BY_CONDITION: '/api/patients/condition',

  // ===== Import/Export Operations =====
  BULK_IMPORT: '/api/patients/bulk',
  BULK_UPDATE: '/api/patients/bulk-update',
  BULK_DELETE: '/api/patients/bulk-delete',
  EXPORT_CSV: '/api/patients/export/csv',
  EXPORT_EXCEL: '/api/patients/export/excel',
  EXPORT_PDF: '/api/patients/export/pdf',
  TEMPLATE_DOWNLOAD: '/api/patients/template/download',

  // ===== Analytics & Reports =====
  ANALYTICS: {
    TRENDS: '/api/patients/analytics/trends',
    GEOGRAPHIC: '/api/patients/analytics/geographic',
    DISEASE_PATTERNS: '/api/patients/analytics/disease-patterns',
    AGE_DISTRIBUTION: '/api/patients/analytics/age-distribution',
    GENDER_BREAKDOWN: '/api/patients/analytics/gender-breakdown',
    OUTCOME_ANALYSIS: '/api/patients/analytics/outcomes',
    SEASONAL_TRENDS: '/api/patients/analytics/seasonal',
    HOSPITAL_COMPARISON: '/api/patients/analytics/hospital-comparison'
  },

  // ===== Form Support Data =====
  FORM_DATA: {
    DISEASE_OPTIONS: '/api/patients/form-data/diseases',
    SYMPTOM_OPTIONS: (diseaseId: number) => `/api/patients/form-data/symptoms/${diseaseId}`,
    HOSPITAL_OPTIONS: '/api/patients/form-data/hospitals',
    CONDITION_OPTIONS: '/api/patients/form-data/conditions',
    PROVINCE_OPTIONS: '/api/patients/form-data/provinces',
    DISTRICT_OPTIONS: (provinceId: string) => `/api/patients/form-data/districts/${provinceId}`,
    SUB_DISTRICT_OPTIONS: (districtId: string) => `/api/patients/form-data/sub-districts/${districtId}`,
    LAB_RESULT_OPTIONS: '/api/patients/form-data/lab-results',
    PATIENT_TYPE_OPTIONS: '/api/patients/form-data/patient-types',
    MARITAL_STATUS_OPTIONS: '/api/patients/form-data/marital-status'
  },

  // ===== Validation & Verification =====
  VALIDATE: {
    ID_CARD: '/api/patients/validate/id-card',
    PHONE_NUMBER: '/api/patients/validate/phone',
    HOSPITAL_CODE: '/api/patients/validate/hospital-code',
    DISEASE_CODE: '/api/patients/validate/disease-code',
    BULK_DATA: '/api/patients/validate/bulk-data'
  },

  // ===== Advanced Features =====
  TIMELINE: (id: number) => `/api/patients/${id}/timeline`,
  RELATED_CASES: (id: number) => `/api/patients/${id}/related`,
  CONTACT_TRACING: (id: number) => `/api/patients/${id}/contacts`,
  FOLLOWUP: (id: number) => `/api/patients/${id}/followup`,
  NOTIFICATIONS: (id: number) => `/api/patients/${id}/notifications`,

  // ===== Audit & History =====
  AUDIT_LOG: (id: number) => `/api/patients/${id}/audit`,
  CHANGE_HISTORY: (id: number) => `/api/patients/${id}/history`,
  ACCESS_LOG: (id: number) => `/api/patients/${id}/access`,

  // ===== Integration Endpoints =====
  SYNC: {
    IMPORT_FROM_HIS: '/api/patients/sync/his-import',
    EXPORT_TO_SURVEILLANCE: '/api/patients/sync/surveillance-export',
    BACKUP_DATA: '/api/patients/sync/backup',
    RESTORE_DATA: '/api/patients/sync/restore'
  }
} as const;

// ===== Address/Location Support Endpoints =====
export const ADDRESS_ENDPOINTS = {
  PROVINCES: '/api/locations/provinces',
  DISTRICTS: (provinceId: string) => `/api/locations/districts/${provinceId}`,
  SUB_DISTRICTS: (districtId: string) => `/api/locations/sub-districts/${districtId}`,
  SEARCH_ADDRESS: '/api/locations/search',
  VALIDATE_ADDRESS: '/api/locations/validate',
  POSTAL_CODES: '/api/locations/postal-codes'
} as const;

// ===== 🚀 Type-safe endpoint builders =====
export class PatientEndpointBuilder {
  /**
   * Build patient list endpoint with query parameters
   */
  static list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    diseaseId?: number;
    hospitalCode?: string;
    dateFrom?: string;
    dateTo?: string;
    condition?: string;
    gender?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): string {
    if (!params) return PATIENT_ENDPOINTS.LIST;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${PATIENT_ENDPOINTS.LIST}?${queryString}` : PATIENT_ENDPOINTS.LIST;
  }

  /**
   * Build patient search endpoint
   */
  static search(query: string, options?: {
    limit?: number;
    fields?: string[];
    hospitalCode?: string;
    diseaseId?: number;
  }): string {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.hospitalCode) params.append('hospitalCode', options.hospitalCode);
    if (options?.diseaseId) params.append('diseaseId', options.diseaseId.toString());
    if (options?.fields?.length) {
      options.fields.forEach(field => params.append('fields', field));
    }

    return `${PATIENT_ENDPOINTS.SEARCH}?${params.toString()}`;
  }

  /**
   * Build patient statistics endpoint with filters
   */
  static stats(filters?: {
    hospitalCode?: string;
    diseaseId?: number;
    dateFrom?: string;
    dateTo?: string;
    groupBy?: string[];
  }): string {
    if (!filters) return PATIENT_ENDPOINTS.STATS;

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const queryString = params.toString();
    return queryString ? `${PATIENT_ENDPOINTS.STATS}?${queryString}` : PATIENT_ENDPOINTS.STATS;
  }

  /**
   * Build export endpoint with filters
   */
  static export(format: 'csv' | 'excel' | 'pdf', filters?: Record<string, any>): string {
    const baseEndpoint = format === 'csv' 
      ? PATIENT_ENDPOINTS.EXPORT_CSV 
      : format === 'excel' 
        ? PATIENT_ENDPOINTS.EXPORT_EXCEL 
        : PATIENT_ENDPOINTS.EXPORT_PDF;

    if (!filters) return baseEndpoint;

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }

  /**
   * Build analytics endpoint with parameters
   */
  static analytics(type: keyof typeof PATIENT_ENDPOINTS.ANALYTICS, params?: Record<string, any>): string {
    const endpoint = PATIENT_ENDPOINTS.ANALYTICS[type];
    
    if (!params) return endpoint;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  /**
   * Build date range endpoint
   */
  static dateRange(startDate: string, endDate: string, options?: {
    hospitalCode?: string;
    diseaseId?: number;
    groupBy?: 'day' | 'week' | 'month';
  }): string {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);

    if (options?.hospitalCode) params.append('hospitalCode', options.hospitalCode);
    if (options?.diseaseId) params.append('diseaseId', options.diseaseId.toString());
    if (options?.groupBy) params.append('groupBy', options.groupBy);

    return `${PATIENT_ENDPOINTS.BY_DATE_RANGE}?${params.toString()}`;
  }

  /**
   * Build ID card history endpoint with options
   */
  static idCardHistory(idCard: string, options?: {
    includeInactive?: boolean;
    dateFrom?: string;
    dateTo?: string;
    diseaseId?: number;
  }): string {
    const baseEndpoint = PATIENT_ENDPOINTS.HISTORY_BY_ID(idCard);
    
    if (!options) return baseEndpoint;

    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }
}

// ===== 🚀 Endpoint validation utilities =====
export class PatientEndpointValidator {
  /**
   * Validate patient ID parameter
   */
  static validatePatientId(id: any): number {
    const patientId = typeof id === 'string' ? parseInt(id) : id;
    if (!patientId || isNaN(patientId) || patientId <= 0) {
      throw new Error('Invalid patient ID');
    }
    return patientId;
  }

  /**
   * Validate ID card format
   */
  static validateIdCard(idCard: string): string {
    const cleaned = idCard.replace(/\D/g, '');
    if (cleaned.length !== 13) {
      throw new Error('ID card must be exactly 13 digits');
    }
    return cleaned;
  }

  /**
   * Validate hospital code format
   */
  static validateHospitalCode(code: string): string {
    if (!code || code.length !== 5) {
      throw new Error('Hospital code must be exactly 5 characters');
    }
    return code.toUpperCase();
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  static validateDate(dateStr: string): string {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    return dateStr;
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
   * Validate disease ID
   */
  static validateDiseaseId(id: any): number {
    const diseaseId = typeof id === 'string' ? parseInt(id) : id;
    if (!diseaseId || isNaN(diseaseId) || diseaseId <= 0) {
      throw new Error('Invalid disease ID');
    }
    return diseaseId;
  }

  /**
   * Validate export format
   */
  static validateExportFormat(format: string): 'csv' | 'excel' | 'pdf' {
    const validFormats = ['csv', 'excel', 'pdf'] as const;
    if (!validFormats.includes(format as any)) {
      throw new Error(`Invalid export format. Must be one of: ${validFormats.join(', ')}`);
    }
    return format as 'csv' | 'excel' | 'pdf';
  }
}

// ===== 🚀 Default query parameters =====
export const DEFAULT_PATIENT_PARAMS = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
  includeInactive: false
};

export const DEFAULT_SEARCH_PARAMS = {
  limit: 10,
  fields: ['patientName', 'idCardCode', 'patientHn'] as const
};

export const DEFAULT_STATS_PARAMS = {
  groupBy: ['gender', 'patientCondition'] as const,
  includeInactive: false
};

// ===== 🚀 Patient-specific constants =====
export const PATIENT_SORT_FIELDS = [
  'patientName', 
  'illnessDate', 
  'createdAt', 
  'updatedAt',
  'ageAtIllness',
  'patientCondition'
] as const;

export const PATIENT_SEARCH_FIELDS = [
  'patientName',
  'idCardCode', 
  'patientHn',
  'phoneNumber'
] as const;

export const PATIENT_FILTER_FIELDS = [
  'diseaseId',
  'hospitalCode',
  'gender',
  'patientCondition',
  'patientType',
  'illnessDateFrom',
  'illnessDateTo'
] as const;

export const PATIENT_EXPORT_FORMATS = ['csv', 'excel', 'pdf'] as const;

export const MAX_BULK_IMPORT_SIZE = 1000; // Maximum records per bulk import
export const MAX_EXPORT_RECORDS = 10000; // Maximum records per export
export const MAX_SEARCH_RESULTS = 50; // Maximum search results

// ===== Export everything =====
export default PATIENT_ENDPOINTS;