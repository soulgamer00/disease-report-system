// backend/src/controllers/userController.ts

import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { ResponseUtils } from '../utils/responseUtils';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  userQuerySchema,
  userIdSchema,
  bulkUserActionSchema,
  userActivityLogSchema,
  type CreateUserData,
  type UpdateUserData,
  type ChangePasswordData,
  type ResetPasswordData,
  type UserQueryParams,
  type BulkUserActionData,
} from '../validations/userValidation';
import { AuthenticatedRequestWithPermissions } from '../middleware/permissions';

/**
 * Get paginated list of users with search and filters
 * GET /api/users
 */
export const getUsers = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = userQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid query parameters', errors);
    }

    const queryParams = validationResult.data;
    
    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const result = await userService.getUsers(queryParams, context);

    return ResponseUtils.success(res, 'Users retrieved successfully', result);

  } catch (error) {
    console.error('Get users error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving users',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate user ID
    const validationResult = userIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid user ID', errors);
    }

    const { id } = validationResult.data;
    
    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const user = await userService.getUserById(id, context);

    if (!user) {
      return ResponseUtils.notFound(res, `User with ID ${id} not found or access denied`);
    }

    return ResponseUtils.success(res, 'User retrieved successfully', user);

  } catch (error) {
    console.error('Get user by ID error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving user',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Create new user
 * POST /api/users
 */
export const createUser = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate request body
    const validationResult = createUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const userData = validationResult.data;
    const createdBy = req.user.username;
    const creatorRole = req.user.roleName;

    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const newUser = await userService.createUser(userData, createdBy, creatorRole, context);

    return ResponseUtils.success(res, 'User created successfully', newUser, 201);

  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }
      
      if (error.message.includes('not found') || error.message.includes('Invalid role')) {
        return ResponseUtils.error(res, error.message, 400, undefined, 'INVALID_REFERENCE');
      }

      if (error.message.includes('Unauthorized') || error.message.includes('Access denied')) {
        return ResponseUtils.forbidden(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while creating user',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate user ID
    const idValidation = userIdSchema.safeParse({ id: req.params.id });
    
    if (!idValidation.success) {
      const errors = idValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid user ID', errors);
    }

    // Validate request body
    const dataValidation = updateUserSchema.safeParse(req.body);
    
    if (!dataValidation.success) {
      const errors = dataValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const { id } = idValidation.data;
    const updateData = dataValidation.data;
    const updatedBy = req.user.username;
    const updaterRole = req.user.roleName;

    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const updatedUser = await userService.updateUser(id, updateData, updatedBy, updaterRole, context);

    return ResponseUtils.success(res, 'User updated successfully', updatedUser);

  } catch (error) {
    console.error('Update user error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }

      if (error.message.includes('Unauthorized') || error.message.includes('cannot change')) {
        return ResponseUtils.forbidden(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while updating user',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Delete user (soft delete)
 * DELETE /api/users/:id
 */
export const deleteUser = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate user ID
    const validationResult = userIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid user ID', errors);
    }

    const { id } = validationResult.data;
    const deletedBy = req.user.username;
    const deleterRole = req.user.roleName;

    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    await userService.deleteUser(id, deletedBy, deleterRole, context);

    return ResponseUtils.success(res, 'User deleted successfully', {
      id,
      deletedBy,
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete user error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return ResponseUtils.notFound(res, error.message);
      }

      if (error.message.includes('cannot delete') || error.message.includes('Insufficient')) {
        return ResponseUtils.forbidden(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while deleting user',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Change password
 * POST /api/users/:id/change-password
 */
export const changePassword = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate user ID
    const idValidation = userIdSchema.safeParse({ id: req.params.id });
    
    if (!idValidation.success) {
      const errors = idValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid user ID', errors);
    }

    // Validate request body
    const dataValidation = changePasswordSchema.safeParse(req.body);
    
    if (!dataValidation.success) {
      const errors = dataValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const { id } = idValidation.data;
    const passwordData = dataValidation.data;
    const requesterId = req.user.userId;

    await userService.changePassword(id, passwordData, requesterId);

    return ResponseUtils.success(res, 'Password changed successfully', {
      id,
      changedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Change password error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return ResponseUtils.notFound(res, error.message);
      }

      if (error.message.includes('incorrect') || error.message.includes('only change their own')) {
        return ResponseUtils.forbidden(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while changing password',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Reset password (SUPERUSER only)
 * POST /api/users/reset-password
 */
export const resetPassword = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate request body
    const validationResult = resetPasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const resetData = validationResult.data;
    const resetBy = req.user.username;
    const resetterRole = req.user.roleName;

    await userService.resetPassword(resetData, resetBy, resetterRole);

    return ResponseUtils.success(res, 'Password reset successfully', {
      userId: resetData.userId,
      resetBy,
      resetAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return ResponseUtils.notFound(res, error.message);
      }

      if (error.message.includes('Only SUPERUSER')) {
        return ResponseUtils.forbidden(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while resetting password',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Search users
 * GET /api/users/search
 */
export const searchUsers = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm || searchTerm.length < 2) {
      return ResponseUtils.error(res, 'Search term must be at least 2 characters', 400);
    }

    if (limit > 50) {
      return ResponseUtils.error(res, 'Limit cannot exceed 50', 400);
    }

    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const users = await userService.searchUsers(searchTerm, limit, context);

    return ResponseUtils.success(res, 'Search completed successfully', {
      query: searchTerm,
      results: users,
      count: users.length,
    });

  } catch (error) {
    console.error('Search users error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while searching users',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get user statistics
 * GET /api/users/stats
 */
export const getUserStats = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const stats = await userService.getUserStats(context);

    return ResponseUtils.success(res, 'User statistics retrieved successfully', stats);

  } catch (error) {
    console.error('Get user stats error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving user statistics',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Bulk user actions
 * POST /api/users/bulk-action
 */
export const bulkUserAction = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate request body
    const validationResult = bulkUserActionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const actionData = validationResult.data;
    const actionBy = req.user.username;
    const actionerRole = req.user.roleName;

    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const results = await userService.bulkUserAction(actionData, actionBy, actionerRole, context);

    return ResponseUtils.success(res, 'Bulk action completed', {
      action: actionData.action,
      totalRequested: actionData.userIds.length,
      successful: results.success.length,
      failed: results.failed.length,
      results
    });

  } catch (error) {
    console.error('Bulk user action error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while performing bulk action',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Check username availability
 * GET /api/users/check-username
 */
export const checkUsernameAvailability = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const { username, excludeId } = req.query;

    if (!username || typeof username !== 'string') {
      return ResponseUtils.error(res, 'Username is required', 400);
    }

    if (username.length < 3 || username.length > 50) {
      return ResponseUtils.error(res, 'Username must be between 3 and 50 characters', 400);
    }

    const excludeIdStr = excludeId ? excludeId as string : undefined;

    const isAvailable = await userService.isUsernameAvailable(username, excludeIdStr);

    return ResponseUtils.success(res, 'Username availability checked successfully', {
      username,
      excludeId: excludeIdStr || null,
      isAvailable,
    });

  } catch (error) {
    console.error('Check username availability error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while checking username availability',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Check email availability
 * GET /api/users/check-email
 */
export const checkEmailAvailability = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const { email, excludeId } = req.query;

    if (!email || typeof email !== 'string') {
      return ResponseUtils.error(res, 'Email is required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseUtils.error(res, 'Invalid email format', 400);
    }

    const excludeIdStr = excludeId ? excludeId as string : undefined;

    const isAvailable = await userService.isEmailAvailable(email, excludeIdStr);

    return ResponseUtils.success(res, 'Email availability checked successfully', {
      email,
      excludeId: excludeIdStr || null,
      isAvailable,
    });

  } catch (error) {
    console.error('Check email availability error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while checking email availability',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get accessible hospitals for user assignment
 * GET /api/users/accessible-hospitals
 */
export const getAccessibleHospitals = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // ✅ SECURITY: Create access context
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const hospitals = await userService.getAccessibleHospitals(context);

    return ResponseUtils.success(res, 'Accessible hospitals retrieved successfully', {
      hospitals,
      accessScope: context?.canAccessAllHospitals ? 'ALL_HOSPITALS' : 'LIMITED_HOSPITALS',
    });

  } catch (error) {
    console.error('Get accessible hospitals error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving accessible hospitals',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get current user profile (self)
 * GET /api/users/me
 */
export const getCurrentUserProfile = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const userId = req.user.userId;

    // ✅ SECURITY: Users can always access their own profile
    const context = {
      userRole: 'SUPERUSER', // Bypass hospital filtering for self-access
      userHospitalCode: undefined,
      permissions: [],
      canAccessAllHospitals: true,
    };

    const user = await userService.getUserById(userId, context);

    if (!user) {
      return ResponseUtils.notFound(res, 'User profile not found');
    }

    return ResponseUtils.success(res, 'User profile retrieved successfully', user);

  } catch (error) {
    console.error('Get current user profile error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving user profile',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Update current user profile (self)
 * PUT /api/users/me
 */
export const updateCurrentUserProfile = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate request body (exclude role and hospital changes for self-update)
    const allowedFields = {
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      department: req.body.department,
      position: req.body.position,
    };

    // Remove undefined fields
    const updateData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
      return ResponseUtils.error(res, 'At least one field must be provided for update', 400);
    }

    const dataValidation = updateUserSchema.safeParse(updateData);
    
    if (!dataValidation.success) {
      const errors = dataValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const userId = req.user.userId;
    const updatedBy = req.user.username;
    const updaterRole = req.user.roleName;

    // ✅ SECURITY: Users can always update their own profile
    const context = {
      userRole: 'SUPERUSER', // Bypass hospital filtering for self-update
      userHospitalCode: undefined,
      permissions: [],
      canAccessAllHospitals: true,
    };

    const updatedUser = await userService.updateUser(userId, updateData, updatedBy, updaterRole, context);

    return ResponseUtils.success(res, 'Profile updated successfully', updatedUser);

  } catch (error) {
    console.error('Update current user profile error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while updating profile',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Change current user password (self)
 * POST /api/users/me/change-password
 */
export const changeCurrentUserPassword = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // Validate request body
    const validationResult = changePasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const passwordData = validationResult.data;
    const userId = req.user.userId;
    const requesterId = req.user.userId; // Same as userId for self-change

    await userService.changePassword(userId, passwordData, requesterId);

    return ResponseUtils.success(res, 'Password changed successfully', {
      changedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Change current user password error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('incorrect')) {
        return ResponseUtils.error(res, error.message, 400, undefined, 'INVALID_PASSWORD');
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while changing password',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};