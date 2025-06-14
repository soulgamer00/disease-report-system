// backend/src/validations/userValidation.ts

import { z } from 'zod';

// ✅ SECURITY: Strong password validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// ✅ SECURITY: Username validation (prevent injection)
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be less than 50 characters')
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores')
  .refine(username => !['admin', 'root', 'superuser', 'administrator', 'system'].includes(username.toLowerCase()), 
    'Username cannot be a reserved system name');

// ✅ SECURITY: Name validation (prevent XSS)
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[\u0E00-\u0E7Fa-zA-Z\s'-]+$/, 'Name contains invalid characters')
  .refine(name => !/<[^>]*>/.test(name), 'Name cannot contain HTML tags');

// ✅ SECURITY: Role validation (prevent privilege escalation)
const roleIdSchema = z
  .number()
  .int('Role ID must be an integer')
  .min(1, 'Role ID must be positive')
  .max(999, 'Invalid role ID');

// ✅ SECURITY: Hospital code validation
const hospitalCodeSchema = z
  .string()
  .length(5, 'Hospital code must be exactly 5 characters')
  .regex(/^[A-Z0-9]{5}$/, 'Hospital code must be 5 alphanumeric uppercase characters')
  .optional();

// Create User Schema
export const createUserSchema = z.object({
  // Required fields
  username: usernameSchema,
  password: passwordSchema,
  name: nameSchema,
  roleId: roleIdSchema,

  // Optional hospital assignment (for USER role)
  hospitalCode: hospitalCodeSchema,

  // Optional fields
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional(),

  phoneNumber: z
    .string()
    .regex(/^(\+66|0)[0-9]{8,9}$/, 'Invalid Thai phone number format')
    .optional(),

  department: z
    .string()
    .max(100, 'Department must be less than 100 characters')
    .optional(),

  position: z
    .string()
    .max(100, 'Position must be less than 100 characters')
    .optional(),
})
.refine(data => {
  // ✅ SECURITY: USER role MUST have hospital assignment
  if (data.roleId === 3) { // Assuming 3 = USER role
    return data.hospitalCode !== undefined && data.hospitalCode !== null;
  }
  return true;
}, {
  message: 'USER role must be assigned to a hospital',
  path: ['hospitalCode']
});

// Update User Schema (excluding password and username changes)
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  roleId: roleIdSchema.optional(),
  hospitalCode: hospitalCodeSchema,
  
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional(),

  phoneNumber: z
    .string()
    .regex(/^(\+66|0)[0-9]{8,9}$/, 'Invalid Thai phone number format')
    .optional(),

  department: z
    .string()
    .max(100, 'Department must be less than 100 characters')
    .optional(),

  position: z
    .string()
    .max(100, 'Position must be less than 100 characters')
    .optional(),

  isActive: z
    .boolean()
    .optional(),
})
.refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
})
.refine(data => {
  // ✅ SECURITY: USER role MUST have hospital assignment
  if (data.roleId === 3) {
    return data.hospitalCode !== undefined && data.hospitalCode !== null;
  }
  return true;
}, {
  message: 'USER role must be assigned to a hospital',
  path: ['hospitalCode']
});

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),

  newPassword: passwordSchema,

  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),
})
.refine(data => data.newPassword === data.confirmPassword, {
  message: 'New password and confirmation do not match',
  path: ['confirmPassword']
})
.refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

// Reset Password Schema (SUPERUSER only)
export const resetPasswordSchema = z.object({
  userId: z
    .string()
    .uuid('Invalid user ID format'),

  newPassword: passwordSchema,

  confirmPassword: z
    .string()
    .min(1, 'Password confirmation is required'),

  reason: z
    .string()
    .min(10, 'Reset reason must be at least 10 characters')
    .max(500, 'Reset reason must be less than 500 characters'),
})
.refine(data => data.newPassword === data.confirmPassword, {
  message: 'New password and confirmation do not match',
  path: ['confirmPassword']
});

// User Query Schema
export const userQuerySchema = z.object({
  // Pagination
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine(n => n >= 1, 'Page must be at least 1')
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100')
    .default('20'),

  // Search & Filters
  search: z
    .string()
    .max(255, 'Search term too long')
    .regex(/^[a-zA-Z0-9\u0E00-\u0E7F\s._-]*$/, 'Invalid characters in search term')
    .optional(),

  roleId: z
    .string()
    .regex(/^\d+$/, 'Role ID must be a number')
    .transform(Number)
    .optional(),

  hospitalCode: z
    .string()
    .length(5, 'Hospital code must be 5 characters')
    .regex(/^[A-Z0-9]{5}$/, 'Invalid hospital code format')
    .optional(),

  isActive: z
    .string()
    .regex(/^(true|false)$/, 'isActive must be true or false')
    .transform(val => val === 'true')
    .optional(),

  department: z
    .string()
    .max(100, 'Department filter too long')
    .optional(),

  // Sorting
  sortBy: z
    .enum(['name', 'username', 'createdAt', 'updatedAt', 'roleName'])
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

// User ID Schema
export const userIdSchema = z.object({
  id: z
    .string()
    .uuid('User ID must be a valid UUID'),
});

// Bulk User Operations Schema
export const bulkUserActionSchema = z.object({
  userIds: z
    .array(z.string().uuid('Invalid user ID format'))
    .min(1, 'At least one user ID is required')
    .max(50, 'Cannot process more than 50 users at once'),

  action: z
    .enum(['activate', 'deactivate', 'delete'])
    .describe('Action to perform on selected users'),

  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be less than 500 characters')
    .optional(),
});

// User Activity Log Schema
export const userActivityLogSchema = z.object({
  userId: z
    .string()
    .uuid('User ID must be a valid UUID')
    .optional(),

  action: z
    .enum(['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'ROLE_CHANGE', 'HOSPITAL_CHANGE'])
    .optional(),

  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),

  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),

  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine(n => n >= 1, 'Page must be at least 1')
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100')
    .default('20'),
});

// ✅ SECURITY: Role assignment validation (prevent privilege escalation)
export const validateRoleAssignment = (
  currentUserRole: string,
  targetRoleId: number,
  targetRoleName: string
): { valid: boolean; message?: string } => {
  // SUPERUSER can assign any role
  if (currentUserRole === 'SUPERUSER') {
    return { valid: true };
  }

  // ADMIN cannot create SUPERUSER accounts
  if (currentUserRole === 'ADMIN' && targetRoleName === 'SUPERUSER') {
    return {
      valid: false,
      message: 'ADMIN users cannot create SUPERUSER accounts'
    };
  }

  // ADMIN can create ADMIN and USER accounts
  if (currentUserRole === 'ADMIN' && ['ADMIN', 'USER'].includes(targetRoleName)) {
    return { valid: true };
  }

  // USER cannot create any accounts
  if (currentUserRole === 'USER') {
    return {
      valid: false,
      message: 'USER role cannot create other user accounts'
    };
  }

  return {
    valid: false,
    message: 'Insufficient permissions for role assignment'
  };
};

// ✅ SECURITY: Hospital access validation
export const validateHospitalAccess = (
  currentUserRole: string,
  currentUserHospitalCode: string | undefined,
  targetHospitalCode: string | undefined
): { valid: boolean; message?: string } => {
  // SUPERUSER can access all hospitals
  if (currentUserRole === 'SUPERUSER') {
    return { valid: true };
  }

  // ADMIN can access all hospitals
  if (currentUserRole === 'ADMIN') {
    return { valid: true };
  }

  // USER can only access their own hospital
  if (currentUserRole === 'USER') {
    if (!currentUserHospitalCode) {
      return {
        valid: false,
        message: 'User is not assigned to any hospital'
      };
    }

    if (targetHospitalCode && targetHospitalCode !== currentUserHospitalCode) {
      return {
        valid: false,
        message: `Access denied: You can only manage users in hospital ${currentUserHospitalCode}`
      };
    }
  }

  return { valid: true };
};

// Export types for TypeScript
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type UserQueryParams = z.infer<typeof userQuerySchema>;
export type UserIdParams = z.infer<typeof userIdSchema>;
export type BulkUserActionData = z.infer<typeof bulkUserActionSchema>;
export type UserActivityLogParams = z.infer<typeof userActivityLogSchema>;