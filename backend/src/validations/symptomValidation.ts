// backend/src/validations/symptomValidation.ts

import { z } from 'zod';

// Create Symptom Schema
export const createSymptomSchema = z.object({
  // Required fields
  diseaseId: z
    .number()
    .int('Disease ID must be an integer')
    .positive('Disease ID must be positive'),

  name: z
    .string()
    .min(2, 'Symptom name must be at least 2 characters')
    .max(255, 'Symptom name must be less than 255 characters')
    .regex(/^[\u0E00-\u0E7Fa-zA-Z\s\-\(\)\.\,]+$/, 'Symptom name contains invalid characters'),
});

// Update Symptom Schema (same as create but all fields optional)
export const updateSymptomSchema = createSymptomSchema.partial({
  diseaseId: true,
  name: true,
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Symptom Query Schema
export const symptomQuerySchema = z.object({
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

  diseaseId: z
    .string()
    .regex(/^\d+$/, 'Disease ID must be a number')
    .transform(Number)
    .optional(),

  isActive: z
    .string()
    .regex(/^(true|false)$/, 'isActive must be true or false')
    .transform((val) => val === 'true')
    .optional(),

  // Sorting
  sortBy: z
    .enum(['name', 'diseaseId', 'createdAt', 'updatedAt'])
    .default('name'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
});

// Symptom ID validation
export const symptomIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Symptom ID must be a number')
    .transform(Number)
    .refine((n) => n > 0, 'Symptom ID must be positive'),
});

// Disease ID validation (for routes like /symptoms/by-disease/:diseaseId)
export const diseaseIdParamSchema = z.object({
  diseaseId: z
    .string()
    .regex(/^\d+$/, 'Disease ID must be a number')
    .transform(Number)
    .refine((n) => n > 0, 'Disease ID must be positive'),
});

// Bulk create symptoms schema
export const bulkCreateSymptomsSchema = z.object({
  diseaseId: z
    .number()
    .int('Disease ID must be an integer')
    .positive('Disease ID must be positive'),

  symptoms: z
    .array(z.object({
      name: z
        .string()
        .min(2, 'Symptom name must be at least 2 characters')
        .max(255, 'Symptom name must be less than 255 characters')
        .regex(/^[\u0E00-\u0E7Fa-zA-Z\s\-\(\)\.\,]+$/, 'Symptom name contains invalid characters'),
    }))
    .min(1, 'At least one symptom is required')
    .max(50, 'Cannot create more than 50 symptoms at once')
    .refine(
      (symptoms) => {
        const names = symptoms.map(s => s.name.toLowerCase());
        return names.length === new Set(names).size;
      },
      { message: 'Symptom names must be unique within the list' }
    ),
});

// Export types for TypeScript
export type CreateSymptomData = z.infer<typeof createSymptomSchema>;
export type UpdateSymptomData = z.infer<typeof updateSymptomSchema>;
export type SymptomQueryParams = z.infer<typeof symptomQuerySchema>;
export type SymptomIdParams = z.infer<typeof symptomIdSchema>;
export type DiseaseIdParams = z.infer<typeof diseaseIdParamSchema>;
export type BulkCreateSymptomsData = z.infer<typeof bulkCreateSymptomsSchema>;