// backend/src/routes/users.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  authorizePermissions,
  addPermissionContext,
} from '../middleware/permissions';
import { PERMISSIONS } from '../utils/permissionConstants';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  resetPassword,
  searchUsers,
  getUserStats,
  bulkUserAction,
  checkUsernameAvailability,
  checkEmailAvailability,
  getAccessibleHospitals,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  changeCurrentUserPassword,
} from '../controllers/userController';

const router = Router();

// Apply authentication and permission context to all routes
router.use(authenticateToken);
router.use(addPermissionContext());

// 🔒 IMPORTANT: User management access rules:
// - SUPERUSER: Full CRUD access to all users
// - ADMIN: View all users, create/update ADMIN and USER accounts
// - USER: View and update own profile only

// ========== SELF-SERVICE ROUTES (All authenticated users) ==========

/**
 * GET /api/users/me
 * Get current user profile
 * Access: All authenticated users (self-access)
 */
router.get('/me', getCurrentUserProfile);

/**
 * PUT /api/users/me
 * Update current user profile (limited fields)
 * Access: All authenticated users (self-update)
 */
router.put('/me', updateCurrentUserProfile);

/**
 * POST /api/users/me/change-password
 * Change current user password
 * Access: All authenticated users (self-password-change)
 */
router.post('/me/change-password', changeCurrentUserPassword);

// ========== PUBLIC/UTILITY ROUTES (for forms and validations) ==========

/**
 * GET /api/users/check-username
 * Check if username is available
 * Query params: username, excludeId?
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/check-username',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  checkUsernameAvailability
);

/**
 * GET /api/users/check-email
 * Check if email is available
 * Query params: email, excludeId?
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/check-email',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  checkEmailAvailability
);

/**
 * GET /api/users/accessible-hospitals
 * Get hospitals accessible for user assignment
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/accessible-hospitals',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  getAccessibleHospitals
);

/**
 * GET /api/users/stats
 * Get user statistics for dashboard
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/stats',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  getUserStats
);

/**
 * GET /api/users/search
 * Search users by name, username, or email
 * Query params: q (search term), limit?
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/search',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  searchUsers
);

// ========== ADMINISTRATIVE ROUTES ==========

/**
 * POST /api/users/reset-password
 * Reset user password (SUPERUSER only)
 * Body: { userId, newPassword, confirmPassword, reason }
 * Access: USER_UPDATE (SUPERUSER only via service validation)
 */
router.post('/reset-password',
  authorizePermissions(PERMISSIONS.USER_UPDATE),
  resetPassword
);

/**
 * POST /api/users/bulk-action
 * Perform bulk actions on users (activate, deactivate, delete)
 * Body: { userIds, action, reason? }
 * Access: USER_UPDATE (ADMIN, SUPERUSER)
 */
router.post('/bulk-action',
  authorizePermissions(PERMISSIONS.USER_UPDATE),
  bulkUserAction
);

// ========== USER CRUD OPERATIONS ==========

/**
 * GET /api/users
 * Get paginated list of users with filters
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  getUsers
);

/**
 * GET /api/users/:id
 * Get user by ID
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/:id',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  getUserById
);

/**
 * POST /api/users
 * Create new user
 * Access: USER_CREATE (ADMIN, SUPERUSER)
 * Note: Role assignment validation enforced in service layer
 */
router.post('/',
  authorizePermissions(PERMISSIONS.USER_CREATE),
  createUser
);

/**
 * PUT /api/users/:id
 * Update user record
 * Access: USER_UPDATE (ADMIN, SUPERUSER)
 * Note: Role assignment validation enforced in service layer
 */
router.put('/:id',
  authorizePermissions(PERMISSIONS.USER_UPDATE),
  updateUser
);

/**
 * POST /api/users/:id/change-password
 * Change user password (as admin/superuser)
 * Body: { currentPassword, newPassword, confirmPassword }
 * Access: USER_UPDATE (ADMIN, SUPERUSER)
 */
router.post('/:id/change-password',
  authorizePermissions(PERMISSIONS.USER_UPDATE),
  changePassword
);

/**
 * DELETE /api/users/:id
 * Soft delete user record
 * Access: USER_DELETE (SUPERUSER only)
 */
router.delete('/:id',
  authorizePermissions(PERMISSIONS.USER_DELETE),
  deleteUser
);

// ========== FUTURE FEATURES (Placeholder Routes) ==========

/**
 * GET /api/users/export/csv
 * Export users to CSV
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/export/csv',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'CSV export not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Filtered CSV export by role/hospital',
        'Include user activity statistics',
        'Custom field selection',
        'Formatted output options',
        'Batch export scheduling',
      ]
    });
  }
);

/**
 * POST /api/users/import/csv
 * Import users from CSV
 * Access: USER_CREATE (ADMIN, SUPERUSER)
 */
router.post('/import/csv',
  authorizePermissions(PERMISSIONS.USER_CREATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'CSV import not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'CSV file upload and validation',
        'User data normalization',
        'Duplicate detection and handling',
        'Role and hospital assignment validation',
        'Password generation and email notifications',
        'Progress tracking for large imports',
        'Rollback capability for failed imports',
      ]
    });
  }
);

/**
 * PUT /api/users/:id/toggle-status
 * Toggle user active/inactive status
 * Access: USER_UPDATE (ADMIN, SUPERUSER)
 */
router.put('/:id/toggle-status',
  authorizePermissions(PERMISSIONS.USER_UPDATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'User status toggle not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Quick status toggle with reason',
        'Bulk status updates',
        'Activity history tracking',
        'Automatic session invalidation',
        'Email notifications to affected users',
      ]
    });
  }
);

/**
 * GET /api/users/:id/activity-log
 * Get user activity log
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/:id/activity-log',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'User activity log not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Comprehensive activity tracking',
        'Login/logout history',
        'Data access patterns',
        'Administrative actions performed',
        'Security events and anomalies',
        'Filterable and searchable logs',
      ]
    });
  }
);

/**
 * POST /api/users/:id/send-welcome-email
 * Send welcome email to user
 * Access: USER_UPDATE (ADMIN, SUPERUSER)
 */
router.post('/:id/send-welcome-email',
  authorizePermissions(PERMISSIONS.USER_UPDATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Welcome email not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Customizable welcome email templates',
        'Account activation links',
        'Initial password setup instructions',
        'System orientation materials',
        'Contact information for support',
      ]
    });
  }
);

/**
 * POST /api/users/:id/lock-account
 * Lock user account (security action)
 * Access: USER_UPDATE (ADMIN, SUPERUSER)
 */
router.post('/:id/lock-account',
  authorizePermissions(PERMISSIONS.USER_UPDATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Account locking not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Immediate account lockout',
        'Session termination',
        'Audit trail logging',
        'Automatic unlock scheduling',
        'Security incident reporting',
      ]
    });
  }
);

/**
 * POST /api/users/:id/unlock-account
 * Unlock user account
 * Access: USER_UPDATE (ADMIN, SUPERUSER)
 */
router.post('/:id/unlock-account',
  authorizePermissions(PERMISSIONS.USER_UPDATE),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Account unlocking not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'Account unlock with verification',
        'Security review requirements',
        'Password reset enforcement',
        'Multi-factor authentication setup',
        'Activity monitoring post-unlock',
      ]
    });
  }
);

/**
 * GET /api/users/analytics/usage-patterns
 * Get user usage analytics
 * Access: USER_VIEW (ADMIN, SUPERUSER)
 */
router.get('/analytics/usage-patterns',
  authorizePermissions(PERMISSIONS.USER_VIEW),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'User analytics not yet implemented',
      code: 'NOT_IMPLEMENTED',
      plannedFeatures: [
        'User engagement metrics',
        'Feature usage statistics',
        'Login patterns and frequency',
        'Geographic access analysis',
        'Performance and efficiency metrics',
        'Comparative role-based analytics',
      ]
    });
  }
);

// ========== ERROR HANDLING ==========

/**
 * Catch-all route for undefined user endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `User API endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      GET: [
        '/api/users/me (🔓 All users)',
        '/api/users/check-username (🔒 ADMIN, SUPERUSER)',
        '/api/users/check-email (🔒 ADMIN, SUPERUSER)',
        '/api/users/accessible-hospitals (🔒 ADMIN, SUPERUSER)',
        '/api/users/stats (🔒 ADMIN, SUPERUSER)',
        '/api/users/search (🔒 ADMIN, SUPERUSER)',
        '/api/users (🔒 ADMIN, SUPERUSER)',
        '/api/users/:id (🔒 ADMIN, SUPERUSER)',
        '/api/users/export/csv (🔒 ADMIN, SUPERUSER - future)',
        '/api/users/:id/activity-log (🔒 ADMIN, SUPERUSER - future)',
        '/api/users/analytics/usage-patterns (🔒 ADMIN, SUPERUSER - future)',
      ],
      POST: [
        '/api/users/reset-password (🔒 SUPERUSER)',
        '/api/users/bulk-action (🔒 ADMIN, SUPERUSER)',
        '/api/users (🔒 ADMIN, SUPERUSER)',
        '/api/users/:id/change-password (🔒 ADMIN, SUPERUSER)',
        '/api/users/import/csv (🔒 ADMIN, SUPERUSER - future)',
        '/api/users/:id/send-welcome-email (🔒 ADMIN, SUPERUSER - future)',
        '/api/users/:id/lock-account (🔒 ADMIN, SUPERUSER - future)',
        '/api/users/:id/unlock-account (🔒 ADMIN, SUPERUSER - future)',
      ],
      PUT: [
        '/api/users/me (🔓 All users)',
        '/api/users/:id (🔒 ADMIN, SUPERUSER)',
        '/api/users/:id/toggle-status (🔒 ADMIN, SUPERUSER - future)',
      ],
      DELETE: [
        '/api/users/:id (🔒 SUPERUSER)',
      ]
    },
    requiredPermissions: {
      view: [PERMISSIONS.USER_VIEW],
      create: [PERMISSIONS.USER_CREATE],
      update: [PERMISSIONS.USER_UPDATE],
      delete: [PERMISSIONS.USER_DELETE],
    },
    accessRestrictions: {
      note: 'User management has strict role-based access controls',
      selfServiceEndpoints: ['/me', '/me/change-password'],
      administrativeEndpoints: ['/reset-password', '/bulk-action'],
      restrictedOperations: {
        'SUPERUSER creation': 'SUPERUSER only',
        'SUPERUSER deletion': 'SUPERUSER only',
        'Password reset': 'SUPERUSER only',
        'Role assignment': 'Validated by service layer',
      },
      dataScoping: {
        'SUPERUSER': 'All users across all hospitals',
        'ADMIN': 'All users across all hospitals (limited role creation)',
        'USER': 'Own profile only',
      }
    }
  });
});

export default router;