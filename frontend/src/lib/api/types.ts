// src/lib/api/types.ts
// ✅ SECURITY: Complete and consistent API types for all modules

// ===== Base API Response Types =====
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

// ===== Authentication Types =====
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  department?: string | null;
  position?: string | null;
  roleId: number;
  roleName: string;
  hospitalCode?: string | null;
  hospitalName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface LoginResponse extends ApiResponse<{
  user: User;
}> {}

export interface ProfileResponse extends ApiResponse<{
  user: User;
}> {}

// ===== Hospital Types =====
export interface Hospital {
  id: number;
  hospitalName: string | null;
  hospitalCode9eDigit: string | null;
  hospitalCode9Digit: string | null;
  hospitalCode5Digit: string;
  organizationType: string | null;
  healthServiceType: string | null;
  affiliation: string | null;
  departmentDivision: string | null;
  isActive: boolean;
  _count?: {
    users: number;
    patientVisits: number;
    populations: number;
  };
}

export interface CreateHospitalData {
  hospitalCode5Digit: string;
  hospitalName?: string;
  hospitalCode9eDigit?: string;
  hospitalCode9Digit?: string;
  organizationType?: string;
  healthServiceType?: string;
  affiliation?: string;
  departmentDivision?: string;
}

export interface UpdateHospitalData {
  hospitalCode5Digit?: string;
  hospitalName?: string;
  hospitalCode9eDigit?: string;
  hospitalCode9Digit?: string;
  organizationType?: string;
  healthServiceType?: string;
  affiliation?: string;
  departmentDivision?: string;
}

export interface HospitalQueryParams {
  page: number;
  limit: number;
  search?: string;
  organizationType?: string;
  healthServiceType?: string;
  affiliation?: string;
  isActive?: boolean;
  sortBy: 'hospitalName' | 'hospitalCode5Digit' | 'organizationType' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedHospitalResponse {
  hospitals: Hospital[];
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
    organizationType?: string;
    healthServiceType?: string;
    affiliation?: string;
    isActive?: boolean;
  };
}

export interface HospitalStats {
  totalHospitals: number;
  activeHospitals: number;
  inactiveHospitals: number;
  byOrganizationType: Array<{
    type: string;
    count: number;
  }>;
  byHealthServiceType: Array<{
    type: string;
    count: number;
  }>;
  withUsers: number;
  withoutUsers: number;
  totalPatients: number;
  totalPopulationRecords: number;
  mostActiveHospital?: {
    id: number;
    name: string;
    code: string;
    patientCount: number;
    userCount: number;
  };
}

export interface HospitalSearchResult {
  id: number;
  hospitalCode5Digit: string;
  hospitalName: string | null;
  organizationType: string | null;
}

export interface ActiveHospital {
  id: number;
  hospitalCode5Digit: string;
  hospitalName: string | null;
  organizationType: string | null;
  userCount: number;
  patientCount: number;
}

export interface HospitalCodeAvailability {
  code: string;
  excludeId: number | null;
  isAvailable: boolean;
}

// ===== Population Management Types =====
export interface Population {
  id: number;
  year: number;
  population: number;
  hospitalCode: string;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  isActive: boolean;
  hospital: {
    id: number;
    hospitalName: string | null;
    hospitalCode5Digit: string;
  };
}

export interface CreatePopulationData {
  year: number;
  population: number;
  hospitalCode: string;
}

export interface UpdatePopulationData {
  year?: number;
  population?: number;
  hospitalCode?: string;
}

export interface PopulationQueryParams {
  page: number;
  limit: number;
  year?: number;
  hospitalCode?: string;
  minPopulation?: number;
  maxPopulation?: number;
  sortBy: 'year' | 'population' | 'hospitalCode' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedPopulationResponse {
  populations: Population[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    year?: number;
    hospitalCode?: string;
    minPopulation?: number;
    maxPopulation?: number;
  };
}

export interface PopulationStats {
  totalRecords: number;
  currentYear: {
    year: number;
    totalPopulation: number;
    hospitalCount: number;
  };
  previousYear: {
    year: number;
    totalPopulation: number;
  };
  populationChange: number | null;
  accessScope: 'ALL_HOSPITALS' | 'LIMITED_HOSPITALS';
  userHospital: string | null;
}

export interface IncidenceRateParams {
  hospitalCode?: string;
  year: number;
  diseaseId?: number;
  per: number;
}

export interface IncidenceRateResult {
  hospitalCode: string;
  hospitalName: string | null;
  year: number;
  population: number;
  patientCount: number;
  incidenceRate: number;
  per: number;
  disease?: {
    id: number;
    thaiName: string;
    engName: string | null;
  };
}

export interface PopulationTrend extends Population {
  yearOverYearChange?: number;
  percentageChange?: number;
}

export interface AccessibleHospitalForPopulation {
  hospitalCode5Digit: string;
  hospitalName: string | null;
  hasPopulationData: boolean;
}

// ===== Disease Types =====
export interface Disease {
  id: number;
  imageUrl?: string | null;
  engName?: string | null;
  thaiName: string;
  daName?: string | null;
  details?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  isActive: boolean;
  symptoms: Array<{
    id: number;
    name: string;
    isActive: boolean;
  }>;
}

export interface CreateDiseaseData {
  thaiName: string;
  engName?: string;
  daName?: string;
  details?: string;
  imageUrl?: string;
}

export interface UpdateDiseaseData {
  thaiName?: string;
  engName?: string;
  daName?: string;
  details?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface DiseaseQueryParams {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  sortBy: 'thaiName' | 'engName' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedDiseaseResponse {
  diseases: Disease[];
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
    isActive?: boolean;
  };
}

export interface DiseaseStats {
  totalDiseases: number;
  activeDiseases: number;
  inactiveDiseases: number;
  withSymptoms: number;
  withoutSymptoms: number;
  mostRecentDisease?: {
    id: number;
    thaiName: string;
    createdAt: string;
  };
}

export interface DiseaseSearchResult {
  id: number;
  thaiName: string;
  engName?: string | null;
}

export interface ActiveDisease {
  id: number;
  thaiName: string;
  engName?: string | null;
  symptomCount: number;
}

export interface DiseaseNameAvailability {
  thaiName: string;
  engName?: string | null;
  availability: {
    thaiNameAvailable: boolean;
    engNameAvailable: boolean;
  };
}

// ===== Symptom Types =====
export interface Symptom {
  id: number;
  diseaseId: number;
  name: string;
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  isActive: boolean;
  disease: {
    id: number;
    thaiName: string;
    engName?: string | null;
  };
}

export interface CreateSymptomData {
  diseaseId: number;
  name: string;
}

export interface UpdateSymptomData {
  diseaseId?: number;
  name?: string;
  isActive?: boolean;
}

export interface SymptomQueryParams {
  page: number;
  limit: number;
  search?: string;
  diseaseId?: number;
  isActive?: boolean;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedSymptomResponse {
  symptoms: Symptom[];
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
    isActive?: boolean;
  };
}

export interface SymptomStats {
  totalSymptoms: number;
  activeSymptoms: number;
  inactiveSymptoms: number;
  byDisease: Array<{
    diseaseId: number;
    diseaseName: string;
    symptomCount: number;
  }>;
  mostRecentSymptom?: {
    id: number;
    name: string;
    diseaseName: string;
    createdAt: string;
  };
}

export interface BulkCreateSymptomsData {
  diseaseId: number;
  symptoms: Array<{
    name: string;
  }>;
}

export interface SymptomsByDisease {
  id: number;
  name: string;
}

export interface SymptomSearchResult {
  id: number;
  name: string;
  diseaseId: number;
  diseaseName: string;
}

// ===== Patient Types (Future Implementation) =====
export interface Patient {
  id: number;
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
  
  // Current Address
  currentHouseNumber?: string | null;
  currentVillageNumber?: string | null;
  currentRoadName?: string | null;
  currentProvince?: string | null;
  currentDistrict?: string | null;
  currentSubDistrict?: string | null;
  
  // Address where illness occurred
  addressSickHouseNumber?: string | null;
  addressSickVillageNumber?: string | null;
  addressSickRoadName?: string | null;
  addressSickProvince?: string | null;
  addressSickDistrict?: string | null;
  addressSickSubDistrict?: string | null;
  
  // Medical Information
  diseaseId: number;
  disease: {
    id: number;
    thaiName: string;
    engName?: string | null;
  };
  symptomsOfDisease?: string | null;
  treatmentHospital?: string | null;
  treatmentArea?: string | null;
  hospitalCode: string;
  hospital: {
    id: number;
    hospitalName: string | null;
    hospitalCode5Digit: string;
  };
  
  // Medical Timeline
  illnessDate: string;
  treatmentDate?: string | null;
  diagnosisDate?: string | null;
  deathDate?: string | null;
  
  // Lab Results
  labResult?: string | null;
  ns1Result?: string | null;
  
  // Patient Status
  patientType?: string | null;
  patientCondition?: string | null;
  causeOfDeath?: string | null;
  receivingProvince?: string | null;
  remarks?: string | null;
  
  // Audit Fields
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  isActive: boolean;
}

export interface CreatePatientData {
  // Patient Demographics
  idCardCode?: string;
  patientHn?: string;
  namePrefix?: string;
  patientName: string;
  gender?: string;
  birthday?: string;
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
  
  // Address where illness occurred
  addressSickHouseNumber?: string;
  addressSickVillageNumber?: string;
  addressSickRoadName?: string;
  addressSickProvince?: string;
  addressSickDistrict?: string;
  addressSickSubDistrict?: string;
  
  // Medical Information
  diseaseId: number;
  symptomsOfDisease?: string;
  treatmentHospital?: string;
  treatmentArea?: string;
  hospitalCode: string;
  
  // Medical Timeline
  illnessDate: string;
  treatmentDate?: string;
  diagnosisDate?: string;
  deathDate?: string;
  
  // Lab Results
  labResult?: string;
  ns1Result?: string;
  
  // Patient Status
  patientType?: string;
  patientCondition?: string;
  causeOfDeath?: string;
  receivingProvince?: string;
  remarks?: string;
}

export interface UpdatePatientData {
  // Same as CreatePatientData but all fields optional
  idCardCode?: string;
  patientHn?: string;
  namePrefix?: string;
  patientName?: string;
  gender?: string;
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
  treatmentHospital?: string;
  treatmentArea?: string;
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

export interface PatientQueryParams {
  page: number;
  limit: number;
  search?: string;
  diseaseId?: number;
  hospitalCode?: string;
  illnessDateFrom?: string;
  illnessDateTo?: string;
  patientCondition?: string;
  isActive?: boolean;
  sortBy: 'patientName' | 'illnessDate' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

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
    illnessDateFrom?: string;
    illnessDateTo?: string;
    patientCondition?: string;
    isActive?: boolean;
  };
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  byDisease: Array<{
    diseaseId: number;
    diseaseName: string;
    patientCount: number;
  }>;
  byHospital: Array<{
    hospitalCode: string;
    hospitalName: string | null;
    patientCount: number;
  }>;
  byCondition: Array<{
    condition: string;
    patientCount: number;
  }>;
  recentPatients: number;
  thisMonthPatients: number;
  lastMonthPatients: number;
  monthlyChange: number;
}

// ===== User Management Types (Future Implementation) =====
export interface CreateUserData {
  username: string;
  password: string;
  name: string;
  roleId: number;
  hospitalCode?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
}

export interface UpdateUserData {
  name?: string;
  roleId?: number;
  hospitalCode?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
}

export interface UserQueryParams {
  page: number;
  limit: number;
  search?: string;
  roleId?: number;
  hospitalCode?: string;
  isActive?: boolean;
  department?: string;
  sortBy: 'name' | 'username' | 'createdAt' | 'updatedAt' | 'roleName';
  sortOrder: 'asc' | 'desc';
}

// ===== System Types =====
export interface SystemHealth {
  status: string;
  timestamp: string;
  environment: string;
  version: string;
  services: {
    database: string;
    cache: string;
    authentication: string;
    authorization: string;
  };
}

// ===== Common Utility Types =====
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BaseFilters {
  search?: string;
  isActive?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeFields?: string[];
  filters?: Record<string, any>;
}