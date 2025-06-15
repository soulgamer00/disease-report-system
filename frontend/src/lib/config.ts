// frontend/src/lib/config.ts
// Global application configuration

export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // App Information
  APP_NAME: 'ระบบเฝ้าระวังโรคติดต่อโดยแมลง',
  APP_NAME_EN: 'Disease Surveillance System',
  
  // Localization
  DEFAULT_LOCALE: 'th-TH',
  DEFAULT_TIMEZONE: 'Asia/Bangkok',
  
  // Performance
  REQUEST_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  
  // UI Defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Development
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
} as const;

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  const baseUrl = config.API_BASE_URL.endsWith('/') 
    ? config.API_BASE_URL.slice(0, -1) 
    : config.API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

// Helper function for Thai number formatting
export function formatThaiNumber(num: number): string {
  return new Intl.NumberFormat(config.DEFAULT_LOCALE).format(num);
}

// Helper function for Thai date formatting
export function formatThaiDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(config.DEFAULT_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}