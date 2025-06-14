// backend/src/controllers/diseaseController.ts

import { Request, Response } from 'express';
import { diseaseService } from '../services/diseaseService';
import { ResponseUtils } from '../utils/responseUtils';
import {
  createDiseaseSchema,
  updateDiseaseSchema,
  diseaseQuerySchema,
  diseaseIdSchema,
  type CreateDiseaseData,
  type UpdateDiseaseData,
  type DiseaseQueryParams,
} from '../validations/diseaseValidation';

// Interface for authenticated request (from auth middleware)
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
    name: string;
    roleId: number;
    roleName: string;
  };
}

/**
 * Get paginated list of diseases with search and filters
 * GET /api/diseases
 */
export const getDiseases = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = diseaseQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid query parameters', errors);
    }

    const queryParams = validationResult.data;
    const result = await diseaseService.getDiseases(queryParams);

    return ResponseUtils.success(res, 'Diseases retrieved successfully', result);

  } catch (error) {
    console.error('Get diseases error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving diseases',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get disease by ID
 * GET /api/diseases/:id
 */
export const getDiseaseById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate disease ID
    const validationResult = diseaseIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid disease ID', errors);
    }

    const { id } = validationResult.data;
    const disease = await diseaseService.getDiseaseById(id);

    if (!disease) {
      return ResponseUtils.notFound(res, `Disease with ID ${id} not found`);
    }

    return ResponseUtils.success(res, 'Disease retrieved successfully', disease);

  } catch (error) {
    console.error('Get disease by ID error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving disease',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Create new disease
 * POST /api/diseases
 */
export const createDisease = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validationResult = createDiseaseSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const diseaseData = validationResult.data;
    const createdBy = req.user.username;

    const newDisease = await diseaseService.createDisease(diseaseData, createdBy);

    return ResponseUtils.success(res, 'Disease created successfully', newDisease, 201);

  } catch (error) {
    console.error('Create disease error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while creating disease',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Update disease
 * PUT /api/diseases/:id
 */
export const updateDisease = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate disease ID
    const idValidation = diseaseIdSchema.safeParse({ id: req.params.id });
    
    if (!idValidation.success) {
      const errors = idValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid disease ID', errors);
    }

    // Validate request body
    const dataValidation = updateDiseaseSchema.safeParse(req.body);
    
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

    const updatedDisease = await diseaseService.updateDisease(id, updateData, updatedBy);

    return ResponseUtils.success(res, 'Disease updated successfully', updatedDisease);

  } catch (error) {
    console.error('Update disease error:', error);
    
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
      'Internal server error while updating disease',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Delete disease (soft delete)
 * DELETE /api/diseases/:id
 */
export const deleteDisease = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate disease ID
    const validationResult = diseaseIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid disease ID', errors);
    }

    const { id } = validationResult.data;
    const deletedBy = req.user.username;

    await diseaseService.deleteDisease(id, deletedBy);

    return ResponseUtils.success(res, 'Disease deleted successfully', {
      id,
      deletedBy,
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete disease error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('Cannot delete disease')) {
        return ResponseUtils.error(res, error.message, 409, undefined, 'DISEASE_IN_USE');
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while deleting disease',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get disease statistics
 * GET /api/diseases/stats
 */
export const getDiseaseStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await diseaseService.getDiseaseStats();

    return ResponseUtils.success(res, 'Disease statistics retrieved successfully', stats);

  } catch (error) {
    console.error('Get disease stats error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving disease statistics',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Search diseases (for dropdowns)
 * GET /api/diseases/search
 */
export const searchDiseases = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm || searchTerm.length < 2) {
      return ResponseUtils.error(res, 'Search term must be at least 2 characters', 400);
    }

    if (limit > 50) {
      return ResponseUtils.error(res, 'Limit cannot exceed 50', 400);
    }

    const diseases = await diseaseService.searchDiseases(searchTerm, limit);

    return ResponseUtils.success(res, 'Search completed successfully', {
      query: searchTerm,
      results: diseases,
      count: diseases.length,
    });

  } catch (error) {
    console.error('Search diseases error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while searching diseases',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get all active diseases (for dropdowns)
 * GET /api/diseases/active
 */
export const getActiveDiseases = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const diseases = await diseaseService.getActiveDiseases();

    return ResponseUtils.success(res, 'Active diseases retrieved successfully', diseases);

  } catch (error) {
    console.error('Get active diseases error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving active diseases',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Check disease name availability
 * GET /api/diseases/check-name
 */
export const checkDiseaseNameAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { thaiName, engName, excludeId } = req.query;

    if (!thaiName || typeof thaiName !== 'string') {
      return ResponseUtils.error(res, 'Thai name is required', 400);
    }

    const excludeIdNum = excludeId ? parseInt(excludeId as string) : undefined;

    if (excludeId && (isNaN(excludeIdNum!) || excludeIdNum! <= 0)) {
      return ResponseUtils.error(res, 'Invalid exclude ID', 400);
    }

    const availability = await diseaseService.isDiseaseNameAvailable(
      thaiName,
      engName as string | undefined,
      excludeIdNum
    );

    return ResponseUtils.success(res, 'Name availability checked successfully', {
      thaiName,
      engName: engName || null,
      availability,
    });

  } catch (error) {
    console.error('Check disease name availability error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while checking name availability',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};