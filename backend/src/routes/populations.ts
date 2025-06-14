// backend/src/routes/populations.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  authorizePermissions,
  requirePopulationAccess,
  addPermissionContext,
} from '../middleware/permissions';
import { PERMISSIONS } from '../utils/permissionConstants';
import {
  getPopulations,
  getPopulationById,
  createPopulation,
  updatePopulation,
  deletePopulation,
  calculateIncidenceRate,
  getPopulationByHospitalYear,
  getPopulationTrends,
  getPopulationStats,
} from '../controllers/populationController';

const router = Router();

// Apply authentication and permission context to all routes
router.use(authenticateToken);
router.use(addPermissionContext());

// 🚨 IMPORTANT: Population access is restricted to ADMIN and SUPERUSER only
// USER role should NEVER access population endpoints

// ========== POPULATION STATISTICS & ANALYTICS ==========

/**
 * GET /api/populations/stats
 * Get population statistics
 * Access: POPULATION_VIEW (ADMIN, SUPERUSER only)
 */
router.get('/stats',
  requirePopulationAccess('VIEW'),
  getPopulationStats
);

/**
 * GET /api/populations/incidence-rate
 * Calculate incidence rate per population
 * Query params: hospitalCode?, year, diseaseId?, per?
 * Access: POPULATION_VIEW (ADMIN, SUPERUSER only)
 */
router.get('/incidence-rate',
  requirePopulationAccess('VIEW'),
  calculateIncidenceRate
);

/**
 * GET /api/populations/trends/:hospitalCode
 * Get population trends for a hospital over time
 * Query params: startYear?, endYear?
 * Access: POPULATION_VIEW (ADMIN, SUPERUSER only)
 */
router.get('/trends/:hospitalCode',
  requirePopulationAccess('VIEW'),
  getPopulationTrends
);

/**
 * GET /api/populations/hospital/:hospitalCode/year/:year
 * Get population data for specific hospital and year
 * Access: POPULATION_VIEW (ADMIN, SUPERUSER only)
 */
router.get('/hospital/:hospitalCode/year/:year',
  requirePopulationAccess('VIEW'),
  getPopulationByHospitalYear
);

/**
 * GET /api/populations/accessible-hospitals
 * Get list of hospitals accessible to user for population management
 * Access: POPULATION_VIEW (ADMIN, SUPERUSER only)
 */
router.get('/accessible-hospitals',
  requirePopulationAccess('VIEW'),
  async (req, res) => {
    try {
      const { populationService } = await import('../services/populationService');
      const context = (req as any).permissionContext;
      
      const hospitals = await populationService.getAccessibleHospitals(context);
      
      res.json({
        success: true,
        message: 'Accessible hospitals retrieved successfully',
        data: hospitals,
        accessScope: context?.canAccessAllHospitals ? 'ALL_HOSPITALS' : 'LIMITED_HOSPITALS',
      });
    } catch (error) {
      console.error('Get accessible hospitals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve accessible hospitals',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ========== POPULATION CRUD OPERATIONS ==========

/**
 * GET /api/populations
 * Get paginated list of populations with filters
 * Access: POPULATION_VIEW (ADMIN, SUPERUSER only)
 */
router.get('/',
  requirePopulationAccess('VIEW'),
  getPopulations
);

/**
 * GET /api/populations/:id
 * Get population by ID
 * Access: POPULATION_VIEW (ADMIN, SUPERUSER only)
 */
router.get('/:id',
  requirePopulationAccess('VIEW'),
  getPopulationById
);

/**
 * POST /api/populations
 * Create new population record
 * Access: POPULATION_CREATE (ADMIN, SUPERUSER only)
 */
router.post('/',
  requirePopulationAccess('CREATE'),
  createPopulation
);

/**
 * PUT /api/populations/:id
 * Update population record
 * Access: POPULATION_UPDATE (ADMIN, SUPERUSER only)
 */
router.put('/:id',
  requirePopulationAccess('UPDATE'),
  updatePopulation
);

/**
 * DELETE /api/populations/:id
 * Soft delete population record
 * Access: POPULATION_DELETE (SUPERUSER only)
 */
router.delete('/:id',
  requirePopulationAccess('DELETE'),
  deletePopulation
);

// ========== FUTURE FEATURES (Placeholder Routes) ==========

/**
 * POST /api/populations/bulk
 * Bulk import population data (CSV)
 * Access: POPULATION_CREATE (ADMIN, SUPERUSER only)
 */
router.post('/bulk',
  requirePopulationAccess('CREATE'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Bulk population import not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'CSV file upload and validation',
        'Automatic year detection',
        'Hospital code validation',
        'Duplicate detection and handling',
        'Progress tracking for large imports',
        'Historical data import support',
      ]
    });
  }
);

/**
 * GET /api/populations/export/csv
 * Export population data to CSV
 * Access: POPULATION_EXPORT (ADMIN, SUPERUSER only)
 */
router.get('/export/csv',
  authorizePermissions(PERMISSIONS.POPULATION_EXPORT),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'CSV export not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Filtered CSV export by year/hospital',
        'Custom field selection',
        'Multi-year data export',
        'Formatted output options',
        'Scheduled export generation',
      ]
    });
  }
);

/**
 * GET /api/populations/analytics/growth-rate
 * Calculate population growth rate analysis
 * Access: ANALYTICS_VIEW (ADMIN, SUPERUSER only)
 */
router.get('/analytics/growth-rate',
  authorizePermissions(PERMISSIONS.ANALYTICS_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Population growth rate analysis not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Year-over-year growth calculations',
        'Compound annual growth rate (CAGR)',
        'Growth trend projections',
        'Hospital comparison analysis',
        'Regional growth patterns',
      ]
    });
  }
);

/**
 * GET /api/populations/reports/summary
 * Generate population summary reports
 * Access: REPORT_VIEW_ALL (ADMIN, SUPERUSER only)
 */
router.get('/reports/summary',
  authorizePermissions(PERMISSIONS.REPORT_VIEW_ALL),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Population summary reports not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Annual population summaries',
        'Hospital-specific reports',
        'Regional comparison reports',
        'Statistical analysis reports',
        'Executive dashboard reports',
      ]
    });
  }
);

// ========== ERROR HANDLING ==========

/**
 * Catch-all route for undefined population endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Population API endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      GET: [
        '/api/populations',
        '/api/populations/stats',
        '/api/populations/incidence-rate',
        '/api/populations/trends/:hospitalCode',
        '/api/populations/hospital/:hospitalCode/year/:year',
        '/api/populations/accessible-hospitals',
        '/api/populations/:id',
        '/api/populations/export/csv (future)',
        '/api/populations/analytics/growth-rate (future)',
        '/api/populations/reports/summary (future)',
      ],
      POST: [
        '/api/populations',
        '/api/populations/bulk (future)',
      ],
      PUT: [
        '/api/populations/:id',
      ],
      DELETE: [
        '/api/populations/:id',
      ]
    },
    requiredPermissions: {
      view: [PERMISSIONS.POPULATION_VIEW],
      create: [PERMISSIONS.POPULATION_CREATE],
      update: [PERMISSIONS.POPULATION_UPDATE],
      delete: [PERMISSIONS.POPULATION_DELETE],
      export: [PERMISSIONS.POPULATION_EXPORT],
      analytics: [PERMISSIONS.ANALYTICS_VIEW],
      reports: [PERMISSIONS.REPORT_VIEW_ALL],
    },
    accessRestrictions: {
      note: 'Population endpoints are restricted to ADMIN and SUPERUSER roles only',
      restrictedRoles: ['USER'],
      allowedRoles: ['ADMIN', 'SUPERUSER'],
    }
  });
});

export default router;