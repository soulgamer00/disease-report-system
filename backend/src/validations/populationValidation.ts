// backend/src/validations/populationValidation.ts

import { z } from 'zod';
import { DateUtils } from '../utils/dateUtils';

// Create Population Schema
export const createPopulationSchema = z.object({
  year: z
    .number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(DateUtils.getCurrentYear() + 1, 'Year cannot be more than 1 year in the future'),

  population: z
    .number()
    .int('Population must be an integer')
    .min(1, 'Population must be at least 1')
    .max(100000000, 'Population cannot exceed 100 million'),

  hospitalCode: z
    .string()
    .min(5, 'Hospital code must be at least 5 characters')
    .max(10, 'Hospital code must be at most 10 characters')  // ✅ รองรับ 5-10 ตัว
    .regex(/^[A-Z0-9]{5,10}$/, 'Hospital code must be 5-10 alphanumeric characters'),
});

// Update Population Schema
export const updatePopulationSchema = createPopulationSchema.partial({
  year: true,
  hospitalCode: true,
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Population Query Schema
export const populationQuerySchema = z.object({
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

  // Filters
  year: z
    .string()
    .regex(/^\d{4}$/, 'Year must be a 4-digit number')
    .transform(Number)
    .optional(),

  hospitalCode: z
    .string()
    .length(5, 'Hospital code must be 5 characters')
    .optional(),

  // Population range filters
  minPopulation: z
    .string()
    .regex(/^\d+$/, 'Minimum population must be a number')
    .transform(Number)
    .optional(),

  maxPopulation: z
    .string()
    .regex(/^\d+$/, 'Maximum population must be a number')
    .transform(Number)
    .optional(),

  // Sorting
  sortBy: z
    .enum(['year', 'population', 'hospitalCode', 'createdAt'])
    .default('year'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
}).refine(
  (data) => {
    if (data.minPopulation && data.maxPopulation) {
      return data.minPopulation <= data.maxPopulation;
    }
    return true;
  },
  {
    message: 'Minimum population must be less than or equal to maximum population',
    path: ['minPopulation'],
  }
);

// Population ID Schema
export const populationIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Population ID must be a number')
    .transform(Number)
    .refine((n) => n > 0, 'Population ID must be positive'),
});

// Incidence Rate Calculation Schema
export const incidenceRateSchema = z.object({
  hospitalCode: z
    .string()
    .length(5, 'Hospital code must be 5 characters')
    .optional(),

  year: z
    .number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(DateUtils.getCurrentYear(), 'Year cannot be in the future'),

  diseaseId: z
    .number()
    .int('Disease ID must be an integer')
    .positive('Disease ID must be positive')
    .optional(),

  per: z
    .number()
    .positive('Per value must be positive')
    .default(100000), // per 100,000 population
});

// Export types
export type CreatePopulationData = z.infer<typeof createPopulationSchema>;
export type UpdatePopulationData = z.infer<typeof updatePopulationSchema>;
export type PopulationQueryParams = z.infer<typeof populationQuerySchema>;
export type PopulationIdParams = z.infer<typeof populationIdSchema>;
export type IncidenceRateParams = z.infer<typeof incidenceRateSchema>;