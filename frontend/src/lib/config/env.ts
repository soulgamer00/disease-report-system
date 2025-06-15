// src/lib/config/env.ts
// ✅ SECURITY: Environment configuration - NO hardcoded URLs

interface AppConfig {
  API_BASE_URL: string;
  APP_ENV: 'development' | 'staging' | 'production';
  DEBUG: boolean;
  APP_NAME: string;
  APP_VERSION: string;
}

export const config: AppConfig = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://128.199.99.215:3000',
  APP_ENV: (import.meta.env.VITE_APP_ENV as AppConfig['APP_ENV']) || 'development',
  DEBUG: import.meta.env.VITE_DEBUG === 'true' || false,
  APP_NAME: 'ระบบเฝ้าระวังโรคติดต่อโดยแมลง',
  APP_VERSION: '1.0.0',
};

// Environment checks
export const isDevelopment = config.APP_ENV === 'development';
export const isProduction = config.APP_ENV === 'production';
export const isStaging = config.APP_ENV === 'staging';

// Validation
if (!config.API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

// Development warnings
if (isDevelopment) {
  console.log('🚀 Development Mode Enabled');
  console.log('📡 API Base URL:', config.API_BASE_URL);
  console.log('🔍 Debug Mode:', config.DEBUG);
}

// Export for convenience
export default config;