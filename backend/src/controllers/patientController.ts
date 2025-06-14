// backend/src/controllers/patientController.ts - ✅ SIMPLIFIED: เหลือเฉพาะฟังก์ชั่นหลัก

import { Request, Response } from 'express';
import { patientService } from '../services/patientService';
import { ResponseUtils } from '../utils/responseUtils';
import {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema,
  patientIdSchema,
  exportPatientSchema,
  type CreatePatientData,
  type UpdatePatientData,
  type PatientQueryParams,
} from '../validations/patientValidation';

// Interface for authenticated request (from auth middleware)
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
    name: string;
    roleId: number;
    roleName: string;
    hospitalCode?: string; // สำหรับ USER role
  };
}

// ========== หลัก CRUD OPERATIONS ==========

/**
 * ✅ ENHANCED: Get patients with comprehensive filtering, search, and pagination
 * GET /api/patients
 * รวม: search + filter + pagination + sorting ในที่เดียว
 */
export const getPatients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate query parameters
    const validationResult = patientQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return ResponseUtils.validationError(res, 'Invalid query parameters', errors);
    }

    const queryParams = validationResult.data;

    // 🚀 Create hospital access context for USER role scoping
    const context = {
      userRole: req.user.roleName,
      userHospitalCode: req.user.hospitalCode,
      canAccessAllHospitals: ['ADMIN', 'SUPERUSER'].includes(req.user.roleName),
      permissions: [], // จะเพิ่มใน version ถัดไป
    };

    const result = await patientService.getPatients(queryParams, context);

    return ResponseUtils.success(res, 'Patients retrieved successfully', result);

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving patients',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get patient by ID
 * GET /api/patients/:id
 */
export const getPatientById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate patient ID
    const validationResult = patientIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { id } = validationResult.data;

    // 🚀 Create hospital access context
    const context = {
      userRole: req.user.roleName,
      userHospitalCode: req.user.hospitalCode,
      canAccessAllHospitals: ['ADMIN', 'SUPERUSER'].includes(req.user.roleName),
      permissions: [],
    };

    const patient = await patientService.getPatientById(id, context);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found or access denied`,
      });
    }

    res.json({
      success: true,
      message: 'Patient retrieved successfully',
      data: patient,
    });

  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving patient',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create new patient record
 * POST /api/patients
 */
export const createPatient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validationResult = createPatientSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const patientData = validationResult.data;
    const createdBy = req.user.username;

    // 🚀 Create hospital access context for USER role validation
    const context = {
      userRole: req.user.roleName,
      userHospitalCode: req.user.hospitalCode,
      canAccessAllHospitals: ['ADMIN', 'SUPERUSER'].includes(req.user.roleName),
      permissions: [],
    };

    const newPatient = await patientService.createPatient(patientData, createdBy, context);

    res.status(201).json({
      success: true,
      message: 'Patient record created successfully',
      data: newPatient,
    });

  } catch (error) {
    console.error('Create patient error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          code: 'INVALID_REFERENCE',
        });
      }
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          code: 'ACCESS_DENIED',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating patient record',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update patient record
 * PUT /api/patients/:id
 */
export const updatePatient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate patient ID
    const idValidation = patientIdSchema.safeParse({ id: req.params.id });
    
    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID',
        errors: idValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Validate request body
    const dataValidation = updatePatientSchema.safeParse(req.body);
    
    if (!dataValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: dataValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { id } = idValidation.data;
    const updateData = dataValidation.data;
    const updatedBy = req.user.username;

    // 🚀 Create hospital access context
    const context = {
      userRole: req.user.roleName,
      userHospitalCode: req.user.hospitalCode,
      canAccessAllHospitals: ['ADMIN', 'SUPERUSER'].includes(req.user.roleName),
      permissions: [],
    };

    const updatedPatient = await patientService.updatePatient(id, updateData, updatedBy, context);

    res.json({
      success: true,
      message: 'Patient record updated successfully',
      data: updatedPatient,
    });

  } catch (error) {
    console.error('Update patient error:', error);
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
          code: 'PATIENT_NOT_FOUND',
        });
      }
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          code: 'ACCESS_DENIED',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating patient record',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete patient (soft delete)
 * DELETE /api/patients/:id
 */
export const deletePatient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate patient ID
    const validationResult = patientIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { id } = validationResult.data;
    const deletedBy = req.user.username;

    // 🚀 Create hospital access context
    const context = {
      userRole: req.user.roleName,
      userHospitalCode: req.user.hospitalCode,
      canAccessAllHospitals: ['ADMIN', 'SUPERUSER'].includes(req.user.roleName),
      permissions: [],
    };

    await patientService.deletePatient(id, deletedBy, context);

    res.json({
      success: true,
      message: 'Patient record deleted successfully',
      data: { id, deletedBy, deletedAt: new Date().toISOString() },
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
          code: 'PATIENT_NOT_FOUND',
        });
      }
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          code: 'ACCESS_DENIED',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting patient record',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ========== IMPORT/EXPORT OPERATIONS ==========

/**
 * ✅ NEW: Export patients to Excel/CSV
 * POST /api/patients/export
 */
export const exportPatients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate export parameters
    const validationResult = exportPatientSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export parameters',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const exportParams = validationResult.data;

    // 🚀 Create hospital access context for filtering
    const context = {
      userRole: req.user.roleName,
      userHospitalCode: req.user.hospitalCode,
      canAccessAllHospitals: ['ADMIN', 'SUPERUSER'].includes(req.user.roleName),
      permissions: [],
    };

    const fileBuffer = await patientService.exportPatients(exportParams, context);

    // Set appropriate headers for file download
    const filename = `patients-export-${new Date().toISOString().split('T')[0]}.${exportParams.format}`;
    const contentType = exportParams.format === 'csv' 
      ? 'text/csv' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('*** DETAILED EXPORT ERROR:', error); // ✅ เพิ่มบรรทัดนี้
    res.status(500).json({
      success: false,
      message: 'Internal server error while exporting patients',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * ✅ NEW: Import patients from Excel/CSV
 * POST /api/patients/import
 */
export const importPatients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        code: 'NO_FILE_UPLOADED',
      });
    }

    const file = req.file;
    const createdBy = req.user.username;

    // 🚀 Create hospital access context for validation
    const context = {
      userRole: req.user.roleName,
      userHospitalCode: req.user.hospitalCode,
      canAccessAllHospitals: ['ADMIN', 'SUPERUSER'].includes(req.user.roleName),
      permissions: [],
    };

    const result = await patientService.importPatients(file, createdBy, context);

    res.status(201).json({
      success: true,
      message: 'Patients imported successfully',
      data: result,
    });

  } catch (error) {
    console.error('Import patients error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid file format')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          code: 'INVALID_FILE_FORMAT',
        });
      }
      
      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          code: 'ACCESS_DENIED',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while importing patients',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * ✅ NEW: Get import template
 * GET /api/patients/template
 */
export const getImportTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 getImportTemplate called');
    console.log('🔍 Query params:', req.query);
    console.log('🔍 User:', req.user);

    const format = (req.query.format as string) || 'excel';
    console.log('🔍 Format:', format);
    
    if (!['excel', 'csv'].includes(format)) {
      console.log('❌ Invalid format:', format);
      return res.status(400).json({
        success: false,
        message: 'Format must be either "excel" or "csv"',
        code: 'INVALID_FORMAT'
      });
    }

    console.log('🔍 Calling patientService.generateImportTemplate...');
    const templateBuffer = await patientService.generateImportTemplate(format as 'excel' | 'csv');
    console.log('✅ Template generated, size:', templateBuffer.length);

    // Set appropriate headers for file download
    const filename = `patients-import-template.${format === 'excel' ? 'xlsx' : 'csv'}`;
    const contentType = format === 'csv' 
      ? 'text/csv' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    console.log('📤 Sending file:', { filename, contentType, size: templateBuffer.length });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(templateBuffer);

  } catch (error) {
    console.error('❌ Get import template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

};