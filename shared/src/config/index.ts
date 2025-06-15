// shared/src/config/index.ts
// Centralized Configuration Management
// Security-First: Environment-based configuration with validation

import { z } from 'zod';

// =========================
// Configuration Schemas
// =========================

// Base configuration schema
const baseConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT Secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Redis Configuration (for future use)
  REDIS_URL: z.string().optional(),
  
  // Application Info
  APP_NAME: z.string().default('Disease Surveillance System'),
  APP_VERSION: z.string().default('1.0.0'),
});

// Frontend-specific configuration
const frontendConfigSchema = z.object({
  VITE_PUBLIC_API_URL: z.string().default('http://localhost:3000/api'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_APP_NAME: z.string().default('Disease Surveillance System'),
});

// Backend-specific configuration  
const backendConfigSchema = baseConfigSchema.extend({
  // Security Headers
  HELMET_ENABLED: z.string().transform(Boolean).default(true),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default(10 * 1024 * 1024), // 10MB
  
  // Discord Notification (for future)
  DISCORD_WEBHOOK_URL: z.string().optional(),
});

// =========================
// Configuration Classes
// =========================

export class ConfigManager {
  private static instance: ConfigManager;
  private config: any = {};
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Initialize configuration with validation
  init(environment: 'frontend' | 'backend' = 'backend') {
    if (this.isInitialized) {
      return this.config;
    }

    try {
      const rawConfig = this.loadEnvironmentVariables();
      
      if (environment === 'frontend') {
        this.config = frontendConfigSchema.parse(rawConfig);
      } else {
        this.config = backendConfigSchema.parse(rawConfig);
      }
      
      this.isInitialized = true;
      this.logConfigSummary(environment);
      
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Configuration Validation Failed:');
        error.errors.forEach(err => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
      }
      throw new Error(`Configuration initialization failed: ${error}`);
    }
  }

  // Load environment variables from various sources
  private loadEnvironmentVariables(): Record<string, any> {
    // In Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env;
    }
    
    // In browser environment (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env;
    }
    
    throw new Error('Unable to load environment variables');
  }

  // Get configuration value with type safety
  get<T = any>(key: string): T {
    if (!this.isInitialized) {
      throw new Error('Configuration not initialized. Call init() first.');
    }
    
    return this.config[key] as T;
  }

  // Get all configuration
  getAll() {
    if (!this.isInitialized) {
      throw new Error('Configuration not initialized. Call init() first.');
    }
    
    return { ...this.config };
  }

  // Check if configuration is valid
  isValid(): boolean {
    return this.isInitialized && this.config !== null;
  }

  // Get environment-specific settings
  isDevelopment(): boolean {
    return this.get<string>('NODE_ENV') === 'development';
  }

  isProduction(): boolean {
    return this.get<string>('NODE_ENV') === 'production';
  }

  isTest(): boolean {
    return this.get<string>('NODE_ENV') === 'test';
  }

  // Log configuration summary (without sensitive data)
  private logConfigSummary(environment: string) {
    const safeConfig = this.getSafeConfigForLogging();
    
    console.log('🔧 ===============================================');
    console.log(`📋 ${environment.toUpperCase()} Configuration Loaded`);
    console.log('🔧 ===============================================');
    console.log(`🌍 Environment: ${safeConfig.NODE_ENV}`);
    console.log(`📡 Port: ${safeConfig.PORT || 'N/A'}`);
    console.log(`🔗 CORS Origin: ${safeConfig.CORS_ORIGIN || 'N/A'}`);
    console.log(`📱 App Version: ${safeConfig.APP_VERSION || safeConfig.VITE_APP_VERSION}`);
    console.log('✅ Configuration validation passed');
    console.log('🔧 ===============================================\n');
  }

  // Get safe configuration for logging (excludes sensitive data)
  private getSafeConfigForLogging() {
    const sensitiveKeys = ['JWT_SECRET', 'DATABASE_URL', 'DISCORD_WEBHOOK_URL', 'REDIS_URL'];
    const safeConfig = { ...this.config };
    
    sensitiveKeys.forEach(key => {
      if (safeConfig[key]) {
        safeConfig[key] = '[REDACTED]';
      }
    });
    
    return safeConfig;
  }
}

// =========================
// Convenience Exports
// =========================

// Singleton instance
export const config = ConfigManager.getInstance();

// Helper functions for common configurations
export const getApiUrl = (): string => {
  return config.get<string>('VITE_PUBLIC_API_URL') || `http://localhost:${config.get<number>('PORT')}/api`;
};

export const getDatabaseUrl = (): string => {
  return config.get<string>('DATABASE_URL');
};

export const getJwtConfig = () => ({
  secret: config.get<string>('JWT_SECRET'),
  expiresIn: config.get<string>('JWT_EXPIRES_IN'),
});

export const getCorsConfig = () => ({
  origin: config.get<string>('CORS_ORIGIN'),
  credentials: true,
});

// =========================
// Type Exports
// =========================

export type BaseConfig = z.infer<typeof baseConfigSchema>;
export type FrontendConfig = z.infer<typeof frontendConfigSchema>;
export type BackendConfig = z.infer<typeof backendConfigSchema>;

// =========================
// Usage Examples
// =========================

/*
// Backend Usage:
import { config, getJwtConfig, getDatabaseUrl } from '@shared/config';

// Initialize configuration
config.init('backend');

// Get specific values
const jwtConfig = getJwtConfig();
const dbUrl = getDatabaseUrl();
const port = config.get<number>('PORT');

// Frontend Usage:
import { config, getApiUrl } from '@shared/config';

// Initialize configuration
config.init('frontend');

// Get API URL
const apiUrl = getApiUrl();
const appVersion = config.get<string>('VITE_APP_VERSION');
*/