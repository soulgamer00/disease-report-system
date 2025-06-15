// src/lib/services/api.ts
// 🔥 Universal API service สำหรับ public reports

// ========== TYPES ==========
export interface PublicApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

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
  engName?: string;
  thaiName: string;
  daName?: string;
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

// ✅ เพิ่ม Population Stats Interface
export interface PopulationStats {
  currentYear: number;
  totalCurrentPopulation: number;
  hospitalsWithPopulation: number;
  availableYears: number[];
  hospitalBreakdown: Array<{
    hospitalCode: string;
    hospitalName: string;
    population: number;
    year: number;
  }>;
}

// Report Data Types
export interface AgeGroupData {
  ageGroup: string;
  count: number;
  percentage: number;
  incidenceRate: number;
}

export interface GenderData {
  total: number;
  male: number;
  female: number;
  other: number;
  notSpecified: number;
}

export interface HospitalRateData {
  hospitalCode: string;
  hospitalName: string;
  population: number;
  patients: number;
  deaths: number;
  incidenceRate: number;
  mortalityRate: number;
  caseFatalityRate: number;
  hasPopulationData: boolean;
}

export interface OccupationData {
  occupation: string;
  count: number;
  percentage: number;
}

// Report Response Types
export interface AgeGroupsReport {
  disease: {
    id: number;
    thaiName: string;
    engName?: string;
    daName?: string;
  };
  filters: ReportFilters;
  summary: {
    totalPatients: number;
    totalPopulation: number;
    hasPopulationData: boolean;
  };
  ageGroups: AgeGroupData[];
}

export interface GenderRatioReport {
  disease: {
    id: number;
    thaiName: string;
    engName?: string;
    daName?: string;
  };
  filters: ReportFilters;
  summary: GenderData & {
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
}

export interface IncidenceRatesReport {
  disease: {
    id: number;
    thaiName: string;
    engName?: string;
    daName?: string;
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
    populationNote?: string;
  };
  hospitals: HospitalRateData[];
  populationDetails: {
    totalHospitalsWithData: number;
    yearsCovered: number[];
    note: string;
  };
}

export interface OccupationReport {
  disease: {
    id: number;
    thaiName: string;
    engName?: string;
    daName?: string;
  };
  filters: ReportFilters;
  summary: {
    totalPatients: number;
    uniqueOccupations: number;
  };
  occupations: OccupationData[];
}

// ========== API CONFIGURATION ==========
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const API_ENDPOINTS = {
  // Public endpoints
  PUBLIC_DISEASES: '/public/diseases',
  PUBLIC_DISEASE_BY_ID: (id: string) => `/public/diseases/${id}`,
  PUBLIC_HOSPITALS: '/public/hospitals',
  PUBLIC_STATS: '/public/stats',
  PUBLIC_POPULATION_STATS: '/public/populations/stats', // ✅ เพิ่ม Population endpoint
  
  // Report endpoints
  REPORT_AGE_GROUPS: '/public/reports/age-groups',
  REPORT_GENDER_RATIO: '/public/reports/gender-ratio',
  REPORT_INCIDENCE_RATES: '/public/reports/incidence-rates',
  REPORT_OCCUPATION: '/public/reports/occupation',
} as const;

// ========== HTTP CLIENT ==========
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<PublicApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      console.log(`🔓 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle direct data responses (some endpoints might not have wrapper)
      if (data.success !== undefined) {
        return data;
      } else {
        // Wrap raw data in standard format
        return {
          success: true,
          message: 'Data retrieved successfully',
          data,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error(`❌ API Error for ${url}:`, error);
      throw error;
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // ========== PUBLIC API METHODS ==========

  async getDiseases(): Promise<PublicApiResponse<Disease[]>> {
    return this.request<Disease[]>(API_ENDPOINTS.PUBLIC_DISEASES);
  }

  async getDiseaseById(id: string): Promise<PublicApiResponse<Disease>> {
    return this.request<Disease>(API_ENDPOINTS.PUBLIC_DISEASE_BY_ID(id));
  }

  async getHospitals(): Promise<PublicApiResponse<Hospital[]>> {
    return this.request<Hospital[]>(API_ENDPOINTS.PUBLIC_HOSPITALS);
  }

  async getPublicStats(): Promise<PublicApiResponse<PublicStats>> {
    return this.request<PublicStats>(API_ENDPOINTS.PUBLIC_STATS);
  }

  // ✅ เพิ่ม Population Stats Method
  async getPopulationStats(): Promise<PublicApiResponse<PopulationStats>> {
    return this.request<PopulationStats>(API_ENDPOINTS.PUBLIC_POPULATION_STATS);
  }

  // ========== REPORT API METHODS ==========

  async getAgeGroupsReport(filters: ReportFilters): Promise<PublicApiResponse<AgeGroupsReport>> {
    const queryString = this.buildQueryString(filters);
    return this.request<AgeGroupsReport>(`${API_ENDPOINTS.REPORT_AGE_GROUPS}${queryString}`);
  }

  async getGenderRatioReport(filters: ReportFilters): Promise<PublicApiResponse<GenderRatioReport>> {
    const queryString = this.buildQueryString(filters);
    return this.request<GenderRatioReport>(`${API_ENDPOINTS.REPORT_GENDER_RATIO}${queryString}`);
  }

  async getIncidenceRatesReport(filters: ReportFilters): Promise<PublicApiResponse<IncidenceRatesReport>> {
    const queryString = this.buildQueryString(filters);
    return this.request<IncidenceRatesReport>(`${API_ENDPOINTS.REPORT_INCIDENCE_RATES}${queryString}`);
  }

  async getOccupationReport(filters: ReportFilters): Promise<PublicApiResponse<OccupationReport>> {
    const queryString = this.buildQueryString(filters);
    return this.request<OccupationReport>(`${API_ENDPOINTS.REPORT_OCCUPATION}${queryString}`);
  }

  // ========== UTILITY METHODS ==========
  
  // คำนวณ Incidence Rate (ต่อแสนประชากร)
  calculateIncidenceRate(patients: number, population: number): number {
    if (population === 0) return 0;
    return Math.round((patients / population) * 100000 * 100) / 100; // 2 decimal places
  }

  // คำนวณ Mortality Rate (ต่อแสนประชากร)
  calculateMortalityRate(deaths: number, population: number): number {
    if (population === 0) return 0;
    return Math.round((deaths / population) * 100000 * 100) / 100;
  }

  // คำนวณ Case Fatality Rate (ร้อยละ)
  calculateCaseFatalityRate(deaths: number, totalCases: number): number {
    if (totalCases === 0) return 0;
    return Math.round((deaths / totalCases) * 100 * 100) / 100;
  }

  // ========== BATCH REPORT METHOD ==========
  
  async getAllReports(filters: ReportFilters): Promise<{
    ageGroups: PublicApiResponse<AgeGroupsReport>;
    genderRatio: PublicApiResponse<GenderRatioReport>;
    incidenceRates: PublicApiResponse<IncidenceRatesReport>;
    occupation: PublicApiResponse<OccupationReport>;
  }> {
    // 🚀 Parallel loading for better performance
    const [ageGroups, genderRatio, incidenceRates, occupation] = await Promise.all([
      this.getAgeGroupsReport(filters),
      this.getGenderRatioReport(filters),
      this.getIncidenceRatesReport(filters),
      this.getOccupationReport(filters),
    ]);

    return {
      ageGroups,
      genderRatio,
      incidenceRates,
      occupation,
    };
  }
}

// ========== SINGLETON INSTANCE ==========
export const apiClient = new ApiClient();

// ========== CONVENIENCE EXPORTS ==========
export const publicApi = {
  // Data fetching
  diseases: () => apiClient.getDiseases(),
  disease: (id: string) => apiClient.getDiseaseById(id),
  hospitals: () => apiClient.getHospitals(),
  stats: () => apiClient.getPublicStats(),
  populationStats: () => apiClient.getPopulationStats(), // ✅ เพิ่ม Population Stats
  
  // Reports
  reports: {
    ageGroups: (filters: ReportFilters) => apiClient.getAgeGroupsReport(filters),
    genderRatio: (filters: ReportFilters) => apiClient.getGenderRatioReport(filters),
    incidenceRates: (filters: ReportFilters) => apiClient.getIncidenceRatesReport(filters),
    occupation: (filters: ReportFilters) => apiClient.getOccupationReport(filters),
    all: (filters: ReportFilters) => apiClient.getAllReports(filters),
  },

  // Utility functions
  utils: {
    calculateIncidenceRate: (patients: number, population: number) => 
      apiClient.calculateIncidenceRate(patients, population),
    calculateMortalityRate: (deaths: number, population: number) => 
      apiClient.calculateMortalityRate(deaths, population),
    calculateCaseFatalityRate: (deaths: number, totalCases: number) => 
      apiClient.calculateCaseFatalityRate(deaths, totalCases),
  }
};

// ========== ERROR HANDLING UTILITIES ==========
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }
    return error.message;
  }
  
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
};