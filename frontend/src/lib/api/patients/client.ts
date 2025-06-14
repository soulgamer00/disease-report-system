// frontend/src/lib/api/patients/client.ts
// ✅ Patient API Client - เชื่อมต่อกับ Backend

import { config } from '$lib/config/env';

// ========== TYPES ==========
export interface Patient {
  id: number;
  
  // Tab 1: Personal Info
  idCardCode?: string | null;
  patientHn?: string | null;
  namePrefix?: string | null;
  patientName: string;
  gender?: string | null;
  birthday?: string | null;
  ageAtIllness?: number | null;
  nationality?: string | null;
  maritalStatus?: string | null;
  occupation?: string | null;
  phoneNumber?: string | null;
  
  // Tab 2: Address
  currentHouseNumber?: string | null;
  currentVillageNumber?: string | null;
  currentRoadName?: string | null;
  currentProvince?: string | null;
  currentDistrict?: string | null;
  currentSubDistrict?: string | null;
  addressSickHouseNumber?: string | null;
  addressSickVillageNumber?: string | null;
  addressSickRoadName?: string | null;
  addressSickProvince?: string | null;
  addressSickDistrict?: string | null;
  addressSickSubDistrict?: string | null;
  
  // Tab 3: Illness
  diseaseId: number;
  disease: {
    id: number;
    thaiName: string;
    engName?: string | null;
  };
  symptomsOfDisease?: string | null;
  treatmentArea?: string | null;
  treatmentHospital?: string | null;
  illnessDate: string;
  treatmentDate?: string | null;
  diagnosisDate?: string | null;
  
  // Tab 4: Lab Results
  labResult?: string | null;
  ns1Result?: string | null;
  patientType?: string | null;
  patientCondition?: string | null;
  deathDate?: string | null;
  causeOfDeath?: string | null;
  
  // Tab 5: Notes
  receivingProvince?: string | null;
  hospitalCode: string;
  hospital: {
    id: number;
    hospitalName: string | null;
    hospitalCode5Digit: string;
  };
  remarks?: string | null;
  
  // Audit
  createdBy?: string | null;
  createdAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  isActive: boolean;
}

export interface CreatePatientData {
  // Tab 1: Personal Info (Required)
  idCardCode: string;
  namePrefix: string;
  patientName: string;
  gender: 'M' | 'F';
  birthday: string;
  ageAtIllness: number;
  nationality: string;
  maritalStatus: string;
  occupation: string;
  phoneNumber: string;
  patientHn?: string; // Optional
  
  // Tab 2: Address (Required)
  currentHouseNumber: string;
  currentVillageNumber: string;
  currentRoadName: string;
  currentProvince: string;
  currentDistrict: string;
  currentSubDistrict: string;
  addressSickHouseNumber: string;
  addressSickVillageNumber: string;
  addressSickRoadName: string;
  addressSickProvince: string;
  addressSickDistrict: string;
  addressSickSubDistrict: string;
  
  // Tab 3: Illness (Required)
  diseaseId: number;
  symptomsOfDisease: string;
  treatmentArea: string;
  treatmentHospital: string;
  illnessDate: string;
  treatmentDate: string;
  diagnosisDate: string;
  
  // Tab 4: Lab Results (Required)
  labResult: string;
  ns1Result: string;
  patientType: string;
  patientCondition: string;
  deathDate?: string; // Optional (only if died)
  causeOfDeath?: string; // Optional (only if died)
  
  // Tab 5: Notes (Required)
  receivingProvince: string;
  hospitalCode: string;
  remarks: string;
}

export interface UpdatePatientData extends Partial<CreatePatientData> {}

export interface PatientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  diseaseId?: number;
  hospitalCode?: string;
  treatmentHospital?: string;
  gender?: 'M' | 'F';
  patientCondition?: string;
  illnessDateFrom?: string;
  illnessDateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
    treatmentHospital?: string;
    gender?: string;
    patientCondition?: string;
    illnessDateFrom?: string;
    illnessDateTo?: string;
  };
  summary: {
    totalRecords: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Import/Export Types
export interface ImportResult {
  summary: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    skippedRows: number;
  };
  successful: Array<{
    rowNumber: number;
    patientId: number;
    patientName: string;
  }>;
  failed: Array<{
    rowNumber: number;
    errors: string[];
    data: Record<string, unknown>; // ✅ แทน any
  }>;
  warnings: Array<{
    rowNumber: number;
    message: string;
  }>;
}
export interface DiseaseOption {
  id: number;
  thaiName: string;
  engName?: string | null;
}

export interface SymptomOption {
  id: number;
  name: string;
}

export interface HospitalOption {
  id: number;
  hospitalCode5Digit: string;
  hospitalName: string | null;
}

// ========== API CLIENT CLASS ==========
export class PatientApiClient {
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
      credentials: 'include', // Include httpOnly cookies
      ...options,
    };

    try {
      console.log('🔄 API Request:', endpoint);
      const response = await fetch(url, config);
      
      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, data);
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      console.log('✅ API Success:', endpoint);
      return data;

    } catch (error) {
      console.error('❌ API Error:', endpoint, error);
      throw error instanceof Error ? error : new Error('Network error');
    }
  }

  // ========== PATIENT CRUD OPERATIONS ==========

  /**
   * 📋 Get patients list with search & filters
   */
  async getPatients(params?: PatientQueryParams): Promise<ApiResponse<PaginatedPatientResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/patients?${searchParams.toString()}`;
    return this.request(endpoint);
  }

  /**
   * 👁️ Get patient by ID
   */
  async getPatientById(id: number): Promise<ApiResponse<Patient>> {
    return this.request(`/api/patients/${id}`);
  }

  /**
   * ➕ Create new patient
   */
  async createPatient(data: CreatePatientData): Promise<ApiResponse<Patient>> {
    return this.request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * ✏️ Update existing patient
   */
  async updatePatient(id: number, data: UpdatePatientData): Promise<ApiResponse<Patient>> {
    return this.request(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 🗑️ Delete patient (soft delete)
   */
  async deletePatient(id: number): Promise<ApiResponse<{ id: number; deletedBy: string; deletedAt: string }>> {
    return this.request(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== REFERENCE DATA ==========

  /**
   * 🦠 Get diseases for dropdown
   */
  async getDiseases(): Promise<ApiResponse<DiseaseOption[]>> {
    return this.request('/api/diseases/active');
  }

  /**
   * 😷 Get symptoms by disease ID
   */
  async getSymptomsByDisease(diseaseId: number): Promise<ApiResponse<SymptomOption[]>> {
    return this.request(`/api/symptoms/by-disease/${diseaseId}`);
  }

  /**
   * 🏥 Get hospitals for dropdown
   */
  async getHospitals(): Promise<ApiResponse<HospitalOption[]>> {
    return this.request('/api/hospitals/active');
  }

  // ========== IMPORT/EXPORT ==========

  /**
   * 📤 Export patients to Excel/CSV
   */
  async exportPatients(params: {
    format: 'csv' | 'excel';
    filters?: PatientQueryParams;
  }): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/patients/export`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }

  /**
   * 📥 Import patients from file
   */
  async importPatients(file: File): Promise<ApiResponse<ImportResult>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/patients/import`, {
      method: 'POST',
      credentials: 'include',
      body: formData // Don't set Content-Type header for FormData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Import failed');
    }
    
    return data;
  }

  /**
   * 📄 Download import template
   */
  async downloadTemplate(format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/patients/template?format=${format}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Template download failed');
    }
    
    return response.blob();
  }
}

// ========== SINGLETON INSTANCE ==========
export const patientApi = new PatientApiClient();

// ========== HELPER FUNCTIONS ==========

/**
 * 💾 Download file from blob
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 📅 Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('th-TH');
}

/**
 * 📱 Format Thai phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Convert 0812345678 to 081-234-5678
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

/**
 * 🆔 Format Thai ID card
 */
export function formatIdCard(idCard: string): string {
  if (!idCard) return '';
  // Convert 1234567890123 to 1-2345-67890-12-3
  return idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
}

/**
 * ⚡ Debounce function for search
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}