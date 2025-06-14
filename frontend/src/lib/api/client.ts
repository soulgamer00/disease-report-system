// src/lib/api/client.ts - ✅ COMPLETE Disease & Symptom Client Methods
// ✅ SECURITY: API client with proper error handling and NO hardcoded URLs

import { config } from '$lib/config/env';
import { API_ENDPOINTS, EndpointBuilder, EndpointValidator } from './endpoints';
import type { 
  ApiResponse,
  // Disease Types
  Disease,
  CreateDiseaseData,
  UpdateDiseaseData,
  DiseaseQueryParams,
  PaginatedDiseaseResponse,
  DiseaseStats,
  DiseaseSearchResult,
  ActiveDisease,
  DiseaseNameAvailability,
  // Symptom Types
  Symptom,
  CreateSymptomData,
  UpdateSymptomData,
  SymptomQueryParams,
  PaginatedSymptomResponse,
  SymptomStats,
  BulkCreateSymptomsData,
  SymptomsByDisease,
  SymptomSearchResult,
  // Other types
  Hospital,
  CreateHospitalData,
  UpdateHospitalData,
  HospitalQueryParams,
  PaginatedHospitalResponse,
  HospitalStats,
  HospitalSearchResult,
  ActiveHospital,
  HospitalCodeAvailability,
  LoginCredentials,
  User,
  Population,
  CreatePopulationData,
  UpdatePopulationData,
  PopulationQueryParams,
  PaginatedPopulationResponse,
  PopulationStats,
  IncidenceRateParams,
  IncidenceRateResult,
  PopulationTrend,
  AccessibleHospitalForPopulation
} from './types';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // ✅ SECURITY: Include httpOnly cookies
      ...options,
    };

    try {
      console.log('DEBUG (apiClient): Making request to:', endpoint);
      const response = await fetch(url, config);
      
      // Parse JSON response
      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('DEBUG (apiClient): Failed to parse JSON:', parseError);
        throw new ApiClientError(
          'Invalid response format from server',
          response.status
        );
      }

      // Check if response was successful
      if (!response.ok) {
        console.error('DEBUG (apiClient): HTTP error:', response.status, data);
        throw new ApiClientError(
          data.message || `HTTP ${response.status}`,
          response.status,
          data.code,
          data.errors
        );
      }

      console.log('DEBUG (apiClient): Request successful:', endpoint);
      return data;

    } catch (error) {
      console.error('DEBUG (apiClient): Request failed:', endpoint, error);
      
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Network or other errors
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // ===== Authentication Methods =====
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User }>> {
    return this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request(API_ENDPOINTS.AUTH.PROFILE);
  }

  // ===== 🚀 Disease Methods - Complete Implementation =====

  /**
   * Get paginated list of diseases
   */
  async getDiseases(params?: DiseaseQueryParams): Promise<ApiResponse<PaginatedDiseaseResponse>> {
    const validatedParams = this.validateDiseaseQueryParams(params);
    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.DISEASES.LIST, validatedParams);
    return this.request(endpoint);
  }

  /**
   * Get disease by ID
   */
  async getDiseaseById(id: number): Promise<ApiResponse<Disease>> {
    const validatedId = EndpointValidator.validateDiseaseId(id);
    return this.request(API_ENDPOINTS.DISEASES.GET(validatedId));
  }

  /**
   * Create new disease
   */
  async createDisease(data: CreateDiseaseData): Promise<ApiResponse<Disease>> {
    this.validateCreateDiseaseData(data);
    return this.request(API_ENDPOINTS.DISEASES.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update existing disease
   */
  async updateDisease(id: number, data: UpdateDiseaseData): Promise<ApiResponse<Disease>> {
    const validatedId = EndpointValidator.validateDiseaseId(id);
    this.validateUpdateDiseaseData(data);
    return this.request(API_ENDPOINTS.DISEASES.UPDATE(validatedId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete disease (soft delete)
   */
  async deleteDisease(id: number): Promise<ApiResponse<{ id: number; deletedBy: string; deletedAt: string }>> {
    const validatedId = EndpointValidator.validateDiseaseId(id);
    return this.request(API_ENDPOINTS.DISEASES.DELETE(validatedId), {
      method: 'DELETE',
    });
  }

  /**
   * Get all active diseases (for dropdowns)
   */
  async getActiveDiseases(): Promise<ApiResponse<ActiveDisease[]>> {
    return this.request(API_ENDPOINTS.DISEASES.ACTIVE);
  }

  /**
   * Search diseases by name (for autocomplete)
   */
  async searchDiseases(query: string, limit: number = 10): Promise<ApiResponse<{
    query: string;
    results: DiseaseSearchResult[];
    count: number;
  }>> {
    const validatedQuery = EndpointValidator.validateSearchQuery(query);
    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.DISEASES.SEARCH, {
      q: validatedQuery,
      limit: Math.min(limit, 50)
    });
    return this.request(endpoint);
  }

  /**
   * Get disease statistics
   */
  async getDiseaseStats(): Promise<ApiResponse<DiseaseStats>> {
    return this.request(API_ENDPOINTS.DISEASES.STATS);
  }

  /**
   * Check disease name availability
   */
  async checkDiseaseNameAvailability(
    thaiName: string, 
    engName?: string, 
    excludeId?: number
  ): Promise<ApiResponse<DiseaseNameAvailability>> {
    const params: Record<string, any> = { thaiName: thaiName.trim() };
    if (engName) params.engName = engName.trim();
    if (excludeId) params.excludeId = excludeId;

    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.DISEASES.CHECK_NAME, params);
    return this.request(endpoint);
  }

  /**
   * Toggle disease active status
   */
  async toggleDiseaseStatus(id: number): Promise<ApiResponse<Disease>> {
    const validatedId = EndpointValidator.validateDiseaseId(id);
    return this.request(API_ENDPOINTS.DISEASES.TOGGLE_STATUS(validatedId), {
      method: 'PUT',
    });
  }

  /**
   * Get diseases with symptoms
   */
  async getDiseasesWithSymptoms(includeInactive: boolean = false): Promise<ApiResponse<Disease[]>> {
    const endpoint = EndpointBuilder.disease.withSymptoms(includeInactive);
    return this.request(endpoint);
  }

  /**
   * Get diseases without symptoms
   */
  async getDiseasesWithoutSymptoms(): Promise<ApiResponse<Disease[]>> {
    return this.request(API_ENDPOINTS.DISEASES.WITHOUT_SYMPTOMS);
  }

  /**
   * Get most common diseases
   */
  async getMostCommonDiseases(limit: number = 10, timeframe: string = '1year'): Promise<ApiResponse<Array<Disease & { patientCount: number }>>> {
    const endpoint = EndpointBuilder.disease.mostCommon(limit, timeframe);
    return this.request(endpoint);
  }

  /**
   * Get recently added diseases
   */
  async getRecentlyAddedDiseases(days: number = 30, limit: number = 10): Promise<ApiResponse<Disease[]>> {
    const endpoint = EndpointBuilder.disease.recentlyAdded(days, limit);
    return this.request(endpoint);
  }

  /**
   * Disease autocomplete
   */
  async autocompleteDiseases(query: string, limit: number = 5): Promise<ApiResponse<DiseaseSearchResult[]>> {
    const validatedQuery = EndpointValidator.validateSearchQuery(query);
    const endpoint = EndpointBuilder.disease.autocomplete(validatedQuery, limit);
    return this.request(endpoint);
  }

  /**
   * Bulk create diseases
   */
  async bulkCreateDiseases(diseases: CreateDiseaseData[]): Promise<ApiResponse<{
    created: Disease[];
    failed: Array<{ data: CreateDiseaseData; reason: string }>;
    summary: { total: number; successful: number; failed: number };
  }>> {
    if (!Array.isArray(diseases) || diseases.length === 0) {
      throw new ApiClientError('Diseases array is required and cannot be empty', 400);
    }

    diseases.forEach((disease, index) => {
      try {
        this.validateCreateDiseaseData(disease);
      } catch (error) {
        throw new ApiClientError(
          `Invalid disease data at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          400
        );
      }
    });

    return this.request(API_ENDPOINTS.DISEASES.BULK_CREATE, {
      method: 'POST',
      body: JSON.stringify({ diseases }),
    });
  }

  /**
   * Export diseases to CSV
   */
  async exportDiseasesCSV(filters?: DiseaseQueryParams): Promise<Blob> {
    const endpoint = EndpointBuilder.disease.exportCsv(filters);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new ApiClientError('Export failed', response.status);
    }
    
    return response.blob();
  }

  /**
   * Get disease usage analytics
   */
  async getDiseaseUsageAnalytics(timeframe: string = '1year'): Promise<ApiResponse<{
    totalPatients: number;
    diseaseDistribution: Array<{ diseaseId: number; diseaseName: string; patientCount: number; percentage: number }>;
    trends: Array<{ month: string; patientCount: number }>;
  }>> {
    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.DISEASES.USAGE_ANALYTICS, { timeframe });
    return this.request(endpoint);
  }

  /**
   * Advanced disease search
   */
  async advancedSearchDiseases(criteria: {
    query?: string;
    hasSymptoms?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    patientCountMin?: number;
    patientCountMax?: number;
  }): Promise<ApiResponse<PaginatedDiseaseResponse>> {
    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.DISEASES.ADVANCED_SEARCH, criteria);
    return this.request(endpoint);
  }

  // ===== 🚀 Symptom Methods - Complete Implementation =====

  /**
   * Get paginated list of symptoms
   */
  async getSymptoms(params?: SymptomQueryParams): Promise<ApiResponse<PaginatedSymptomResponse>> {
    const validatedParams = this.validateSymptomQueryParams(params);
    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.SYMPTOMS.LIST, validatedParams);
    return this.request(endpoint);
  }

  /**
   * Get symptom by ID
   */
  async getSymptomById(id: number): Promise<ApiResponse<Symptom>> {
    const validatedId = EndpointValidator.validateSymptomId(id);
    return this.request(API_ENDPOINTS.SYMPTOMS.GET(validatedId));
  }

  /**
   * Create new symptom
   */
  async createSymptom(data: CreateSymptomData): Promise<ApiResponse<Symptom>> {
    this.validateCreateSymptomData(data);
    return this.request(API_ENDPOINTS.SYMPTOMS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update existing symptom
   */
  async updateSymptom(id: number, data: UpdateSymptomData): Promise<ApiResponse<Symptom>> {
    const validatedId = EndpointValidator.validateSymptomId(id);
    this.validateUpdateSymptomData(data);
    return this.request(API_ENDPOINTS.SYMPTOMS.UPDATE(validatedId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete symptom (soft delete)
   */
  async deleteSymptom(id: number): Promise<ApiResponse<{ id: number; deletedBy: string; deletedAt: string }>> {
    const validatedId = EndpointValidator.validateSymptomId(id);
    return this.request(API_ENDPOINTS.SYMPTOMS.DELETE(validatedId), {
      method: 'DELETE',
    });
  }

  /**
   * Get symptoms by disease ID (for patient forms)
   */
  async getSymptomsByDisease(diseaseId: number): Promise<ApiResponse<SymptomsByDisease[]>> {
    const validatedDiseaseId = EndpointValidator.validateDiseaseId(diseaseId);
    return this.request(API_ENDPOINTS.SYMPTOMS.BY_DISEASE(validatedDiseaseId));
  }

  /**
   * Search symptoms by name (for autocomplete)
   */
  async searchSymptoms(
    query: string, 
    diseaseId?: number, 
    limit: number = 10
  ): Promise<ApiResponse<{
    query: string;
    diseaseId: number | null;
    results: SymptomSearchResult[];
    count: number;
  }>> {
    const validatedQuery = EndpointValidator.validateSearchQuery(query);
    const endpoint = EndpointBuilder.symptom.search(validatedQuery, diseaseId, Math.min(limit, 50));
    return this.request(endpoint);
  }

  /**
   * Get symptom statistics
   */
  async getSymptomStats(): Promise<ApiResponse<SymptomStats>> {
    return this.request(API_ENDPOINTS.SYMPTOMS.STATS);
  }

  /**
   * Bulk create symptoms for a disease
   */
  async bulkCreateSymptoms(data: BulkCreateSymptomsData): Promise<ApiResponse<{
    diseaseId: number;
    createdSymptoms: Symptom[];
    count: number;
  }>> {
    this.validateBulkCreateSymptomsData(data);
    return this.request(API_ENDPOINTS.SYMPTOMS.BULK_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Bulk update symptoms
   */
  async bulkUpdateSymptoms(updates: Array<{
    id: number;
    data: UpdateSymptomData;
  }>): Promise<ApiResponse<{
    updated: Symptom[];
    failed: Array<{ id: number; reason: string }>;
    summary: { total: number; successful: number; failed: number };
  }>> {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ApiClientError('Updates array is required and cannot be empty', 400);
    }

    updates.forEach((update, index) => {
      try {
        EndpointValidator.validateSymptomId(update.id);
        this.validateUpdateSymptomData(update.data);
      } catch (error) {
        throw new ApiClientError(
          `Invalid update data at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          400
        );
      }
    });

    return this.request(API_ENDPOINTS.SYMPTOMS.BULK_UPDATE, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
  }

  /**
   * Bulk delete symptoms
   */
  async bulkDeleteSymptoms(symptomIds: number[]): Promise<ApiResponse<{
    deleted: number[];
    failed: Array<{ id: number; reason: string }>;
    summary: { total: number; successful: number; failed: number };
  }>> {
    if (!Array.isArray(symptomIds) || symptomIds.length === 0) {
      throw new ApiClientError('Symptom IDs array is required and cannot be empty', 400);
    }

    symptomIds.forEach(id => EndpointValidator.validateSymptomId(id));

    return this.request(API_ENDPOINTS.SYMPTOMS.BULK_DELETE, {
      method: 'DELETE',
      body: JSON.stringify({ symptomIds }),
    });
  }

  /**
   * Check symptom name availability for a disease
   */
  async checkSymptomNameAvailability(
    diseaseId: number,
    name: string,
    excludeId?: number
  ): Promise<ApiResponse<{
    diseaseId: number;
    name: string;
    excludeId: number | null;
    isAvailable: boolean;
  }>> {
    const validatedDiseaseId = EndpointValidator.validateDiseaseId(diseaseId);
    const endpoint = EndpointBuilder.symptom.checkName(validatedDiseaseId, name.trim(), excludeId);
    return this.request(endpoint);
  }

  /**
   * Toggle symptom active status
   */
  async toggleSymptomStatus(id: number): Promise<ApiResponse<Symptom>> {
    const validatedId = EndpointValidator.validateSymptomId(id);
    return this.request(API_ENDPOINTS.SYMPTOMS.TOGGLE_STATUS(validatedId), {
      method: 'PUT',
    });
  }

  /**
   * Symptom autocomplete
   */
  async autocompleteSymptoms(
    query: string, 
    diseaseId?: number, 
    limit: number = 5
  ): Promise<ApiResponse<SymptomSearchResult[]>> {
    const validatedQuery = EndpointValidator.validateSearchQuery(query);
    const endpoint = EndpointBuilder.symptom.autocomplete(validatedQuery, diseaseId, limit);
    return this.request(endpoint);
  }

  /**
   * Filter symptoms by disease IDs
   */
  async filterSymptomsByDiseases(
    diseaseIds: number[], 
    includeInactive: boolean = false
  ): Promise<ApiResponse<Symptom[]>> {
    if (!Array.isArray(diseaseIds) || diseaseIds.length === 0) {
      throw new ApiClientError('Disease IDs array is required and cannot be empty', 400);
    }

    diseaseIds.forEach(id => EndpointValidator.validateDiseaseId(id));
    const endpoint = EndpointBuilder.symptom.filterByDisease(diseaseIds, includeInactive);
    return this.request(endpoint);
  }

  /**
   * Export symptoms to CSV
   */
  async exportSymptomsCSV(filters?: SymptomQueryParams): Promise<Blob> {
    const endpoint = EndpointBuilder.symptom.exportCsv(filters);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new ApiClientError('Export failed', response.status);
    }
    
    return response.blob();
  }

  /**
   * Export symptoms by disease to CSV
   */
  async exportSymptomsByDiseaseCSV(diseaseId: number): Promise<Blob> {
    const validatedDiseaseId = EndpointValidator.validateDiseaseId(diseaseId);
    
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SYMPTOMS.EXPORT_BY_DISEASE(validatedDiseaseId)}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new ApiClientError('Export failed', response.status);
    }
    
    return response.blob();
  }

  /**
   * Get symptom usage analytics
   */
  async getSymptomUsageAnalytics(timeframe: string = '1year'): Promise<ApiResponse<{
    totalUsage: number;
    symptomDistribution: Array<{ 
      symptomId: number; 
      symptomName: string; 
      diseaseId: number;
      diseaseName: string;
      usageCount: number; 
      percentage: number 
    }>;
    trends: Array<{ month: string; usageCount: number }>;
  }>> {
    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.SYMPTOMS.USAGE_ANALYTICS, { timeframe });
    return this.request(endpoint);
  }

  /**
   * Get disease coverage analytics
   */
  async getDiseaseCoverageAnalytics(): Promise<ApiResponse<{
    totalDiseases: number;
    diseasesWithSymptoms: number;
    diseasesWithoutSymptoms: number;
    averageSymptomsPerDisease: number;
    coverage: Array<{
      diseaseId: number;
      diseaseName: string;
      symptomCount: number;
      coverageLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  }>> {
    return this.request(API_ENDPOINTS.SYMPTOMS.DISEASE_COVERAGE);
  }

  /**
   * Get most common symptoms
   */
  async getMostCommonSymptoms(limit: number = 20, timeframe: string = '1year'): Promise<ApiResponse<Array<{
    id: number;
    name: string;
    diseaseId: number;
    diseaseName: string;
    usageCount: number;
    rank: number;
  }>>> {
    const endpoint = EndpointBuilder.symptom.commonSymptoms(limit, timeframe);
    return this.request(endpoint);
  }

  /**
   * Get patient symptom analytics
   */
  async getPatientSymptomAnalytics(
    hospitalCode?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<{
    totalPatients: number;
    symptomFrequency: Array<{
      symptomId: number;
      symptomName: string;
      diseaseId: number;
      diseaseName: string;
      patientCount: number;
      frequency: number;
    }>;
    comorbidityPatterns: Array<{
      symptoms: string[];
      patientCount: number;
      percentage: number;
    }>;
  }>> {
    const params: Record<string, any> = {};
    if (hospitalCode) params.hospitalCode = hospitalCode;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.SYMPTOMS.PATIENT_SYMPTOMS, params);
    return this.request(endpoint);
  }

  /**
   * Validate bulk symptoms data
   */
  async validateBulkSymptoms(data: {
    diseaseId: number;
    symptoms: Array<{ name: string }>;
  }): Promise<ApiResponse<{
    valid: Array<{ name: string; status: 'valid' }>;
    invalid: Array<{ name: string; status: 'invalid'; reason: string }>;
    duplicates: Array<{ name: string; status: 'duplicate'; existingId: number }>;
    summary: { total: number; valid: number; invalid: number; duplicates: number };
  }>> {
    this.validateBulkCreateSymptomsData(data);
    return this.request(API_ENDPOINTS.SYMPTOMS.VALIDATE_BULK, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Check for duplicate symptoms
   */
  async checkDuplicateSymptoms(diseaseId: number, names: string[]): Promise<ApiResponse<{
    diseaseId: number;
    results: Array<{
      name: string;
      isDuplicate: boolean;
      existingId?: number;
    }>;
  }>> {
    const validatedDiseaseId = EndpointValidator.validateDiseaseId(diseaseId);
    
    if (!Array.isArray(names) || names.length === 0) {
      throw new ApiClientError('Names array is required and cannot be empty', 400);
    }

    return this.request(API_ENDPOINTS.SYMPTOMS.DUPLICATE_CHECK, {
      method: 'POST',
      body: JSON.stringify({ diseaseId: validatedDiseaseId, names }),
    });
  }

  /**
   * Get merge suggestions for symptoms
   */
  async getSymptomMergeSuggestions(symptomIds: number[]): Promise<ApiResponse<{
    suggestions: Array<{
      primarySymptom: { id: number; name: string; diseaseId: number };
      duplicateSymptoms: Array<{ id: number; name: string; similarity: number }>;
      confidence: number;
      reason: string;
    }>;
    summary: { totalAnalyzed: number; suggestionsFound: number };
  }>> {
    if (!Array.isArray(symptomIds) || symptomIds.length === 0) {
      throw new ApiClientError('Symptom IDs array is required and cannot be empty', 400);
    }

    symptomIds.forEach(id => EndpointValidator.validateSymptomId(id));
    const endpoint = EndpointBuilder.symptom.mergeSuggestions(symptomIds);
    return this.request(endpoint);
  }

  /**
   * Advanced symptom search
   */
  async advancedSearchSymptoms(criteria: {
    query?: string;
    diseaseIds?: number[];
    createdAfter?: string;
    createdBefore?: string;
    usageCountMin?: number;
    usageCountMax?: number;
  }): Promise<ApiResponse<PaginatedSymptomResponse>> {
    const params: Record<string, any> = {};
    
    if (criteria.query) {
      params.query = EndpointValidator.validateSearchQuery(criteria.query);
    }
    
    if (criteria.diseaseIds?.length) {
      criteria.diseaseIds.forEach(id => EndpointValidator.validateDiseaseId(id));
      params.diseaseIds = criteria.diseaseIds;
    }
    
    if (criteria.createdAfter) params.createdAfter = criteria.createdAfter;
    if (criteria.createdBefore) params.createdBefore = criteria.createdBefore;
    if (criteria.usageCountMin) params.usageCountMin = criteria.usageCountMin;
    if (criteria.usageCountMax) params.usageCountMax = criteria.usageCountMax;

    const endpoint = EndpointBuilder.withParams(API_ENDPOINTS.SYMPTOMS.ADVANCED_SEARCH, params);
    return this.request(endpoint);
  }

  // ===== Hospital Methods (Previous Implementation) =====
  async getHospitals(params?: HospitalQueryParams): Promise<ApiResponse<PaginatedHospitalResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `${API_ENDPOINTS.HOSPITALS.LIST}?${searchParams.toString()}`;
    return this.request(endpoint);
  }

  async getHospitalById(id: number): Promise<ApiResponse<Hospital>> {
    return this.request(API_ENDPOINTS.HOSPITALS.GET(id));
  }

  async getHospitalByCode(code: string): Promise<ApiResponse<Hospital>> {
    return this.request(API_ENDPOINTS.HOSPITALS.BY_CODE(code));
  }

  async createHospital(data: CreateHospitalData): Promise<ApiResponse<Hospital>> {
    return this.request(API_ENDPOINTS.HOSPITALS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHospital(id: number, data: UpdateHospitalData): Promise<ApiResponse<Hospital>> {
    return this.request(API_ENDPOINTS.HOSPITALS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHospital(id: number): Promise<ApiResponse<{ id: number; deletedBy: string; deletedAt: string }>> {
    return this.request(API_ENDPOINTS.HOSPITALS.DELETE(id), {
      method: 'DELETE',
    });
  }

  async getActiveHospitals(): Promise<ApiResponse<ActiveHospital[]>> {
    return this.request(API_ENDPOINTS.HOSPITALS.ACTIVE);
  }

  async searchHospitals(query: string, limit: number = 10): Promise<ApiResponse<{
    query: string;
    results: HospitalSearchResult[];
    count: number;
  }>> {
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const endpoint = `${API_ENDPOINTS.HOSPITALS.SEARCH}?${searchParams.toString()}`;
    return this.request(endpoint);
  }

  async getHospitalStats(): Promise<ApiResponse<HospitalStats>> {
    return this.request(API_ENDPOINTS.HOSPITALS.STATS);
  }

  // ===== Population Methods (Previous Implementation) =====
  async getPopulations(params?: PopulationQueryParams): Promise<ApiResponse<PaginatedPopulationResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `${API_ENDPOINTS.POPULATIONS.LIST}?${searchParams.toString()}`;
    return this.request(endpoint);
  }

  async getPopulationById(id: number): Promise<ApiResponse<Population>> {
    return this.request(API_ENDPOINTS.POPULATIONS.GET(id));
  }

  async createPopulation(data: CreatePopulationData): Promise<ApiResponse<Population>> {
    return this.request(API_ENDPOINTS.POPULATIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePopulation(id: number, data: UpdatePopulationData): Promise<ApiResponse<Population>> {
    return this.request(API_ENDPOINTS.POPULATIONS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePopulation(id: number): Promise<ApiResponse<{ id: number; deletedBy: string; deletedAt: string }>> {
    return this.request(API_ENDPOINTS.POPULATIONS.DELETE(id), {
      method: 'DELETE',
    });
  }

  async getPopulationStats(): Promise<ApiResponse<PopulationStats>> {
    return this.request(API_ENDPOINTS.POPULATIONS.STATS);
  }

  async calculateIncidenceRate(params: IncidenceRateParams): Promise<ApiResponse<{
    parameters: IncidenceRateParams;
    results: IncidenceRateResult[];
    calculatedAt: string;
  }>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = `${API_ENDPOINTS.POPULATIONS.INCIDENCE_RATE}?${searchParams.toString()}`;
    return this.request(endpoint);
  }

  async getPopulationTrends(
    hospitalCode: string, 
    startYear?: number, 
    endYear?: number
  ): Promise<ApiResponse<{
    hospitalCode: string;
    trends: PopulationTrend[];
    period: {
      startYear: number;
      endYear: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    
    if (startYear) searchParams.append('startYear', startYear.toString());
    if (endYear) searchParams.append('endYear', endYear.toString());

    const endpoint = `${API_ENDPOINTS.POPULATIONS.TRENDS(hospitalCode)}?${searchParams.toString()}`;
    return this.request(endpoint);
  }

  async getPopulationByHospitalYear(hospitalCode: string, year: number): Promise<ApiResponse<Population>> {
    return this.request(API_ENDPOINTS.POPULATIONS.BY_HOSPITAL_YEAR(hospitalCode, year));
  }

  async getAccessibleHospitalsForPopulation(): Promise<ApiResponse<AccessibleHospitalForPopulation[]>> {
    return this.request(API_ENDPOINTS.POPULATIONS.ACCESSIBLE_HOSPITALS);
  }

  async searchPopulations(
    query: string, 
    limit: number = 10
  ): Promise<ApiResponse<{
    query: string;
    results: Population[];
    count: number;
  }>> {
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const endpoint = `${API_ENDPOINTS.POPULATIONS.SEARCH}?${searchParams.toString()}`;
    return this.request(endpoint);
  }

  async bulkImportPopulations(populations: CreatePopulationData[]): Promise<ApiResponse<{
    imported: Population[];
    failed: Array<{ data: CreatePopulationData; reason: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }>> {
    return this.request(API_ENDPOINTS.POPULATIONS.BULK_IMPORT, {
      method: 'POST',
      body: JSON.stringify({ populations }),
    });
  }

  async exportPopulationsCSV(params?: PopulationQueryParams): Promise<Blob> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `${API_ENDPOINTS.POPULATIONS.EXPORT_CSV}?${searchParams.toString()}`;
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new ApiClientError('Export failed', response.status);
    }
    
    return response.blob();
  }

  // ===== 🚀 Validation Methods =====

  private validateDiseaseQueryParams(params?: DiseaseQueryParams): Record<string, any> {
    if (!params) {
      return {
        page: 1,
        limit: 20,
        sortBy: 'thaiName',
        sortOrder: 'asc'
      };
    }

    const validated = EndpointValidator.validatePagination(params.page, params.limit);
    const sort = EndpointValidator.validateSort(params.sortBy, params.sortOrder, ['thaiName', 'engName', 'createdAt', 'updatedAt']);

    return {
      ...validated,
      ...sort,
      search: params.search?.trim(),
      isActive: params.isActive
    };
  }

  private validateSymptomQueryParams(params?: SymptomQueryParams): Record<string, any> {
    if (!params) {
      return {
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc'
      };
    }

    const validated = EndpointValidator.validatePagination(params.page, params.limit);
    const sort = EndpointValidator.validateSort(params.sortBy, params.sortOrder, ['name', 'createdAt', 'updatedAt']);

    const result: Record<string, any> = {
      ...validated,
      ...sort,
      search: params.search?.trim(),
      isActive: params.isActive
    };

    if (params.diseaseId) {
      result.diseaseId = EndpointValidator.validateDiseaseId(params.diseaseId);
    }

    return result;
  }

  private validateCreateDiseaseData(data: CreateDiseaseData): void {
    if (!data.thaiName?.trim()) {
      throw new ApiClientError('Thai name is required', 400);
    }

    if (data.thaiName.length < 2 || data.thaiName.length > 100) {
      throw new ApiClientError('Thai name must be between 2 and 100 characters', 400);
    }

    if (data.engName && (data.engName.length < 2 || data.engName.length > 100)) {
      throw new ApiClientError('English name must be between 2 and 100 characters', 400);
    }

    if (data.details && data.details.length > 1000) {
      throw new ApiClientError('Details must be less than 1000 characters', 400);
    }
  }

  private validateUpdateDiseaseData(data: UpdateDiseaseData): void {
    if (Object.keys(data).length === 0) {
      throw new ApiClientError('At least one field must be provided for update', 400);
    }

    if (data.thaiName !== undefined) {
      if (!data.thaiName?.trim()) {
        throw new ApiClientError('Thai name cannot be empty', 400);
      }
      if (data.thaiName.length < 2 || data.thaiName.length > 100) {
        throw new ApiClientError('Thai name must be between 2 and 100 characters', 400);
      }
    }

    if (data.engName !== undefined && data.engName) {
      if (data.engName.length < 2 || data.engName.length > 100) {
        throw new ApiClientError('English name must be between 2 and 100 characters', 400);
      }
    }

    if (data.details !== undefined && data.details && data.details.length > 1000) {
      throw new ApiClientError('Details must be less than 1000 characters', 400);
    }
  }

  private validateCreateSymptomData(data: CreateSymptomData): void {
    EndpointValidator.validateDiseaseId(data.diseaseId);

    if (!data.name?.trim()) {
      throw new ApiClientError('Symptom name is required', 400);
    }

    if (data.name.length < 2 || data.name.length > 255) {
      throw new ApiClientError('Symptom name must be between 2 and 255 characters', 400);
    }
  }

  private validateUpdateSymptomData(data: UpdateSymptomData): void {
    if (Object.keys(data).length === 0) {
      throw new ApiClientError('At least one field must be provided for update', 400);
    }

    if (data.diseaseId !== undefined) {
      EndpointValidator.validateDiseaseId(data.diseaseId);
    }

    if (data.name !== undefined) {
      if (!data.name?.trim()) {
        throw new ApiClientError('Symptom name cannot be empty', 400);
      }
      if (data.name.length < 2 || data.name.length > 255) {
        throw new ApiClientError('Symptom name must be between 2 and 255 characters', 400);
      }
    }
  }

  private validateBulkCreateSymptomsData(data: BulkCreateSymptomsData): void {
    EndpointValidator.validateDiseaseId(data.diseaseId);

    if (!Array.isArray(data.symptoms) || data.symptoms.length === 0) {
      throw new ApiClientError('Symptoms array is required and cannot be empty', 400);
    }

    if (data.symptoms.length > 50) {
      throw new ApiClientError('Cannot create more than 50 symptoms at once', 400);
    }

    data.symptoms.forEach((symptom, index) => {
      if (!symptom.name?.trim()) {
        throw new ApiClientError(`Symptom name is required at index ${index}`, 400);
      }
      if (symptom.name.length < 2 || symptom.name.length > 255) {
        throw new ApiClientError(`Symptom name at index ${index} must be between 2 and 255 characters`, 400);
      }
    });

    // Check for duplicates within the array
    const names = data.symptoms.map(s => s.name.trim().toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      throw new ApiClientError(`Duplicate symptom names found: ${duplicates.join(', ')}`, 400);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();