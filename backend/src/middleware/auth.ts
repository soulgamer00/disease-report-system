// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ResponseUtils } from '../utils/responseUtils';

const prisma = new PrismaClient();

// ✅ FIXED: Proper JWT payload interface
export interface JWTPayload {
  userId: string;
  username: string;
  name: string;
  roleId: number;
  roleName: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// ✅ FIXED: Enhanced authenticated user interface
export interface AuthenticatedUser extends JWTPayload {
  hospitalCode?: string;
}

// ✅ FIXED: Type-safe request interfaces
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AuthenticatedRequestExtended extends AuthenticatedRequest {
  user: AuthenticatedUser; // Required user
  requiresHospitalScope?: boolean;
  hospitalContext?: {
    userHospitalCode?: string;
    canAccessAllHospitals: boolean;
  };
}

// ✅ FIXED: Type-safe authentication middleware
export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // อ่าน token จาก httpOnly cookie
    const token = req.cookies?.auth_token;

    if (!token) {
      ResponseUtils.unauthorized(res, 'Access token required. Please login.');
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // ตรวจสอบ token format
    if (!decoded.userId || !decoded.username || !decoded.roleId) {
      ResponseUtils.unauthorized(res, 'Invalid token format');
      return;
    }

    // ✅ FIXED: Type-safe user object creation
    const authenticatedUser: AuthenticatedUser = {
      userId: decoded.userId,
      username: decoded.username,
      name: decoded.name,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      iat: decoded.iat,
      exp: decoded.exp,
      iss: decoded.iss,
      aud: decoded.aud,
    };

    // 🚀 NEW: Get user hospital information for USER role
    if (decoded.roleName === 'USER') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { 
          hospitalCode: true,
          isActive: true,
          hospital: {
            select: {
              hospitalName: true,
              hospitalCode5Digit: true,
            }
          }
        },
      });

      if (!user || !user.isActive) {
        ResponseUtils.unauthorized(res, 'User account is inactive or not found');
        return;
      }

      // Add hospital code to user object
      authenticatedUser.hospitalCode = user.hospitalCode || undefined;
    }

    // ✅ FIXED: Type-safe user assignment
    req.user = authenticatedUser;
    next();

  } catch (error) {
    console.error('Token verification error:', error);

    // Handle different JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      ResponseUtils.unauthorized(res, 'Token has expired. Please login again.');
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      ResponseUtils.unauthorized(res, 'Invalid token. Please login again.');
      return;
    }

    ResponseUtils.unauthorized(res, 'Token verification failed');
  }
};

// 🔴 DEPRECATED: Legacy role-based authorization (kept for backward compatibility)
// Use authorizePermissions from permissions.ts instead
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    console.warn('⚠️  DEPRECATED: authorizeRoles() is deprecated. Use authorizePermissions() instead.');
    
    try {
      // ตรวจสอบว่ามี user ใน request หรือไม่ (จาก authenticateToken middleware)
      if (!req.user) {
        ResponseUtils.unauthorized(res, 'Authentication required');
        return;
      }

      // ตรวจสอบว่า user มี role ที่อนุญาตหรือไม่
      const userRole = req.user.roleName;
      if (!allowedRoles.includes(userRole)) {
        ResponseUtils.forbidden(
          res, 
          `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
        );
        return;
      }

      next();

    } catch (error) {
      console.error('Authorization error:', error);
      ResponseUtils.internalError(res, 'Authorization check failed');
    }
  };
};

// 🔴 DEPRECATED: Legacy role ID authorization (kept for backward compatibility)
// Use authorizePermissions from permissions.ts instead
export const authorizeRoleIds = (...allowedRoleIds: number[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    console.warn('⚠️  DEPRECATED: authorizeRoleIds() is deprecated. Use authorizePermissions() instead.');
    
    try {
      if (!req.user) {
        ResponseUtils.unauthorized(res, 'Authentication required');
        return;
      }

      const userRoleId = req.user.roleId;
      if (!allowedRoleIds.includes(userRoleId)) {
        ResponseUtils.forbidden(
          res, 
          `Access denied. Required role IDs: ${allowedRoleIds.join(', ')}. Your role ID: ${userRoleId}`
        );
        return;
      }

      next();

    } catch (error) {
      console.error('Authorization error:', error);
      ResponseUtils.internalError(res, 'Authorization check failed');
    }
  };
};

// ✅ FIXED: Type-safe owner-based access control
export const authorizeOwnerOrAdmin = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      ResponseUtils.unauthorized(res, 'Authentication required');
      return;
    }

    const userId = req.params.userId || req.body.userId;
    const userRole = req.user.roleName;

    // Allow if user is admin/superuser or accessing their own resource
    if (userRole === 'ADMIN' || userRole === 'SUPERUSER' || req.user.userId === userId) {
      next();
    } else {
      ResponseUtils.forbidden(res, 'Access denied. You can only access your own resources.');
    }

  } catch (error) {
    console.error('Owner authorization error:', error);
    ResponseUtils.internalError(res, 'Authorization check failed');
  }
};

// 🚀 NEW: Enhanced authentication with hospital context
export const authenticateWithHospitalContext = async (
  req: AuthenticatedRequestExtended,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First, authenticate the token
  await authenticateToken(req, res, () => {
    if (!req.user) {
      return; // Error already handled by authenticateToken
    }

    // ✅ FIXED: Type-safe hospital context
    if (req.user.roleName === 'USER') {
      req.requiresHospitalScope = true;
      req.hospitalContext = {
        userHospitalCode: req.user.hospitalCode,
        canAccessAllHospitals: false,
      };
    } else {
      req.hospitalContext = {
        canAccessAllHospitals: true,
      };
    }
    
    next();
  });
};

// ✅ FIXED: Type-safe middleware to require authentication
export const requireAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    ResponseUtils.unauthorized(res, 'Authentication required');
    return;
  }
  next();
};

// ✅ FIXED: Type-safe middleware to require specific role
export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtils.unauthorized(res, 'Authentication required');
      return;
    }

    if (req.user.roleName !== role) {
      ResponseUtils.forbidden(res, `Access denied. Required role: ${role}`);
      return;
    }

    next();
  };
};

// ✅ FIXED: Type-safe middleware to require any of the specified roles
export const requireAnyRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtils.unauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.roleName)) {
      ResponseUtils.forbidden(res, `Access denied. Required roles: ${roles.join(', ')}`);
      return;
    }

    next();
  };
};

// ✅ FIXED: Export clean interfaces for use in other files
export type { AuthenticatedUser, AuthenticatedRequest, AuthenticatedRequestExtended };