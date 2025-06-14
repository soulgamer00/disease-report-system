// backend/src/routes/patients.ts - ✅ SIMPLIFIED: เหลือเฉพาะฟังก์ชั่นหลัก

import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { uploadPatientFile, handleFileUploadError } from '../middleware/fileUpload';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  exportPatients,
  importPatients,
  getImportTemplate,
} from '../controllers/patientController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ========== หลัก CRUD OPERATIONS ==========

/**
 * GET /api/patients
 * Get paginated list of patients with search and filters
 * ✅ รวม: search, filter by year, hospital, disease, gender, condition
 * Access: All authenticated users (hospital-scoped for USER role)
 */
router.get('/', getPatients);


router.get('/template',
  authorizeRoles('USER', 'ADMIN', 'SUPERUSER'),
  getImportTemplate
);
/**
 * GET /api/patients/:id
 * Get patient by ID
 * Access: All authenticated users (hospital-scoped for USER role)
 */
router.get('/:id', getPatientById);

/**
 * POST /api/patients
 * Create new patient record
 * Access: USER, ADMIN, SUPERUSER (hospital-scoped for USER role)
 */
router.post('/', 
  authorizeRoles( 'ADMIN', 'SUPERUSER'),
  createPatient
);

/**
 * PUT /api/patients/:id
 * Update patient record
 * Access: USER, ADMIN, SUPERUSER (hospital-scoped for USER role)
 */
router.put('/:id',
  authorizeRoles( 'ADMIN', 'SUPERUSER'),
  updatePatient
);

/**
 * DELETE /api/patients/:id
 * Soft delete patient record
 * Access: ADMIN, SUPERUSER only
 */
router.delete('/:id',
  authorizeRoles('ADMIN', 'SUPERUSER'),
  deletePatient
);

// ========== IMPORT/EXPORT OPERATIONS ==========

/**
 * GET /api/patients/template
 * Download import template (Excel/CSV)
 * Access: USER, ADMIN, SUPERUSER
 * NOTE: This must come before /:id route to avoid conflict
 */
router.get('/template',
  authorizeRoles('USER', 'ADMIN', 'SUPERUSER'),
  getImportTemplate
);

/**
 * POST /api/patients/export
 * Export patients to Excel/CSV
 * Access: USER, ADMIN, SUPERUSER (hospital-scoped for USER role)
 */
router.post('/export',
  authorizeRoles('USER', 'ADMIN', 'SUPERUSER'),
  exportPatients
);

/**
 * POST /api/patients/import
 * Import patients from Excel/CSV
 * Access: USER, ADMIN, SUPERUSER (hospital-scoped for USER role)
 */
router.post('/import',
  authorizeRoles('USER', 'ADMIN', 'SUPERUSER'),
  uploadPatientFile.single('file'), // ✅ เพิ่ม file upload middleware
  handleFileUploadError, // ✅ เพิ่ม error handling
  importPatients
);

// ========== ERROR HANDLING ==========

/**
 * Catch-all route for undefined patient endpoints
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Patient API endpoint ${req.method} ${req.originalUrl} not found`,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: {
      'GET': [
        '/api/patients',           // รายการ + กรอง + ค้นหา
        '/api/patients/:id',       // ดูรายละเอียด
        '/api/patients/template',  // ดาวน์โหลด Template
      ],
      'POST': [
        '/api/patients',           // เพิ่มผู้ป่วยใหม่
        '/api/patients/export',    // Export ข้อมูล
        '/api/patients/import',    // Import ข้อมูล
      ],
      'PUT': [
        '/api/patients/:id',       // แก้ไขข้อมูล
      ],
      'DELETE': [
        '/api/patients/:id',       // ลบข้อมูล (ADMIN+)
      ]
    }
  });
});

export default router;