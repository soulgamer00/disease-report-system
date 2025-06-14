// backend/src/controllers/symptomController.ts

import { Request, Response } from 'express';
import { symptomService } from '../services/symptomService';
import { ResponseUtils } from '../utils/responseUtils';
import {
  createSymptomSchema,
  updateSymptomSchema,
  symptomQuerySchema,
  symptomIdSchema,
  diseaseIdParamSchema,
  bulkCreateSymptomsSchema,
  type CreateSymptomData,
  type UpdateSymptomData,
  type SymptomQueryParams,
  type BulkCreateSymptomsData,
} from '../validations/symptomValidation';

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
 * Get paginated list of symptoms with search and filters
 * GET /api/symptoms
 */
export const getSymptoms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = symptomQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid query parameters', errors);
    }

    const queryParams = validationResult.data;
    const result = await symptomService.getSymptoms(queryParams);

    return ResponseUtils.success(res, 'Symptoms retrieved successfully', result);

  } catch (error) {
    console.error('Get symptoms error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving symptoms',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get symptom by ID
 * GET /api/symptoms/:id
 */
export const getSymptomById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate symptom ID
    const validationResult = symptomIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid symptom ID', errors);
    }

    const { id } = validationResult.data;
    const symptom = await symptomService.getSymptomById(id);

    if (!symptom) {
      return ResponseUtils.notFound(res, `Symptom with ID ${id} not found`);
    }

    return ResponseUtils.success(res, 'Symptom retrieved successfully', symptom);

  } catch (error) {
    console.error('Get symptom by ID error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving symptom',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Create new symptom
 * POST /api/symptoms
 */
export const createSymptom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validationResult = createSymptomSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const symptomData = validationResult.data;
    const createdBy = req.user.username;

    const newSymptom = await symptomService.createSymptom(symptomData, createdBy);

    return ResponseUtils.success(res, 'Symptom created successfully', newSymptom, 201);

  } catch (error) {
    console.error('Create symptom error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return ResponseUtils.error(res, error.message, 400, undefined, 'INVALID_DISEASE');
      }
      
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while creating symptom',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Update symptom
 * PUT /api/symptoms/:id
 */
export const updateSymptom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate symptom ID
    const idValidation = symptomIdSchema.safeParse({ id: req.params.id });
    
    if (!idValidation.success) {
      const errors = idValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid symptom ID', errors);
    }

    // Validate request body
    const dataValidation = updateSymptomSchema.safeParse(req.body);
    
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

    const updatedSymptom = await symptomService.updateSymptom(id, updateData, updatedBy);

    return ResponseUtils.success(res, 'Symptom updated successfully', updatedSymptom);

  } catch (error) {
    console.error('Update symptom error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }
      
      if (error.message.includes('inactive')) {
        return ResponseUtils.error(res, error.message, 400, undefined, 'INVALID_DISEASE');
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while updating symptom',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Delete symptom (soft delete)
 * DELETE /api/symptoms/:id
 */
export const deleteSymptom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate symptom ID
    const validationResult = symptomIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid symptom ID', errors);
    }

    const { id } = validationResult.data;
    const deletedBy = req.user.username;

    await symptomService.deleteSymptom(id, deletedBy);

    return ResponseUtils.success(res, 'Symptom deleted successfully', {
      id,
      deletedBy,
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete symptom error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return ResponseUtils.notFound(res, error.message);
      }
      
      if (error.message.includes('Cannot delete symptom')) {
        return ResponseUtils.error(res, error.message, 409, undefined, 'SYMPTOM_IN_USE');
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while deleting symptom',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get symptoms by disease ID (for patient forms)
 * GET /api/symptoms/by-disease/:diseaseId
 */
export const getSymptomsByDisease = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate disease ID
    const validationResult = diseaseIdParamSchema.safeParse({ diseaseId: req.params.diseaseId });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid disease ID', errors);
    }

    const { diseaseId } = validationResult.data;
    const symptoms = await symptomService.getSymptomsByDisease(diseaseId);

    return ResponseUtils.success(res, 'Symptoms retrieved successfully', symptoms);

  } catch (error) {
    console.error('Get symptoms by disease error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return ResponseUtils.notFound(res, error.message);
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving symptoms by disease',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Search symptoms (for autocomplete)
 * GET /api/symptoms/search
 */
export const searchSymptoms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const searchTerm = req.query.q as string;
    const diseaseId = req.query.diseaseId ? parseInt(req.query.diseaseId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm || searchTerm.length < 2) {
      return ResponseUtils.error(res, 'Search term must be at least 2 characters', 400);
    }

    if (limit > 50) {
      return ResponseUtils.error(res, 'Limit cannot exceed 50', 400);
    }

    if (diseaseId && (isNaN(diseaseId) || diseaseId <= 0)) {
      return ResponseUtils.error(res, 'Disease ID must be a positive number', 400);
    }

    const symptoms = await symptomService.searchSymptoms(searchTerm, diseaseId, limit);

    return ResponseUtils.success(res, 'Search completed successfully', {
      query: searchTerm,
      diseaseId: diseaseId || null,
      results: symptoms,
      count: symptoms.length,
    });

  } catch (error) {
    console.error('Search symptoms error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while searching symptoms',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get symptom statistics
 * GET /api/symptoms/stats
 */
export const getSymptomStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await symptomService.getSymptomStats();

    return ResponseUtils.success(res, 'Symptom statistics retrieved successfully', stats);

  } catch (error) {
    console.error('Get symptom stats error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving symptom statistics',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Bulk create symptoms for a disease
 * POST /api/symptoms/bulk
 */
export const bulkCreateSymptoms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validationResult = bulkCreateSymptomsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const bulkData = validationResult.data;
    const createdBy = req.user.username;

    const createdSymptoms = await symptomService.bulkCreateSymptoms(bulkData, createdBy);

    return ResponseUtils.success(res, 'Symptoms created successfully', {
      diseaseId: bulkData.diseaseId,
      createdSymptoms,
      count: createdSymptoms.length,
    }, 201);

  } catch (error) {
    console.error('Bulk create symptoms error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return ResponseUtils.error(res, error.message, 400, undefined, 'INVALID_DISEASE');
      }
      
      if (error.message.includes('already exist')) {
        return ResponseUtils.conflict(res, error.message);
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while bulk creating symptoms',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Check symptom name availability
 * GET /api/symptoms/check-name
 */
export const checkSymptomNameAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { diseaseId, name, excludeId } = req.query;

    if (!diseaseId || !name || typeof diseaseId !== 'string' || typeof name !== 'string') {
      return ResponseUtils.error(res, 'Disease ID and symptom name are required', 400);
    }

    const diseaseIdNum = parseInt(diseaseId);
    if (isNaN(diseaseIdNum) || diseaseIdNum <= 0) {
      return ResponseUtils.error(res, 'Invalid disease ID', 400);
    }

    const excludeIdNum = excludeId ? parseInt(excludeId as string) : undefined;
    if (excludeId && (isNaN(excludeIdNum!) || excludeIdNum! <= 0)) {
      return ResponseUtils.error(res, 'Invalid exclude ID', 400);
    }

    const isAvailable = await symptomService.isSymptomNameAvailable(
      diseaseIdNum,
      name,
      excludeIdNum
    );

    return ResponseUtils.success(res, 'Name availability checked successfully', {
      diseaseId: diseaseIdNum,
      name,
      excludeId: excludeIdNum || null,
      isAvailable,
    });

  } catch (error) {
    console.error('Check symptom name availability error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while checking name availability',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};