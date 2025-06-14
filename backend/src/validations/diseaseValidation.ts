// backend/src/validations/diseaseValidation.ts

import { z } from 'zod';

// Create Disease Schema
export const createDiseaseSchema = z.object({
  // Required fields
  thaiName: z
    .string()
    .min(2, 'Thai name must be at least 2 characters')
    .max(100, 'Thai name must be less than 100 characters')
    .regex(/^[\u0E00-\u0E7F\s\-\(\)\.]+$/, 'Thai name contains invalid characters'),

  // Optional fields
  engName: z
    .string()
    .min(2, 'English name must be at least 2 characters')
    .max(100, 'English name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-\(\)\.]+$/, 'English name contains invalid characters')
    .optional(),

  daName: z
    .string()
    .max(25, 'DA name must be less than 25 characters')
    .optional(),

  details: z
    .string()
    .max(1000, 'Details must be less than 1000 characters')
    .optional(),

  imageUrl: z
    .string()
    .url('Image URL must be a valid URL')
    .max(255, 'Image URL must be less than 255 characters')
    .optional(),
});

// Update Disease Schema (same as create but all fields optional)
export const updateDiseaseSchema = createDiseaseSchema.partial({
  thaiName: true,
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Disease Query Schema
export const diseaseQuerySchema = z.object({
  // Pagination
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

  // Search & Filters
  search: z
    .string()
    .max(255, 'Search term too long')
    .optional(),

  isActive: z
    .string()
    .regex(/^(true|false)$/, 'isActive must be true or false')
    .transform((val) => val === 'true')
    .optional(),

  // Sorting
  sortBy: z
    .enum(['thaiName', 'engName', 'createdAt', 'updatedAt'])
    .default('thaiName'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
});

// Disease ID validation
export const diseaseIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Disease ID must be a number')
    .transform(Number)
    .refine((n) => n > 0, 'Disease ID must be positive'),
});

// Export types for TypeScript
export type CreateDiseaseData = z.infer<typeof createDiseaseSchema>;
export type UpdateDiseaseData = z.infer<typeof updateDiseaseSchema>;
export type DiseaseQueryParams = z.infer<typeof diseaseQuerySchema>;
export type DiseaseIdParams = z.infer<typeof diseaseIdSchema>;