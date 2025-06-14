// backend/src/validations/hospitalValidation.ts - แก้ไขเฉพาะ regex

import { z } from 'zod';

// Create Hospital Schema
export const createHospitalSchema = z.object({
  // ✅ เปลี่ยนแค่ length และ regex
  hospitalCode5Digit: z
    .string()
    .min(5, 'Hospital code must be at least 5 characters')
    .max(9, 'Hospital code must be at most 9 characters')
    .regex(/^[A-Z0-9]{5,9}$/, 'Hospital code must be 5-9 alphanumeric uppercase characters'),

  // ...fields อื่นๆ เหมือนเดิม...
  hospitalName: z
    .string()
    .min(2, 'Hospital name must be at least 2 characters')
    .max(255, 'Hospital name must be less than 255 characters')
    .regex(/^[\u0E00-\u0E7Fa-zA-Z0-9\s\-\(\)\.\,\/]+$/, 'Hospital name contains invalid characters')
    .optional(),

  hospitalCode9eDigit: z
    .string()
    .length(9, 'Hospital code 9E digit must be exactly 9 characters')
    .regex(/^[A-Z0-9]{9}$/, 'Hospital code 9E digit must be 9 alphanumeric uppercase characters')
    .optional(),

  hospitalCode9Digit: z
    .string()
    .length(9, 'Hospital code 9 digit must be exactly 9 characters')
    .regex(/^[A-Z0-9]{9}$/, 'Hospital code 9 digit must be 9 alphanumeric uppercase characters')
    .optional(),

  organizationType: z
    .string()
    .max(255, 'Organization type must be less than 255 characters')
    .optional(),

  healthServiceType: z
    .string()
    .max(255, 'Health service type must be less than 255 characters')
    .optional(),

  affiliation: z
    .string()
    .max(255, 'Affiliation must be less than 255 characters')
    .optional(),

  departmentDivision: z
    .string()
    .max(255, 'Department division must be less than 255 characters')
    .optional(),
});

// Update Hospital Schema (same as create but all fields optional)
export const updateHospitalSchema = createHospitalSchema.partial({
  hospitalCode5Digit: true,
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Hospital Query Schema
export const hospitalQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine((n) => n >= 1, 'Page must be at least 1')
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine((n) => n >= 1 && n <= 100, 'Limit must be between 1 and 100')
    .default('20'),

  search: z
    .string()
    .max(255, 'Search term too long')
    .optional(),

  organizationType: z
    .string()
    .max(255, 'Organization type filter too long')
    .optional(),

  healthServiceType: z
    .string()
    .max(255, 'Health service type filter too long')
    .optional(),

  affiliation: z
    .string()
    .max(255, 'Affiliation filter too long')
    .optional(),

  isActive: z
    .string()
    .regex(/^(true|false)$/, 'isActive must be true or false')
    .transform((val) => val === 'true')
    .optional(),

  sortBy: z
    .enum(['hospitalName', 'hospitalCode5Digit', 'organizationType', 'createdAt', 'updatedAt'])
    .default('hospitalName'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
});

// Hospital ID validation
export const hospitalIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Hospital ID must be a number')
    .transform(Number)
    .refine((n) => n > 0, 'Hospital ID must be positive'),
});

// ✅ เปลี่ยนแค่ length และ regex
export const hospitalCodeSchema = z.object({
  code: z
    .string()
    .min(5, 'Hospital code must be at least 5 characters')
    .max(9, 'Hospital code must be at most 9 characters')
    .regex(/^[A-Z0-9]{5,9}$/, 'Hospital code must be 5-9 alphanumeric uppercase characters'),
});

// ...schemas อื่นๆ เหมือนเดิม...
export const bulkCreateHospitalsSchema = z.object({
  hospitals: z
    .array(createHospitalSchema)
    .min(1, 'At least one hospital is required')
    .max(100, 'Cannot create more than 100 hospitals at once')
    .refine(
      (hospitals) => {
        const codes = hospitals.map(h => h.hospitalCode5Digit);
        return codes.length === new Set(codes).size;
      },
      { message: 'Hospital codes must be unique within the list' }
    ),
});

// ✅ เปลี่ยนแค่ hospital code validation
export const hospitalAssignmentSchema = z.object({
  userId: z
    .string()
    .uuid('User ID must be a valid UUID'),

  hospitalCode: z
    .string()
    .min(5, 'Hospital code must be at least 5 characters')
    .max(9, 'Hospital code must be at most 9 characters')
    .regex(/^[A-Z0-9]{5,9}$/, 'Hospital code must be 5-9 alphanumeric uppercase characters'),
});

// Export types
export type CreateHospitalData = z.infer<typeof createHospitalSchema>;
export type UpdateHospitalData = z.infer<typeof updateHospitalSchema>;
export type HospitalQueryParams = z.infer<typeof hospitalQuerySchema>;
export type HospitalIdParams = z.infer<typeof hospitalIdSchema>;
export type HospitalCodeParams = z.infer<typeof hospitalCodeSchema>;
export type BulkCreateHospitalsData = z.infer<typeof bulkCreateHospitalsSchema>;
export type HospitalAssignmentData = z.infer<typeof hospitalAssignmentSchema>;