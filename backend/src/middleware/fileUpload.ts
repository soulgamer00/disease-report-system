// backend/src/middleware/fileUpload.ts - ✅ NEW: File upload middleware สำหรับ Import

import multer from 'multer';
import { Request } from 'express';

// ✅ SECURITY: File validation
const SUPPORTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
  'application/csv', // .csv alternative
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ✅ Configure multer for memory storage
const storage = multer.memoryStorage();

// ✅ File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
  }
};

// ✅ Create multer instance
export const uploadPatientFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow single file upload
  },
});

// ✅ Error handling middleware for multer errors
export const handleFileUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.',
          code: 'FILE_TOO_LARGE',
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file is allowed.',
          code: 'TOO_MANY_FILES',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          code: 'UNEXPECTED_FILE',
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.',
          code: 'UPLOAD_ERROR',
          error: error.message,
        });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_FILE_TYPE',
      supportedTypes: ['.xlsx', '.xls', '.csv'],
    });
  }

  next(error);
};

// ✅ Utility function to validate uploaded file
export const validateUploadedFile = (file?: Express.Multer.File) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only Excel and CSV files are supported.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  return true;
};

// ✅ Export file validation constants
export const FILE_UPLOAD_CONSTANTS = {
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB: MAX_FILE_SIZE / (1024 * 1024),
  SUPPORTED_EXTENSIONS: ['.xlsx', '.xls', '.csv'],
} as const;