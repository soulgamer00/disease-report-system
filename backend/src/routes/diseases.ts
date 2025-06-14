// backend/src/routes/diseases.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  authorizePermissions,
  addPermissionContext,
} from '../middleware/permissions';
import { PERMISSIONS } from '../utils/permissionConstants';
import {
  getDiseases,
  getDiseaseById,
  createDisease,
  updateDisease,
  deleteDisease,
  getDiseaseStats,
  searchDiseases,
  getActiveDiseases,
  checkDiseaseNameAvailability,
} from '../controllers/diseaseController';

const router = Router();

// Apply authentication and permission context to all routes
router.use(authenticateToken);
router.use(addPermissionContext());

// 🔴 IMPORTANT: Disease management is restricted to SUPERUSER only
// ADMIN and USER should only have read access for dropdowns/selections

// ========== PUBLIC/READ-ONLY ROUTES (for dropdowns and selections) ==========

/**
 * GET /api/diseases/active
 * Get all active diseases for dropdowns/selections
 * Access: All authenticated users (needed for patient forms)
 */
router.get('/active', getActiveDiseases);

/**
 * GET /api/diseases/search
 * Search diseases by name (for autocomplete/dropdowns)
 * Query params: q (search term), limit?
 * Access: All authenticated users (needed for patient forms)
 */
router.get('/search', searchDiseases);

/**
 * GET /api/diseases/stats
 * Get disease statistics for dashboard
 * Access: DISEASE_VIEW (SUPERUSER only)
 */
router.get('/stats',
  authorizePermissions(PERMISSIONS.DISEASE_VIEW),
  getDiseaseStats
);

/**
 * GET /api/diseases/check-name
 * Check if disease name is available
 * Query params: thaiName, engName?, excludeId?
 * Access: DISEASE_VIEW (SUPERUSER only)
 */
router.get('/check-name',
  authorizePermissions(PERMISSIONS.DISEASE_VIEW),
  checkDiseaseNameAvailability
);

// ========== DISEASE CRUD OPERATIONS (SUPERUSER ONLY) ==========

/**
 * GET /api/diseases
 * Get paginated list of diseases with filters
 * Access: DISEASE_VIEW (SUPERUSER only)
 */
router.get('/',
  authorizePermissions(PERMISSIONS.DISEASE_VIEW),
  getDiseases
);

/**
 * GET /api/diseases/:id
 * Get disease by ID with symptoms
 * Access: DISEASE_VIEW (SUPERUSER only)
 */
router.get('/:id',
  authorizePermissions(PERMISSIONS.DISEASE_VIEW),
  getDiseaseById
);

/**
 * POST /api/diseases
 * Create new disease record
 * Access: DISEASE_CREATE (SUPERUSER only)
 */
router.post('/',
  authorizePermissions(PERMISSIONS.DISEASE_CREATE),
  createDisease
);

/**
 * PUT /api/diseases/:id
 * Update disease record
 * Access: DISEASE_UPDATE (SUPERUSER only)
 */
router.put('/:id',
  authorizePermissions(PERMISSIONS.DISEASE_UPDATE),
  updateDisease
);

/**
 * DELETE /api/diseases/:id
 * Soft delete disease record
 * Access: DISEASE_DELETE (SUPERUSER only)
 */
router.delete('/:id',
  authorizePermissions(PERMISSIONS.DISEASE_DELETE),
  deleteDisease
);

// ========== FUTURE FEATURES (Placeholder Routes) ==========

/**
 * POST /api/diseases/bulk
 * Bulk import diseases (CSV/JSON)
 * Access: DISEASE_CREATE (SUPERUSER only)
 */
router.post('/bulk',
  authorizePermissions(PERMISSIONS.DISEASE_CREATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Bulk disease import not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'CSV/JSON file upload and validation',
        'Duplicate detection and handling',
        'Automatic symptom association',
        'Progress tracking for large imports',
        'Rollback capability for failed imports',
      ]
    });
  }
);

/**
 * GET /api/diseases/export/csv
 * Export diseases to CSV
 * Access: DISEASE_VIEW (SUPERUSER only)
 */
router.get('/export/csv',
  authorizePermissions(PERMISSIONS.DISEASE_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'CSV export not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Filtered CSV export by activity status',
        'Include/exclude symptoms in export',
        'Custom field selection',
        'Formatted output options',
      ]
    });
  }
);

/**
 * PUT /api/diseases/:id/toggle-status
 * Toggle disease active/inactive status
 * Access: DISEASE_UPDATE (SUPERUSER only)
 */
router.put('/:id/toggle-status',
  authorizePermissions(PERMISSIONS.DISEASE_UPDATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Disease status toggle not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Bulk status updates',
        'Activity history tracking',
        'Patient impact warnings',
        'Cascade status updates to symptoms',
      ]
    });
  }
);

// ========== ERROR HANDLING ==========

/**
 * Catch-all route for undefined disease endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Disease API endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      GET: [
        '/api/diseases/active (🔓 All users)',
        '/api/diseases/search (🔓 All users)',
        '/api/diseases/stats (🔒 SUPERUSER)',
        '/api/diseases/check-name (🔒 SUPERUSER)',
        '/api/diseases (🔒 SUPERUSER)',
        '/api/diseases/:id (🔒 SUPERUSER)',
        '/api/diseases/export/csv (🔒 SUPERUSER - future)',
      ],
      POST: [
        '/api/diseases (🔒 SUPERUSER)',
        '/api/diseases/bulk (🔒 SUPERUSER - future)',
      ],
      PUT: [
        '/api/diseases/:id (🔒 SUPERUSER)',
        '/api/diseases/:id/toggle-status (🔒 SUPERUSER - future)',
      ],
      DELETE: [
        '/api/diseases/:id (🔒 SUPERUSER)',
      ]
    },
    requiredPermissions: {
      view: [PERMISSIONS.DISEASE_VIEW],
      create: [PERMISSIONS.DISEASE_CREATE],
      update: [PERMISSIONS.DISEASE_UPDATE],
      delete: [PERMISSIONS.DISEASE_DELETE],
    },
    accessRestrictions: {
      note: 'Disease management is restricted to SUPERUSER only',
      publicEndpoints: ['/active', '/search'],
      restrictedEndpoints: ['/', '/:id', '/stats', '/check-name'],
      allowedRoles: ['SUPERUSER'],
      readOnlyAccess: ['ADMIN', 'USER'],
    }
  });
});

export default router;