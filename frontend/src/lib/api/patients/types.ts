// src/lib/api/patients/types.ts
// ✅ SECURITY: Complete Patient type definitions

import type { ApiResponse } from '../types';

// ===== Core Patient Types =====
export interface Patient {
  id: number;
  
  // Personal Information (Tab 1)
  idCardCode?: string | null;
  patientHn?: string | null;
  namePrefix?: string | null;
  patientName: string;
  gender?: string | null;
  birthday?: string | null;
  ageAtIllness?: number | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  occupation?: string | null;
  phoneNumber?: string | null;
  
  // Current Address (Tab 2)
  currentHouseNumber?: string | null;
  currentVillageNumber?: string | null;
  currentRoadName?: string | null;
  currentProvince?: string | null;
  currentDistrict?: string | null;
  currentSubDistrict?: string | null;
  
  // Sick Address (Tab 2)
  addressSickHouseNumber?: string | null;
  addressSickVillageNumber?: string | null;
  addressSickRoadName?: string | null;
  addressSickProvince?: string | null;
  addressSickDistrict?: string | null;
  addressSickSubDistrict?: string | null;
  
  // Medical Information (Tab 3)
  diseaseId: number;
  disease: {
    id: number;
    thaiName: string;
    engName?: string | null;
    daName?: string | null;
  };
  symptomsOfDisease?: string | null;
  treatmentArea?: string | null;
  treatmentHospital?: string | null;
  hospitalCode: string;
  hospital: {
    id: number;
    hospitalName: string | null;
    hospitalCode5Digit: string;
    organizationType?: string | null;
  };
  
  // Medical Timeline (Tab 3)
  illnessDate: string;
  treatmentDate?: string | null;
  diagnosisDate?: string | null;
  deathDate?: string | null;
  
  // Lab Results & Status (Tab 4)
  labResult?: string | null;
  ns1Result?: string | null;
  patientType?: string | null;
  patientCondition?: string | null;
  causeOfDeath?: string | null;
  
  // Additional Info (Tab 5)
  receivingProvince?: string | null;
  remarks?: string | null;
  
  // Audit Fields
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  isActive: boolean;
}

// ===== Form Data Types =====
export interface CreatePatientData {
  // Personal Information (Required fields marked)
  idCardCode?: string;
  patientHn?: string;
  namePrefix?: string;
  patientName: string; // Required
  gender?: 'M' | 'F' | 'OTHER';
  birthday?: string; // ISO date string
  ageAtIllness?: number;
  maritalStatus?: string;
  nationality?: string;
  occupation?: string;
  phoneNumber?: string;
  
  // Current Address
  currentHouseNumber?: string;
  currentVillageNumber?: string;
  currentRoadName?: string;
  currentProvince?: string;
  currentDistrict?: string;
  currentSubDistrict?: string;
  
  // Sick Address
  addressSickHouseNumber?: string;
  addressSickVillageNumber?: string;
  addressSickRoadName?: string;
  addressSickProvince?: string;
  addressSickDistrict?: string;
  addressSickSubDistrict?: string;
  
  // Medical Information
  diseaseId: number; // Required
  symptomsOfDisease?: string;
  treatmentArea?: string;
  treatmentHospital?: string;
  hospitalCode: string; // Required
  
  // Medical Timeline
  illnessDate: string; // Required - ISO date string
  treatmentDate?: string;
  diagnosisDate?: string;
  deathDate?: string;
  
  // Lab Results & Status
  labResult?: string;
  ns1Result?: string;
  patientType?: string;
  patientCondition?: string;
  causeOfDeath?: string;
  
  // Additional Info
  receivingProvince?: string;
  remarks?: string;
}

export interface UpdatePatientData {
  // All fields from CreatePatientData but optional
  idCardCode?: string;
  patientHn?: string;
  namePrefix?: string;
  patientName?: string;
  gender?: 'M' | 'F' | 'OTHER';
  birthday?: string;
  ageAtIllness?: number;
  maritalStatus?: string;
  nationality?: string;
  occupation?: string;
  phoneNumber?: string;
  
  currentHouseNumber?: string;
  currentVillageNumber?: string;
  currentRoadName?: string;
  currentProvince?: string;
  currentDistrict?: string;
  currentSubDistrict?: string;
  
  addressSickHouseNumber?: string;
  addressSickVillageNumber?: string;
  addressSickRoadName?: string;
  addressSickProvince?: string;
  addressSickDistrict?: string;
  addressSickSubDistrict?: string;
  
  diseaseId?: number;
  symptomsOfDisease?: string;
  treatmentArea?: string;
  treatmentHospital?: string;
  hospitalCode?: string;
  
  illnessDate?: string;
  treatmentDate?: string;
  diagnosisDate?: string;
  deathDate?: string;
  
  labResult?: string;
  ns1Result?: string;
  patientType?: string;
  patientCondition?: string;
  causeOfDeath?: string;
  
  receivingProvince?: string;
  remarks?: string;
  isActive?: boolean;
}

// ===== Query & Filter Types =====
export interface PatientQueryParams {
  page: number;
  limit: number;
  search?: string;
  diseaseId?: number;
  hospitalCode?: string;
  gender?: 'M' | 'F' | 'OTHER';
  patientCondition?: string;
  patientType?: string;
  illnessDateFrom?: string;
  illnessDateTo?: string;
  ageFrom?: number;
  ageTo?: number;
  province?: string;
  isActive?: boolean;
  sortBy: 'patientName' | 'illnessDate' | 'createdAt' | 'updatedAt' | 'ageAtIllness';
  sortOrder: 'asc' | 'desc';
}

export interface PatientSearchFilters {
  query?: string;
  diseaseIds?: number[];
  hospitalCodes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: ('M' | 'F' | 'OTHER')[];
  conditions?: string[];
  provinces?: string[];
  includeInactive?: boolean;
}

// ===== Response Types =====
export interface PaginatedPatientResponse {
  patients: Patient[];
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
    gender?: string;
    patientCondition?: string;
    illnessDateFrom?: string;
    illnessDateTo?: string;
  };
  summary?: {
    totalPatients: number;
    newCasesToday: number;
    activeCases: number;
  };
}

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

// ===== Statistics Types =====
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
  
  byAgeGroup: Array<{
    ageRange: string; // "0-10", "11-20", etc.
    patientCount: number;
    percentage: number;
  }>;
  
  trends: {
    daily: Array<{
      date: string;
      count: number;
    }>;
    monthly: Array<{
      month: string;
      count: number;
    }>;
  };
}

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
    mostAffectedProvince: string;
    recoveryRate: number;
  };
  
  alerts: Array<{
    type: 'high_cases' | 'outbreak_risk' | 'data_quality';
    message: string;
    severity: 'low' | 'medium' | 'high';
    date: string;
  }>;
  
  recentPatients: Patient[];
}

// ===== Disease Surveillance Types =====
export interface PatientHistory {
  idCardCode: string;
  patientName: string;
  totalVisits: number;
  firstVisit: string;
  lastVisit: string;
  
  episodes: Array<{
    id: number;
    diseaseId: number;
    diseaseName: string;
    illnessDate: string;
    hospitalCode: string;
    hospitalName: string | null;
    patientCondition?: string | null;
    outcome: 'ongoing' | 'recovered' | 'deceased' | 'unknown';
  }>;
  
  diseaseEpisodes: Array<{
    diseaseId: number;
    diseaseName: string;
    episodeCount: number;
    lastEpisode: string;
    outcomes: Record<string, number>;
  }>;
  
  geographicPattern: Array<{
    province: string;
    district: string;
    episodeCount: number;
  }>;
}

export interface DiseaseEpisode {
  patientId: number;
  episodeNumber: number;
  diseaseId: number;
  diseaseName: string;
  illnessDate: string;
  intervalFromPrevious?: number; // days
  location: {
    province: string;
    district: string;
    hospitalCode: string;
  };
  outcome: string;
  isRecurrence: boolean;
}

// ===== Form Support Types =====
export interface FormOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface DiseaseOption {
  id: number;
  thaiName: string;
  engName?: string | null;
  daName?: string | null;
  isActive: boolean;
  symptoms: SymptomOption[];
}

export interface SymptomOption {
  id: number;
  name: string;
  diseaseId: number;
  isActive: boolean;
}

export interface HospitalOption {
  id: number;
  hospitalCode5Digit: string;
  hospitalName: string | null;
  organizationType?: string | null;
  isActive: boolean;
}

export interface ProvinceOption {
  code: string;
  nameThai: string;
  nameEng: string;
  region: string;
}

export interface DistrictOption {
  code: string;
  nameThai: string;
  nameEng: string;
  provinceCode: string;
}

export interface SubDistrictOption {
  code: string;
  nameThai: string;
  nameEng: string;
  districtCode: string;
  postalCode?: string;
}

// ===== Address Types =====
export interface AddressData {
  houseNumber?: string;
  villageNumber?: string;
  roadName?: string;
  province?: string;
  district?: string;
  subDistrict?: string;
  postalCode?: string;
}

export interface AddressValidation {
  isValid: boolean;
  errors: string[];
  suggestions?: AddressData[];
}

// ===== Bulk Operations Types =====
export interface BulkImportData {
  patients: CreatePatientData[];
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface BulkImportResult {
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
    updated: number;
  };
  
  successful: Array<{
    rowNumber: number;
    patientId: number;
    patientName: string;
  }>;
  
  failed: Array<{
    rowNumber: number;
    data: Partial<CreatePatientData>;
    errors: string[];
  }>;
  
  duplicates: Array<{
    rowNumber: number;
    existingPatientId: number;
    matchedFields: string[];
  }>;
}

export interface BulkUpdateData {
  updates: Array<{
    id: number;
    data: UpdatePatientData;
  }>;
  validateOnly?: boolean;
}

export interface BulkDeleteData {
  patientIds: number[];
  reason: string;
  softDelete?: boolean;
}

// ===== Export Types =====
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filters?: PatientQueryParams;
  fields?: string[];
  includeHeaders?: boolean;
  filename?: string;
}

export interface ExportResult {
  filename: string;
  downloadUrl: string;
  recordCount: number;
  generatedAt: string;
  expiresAt: string;
}

// ===== Analytics Types =====
export interface PatientTrends {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: Array<{
    date: string;
    newCases: number;
    activeCases: number;
    resolvedCases: number;
    cumulativeTotal: number;
  }>;
  
  predictions?: Array<{
    date: string;
    predictedCases: number;
    confidence: number;
  }>;
}

export interface GeographicDistribution {
  type: 'province' | 'district' | 'subdistrict';
  data: Array<{
    code: string;
    name: string;
    patientCount: number;
    incidenceRate: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  
  hotspots: Array<{
    location: string;
    patientCount: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
}

export interface DiseasePattern {
  diseaseId: number;
  diseaseName: string;
  
  seasonality: Array<{
    month: number;
    averageCases: number;
    peakProbability: number;
  }>;
  
  ageDistribution: Array<{
    ageGroup: string;
    cases: number;
    percentage: number;
    severity: Record<string, number>;
  }>;
  
  geographicClusters: Array<{
    center: { lat: number; lng: number };
    radius: number;
    caseCount: number;
    startDate: string;
    endDate?: string;
  }>;
}

// ===== Validation Types =====
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

export interface IdCardValidation extends ValidationResult {
  exists: boolean;
  patientHistory?: PatientHistory;
  duplicateRisk: 'low' | 'medium' | 'high';
}

// ===== Audit Types =====
export interface PatientAuditLog {
  id: number;
  patientId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT';
  userId: string;
  userName: string;
  timestamp: string;
  changes?: Record<string, {
    oldValue: any;
    newValue: any;
  }>;
  ipAddress?: string;
  userAgent?: string;
}

// ===== API Response Wrappers =====
export interface PatientResponse extends ApiResponse<Patient> {}
export interface PatientListResponse extends ApiResponse<PaginatedPatientResponse> {}
export interface PatientStatsResponse extends ApiResponse<PatientStats> {}
export interface PatientHistoryResponse extends ApiResponse<PatientHistory> {}
export interface PatientSearchResponse extends ApiResponse<{
  query: string;
  results: PatientSearchResult[];
  count: number;
  totalMatches: number;
}> {}

// ===== Error Types =====
export interface PatientError {
  code: string;
  message: string;
  field?: string;
  patientId?: number;
  severity: 'error' | 'warning' | 'info';
}

// ===== Constants for type safety =====
export const PATIENT_GENDERS = ['M', 'F', 'OTHER'] as const;
export const PATIENT_CONDITIONS = [
  'STABLE', 'CRITICAL', 'RECOVERING', 'DISCHARGED', 'DECEASED', 'UNKNOWN'
] as const;
export const PATIENT_TYPES = ['IPD', 'OPD', 'ACF'] as const;
export const LAB_RESULTS = ['POSITIVE', 'NEGATIVE', 'PENDING', 'INCONCLUSIVE'] as const;
export const MARITAL_STATUSES = [
  'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN'
] as const;

export type PatientGender = typeof PATIENT_GENDERS[number];
export type PatientCondition = typeof PATIENT_CONDITIONS[number];
export type PatientType = typeof PATIENT_TYPES[number];
export type LabResult = typeof LAB_RESULTS[number];
export type MaritalStatus = typeof MARITAL_STATUSES[number];