// src/lib/types/report.ts
export interface ReportDisease {
  id: number;
  imageUrl?: string;
  engName?: string;
  thaiName: string;
  daName?: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilters {
  diseaseId: string;
  year: string;
  hospital: string;
  gender: string;
  occupation: string;
}

export interface ReportAgeGroupData {
  ageGroup: string;
  count: number;
  percentage: number;
  incidenceRate: number;
}

export interface ReportGenderData {
  total: number;
  male: number;
  female: number;
  other: number;
  ratio: { male: number; female: number };
  percentages: { male: number; female: number; other: number };
}

export interface ReportIncidenceData {
  summary: {
    totalPatients: number;
    deaths: number;
    incidenceRate: number;
    mortalityRate: number;
    caseFatalityRate: number;
  };
  hospitals: Array<{
    hospitalName: string;
    patients: number;
    deaths: number;
    incidenceRate: number;
    mortalityRate: number;
    caseFatalityRate: number;
  }>;
}

export interface ReportOccupationData {
  occupation: string;
  count: number;
  percentage: number;
}

export interface ReportApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ReportHospitalOption {
  value: string;
  label: string;
  code: string;
}

export interface ReportSelectOption {
  value: string;
  label: string;
}

export interface ReportStats {
  totalDiseases: number;
  totalPatients: number;
  currentMonthPatients: number;
}