// backend/src/controllers/hospitalController.ts

import { Request, Response } from 'express';
import { hospitalService } from '../services/hospitalService';
import { ResponseUtils } from '../utils/responseUtils';
import {
  createHospitalSchema,
  updateHospitalSchema,
  hospitalQuerySchema,
  hospitalIdSchema,
  hospitalCodeSchema,
  bulkCreateHospitalsSchema,
  hospitalAssignmentSchema,
  type CreateHospitalData,
  type UpdateHospitalData,
  type HospitalQueryParams,
  type BulkCreateHospitalsData,
  type HospitalAssignmentData,
} from '../validations/hospitalValidation';

// Interface for authenticated request (from auth middleware)
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
    name: string;
    roleId: number;
    roleName: string;
    hospitalCode?: string;
  };
}

/**
 * Get paginated list of hospitals with search and filters
 * GET /api/hospitals
 */
export const getHospitals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = hospitalQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid query parameters', errors);
    }

    const queryParams = validationResult.data;
    
    // Create hospital access context
    const context = {
      userRole: req.user.roleName,
      userHospitalCode: req.user.hospitalCode,
      permissions: [], // Will be populated by permission middleware if needed
      canAccessAllHospitals: req.user.roleName === 'SUPERUSER' || req.user.roleName === 'ADMIN',
    };

    const result = await hospitalService.getHospitals(queryParams, context);

    return ResponseUtils.success(res, 'Hospitals retrieved successfully', result);

  } catch (error) {
    console.error('Get hospitals error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving hospitals',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get hospital by ID
 * GET /api/hospitals/:id
 */
export const getHospitalById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate hospital ID
    const validationResult = hospitalIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid hospital ID', errors);
    }

    const { id } = validationResult.data;
    const hospital = await hospitalService.getHospitalById(id);

    if (!hospital) {
      return ResponseUtils.notFound(res, `Hospital with ID ${id} not found`);
    }

    return ResponseUtils.success(res, 'Hospital retrieved successfully', hospital);

  } catch (error) {
    console.error('Get hospital by ID error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving hospital',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get hospital by code
 * GET /api/hospitals/code/:code
 */
export const getHospitalByCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate hospital code
    const validationResult = hospitalCodeSchema.safeParse({ code: req.params.code });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid hospital code', errors);
    }

    const { code } = validationResult.data;
    const hospital = await hospitalService.getHospitalByCode(code);

    if (!hospital) {
      return ResponseUtils.notFound(res, `Hospital with code ${code} not found`);
    }

    return ResponseUtils.success(res, 'Hospital retrieved successfully', hospital);

  } catch (error) {
    console.error('Get hospital by code error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving hospital',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Create new hospital
 * POST /api/hospitals
 */
export const createHospital = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validationResult = createHospitalSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const hospitalData = validationResult.data;
    const createdBy = req.user.username;

    const newHospital = await hospitalService.createHospital(hospitalData, createdBy);

    return ResponseUtils.success(res, 'Hospital created successfully', newHospital, 201);

  } catch (error) {
    console.error('Create hospital error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while creating hospital',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Update hospital
 * PUT /api/hospitals/:id
 */
export const updateHospital = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate hospital ID
    const idValidation = hospitalIdSchema.safeParse({ id: req.params.id });
    
    if (!idValidation.success) {
      const errors = idValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid hospital ID', errors);
    }

    // Validate request body
    const dataValidation = updateHospitalSchema.safeParse(req.body);
    
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

    const updatedHospital = await hospitalService.updateHospital(id, updateData, updatedBy);

    return ResponseUtils.success(res, 'Hospital updated successfully', updatedHospital);

  } catch (error) {
    console.error('Update hospital error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while updating hospital',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Delete hospital (soft delete)
 * DELETE /api/hospitals/:id
 */
export const deleteHospital = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate hospital ID
    const validationResult = hospitalIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid hospital ID', errors);
    }

    const { id } = validationResult.data;
    const deletedBy = req.user.username;

    await hospitalService.deleteHospital(id, deletedBy);

    return ResponseUtils.success(res, 'Hospital deleted successfully', {
      id,
      deletedBy,
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete hospital error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('Cannot delete hospital')) {
        return ResponseUtils.error(res, error.message, 409, undefined, 'HOSPITAL_IN_USE');
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while deleting hospital',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get all active hospitals (for dropdowns)
 * GET /api/hospitals/active
 */
export const getActiveHospitals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hospitals = await hospitalService.getActiveHospitals();

    return ResponseUtils.success(res, 'Active hospitals retrieved successfully', hospitals);

  } catch (error) {
    console.error('Get active hospitals error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving active hospitals',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Search hospitals (for autocomplete)
 * GET /api/hospitals/search
 */
export const searchHospitals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm || searchTerm.length < 2) {
      return ResponseUtils.error(res, 'Search term must be at least 2 characters', 400);
    }

    if (limit > 50) {
      return ResponseUtils.error(res, 'Limit cannot exceed 50', 400);
    }

    const hospitals = await hospitalService.searchHospitals(searchTerm, limit);

    return ResponseUtils.success(res, 'Search completed successfully', {
      query: searchTerm,
      results: hospitals,
      count: hospitals.length,
    });

  } catch (error) {
    console.error('Search hospitals error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while searching hospitals',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get hospital statistics
 * GET /api/hospitals/stats
 */
export const getHospitalStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await hospitalService.getHospitalStats();

    return ResponseUtils.success(res, 'Hospital statistics retrieved successfully', stats);

  } catch (error) {
    console.error('Get hospital stats error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving hospital statistics',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Bulk create hospitals
 * POST /api/hospitals/bulk
 */
export const bulkCreateHospitals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validationResult = bulkCreateHospitalsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const bulkData = validationResult.data;
    const createdBy = req.user.username;

    const createdHospitals = await hospitalService.bulkCreateHospitals(bulkData, createdBy);

    return ResponseUtils.success(res, 'Hospitals created successfully', {
      createdHospitals,
      count: createdHospitals.length,
    }, 201);

  } catch (error) {
    console.error('Bulk create hospitals error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('already exist')) {
        return ResponseUtils.conflict(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while bulk creating hospitals',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Assign hospital to user
 * POST /api/hospitals/assign-user
 */
export const assignHospitalToUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validationResult = hospitalAssignmentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const assignmentData = validationResult.data;

    await hospitalService.assignHospitalToUser(assignmentData);

    return ResponseUtils.success(res, 'Hospital assigned to user successfully', {
      userId: assignmentData.userId,
      hospitalCode: assignmentData.hospitalCode,
      assignedBy: req.user.username,
      assignedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Assign hospital to user error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return ResponseUtils.error(res, error.message, 400, undefined, 'INVALID_REFERENCE');
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while assigning hospital to user',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Check hospital code availability
 * GET /api/hospitals/check-code
 */
export const checkHospitalCodeAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, excludeId } = req.query;

    if (!code || typeof code !== 'string') {
      return ResponseUtils.error(res, 'Hospital code is required', 400);
    }

    if (code.length !== 5) {
      return ResponseUtils.error(res, 'Hospital code must be exactly 5 characters', 400);
    }

    const excludeIdNum = excludeId ? parseInt(excludeId as string) : undefined;
    if (excludeId && (isNaN(excludeIdNum!) || excludeIdNum! <= 0)) {
      return ResponseUtils.error(res, 'Invalid exclude ID', 400);
    }

    const isAvailable = await hospitalService.isHospitalCodeAvailable(code, excludeIdNum);

    return ResponseUtils.success(res, 'Code availability checked successfully', {
      code,
      excludeId: excludeIdNum || null,
      isAvailable,
    });

  } catch (error) {
    console.error('Check hospital code availability error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while checking code availability',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};