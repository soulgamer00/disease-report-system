// frontend/src/lib/reports/api.ts
// Centralized API calls for all reports

import { getApiUrl } from '../config';
import { API_ENDPOINTS, getReportUrl, REPORTS_CONFIG } from './config';

// ========== TYPES ==========

export interface ReportFilters {
  diseaseId: string;
  year?: string;
  hospital?: string;
  gender?: string;
  ageGroup?: string;
  occupation?: string;
}

export interface Disease {
  id: number;
  imageUrl?: string;
  engName: string;
  thaiName: string;
  daName: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  value: string;
  label: string;
  code?: string;
}

export interface PublicStats {
  totalDiseases: number;
  totalPatients: number;
  currentMonthPatients: number;
}

// Report Response Types
export interface AgeGroupsResponse {
  success: boolean;
  message: string;
  data: {
    disease: {
      id: number;
      thaiName: string;
      engName: string;
      daName: string;
    };
    filters: ReportFilters;
    summary: {
      totalPatients: number;
      totalPopulation: number;
      hasPopulationData: boolean;
    };
    ageGroups: Array<{
      ageGroup: string;
      count: number;
      percentage: number;
      incidenceRate: number;
    }>;
  };
}

export interface GenderRatioResponse {
  success: boolean;
  message: string;
  data: {
    disease: {
      id: number;
      thaiName: string;
      engName: string;
      daName: string;
    };
    filters: ReportFilters;
    summary: {
      total: number;
      male: number;
      female: number;
      other: number;
      notSpecified: number;
      totalPopulation: number;
      hasPopulationData: boolean;
    };
    ratio: {
      male: number;
      female: number;
    };
    percentages: {
      male: number;
      female: number;
      other: number;
      notSpecified: number;
    };
  };
}

export interface IncidenceRatesResponse {
  success: boolean;
  message: string;
  data: {
    disease: {
      id: number;
      thaiName: string;
      engName: string;
      daName: string;
    };
    filters: ReportFilters;
    summary: {
      totalPopulation: number;
      totalPatients: number;
      deaths: number;
      incidenceRate: number;
      mortalityRate: number;
      caseFatalityRate: number;
      hasPopulationData: boolean;
    };
    hospitals: Array<{
      hospitalCode: string;
      hospitalName: string;
      population: number;
      patients: number;
      deaths: number;
      incidenceRate: number;
      mortalityRate: number;
      caseFatalityRate: number;
      hasPopulationData: boolean;
    }>;
  };
}

export interface OccupationResponse {
  success: boolean;
  message: string;
  data: {
    disease: {
      id: number;
      thaiName: string;
      engName: string;
      daName: string;
    };
    filters: ReportFilters;
    summary: {
      totalPatients: number;
      uniqueOccupations: number;
    };
    occupations: Array<{
      occupation: string;
      count: number;
      percentage: number;
    }>;
  };
}

// ========== API CLASS ==========

class ReportsAPI {
  private timeout = REPORTS_CONFIG.REFRESH_INTERVAL;

  // Generic fetch with error handling
  private async fetchWithErrorHandling<T>(url: string): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message || 'API returned error');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // ========== PUBLIC DATA METHODS ==========

  async getDiseases(): Promise<Disease[]> {
    const url = getApiUrl(API_ENDPOINTS.PUBLIC_DISEASES);
    return this.fetchWithErrorHandling<Disease[]>(url);
  }

  async getDiseaseById(id: string): Promise<Disease> {
    const url = getApiUrl(`${API_ENDPOINTS.PUBLIC_DISEASES_BY_ID}/${id}`);
    return this.fetchWithErrorHandling<Disease>(url);
  }

  async getHospitals(): Promise<Hospital[]> {
    const url = getApiUrl(API_ENDPOINTS.PUBLIC_HOSPITALS);
    return this.fetchWithErrorHandling<Hospital[]>(url);
  }

  async getPublicStats(): Promise<PublicStats> {
    const url = getApiUrl(API_ENDPOINTS.PUBLIC_STATS);
    return this.fetchWithErrorHandling<PublicStats>(url);
  }

  // ========== REPORTS METHODS ==========

  async getAgeGroups(filters: ReportFilters): Promise<AgeGroupsResponse> {
    const url = getReportUrl(API_ENDPOINTS.REPORTS_AGE_GROUPS, filters);
    return this.fetchWithErrorHandling<AgeGroupsResponse>(url);
  }

  async getGenderRatio(filters: ReportFilters): Promise<GenderRatioResponse> {
    const url = getReportUrl(API_ENDPOINTS.REPORTS_GENDER_RATIO, filters);
    return this.fetchWithErrorHandling<GenderRatioResponse>(url);
  }

  async getIncidenceRates(filters: ReportFilters): Promise<IncidenceRatesResponse> {
    const url = getReportUrl(API_ENDPOINTS.REPORTS_INCIDENCE_RATES, filters);
    return this.fetchWithErrorHandling<IncidenceRatesResponse>(url);
  }

  async getOccupation(filters: ReportFilters): Promise<OccupationResponse> {
    const url = getReportUrl(API_ENDPOINTS.REPORTS_OCCUPATION, filters);
    return this.fetchWithErrorHandling<OccupationResponse>(url);
  }
}

// ========== SINGLETON INSTANCE ==========

export const reportsAPI = new ReportsAPI();

// ========== UTILITY FUNCTIONS ==========

// Format numbers for Thai locale
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('th-TH').format(num);
}

// Format percentage
export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

// Format rate with decimals
export function formatRate(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

// Validate filters before API call
export function validateFilters(filters: ReportFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!filters.diseaseId || filters.diseaseId === '') {
    errors.push('Disease ID is required');
  }

  if (filters.diseaseId && !/^\d+$/.test(filters.diseaseId)) {
    errors.push('Disease ID must be a number');
  }

  if (filters.year && filters.year !== 'all' && !/^\d{4}$/.test(filters.year)) {
    errors.push('Year must be a 4-digit number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}