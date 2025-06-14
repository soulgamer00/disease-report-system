// backend/src/routes/public.ts

import { Router } from 'express';
import {
  getAllDiseasesPublic,
  getDiseaseByIdPublic,
  getPublicStats,
  getHospitalsPublic,
  getAgeGroupsPublic,
  getGenderRatioPublic,
  getIncidenceRatesPublic,
  getOccupationPublic,
  getPopulationStatsPublic,
} from '../controllers/publicController';

const router = Router();

// 🔓 PUBLIC ROUTES - No authentication required

// ========== BASIC DATA ENDPOINTS ==========

/**
 * GET /public/diseases
 * Get all active diseases (for homepage disease cards)
 * Response: Array of disease objects with basic info
 */
router.get('/diseases', getAllDiseasesPublic);

/**
 * GET /public/diseases/:id
 * Get specific disease by ID (for disease detail page)
 * Params: id - Disease ID (number)
 * Response: Disease object with detailed info
 */
router.get('/diseases/:id', getDiseaseByIdPublic);

/**
 * GET /public/stats
 * Get public statistics (for homepage counters)
 * Response: { totalDiseases, totalPatients, currentMonthPatients }
 */
router.get('/stats', getPublicStats);

/**
 * GET /public/hospitals
 * Get all active hospitals (for dropdown filters)
 * Response: Array of hospitals formatted for dropdown
 */
router.get('/hospitals', getHospitalsPublic);

/**
 * GET /public/populations/stats
 * Get population statistics for public display
 * Response: Population data summary and hospital breakdown
 */
router.get('/populations/stats', getPopulationStatsPublic);

// ========== PUBLIC REPORTS ENDPOINTS ==========

/**
 * GET /public/reports/age-groups
 * Age Groups Distribution Report
 * Query Params:
 *   - diseaseId (required): Disease ID to analyze
 *   - year (optional): Filter by year (default: 'all')
 *   - hospital (optional): Filter by hospital code (default: 'all')
 *   - gender (optional): Filter by gender (default: 'all')
 *   - occupation (optional): Filter by occupation (default: 'all')
 * 
 * Response: Age group distribution with counts, percentages, incidence rates
 */
router.get('/reports/age-groups', getAgeGroupsPublic);

/**
 * GET /public/reports/gender-ratio
 * Gender Ratio Analysis Report
 * Query Params:
 *   - diseaseId (required): Disease ID to analyze
 *   - year (optional): Filter by year (default: 'all')
 *   - hospital (optional): Filter by hospital code (default: 'all')
 *   - ageGroup (optional): Filter by age group (default: 'all')
 *   - occupation (optional): Filter by occupation (default: 'all')
 * 
 * Response: Gender distribution with ratio calculations and percentages
 */
router.get('/reports/gender-ratio', getGenderRatioPublic);

/**
 * GET /public/reports/incidence-rates
 * Incidence & Mortality Rates Report
 * Query Params:
 *   - diseaseId (required): Disease ID to analyze
 *   - year (optional): Filter by year (default: 'all')
 *   - hospital (optional): Filter by hospital code (default: 'all')
 *   - gender (optional): Filter by gender (default: 'all')
 *   - ageGroup (optional): Filter by age group (default: 'all')
 *   - occupation (optional): Filter by occupation (default: 'all')
 * 
 * Response: Incidence rates, mortality rates, case fatality rates by hospital
 */
router.get('/reports/incidence-rates', getIncidenceRatesPublic);

/**
 * GET /public/reports/occupation
 * Occupation Distribution Report
 * Query Params:
 *   - diseaseId (required): Disease ID to analyze
 *   - year (optional): Filter by year (default: 'all')
 *   - hospital (optional): Filter by hospital code (default: 'all')
 *   - gender (optional): Filter by gender (default: 'all')
 *   - ageGroup (optional): Filter by age group (default: 'all')
 * 
 * Response: Occupation distribution with counts and percentages
 */
router.get('/reports/occupation', getOccupationPublic);

// ========== API DOCUMENTATION ENDPOINT ==========

/**
 * GET /public
 * API Documentation for public endpoints
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Disease Surveillance System - Public API',
    version: '1.0.0',
    description: 'Public endpoints for disease surveillance data access (no authentication required)',
    
    endpoints: {
      basic: {
        'GET /public/diseases': 'Get all active diseases',
        'GET /public/diseases/:id': 'Get disease by ID',
        'GET /public/stats': 'Get public statistics',
        'GET /public/hospitals': 'Get active hospitals'
      },
      reports: {
        'GET /public/reports/age-groups': 'Age groups distribution report',
        'GET /public/reports/gender-ratio': 'Gender ratio analysis report', 
        'GET /public/reports/incidence-rates': 'Incidence & mortality rates report',
        'GET /public/reports/occupation': 'Occupation distribution report'
      }
    },
    
    commonQueryParams: {
      diseaseId: 'Disease ID (required for reports)',
      year: 'Filter by year (optional, default: all)',
      hospital: 'Filter by hospital code (optional, default: all)',
      gender: 'Filter by gender (optional, default: all)', 
      ageGroup: 'Filter by age group (optional, default: all)',
      occupation: 'Filter by occupation (optional, default: all)'
    },
    
    examples: {
      ageGroupsReport: '/public/reports/age-groups?diseaseId=1&year=2024&hospital=VCH01',
      genderRatioReport: '/public/reports/gender-ratio?diseaseId=2&year=2024&gender=all',
      incidenceRatesReport: '/public/reports/incidence-rates?diseaseId=1&year=2024',
      occupationReport: '/public/reports/occupation?diseaseId=3&hospital=VCH01'
    },
    
    responseFormat: {
      success: {
        success: true,
        message: 'Success message',
        data: 'Response data object',
        timestamp: 'ISO timestamp'
      },
      error: {
        success: false,
        message: 'Error message',
        error: 'Error details (optional)',
        code: 'Error code (optional)',
        timestamp: 'ISO timestamp'
      }
    },
    
    features: [
      '🔓 No authentication required',
      '📊 4 types of epidemiological reports',
      '🎯 Flexible filtering options',
      '📈 Population-based incidence rate calculations',
      '🏥 Hospital-specific breakdowns',
      '📱 Mobile-friendly JSON responses',
      '🚀 Optimized for performance',
      '✅ Comprehensive error handling'
    ],
    
    note: 'All public endpoints are read-only and designed for transparency in disease surveillance data',
    contact: 'Department of Disease Control, Thailand'
  });
});

// ========== ERROR HANDLING ==========

/**
 * Catch-all route for undefined public endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Public API endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      basic: [
        'GET /public/diseases',
        'GET /public/diseases/:id', 
        'GET /public/stats',
        'GET /public/hospitals'
      ],
      reports: [
        'GET /public/reports/age-groups',
        'GET /public/reports/gender-ratio',
        'GET /public/reports/incidence-rates', 
        'GET /public/reports/occupation'
      ],
      documentation: [
        'GET /public'
      ]
    },
    note: 'All public endpoints are GET requests and require no authentication',
    timestamp: new Date().toISOString()
  });
});

export default router;