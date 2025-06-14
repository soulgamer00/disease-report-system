// backend/src/controllers/populationController.ts

import { Request, Response } from 'express';
import { populationService } from '../services/populationService';
import { ResponseUtils } from '../utils/responseUtils';
import { DateUtils } from '../utils/dateUtils';
import {
  createPopulationSchema,
  updatePopulationSchema,
  populationQuerySchema,
  populationIdSchema,
  incidenceRateSchema,
} from '../validations/populationValidation';
import { AuthenticatedRequestWithPermissions } from '../middleware/permissions';

/**
 * Get paginated populations with filters
 * GET /api/populations
 */
export const getPopulations = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const validationResult = populationQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid query parameters', errors);
    }

    const queryParams = validationResult.data;
    
    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const result = await populationService.getPopulations(queryParams, context);

    return ResponseUtils.success(res, 'Populations retrieved successfully', result);

  } catch (error) {
    console.error('Get populations error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving populations',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get population by ID
 * GET /api/populations/:id
 */
export const getPopulationById = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const validationResult = populationIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid population ID', errors);
    }

    const { id } = validationResult.data;
    
    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const population = await populationService.getPopulationById(id, context);

    if (!population) {
      return ResponseUtils.notFound(res, `Population with ID ${id} not found`);
    }

    return ResponseUtils.success(res, 'Population retrieved successfully', population);

  } catch (error) {
    console.error('Get population by ID error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving population',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Create new population record
 * POST /api/populations
 */
export const createPopulation = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const validationResult = createPopulationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Validation failed', errors);
    }

    const populationData = validationResult.data;
    const createdBy = req.user.username;

    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const newPopulation = await populationService.createPopulation(populationData, createdBy, context);

    return ResponseUtils.success(res, 'Population created successfully', newPopulation, 201);

  } catch (error) {
    console.error('Create population error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return ResponseUtils.conflict(res, error.message);
      }
      
      if (error.message.includes('not found')) {
        return ResponseUtils.error(res, error.message, 400, undefined, 'INVALID_REFERENCE');
      }
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while creating population',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Update population record
 * PUT /api/populations/:id
 */
export const updatePopulation = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const idValidation = populationIdSchema.safeParse({ id: req.params.id });
    
    if (!idValidation.success) {
      const errors = idValidation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid population ID', errors);
    }

    const dataValidation = updatePopulationSchema.safeParse(req.body);
    
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

    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const updatedPopulation = await populationService.updatePopulation(id, updateData, updatedBy, context);

    return ResponseUtils.success(res, 'Population updated successfully', updatedPopulation);

  } catch (error) {
    console.error('Update population error:', error);
    
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
      'Internal server error while updating population',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Delete population record (soft delete)
 * DELETE /api/populations/:id
 */
export const deletePopulation = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const validationResult = populationIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid population ID', errors);
    }

    const { id } = validationResult.data;
    const deletedBy = req.user.username;

    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    await populationService.deletePopulation(id, deletedBy, context);

    return ResponseUtils.success(res, 'Population deleted successfully', {
      id,
      deletedBy,
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete population error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return ResponseUtils.notFound(res, error.message);
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while deleting population',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Calculate incidence rate
 * GET /api/populations/incidence-rate
 */
export const calculateIncidenceRate = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const queryData = {
      ...req.query,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      diseaseId: req.query.diseaseId ? parseInt(req.query.diseaseId as string) : undefined,
      per: req.query.per ? parseInt(req.query.per as string) : 100000,
    };

    const validationResult = incidenceRateSchema.safeParse(queryData);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid parameters for incidence rate calculation', errors);
    }

    const params = validationResult.data;
    
    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const results = await populationService.calculateIncidenceRate(params, context);

    return ResponseUtils.success(res, 'Incidence rate calculated successfully', {
      parameters: params,
      results,
      calculatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Calculate incidence rate error:', error);
    
    if (error instanceof Error && error.message.includes('No population data found')) {
      return ResponseUtils.notFound(res, error.message);
    }

    return ResponseUtils.internalError(
      res,
      'Internal server error while calculating incidence rate',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get population by hospital and year
 * GET /api/populations/hospital/:hospitalCode/year/:year
 */
export const getPopulationByHospitalYear = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const { hospitalCode, year } = req.params;
    const yearInt = parseInt(year);

    if (!hospitalCode || hospitalCode.length !== 5) {
      return ResponseUtils.error(res, 'Hospital code must be exactly 5 characters', 400);
    }

    if (isNaN(yearInt) || yearInt < 2000) {
      return ResponseUtils.error(res, 'Year must be a valid number >= 2000', 400);
    }

    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const population = await populationService.getPopulationByHospitalYear(hospitalCode, yearInt, context);

    if (!population) {
      return ResponseUtils.notFound(res, `Population data for hospital ${hospitalCode} in year ${year} not found`);
    }

    return ResponseUtils.success(res, 'Population data retrieved successfully', population);

  } catch (error) {
    console.error('Get population by hospital/year error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving population data',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get population trends for a hospital
 * GET /api/populations/trends/:hospitalCode
 */
export const getPopulationTrends = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    const { hospitalCode } = req.params;
    const startYear = req.query.startYear ? parseInt(req.query.startYear as string) : undefined;
    const endYear = req.query.endYear ? parseInt(req.query.endYear as string) : undefined;

    if (!hospitalCode || hospitalCode.length !== 5) {
      return ResponseUtils.error(res, 'Hospital code must be exactly 5 characters', 400);
    }

    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const trends = await populationService.getPopulationTrends(hospitalCode, startYear, endYear, context);

    return ResponseUtils.success(res, 'Population trends retrieved successfully', {
      hospitalCode,
      trends,
      period: {
        startYear: startYear || DateUtils.getCurrentYear() - 5,
        endYear: endYear || DateUtils.getCurrentYear(),
      }
    });

  } catch (error) {
    console.error('Get population trends error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving population trends',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

/**
 * Get population statistics
 * GET /api/populations/stats
 */
export const getPopulationStats = async (req: AuthenticatedRequestWithPermissions, res: Response) => {
  try {
    // ✅ FIXED: Type-safe permission context access
    const context = req.permissionContext ? {
      userRole: req.permissionContext.roleName,
      userHospitalCode: req.permissionContext.userHospitalCode,
      permissions: req.permissionContext.permissions,
      canAccessAllHospitals: req.permissionContext.canAccessAllHospitals,
    } : undefined;

    const stats = await populationService.getPopulationStats(context);

    return ResponseUtils.success(res, 'Population statistics retrieved successfully', stats);

  } catch (error) {
    console.error('Get population stats error:', error);
    return ResponseUtils.internalError(
      res,
      'Internal server error while retrieving population statistics',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};