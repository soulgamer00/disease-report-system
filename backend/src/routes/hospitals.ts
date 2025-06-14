// backend/src/routes/hospitals.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  authorizePermissions,
  addPermissionContext,
} from '../middleware/permissions';
import { PERMISSIONS } from '../utils/permissionConstants';
import {
  getHospitals,
  getHospitalById,
  getHospitalByCode,
  createHospital,
  updateHospital,
  deleteHospital,
  getActiveHospitals,
  searchHospitals,
  getHospitalStats,
  bulkCreateHospitals,
  assignHospitalToUser,
  checkHospitalCodeAvailability,
} from '../controllers/hospitalController';

const router = Router();

// Apply authentication and permission context to all routes
router.use(authenticateToken);
router.use(addPermissionContext());

// 🔴 IMPORTANT: Hospital access rules:
// - SUPERUSER: Full CRUD access
// - ADMIN: Read access (for reports/analytics)
// - USER: Read access (for reference/dropdowns)

// ========== PUBLIC/READ-ONLY ROUTES (for dropdowns and selections) ==========

/**
 * GET /api/hospitals/active
 * Get all active hospitals for dropdowns
 * Access: All authenticated users (needed for patient forms, user assignments)
 */
router.get('/active', getActiveHospitals);

/**
 * GET /api/hospitals/search
 * Search hospitals by name or code (for autocomplete/dropdowns)
 * Query params: q (search term), limit?
 * Access: All authenticated users (needed for patient forms, user management)
 */
router.get('/search', searchHospitals);

/**
 * GET /api/hospitals/stats
 * Get hospital statistics for dashboard
 * Access: HOSPITAL_VIEW (ADMIN, SUPERUSER)
 */
router.get('/stats',
  authorizePermissions(PERMISSIONS.HOSPITAL_VIEW),
  getHospitalStats
);

/**
 * GET /api/hospitals/check-code
 * Check if hospital code is available
 * Query params: code, excludeId?
 * Access: HOSPITAL_VIEW (ADMIN, SUPERUSER)
 */
router.get('/check-code',
  authorizePermissions(PERMISSIONS.HOSPITAL_VIEW),
  checkHospitalCodeAvailability
);

/**
 * GET /api/hospitals/code/:code
 * Get hospital by 5-digit code
 * Access: All authenticated users (for reference)
 */
router.get('/code/:code', getHospitalByCode);

// ========== HOSPITAL CRUD OPERATIONS ==========

/**
 * GET /api/hospitals
 * Get paginated list of hospitals with filters
 * Access: HOSPITAL_VIEW (ADMIN, SUPERUSER)
 */
router.get('/',
  authorizePermissions(PERMISSIONS.HOSPITAL_VIEW),
  getHospitals
);

/**
 * GET /api/hospitals/:id
 * Get hospital by ID with detailed info
 * Access: HOSPITAL_VIEW (ADMIN, SUPERUSER)
 */
router.get('/:id',
  authorizePermissions(PERMISSIONS.HOSPITAL_VIEW),
  getHospitalById
);

/**
 * POST /api/hospitals
 * Create new hospital record
 * Access: HOSPITAL_CREATE (SUPERUSER only)
 */
router.post('/',
  authorizePermissions(PERMISSIONS.HOSPITAL_CREATE),
  createHospital
);

/**
 * POST /api/hospitals/bulk
 * Bulk create hospitals
 * Access: HOSPITAL_CREATE (SUPERUSER only)
 */
router.post('/bulk',
  authorizePermissions(PERMISSIONS.HOSPITAL_CREATE),
  bulkCreateHospitals
);

/**
 * POST /api/hospitals/assign-user
 * Assign hospital to user (for USER role hospital assignment)
 * Access: HOSPITAL_UPDATE (SUPERUSER only)
 */
router.post('/assign-user',
  authorizePermissions(PERMISSIONS.HOSPITAL_UPDATE),
  assignHospitalToUser
);

/**
 * PUT /api/hospitals/:id
 * Update hospital record
 * Access: HOSPITAL_UPDATE (SUPERUSER only)
 */
router.put('/:id',
  authorizePermissions(PERMISSIONS.HOSPITAL_UPDATE),
  updateHospital
);

/**
 * DELETE /api/hospitals/:id
 * Soft delete hospital record
 * Access: HOSPITAL_DELETE (SUPERUSER only)
 */
router.delete('/:id',
  authorizePermissions(PERMISSIONS.HOSPITAL_DELETE),
  deleteHospital
);

// ========== FUTURE FEATURES (Placeholder Routes) ==========

/**
 * GET /api/hospitals/export/csv
 * Export hospitals to CSV
 * Access: HOSPITAL_VIEW (ADMIN, SUPERUSER)
 */
router.get('/export/csv',
  authorizePermissions(PERMISSIONS.HOSPITAL_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'CSV export not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Filtered CSV export by organization type',
        'Include user and patient counts',
        'Custom field selection',
        'Formatted output options',
      ]
    });
  }
);

/**
 * POST /api/hospitals/import/csv
 * Import hospitals from CSV
 * Access: HOSPITAL_CREATE (SUPERUSER only)
 */
router.post('/import/csv',
  authorizePermissions(PERMISSIONS.HOSPITAL_CREATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'CSV import not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'CSV file upload and validation',
        'Hospital code validation and normalization',
        'Duplicate detection and handling',
        'Progress tracking for large imports',
        'Rollback capability for failed imports',
      ]
    });
  }
);

/**
 * PUT /api/hospitals/:id/toggle-status
 * Toggle hospital active/inactive status
 * Access: HOSPITAL_UPDATE (SUPERUSER only)
 */
router.put('/:id/toggle-status',
  authorizePermissions(PERMISSIONS.HOSPITAL_UPDATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Hospital status toggle not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Bulk status updates',
        'Impact analysis on users/patients',
        'Activity history tracking',
        'Cascade updates to related data',
      ]
    });
  }
);

/**
 * GET /api/hospitals/analytics/usage-report
 * Get hospital usage analytics
 * Access: HOSPITAL_VIEW (ADMIN, SUPERUSER)
 */
router.get('/analytics/usage-report',
  authorizePermissions(PERMISSIONS.HOSPITAL_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Hospital usage analytics not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Patient admission trends per hospital',
        'User activity by hospital',
        'Resource utilization reports',
        'Performance benchmarking',
        'Geographic distribution analysis',
      ]
    });
  }
);

/**
 * GET /api/hospitals/:id/users
 * Get users assigned to a hospital
 * Access: HOSPITAL_VIEW (ADMIN, SUPERUSER)
 */
router.get('/:id/users',
  authorizePermissions(PERMISSIONS.HOSPITAL_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Hospital user listing not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'List all users assigned to hospital',
        'User activity status',
        'Role distribution within hospital',
        'User performance metrics',
        'Assignment history tracking',
      ]
    });
  }
);

/**
 * GET /api/hospitals/:id/patients/summary
 * Get patient summary for a hospital
 * Access: HOSPITAL_VIEW (ADMIN, SUPERUSER)
 */
router.get('/:id/patients/summary',
  authorizePermissions(PERMISSIONS.HOSPITAL_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Hospital patient summary not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Patient count by disease type',
        'Admission trends over time',
        'Treatment outcome statistics',
        'Geographic distribution of patients',
        'Comparative analysis with other hospitals',
      ]
    });
  }
);

// ========== ERROR HANDLING ==========

/**
 * Catch-all route for undefined hospital endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Hospital API endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      GET: [
        '/api/hospitals/active (🔓 All users)',
        '/api/hospitals/search (🔓 All users)',
        '/api/hospitals/code/:code (🔓 All users)',
        '/api/hospitals/stats (🔒 ADMIN, SUPERUSER)',
        '/api/hospitals/check-code (🔒 ADMIN, SUPERUSER)',
        '/api/hospitals (🔒 ADMIN, SUPERUSER)',
        '/api/hospitals/:id (🔒 ADMIN, SUPERUSER)',
        '/api/hospitals/export/csv (🔒 ADMIN, SUPERUSER - future)',
        '/api/hospitals/analytics/usage-report (🔒 ADMIN, SUPERUSER - future)',
        '/api/hospitals/:id/users (🔒 ADMIN, SUPERUSER - future)',
        '/api/hospitals/:id/patients/summary (🔒 ADMIN, SUPERUSER - future)',
      ],
      POST: [
        '/api/hospitals (🔒 SUPERUSER)',
        '/api/hospitals/bulk (🔒 SUPERUSER)',
        '/api/hospitals/assign-user (🔒 SUPERUSER)',
        '/api/hospitals/import/csv (🔒 SUPERUSER - future)',
      ],
      PUT: [
        '/api/hospitals/:id (🔒 SUPERUSER)',
        '/api/hospitals/:id/toggle-status (🔒 SUPERUSER - future)',
      ],
      DELETE: [
        '/api/hospitals/:id (🔒 SUPERUSER)',
      ]
    },
    requiredPermissions: {
      view: [PERMISSIONS.HOSPITAL_VIEW],
      create: [PERMISSIONS.HOSPITAL_CREATE],
      update: [PERMISSIONS.HOSPITAL_UPDATE],
      delete: [PERMISSIONS.HOSPITAL_DELETE],
    },
    accessRestrictions: {
      note: 'Hospital management has tiered access levels',
      publicEndpoints: ['/active', '/search', '/code/:code'],
      viewOnlyEndpoints: ['/', '/:id', '/stats', '/check-code'],
      managementEndpoints: ['/bulk', '/assign-user'],
      allowedRoles: {
        view: ['ADMIN', 'SUPERUSER'],
        manage: ['SUPERUSER'],
        reference: ['USER', 'ADMIN', 'SUPERUSER'],
      },
    }
  });
});

export default router;