// backend/src/routes/symptoms.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  authorizePermissions,
  addPermissionContext,
} from '../middleware/permissions';
import { PERMISSIONS } from '../utils/permissionConstants';
import {
  getSymptoms,
  getSymptomById,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  getSymptomsByDisease,
  searchSymptoms,
  getSymptomStats,
  bulkCreateSymptoms,
  checkSymptomNameAvailability,
} from '../controllers/symptomController';

const router = Router();

// Apply authentication and permission context to all routes
router.use(authenticateToken);
router.use(addPermissionContext());

// 🔴 IMPORTANT: Symptom management is restricted to SUPERUSER only
// ADMIN and USER should only have read access for dropdowns/selections

// ========== PUBLIC/READ-ONLY ROUTES (for dropdowns and selections) ==========

/**
 * GET /api/symptoms/by-disease/:diseaseId
 * Get symptoms for a specific disease (for patient forms)
 * Access: All authenticated users (needed for patient forms)
 */
router.get('/by-disease/:diseaseId', getSymptomsByDisease);

/**
 * GET /api/symptoms/search
 * Search symptoms by name (for autocomplete/dropdowns)
 * Query params: q (search term), diseaseId?, limit?
 * Access: All authenticated users (needed for patient forms)
 */
router.get('/search', searchSymptoms);

/**
 * GET /api/symptoms/stats
 * Get symptom statistics for dashboard
 * Access: SYMPTOM_VIEW (SUPERUSER only)
 */
router.get('/stats',
  authorizePermissions(PERMISSIONS.SYMPTOM_VIEW),
  getSymptomStats
);

/**
 * GET /api/symptoms/check-name
 * Check if symptom name is available for a disease
 * Query params: diseaseId, name, excludeId?
 * Access: SYMPTOM_VIEW (SUPERUSER only)
 */
router.get('/check-name',
  authorizePermissions(PERMISSIONS.SYMPTOM_VIEW),
  checkSymptomNameAvailability
);

// ========== SYMPTOM CRUD OPERATIONS (SUPERUSER ONLY) ==========

/**
 * GET /api/symptoms
 * Get paginated list of symptoms with filters
 * Access: SYMPTOM_VIEW (SUPERUSER only)
 */
router.get('/',
  authorizePermissions(PERMISSIONS.SYMPTOM_VIEW),
  getSymptoms
);

/**
 * GET /api/symptoms/:id
 * Get symptom by ID with disease info
 * Access: SYMPTOM_VIEW (SUPERUSER only)
 */
router.get('/:id',
  authorizePermissions(PERMISSIONS.SYMPTOM_VIEW),
  getSymptomById
);

/**
 * POST /api/symptoms
 * Create new symptom record
 * Access: SYMPTOM_CREATE (SUPERUSER only)
 */
router.post('/',
  authorizePermissions(PERMISSIONS.SYMPTOM_CREATE),
  createSymptom
);

/**
 * POST /api/symptoms/bulk
 * Bulk create symptoms for a disease
 * Access: SYMPTOM_CREATE (SUPERUSER only)
 */
router.post('/bulk',
  authorizePermissions(PERMISSIONS.SYMPTOM_CREATE),
  bulkCreateSymptoms
);

/**
 * PUT /api/symptoms/:id
 * Update symptom record
 * Access: SYMPTOM_UPDATE (SUPERUSER only)
 */
router.put('/:id',
  authorizePermissions(PERMISSIONS.SYMPTOM_UPDATE),
  updateSymptom
);

/**
 * DELETE /api/symptoms/:id
 * Soft delete symptom record
 * Access: SYMPTOM_DELETE (SUPERUSER only)
 */
router.delete('/:id',
  authorizePermissions(PERMISSIONS.SYMPTOM_DELETE),
  deleteSymptom
);

// ========== FUTURE FEATURES (Placeholder Routes) ==========

/**
 * GET /api/symptoms/export/csv
 * Export symptoms to CSV
 * Access: SYMPTOM_VIEW (SUPERUSER only)
 */
router.get('/export/csv',
  authorizePermissions(PERMISSIONS.SYMPTOM_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'CSV export not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Filtered CSV export by disease',
        'Include disease information in export',
        'Custom field selection',
        'Formatted output options',
      ]
    });
  }
);

/**
 * POST /api/symptoms/import/csv
 * Import symptoms from CSV
 * Access: SYMPTOM_CREATE (SUPERUSER only)
 */
router.post('/import/csv',
  authorizePermissions(PERMISSIONS.SYMPTOM_CREATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'CSV import not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'CSV file upload and validation',
        'Disease mapping and validation',
        'Duplicate detection and handling',
        'Progress tracking for large imports',
        'Rollback capability for failed imports',
      ]
    });
  }
);

/**
 * PUT /api/symptoms/:id/toggle-status
 * Toggle symptom active/inactive status
 * Access: SYMPTOM_UPDATE (SUPERUSER only)
 */
router.put('/:id/toggle-status',
  authorizePermissions(PERMISSIONS.SYMPTOM_UPDATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Symptom status toggle not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Bulk status updates',
        'Activity history tracking',
        'Patient impact warnings',
        'Disease-level status updates',
      ]
    });
  }
);

/**
 * GET /api/symptoms/analytics/disease-coverage
 * Get analytics on symptom coverage per disease
 * Access: SYMPTOM_VIEW (SUPERUSER only)
 */
router.get('/analytics/disease-coverage',
  authorizePermissions(PERMISSIONS.SYMPTOM_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Disease coverage analytics not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Symptom count per disease',
        'Diseases with no symptoms',
        'Most/least common symptoms',
        'Symptom usage statistics',
        'Coverage recommendations',
      ]
    });
  }
);

// ========== ERROR HANDLING ==========

/**
 * Catch-all route for undefined symptom endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Symptom API endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      GET: [
        '/api/symptoms/by-disease/:diseaseId (🔓 All users)',
        '/api/symptoms/search (🔓 All users)',
        '/api/symptoms/stats (🔒 SUPERUSER)',
        '/api/symptoms/check-name (🔒 SUPERUSER)',
        '/api/symptoms (🔒 SUPERUSER)',
        '/api/symptoms/:id (🔒 SUPERUSER)',
        '/api/symptoms/export/csv (🔒 SUPERUSER - future)',
        '/api/symptoms/analytics/disease-coverage (🔒 SUPERUSER - future)',
      ],
      POST: [
        '/api/symptoms (🔒 SUPERUSER)',
        '/api/symptoms/bulk (🔒 SUPERUSER)',
        '/api/symptoms/import/csv (🔒 SUPERUSER - future)',
      ],
      PUT: [
        '/api/symptoms/:id (🔒 SUPERUSER)',
        '/api/symptoms/:id/toggle-status (🔒 SUPERUSER - future)',
      ],
      DELETE: [
        '/api/symptoms/:id (🔒 SUPERUSER)',
      ]
    },
    requiredPermissions: {
      view: [PERMISSIONS.SYMPTOM_VIEW],
      create: [PERMISSIONS.SYMPTOM_CREATE],
      update: [PERMISSIONS.SYMPTOM_UPDATE],
      delete: [PERMISSIONS.SYMPTOM_DELETE],
    },
    accessRestrictions: {
      note: 'Symptom management is restricted to SUPERUSER only',
      publicEndpoints: ['/by-disease/:diseaseId', '/search'],
      restrictedEndpoints: ['/', '/:id', '/stats', '/check-name', '/bulk'],
      allowedRoles: ['SUPERUSER'],
      readOnlyAccess: ['ADMIN', 'USER'],
    }
  });
});

export default router;