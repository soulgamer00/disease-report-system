// frontend/src/lib/reports/config.ts
// Reports-specific configuration and API endpoints

import { config } from '../config';

// Reports Configuration
export const REPORTS_CONFIG = {
  // Default values
  DEFAULT_YEAR: new Date().getFullYear().toString(),
  DEFAULT_HOSPITAL: 'all',
  DEFAULT_GENDER: 'all',
  DEFAULT_AGE_GROUP: 'all',
  DEFAULT_OCCUPATION: 'all',
  
  // Chart settings
  MAX_CHART_ITEMS: 20,
  DEFAULT_CHART_HEIGHT: 300,
  CHART_ANIMATION_DURATION: 750,
  
  // Data refresh
  REFRESH_INTERVAL: 30000, // 30 seconds
  CACHE_DURATION: 300000,  // 5 minutes
  
  // Display limits
  TOP_OCCUPATIONS_DISPLAY: [5, 10, 15, 20],
  MAX_HOSPITAL_NAME_LENGTH: 25,
  MAX_OCCUPATION_NAME_LENGTH: 20,
  
  // Population calculation
  INCIDENCE_RATE_PER: 100000, // per 100,000 population
  
  // Age groups for analysis
  AGE_GROUP_RANGES: {
    '< 1 ปี': { min: 0, max: 0 },
    '1-4 ปี': { min: 1, max: 4 },
    '5-9 ปี': { min: 5, max: 9 },
    '10-14 ปี': { min: 10, max: 14 },
    '15-24 ปี': { min: 15, max: 24 },
    '25-34 ปี': { min: 25, max: 34 },
    '35-44 ปี': { min: 35, max: 44 },
    '45-54 ปี': { min: 45, max: 54 },
    '55-64 ปี': { min: 55, max: 64 },
    '65+ ปี': { min: 65, max: 150 }
  }
} as const;

// API Endpoints for Reports
export const API_ENDPOINTS = {
  // Public API - No authentication required
  PUBLIC_DISEASES: '/public/diseases',
  PUBLIC_DISEASES_BY_ID: '/public/diseases',
  PUBLIC_HOSPITALS: '/public/hospitals',
  PUBLIC_STATS: '/public/stats',
  
  // Reports API
  REPORTS_AGE_GROUPS: '/public/reports/age-groups',
  REPORTS_GENDER_RATIO: '/public/reports/gender-ratio',
  REPORTS_INCIDENCE_RATES: '/public/reports/incidence-rates',
  REPORTS_OCCUPATION: '/public/reports/occupation',
  
  // Population API
  POPULATION_STATS: '/public/populations/stats'
} as const;

// Build query string from filters
export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value.toString());
    }
  });
  
  return query.toString();
}

// Get full API URL with query parameters
export function getReportUrl(endpoint: string, params?: Record<string, string | number | undefined>): string {
  const baseUrl = config.API_BASE_URL;
  const queryString = params ? buildQueryString(params) : '';
  const separator = queryString ? '?' : '';
  
  return `${baseUrl}${endpoint}${separator}${queryString}`;
}