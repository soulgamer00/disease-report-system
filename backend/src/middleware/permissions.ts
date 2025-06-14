// backend/src/middleware/permissions.ts

import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, PermissionHelper, type PermissionCode } from '../utils/permissionConstants';
import { ResponseUtils } from '../utils/responseUtils';
import { AuthenticatedRequest, AuthenticatedUser } from './auth';

const prisma = new PrismaClient();

// ✅ FIXED: Type-safe permission context interface
export interface PermissionContext {
  permissions: PermissionCode[];
  canAccessAllHospitals: boolean;
  userHospitalCode?: string;
  roleName: string;
}

// ✅ FIXED: Type-safe authenticated request with permissions
export interface AuthenticatedRequestWithPermissions extends AuthenticatedRequest {
  user: AuthenticatedUser; // Required user
  permissionContext?: PermissionContext;
  userPermissions?: PermissionCode[];
  hasGlobalAccess?: boolean;
  hospitalFilter?: { hospitalCode: string };
}

// ✅ FIXED: Type-safe hospital access context
export interface HospitalAccessContext {
  userRole: string;
  userHospitalCode?: string;
  permissions: PermissionCode[];
  canAccessAllHospitals: boolean;
}

// Cache for user permissions (to avoid database calls)
interface PermissionCacheEntry {
  permissions: PermissionCode[];
  timestamp: number;
}

const permissionCache = new Map<string, PermissionCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * ✅ FIXED: Type-safe permission-based authorization middleware
 * Replaces role-based authorization with granular permission control
 */
export const authorizePermissions = (...requiredPermissions: PermissionCode[]) => {
  return async (
    req: AuthenticatedRequestWithPermissions, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        ResponseUtils.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roleName } = req.user;

      // Get user permissions (with caching)
      const userPermissions = await getUserPermissions(userId, roleName);

      // Check if user has any of the required permissions
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        ResponseUtils.forbidden(
          res, 
          `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
        );
        return;
      }

      // ✅ FIXED: Type-safe permission info assignment
      req.userPermissions = userPermissions;
      req.hasGlobalAccess = userPermissions.some(p => 
        PermissionHelper.isGlobalViewPermission(p)
      );

      next();

    } catch (error) {
      console.error('Permission authorization error:', error);
      ResponseUtils.internalError(res, 'Permission validation failed');
    }
  };
};

/**
 * ✅ FIXED: Type-safe hospital-scoped authorization for USER role
 * Ensures USER can only access their own hospital's data
 */
export const enforceHospitalScope = () => {
  return (
    req: AuthenticatedRequestWithPermissions, 
    res: Response, 
    next: NextFunction
  ): void => {
    try {
      if (!req.user) {
        ResponseUtils.unauthorized(res, 'Authentication required');
        return;
      }

      const { roleName, hospitalCode } = req.user;

      // Only apply hospital scope to USER role
      if (roleName === 'USER') {
        if (!hospitalCode) {
          ResponseUtils.forbidden(
            res, 
            'User must be assigned to a hospital to access this resource'
          );
          return;
        }

        // ✅ FIXED: Type-safe hospital filter assignment
        req.hospitalFilter = { hospitalCode };
      }

      next();

    } catch (error) {
      console.error('Hospital scope enforcement error:', error);
      ResponseUtils.internalError(res, 'Hospital scope validation failed');
    }
  };
};

/**
 * ✅ FIXED: Type-safe middleware to add permission context to request
 * Useful for services that need to apply hospital filtering
 */
export const addPermissionContext = () => {
  return async (
    req: AuthenticatedRequestWithPermissions, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        next();
        return;
      }

      const { userId, roleName, hospitalCode } = req.user;
      const userPermissions = await getUserPermissions(userId, roleName);

      // ✅ FIXED: Type-safe permission context assignment
      req.permissionContext = {
        permissions: userPermissions,
        canAccessAllHospitals: userPermissions.some(p => 
          PermissionHelper.isGlobalViewPermission(p)
        ),
        userHospitalCode: hospitalCode,
        roleName,
      };

      next();

    } catch (error) {
      console.error('Add permission context error:', error);
      ResponseUtils.internalError(res, 'Failed to add permission context');
    }
  };
};

/**
 * ✅ FIXED: Type-safe advanced permission check with context
 * Used for complex business logic requiring multiple permission combinations
 */
export const checkPermissionWithContext = async (
  userId: string,
  roleName: string,
  context: {
    permission: PermissionCode;
    resourceHospitalCode?: string;
    resourceOwnerId?: string;
  }
): Promise<{
  hasPermission: boolean;
  reason?: string;
}> => {
  try {
    const userPermissions = await getUserPermissions(userId, roleName);
    
    // Check if user has the required permission
    if (!userPermissions.includes(context.permission)) {
      return {
        hasPermission: false,
        reason: `Missing required permission: ${context.permission}`,
      };
    }

    // For hospital-scoped permissions, check hospital access
    if (PermissionHelper.isHospitalScopedPermission(context.permission)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { hospitalCode: true, roleName: true },
      });

      if (user?.roleName === 'USER') {
        if (!user.hospitalCode) {
          return {
            hasPermission: false,
            reason: 'User not assigned to any hospital',
          };
        }

        if (context.resourceHospitalCode && context.resourceHospitalCode !== user.hospitalCode) {
          return {
            hasPermission: false,
            reason: 'Access denied: Resource belongs to different hospital',
          };
        }
      }
    }

    return { hasPermission: true };

  } catch (error) {
    console.error('Permission context check error:', error);
    return {
      hasPermission: false,
      reason: 'Permission validation failed',
    };
  }
};

/**
 * ✅ FIXED: Type-safe helper to check if user can access specific hospital data
 */
export const canAccessHospitalData = (
  userRole: string,
  userHospitalCode: string | undefined,
  resourceHospitalCode: string,
  permissions: PermissionCode[]
): boolean => {
  // SUPERUSER and ADMIN can access all hospitals
  if (userRole === 'SUPERUSER' || userRole === 'ADMIN') {
    return true;
  }

  // Check if user has global view permission
  if (permissions.some(p => PermissionHelper.isGlobalViewPermission(p))) {
    return true;
  }

  // USER can only access their own hospital
  if (userRole === 'USER') {
    return userHospitalCode === resourceHospitalCode;
  }

  return false;
};

/**
 * ✅ FIXED: Type-safe specific permission checkers for different operations
 */
export const requirePatientAccess = (action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE') => {
  const permissionMap: Record<string, PermissionCode[]> = {
    VIEW: [PERMISSIONS.PATIENT_VIEW_ALL, PERMISSIONS.PATIENT_VIEW_OWN],
    CREATE: [PERMISSIONS.PATIENT_CREATE],
    UPDATE: [PERMISSIONS.PATIENT_UPDATE],
    DELETE: [PERMISSIONS.PATIENT_DELETE],
  };

  return authorizePermissions(...permissionMap[action]);
};

export const requirePopulationAccess = (action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE') => {
  const permissionMap: Record<string, PermissionCode[]> = {
    VIEW: [PERMISSIONS.POPULATION_VIEW],
    CREATE: [PERMISSIONS.POPULATION_CREATE],
    UPDATE: [PERMISSIONS.POPULATION_UPDATE],
    DELETE: [PERMISSIONS.POPULATION_DELETE],
  };

  return authorizePermissions(...permissionMap[action]);
};

export const requireReportAccess = (scope: 'ALL' | 'OWN' = 'ALL') => {
  if (scope === 'ALL') {
    return authorizePermissions(PERMISSIONS.REPORT_VIEW_ALL, PERMISSIONS.REPORT_VIEW_OWN);
  }
  return authorizePermissions(PERMISSIONS.REPORT_VIEW_OWN);
};

/**
 * Clear permission cache for a user (when permissions are updated)
 */
export const clearUserPermissionCache = (userId: string, roleName: string): void => {
  const cacheKey = `${userId}-${roleName}`;
  permissionCache.delete(cacheKey);
};

/**
 * Clear all permission cache (for system maintenance)
 */
export const clearAllPermissionCache = (): void => {
  permissionCache.clear();
};

/**
 * ✅ FIXED: Type-safe get user permissions from database with caching
 */
async function getUserPermissions(userId: string, roleName: string): Promise<PermissionCode[]> {
  const cacheKey = `${userId}-${roleName}`;
  const cached = permissionCache.get(cacheKey);

  // Return cached permissions if still valid
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.permissions;
  }

  try {
    // Get user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              where: { canAccess: true },
            },
          },
        },
        hospital: {
          select: {
            hospitalCode5Digit: true,
            hospitalName: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // ✅ FIXED: Type-safe permission extraction
    const permissions: PermissionCode[] = user.role.permissions.map(
      p => p.permissionCode as PermissionCode
    );

    // Cache the permissions
    permissionCache.set(cacheKey, {
      permissions,
      timestamp: Date.now(),
    });

    return permissions;

  } catch (error) {
    console.error('Get user permissions error:', error);
    throw new Error('Failed to retrieve user permissions');
  }
}

// ✅ FIXED: Export all types for use in other files
export type {
  PermissionContext,
  AuthenticatedRequestWithPermissions,
  HospitalAccessContext,
};