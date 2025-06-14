// backend/src/types/patientTypes.ts - ✅ COMPLETE: Patient types สำหรับ Import/Export + ระบบใหม่

import type { PatientVisit } from '@prisma/client';

// ========== BASE PATIENT TYPES ==========

/**
 * Patient with all relations (from database)
 */
export interface PatientWithRelations extends PatientVisit {
  disease: {
    id: number;
    thaiName: string;
    engName: string | null;
    daName: string | null;
    details?: string | null;
  };
  hospital: {
    id: number;
    hospitalName: string | null;
    hospitalCode5Digit: string;
    organizationType?: string | null;
  };
}

/**
 * Simplified patient for lists and searches
 */
export interface PatientSummary {
  id: number;
  patientName: string;
  idCardCode?: string | null;
  patientHn?: string | null;
  gender?: string | null;
  ageAtIllness?: number | null;
  diseaseId: number;
  diseaseName: string;
  hospitalCode: string;
  hospitalName: string | null;
  illnessDate: string;
  patientCondition?: string | null;
  createdAt: string;
}

// ========== PAGINATION & LISTING ==========

/**
 * Paginated patient response
 */
export interface PaginatedPatientResponse {
  patients: PatientWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search?: string;
    diseaseId?: number;
    hospitalCode?: string;
    treatmentHospital?: string;
    gender?: string;
    patientCondition?: string;
    illnessDateFrom?: string;
    illnessDateTo?: string;
  };
  summary: {
    totalRecords: number;
    filteredRecords: number;
    exportedAt?: string;
  };
}

/**
 * Patient search result
 */
export interface PatientSearchResult {
  id: number;
  patientName: string;
  idCardCode?: string | null;
  patientHn?: string | null;
  disease: {
    id: number;
    thaiName: string;
  };
  hospital: {
    hospitalCode5Digit: string;
    hospitalName: string | null;
  };
  illnessDate: string;
  patientCondition?: string | null;
  relevanceScore?: number;
}

// ========== HOSPITAL ACCESS CONTROL ==========

/**
 * Hospital access context for permission control
 */
export interface HospitalAccessContext {
  userRole: 'USER' | 'ADMIN' | 'SUPERUSER';
  userHospitalCode?: string;
  permissions: string[];
  canAccessAllHospitals: boolean;
}

/**
 * Hospital filter options
 */
export interface HospitalFilterOptions {
  hospitalCode?: string;
  treatmentHospital?: string;
  organizationType?: string;
  includeInactive?: boolean;
}

// ========== IMPORT/EXPORT TYPES ==========

/**
 * Export options and parameters
 */
export interface ExportPatientOptions {
  format: 'csv' | 'excel';
  filters?: {
    search?: string;
    hospitalCode?: string;
    treatmentHospital?: string;
    diseaseId?: number;
    gender?: 'M' | 'F' | 'OTHER';
    patientCondition?: string;
    illnessDateFrom?: string;
    illnessDateTo?: string;
  };
  includeHeaders?: boolean;
  filename?: string;
  fields?: string[]; // Specific fields to export
}

/**
 * Export result metadata
 */
export interface ExportResult {
  filename: string;
  format: 'csv' | 'excel';
  recordCount: number;
  fileSize: number;
  generatedAt: string;
  generatedBy: string;
  filters: Record<string, any>;
}

/**
 * Import options and parameters
 */
export interface ImportPatientOptions {
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  overwriteExisting?: boolean;
  batchSize?: number;
  continueOnError?: boolean;
}

/**
 * Import result with detailed feedback
 */
export interface ImportResult {
  summary: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    skippedRows: number;
    duplicateRows: number;
    processingTimeMs: number;
  };
  successful: Array<{
    rowNumber: number;
    patientId: number;
    patientName: string;
    action: 'created' | 'updated' | 'skipped';
  }>;
  failed: Array<{
    rowNumber: number;
    errors: string[];
    warnings: string[];
    data: Record<string, any>;
  }>;
  duplicates: Array<{
    rowNumber: number;
    existingPatientId: number;
    matchedFields: string[];
    suggestion: 'skip' | 'update' | 'create_new';
  }>;
  warnings: Array<{
    rowNumber: number;
    field: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Import validation result
 */
export interface ImportValidationResult {
  isValid: boolean;
  rowNumber: number;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  transformedData?: Record<string, any>;
}

/**
 * Import row data structure (from Excel/CSV)
 */
export interface ImportRowData {
  'ชื่อผู้ป่วย': string;
  'เลขบัตรประชาชน'?: string;
  'เลข HN'?: string;
  'เพศ'?: string;
  'วันเดือนปีเกิด'?: string;
  'อายุ'?: string | number;
  'รหัสโรค': string | number;
  'รหัสโรงพยาบาล': string;
  'โรงพยาบาลหลัก'?: string;
  'วันที่เจ็บป่วย': string;
  'วันที่รักษา'?: string;
  'สภาพผู้ป่วย'?: string;
  'เบอร์โทรศัพท์'?: string;
  'หมายเหตุ'?: string;
  [key: string]: any; // Allow additional fields
}

// ========== BULK OPERATIONS ==========

/**
 * Bulk operation parameters
 */
export interface BulkPatientOperation {
  patientIds: number[];
  action: 'delete' | 'export' | 'updateStatus' | 'transfer';
  options?: {
    // For delete action
    reason?: string;
    softDelete?: boolean;
    
    // For updateStatus action
    newStatus?: string;
    updateReason?: string;
    
    // For transfer action
    newHospitalCode?: string;
    transferReason?: string;
    
    // For export action
    format?: 'csv' | 'excel';
    filename?: string;
  };
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  successful: Array<{
    patientId: number;
    patientName: string;
    action: string;
    result: any;
  }>;
  failed: Array<{
    patientId: number;
    patientName?: string;
    reason: string;
    error: string;
  }>;
  metadata: {
    operation: string;
    performedBy: string;
    performedAt: string;
    processingTimeMs: number;
  };
}

// ========== FORM & UI SUPPORT ==========

/**
 * Form step validation for 5-tab form
 */
export interface FormStepValidation {
  step: number;
  title: string;
  isValid: boolean;
  isCompleted: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  canProceed: boolean;
  requiredFields: string[];
  completedFields: string[];
}

/**
 * Form option for dropdowns
 */
export interface FormOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Disease option with symptoms
 */
export interface DiseaseOption extends FormOption {
  value: number;
  thaiName: string;
  engName?: string | null;
  daName?: string | null;
  symptoms: Array<{
    id: number;
    name: string;
  }>;
  isActive: boolean;
}

/**
 * Hospital option for forms
 */
export interface HospitalOption extends FormOption {
  value: string;
  hospitalCode5Digit: string;
  hospitalName: string | null;
  organizationType?: string | null;
  isActive: boolean;
  patientCount?: number;
  userCount?: number;
}

// ========== STATISTICS & ANALYTICS ==========

/**
 * Patient statistics
 */
export interface PatientStats {
  totalPatients: number;
  newCasesToday: number;
  newCasesThisWeek: number;
  newCasesThisMonth: number;
  activeCases: number;
  resolvedCases: number;
  criticalCases: number;
  
  byGender: {
    male: number;
    female: number;
    other: number;
    unknown: number;
  };
  
  byCondition: {
    stable: number;
    critical: number;
    recovering: number;
    discharged: number;
    deceased: number;
    unknown: number;
  };
  
  byDisease: Array<{
    diseaseId: number;
    diseaseName: string;
    patientCount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  byHospital: Array<{
    hospitalCode: string;
    hospitalName: string | null;
    patientCount: number;
    percentage: number;
  }>;
  
  recentTrends: Array<{
    date: string;
    newCases: number;
    activeCases: number;
  }>;
}

/**
 * Patient dashboard summary
 */
export interface PatientDashboardSummary {
  overview: {
    totalPatients: number;
    todayNew: number;
    weekNew: number;
    monthNew: number;
    activePercentage: number;
    criticalPercentage: number;
  };
  
  quickStats: {
    averageAge: number;
    mostCommonDisease: string;
    mostAffectedHospital: string;
    recoveryRate: number;
  };
  
  alerts: Array<{
    type: 'high_cases' | 'data_quality' | 'system';
    message: string;
    severity: 'low' | 'medium' | 'high';
    date: string;
    action?: string;
  }>;
  
  recentPatients: PatientSummary[];
}

// ========== ERROR & RESPONSE TYPES ==========

/**
 * Patient-specific error
 */
export interface PatientError {
  code: string;
  message: string;
  field?: string;
  patientId?: number;
  rowNumber?: number;
  severity: 'error' | 'warning' | 'info';
  suggestions?: string[];
}

/**
 * Patient API response wrapper
 */
export interface PatientApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: PatientError[];
  warnings?: PatientError[];
  metadata?: {
    timestamp: string;
    requestId?: string;
    processingTime?: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// ========== FILE HANDLING ==========

/**
 * File upload information
 */
export interface FileUploadInfo {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  checksum?: string;
}

/**
 * Template generation options
 */
export interface TemplateGenerationOptions {
  format: 'csv' | 'excel';
  includeExample: boolean;
  includeHeaders: boolean;
  includeValidation: boolean;
  language: 'th' | 'en';
}

// ========== CONSTANTS FOR TYPE SAFETY ==========

/**
 * Patient gender types
 */
export type PatientGender = 'M' | 'F' | 'OTHER';

/**
 * Patient condition types
 */
export type PatientCondition = 
  | 'STABLE' 
  | 'CRITICAL' 
  | 'RECOVERING' 
  | 'DISCHARGED' 
  | 'DECEASED';

/**
 * Patient type categories
 */
export type PatientType = 'INPATIENT' | 'OUTPATIENT' | 'EMERGENCY';

/**
 * Lab result types
 */
export type LabResult = 
  | 'POSITIVE' 
  | 'NEGATIVE' 
  | 'PENDING' 
  | 'INCONCLUSIVE' 
  | 'NOT_TESTED';

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'excel';

/**
 * Import action types
 */
export type ImportAction = 'created' | 'updated' | 'skipped';

/**
 * Bulk operation types
 */
export type BulkOperationType = 'delete' | 'export' | 'updateStatus' | 'transfer';

/**
 * Sort field types
 */
export type PatientSortField = 
  | 'createdAt' 
  | 'illnessDate' 
  | 'patientName' 
  | 'updatedAt' 
  | 'treatmentHospital';

/**
 * Sort order types
 */
export type SortOrder = 'asc' | 'desc';

// ========== FORM STEP CONSTANTS ==========

/**
 * Patient form steps (5 tabs)
 */
export const PATIENT_FORM_STEPS = [
  {
    id: 1,
    title: 'ข้อมูลส่วนตัว',
    description: 'ข้อมูลพื้นฐานของผู้ป่วย',
    fields: ['patientName', 'diseaseId', 'illnessDate', 'idCardCode', 'gender', 'birthday', 'ageAtIllness']
  },
  {
    id: 2,
    title: 'ที่อยู่',
    description: 'ที่อยู่ปัจจุบันและที่อยู่ขณะป่วย',
    fields: ['currentHouseNumber', 'currentProvince', 'addressSickHouseNumber', 'addressSickProvince']
  },
  {
    id: 3,
    title: 'การเจ็บป่วย',
    description: 'ข้อมูลการเจ็บป่วยและการรักษา',
    fields: ['hospitalCode', 'treatmentHospital', 'treatmentDate', 'diagnosisDate']
  },
  {
    id: 4,
    title: 'ผลตรวจ',
    description: 'ผลการตรวจและสถานะผู้ป่วย',
    fields: ['labResult', 'ns1Result', 'patientType', 'patientCondition', 'deathDate']
  },
  {
    id: 5,
    title: 'หมายเหตุ',
    description: 'ข้อมูลเพิ่มเติมและหมายเหตุ',
    fields: ['receivingProvince', 'remarks']
  }
] as const;

/**
 * Required fields by form step
 */
export const REQUIRED_FIELDS_BY_STEP = {
  1: ['patientName', 'diseaseId', 'illnessDate'],
  2: [],
  3: ['hospitalCode'],
  4: [],
  5: [],
} as const;

// ========== VALIDATION CONSTANTS ==========

/**
 * Maximum values for validation
 */
export const VALIDATION_LIMITS = {
  MAX_PATIENTS_PER_EXPORT: 10000,
  MAX_PATIENTS_PER_IMPORT: 1000,
  MAX_BULK_OPERATION_SIZE: 100,
  MAX_SEARCH_RESULTS: 100,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILENAME_LENGTH: 100,
  MAX_SEARCH_TERM_LENGTH: 255,
} as const;

/**
 * Supported file types for import
 */
export const SUPPORTED_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/vnd.ms-excel': 'excel',
  'text/csv': 'csv',
  'application/csv': 'csv',
} as const;

/**
 * Default values
 */
export const DEFAULT_VALUES = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  EXPORT_FILENAME_PREFIX: 'patients-export',
  IMPORT_TEMPLATE_FILENAME: 'patients-import-template',
  DEFAULT_SORT_FIELD: 'createdAt' as PatientSortField,
  DEFAULT_SORT_ORDER: 'desc' as SortOrder,
} as const;