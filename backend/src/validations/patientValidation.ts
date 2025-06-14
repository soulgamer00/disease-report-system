// backend/src/validations/patientValidation.ts - ✅ COMPLETE: ตรงตาม schema ใหม่

import { z } from 'zod';

// ========== BASE VALIDATION HELPERS ==========

const thaiIDCardSchema = z
  .string()
  .regex(/^\d{13}$/, 'ID card must be exactly 13 digits')
  
   


const thaiPhoneSchema = z
  .string()
  .regex(/^(\+66|0)[0-9]{8,9}$/, 'Invalid Thai phone number format');

// Date validation patterns
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((dateStr) => {
    const parsed = new Date(dateStr);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format');

const pastDateSchema = dateStringSchema
  .refine((dateStr) => {
    const parsed = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed <= today;
  }, 'Date cannot be in the future');

// ========== ENUMS ตรงตาม Requirements ==========

const GenderEnum = z.enum(['M', 'F'], {
  errorMap: () => ({ message: 'Gender must be M (ชาย) or F (หญิง)' })
});

const MaritalStatusEnum = z.enum([
  'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER'
], {
  errorMap: () => ({ message: 'Invalid marital status' })
});

const PatientTypeEnum = z.enum(['IPD', 'OPD', 'ACF'], {
  errorMap: () => ({ message: 'Patient type must be IPD, OPD, or ACF' })
});

// ✅ Updated: Thai condition values
const PatientConditionEnum = z.enum([
  'ไม่ทราบ', 'เสียชีวิต', 'หายจากโรคแล้ว', 'ยังรักษาตัวอยู่'
], {
  errorMap: () => ({ message: 'Invalid patient condition' })
});

// ✅ UPDATED: Lab results now freetext instead of enum
const LabResultSchema = z
  .string()
  .min(1, 'Lab result is required')
  .max(100, 'Lab result must be less than 100 characters')
  .trim();

const NS1ResultSchema = z
  .string()
  .min(1, 'NS1 result is required')
  .max(50, 'NS1 result must be less than 50 characters')
  .trim();

const TreatmentAreaEnum = z.enum([
  'เทศบาล', 'อบต.', 'ไม่ทราบ'
], {
  errorMap: () => ({ message: 'Treatment area must be เทศบาล, อบต., or ไม่ทราบ' })
});

const NamePrefixEnum = z.enum([
  'นาย', 'นาง', 'นางสาว', 'เด็กหญิง', 'เด็กชาย'
], {
  errorMap: () => ({ message: 'Invalid name prefix' })
});

// ========== MAIN PATIENT SCHEMAS - ✅ UPDATED: Required Fields ==========

/**
 * ✅ Create Patient Schema - ตรงตาม schema.prisma ใหม่
 */
export const createPatientSchema = z.object({
  // ===== TAB 1: ข้อมูลส่วนตัว (Personal Information) - REQUIRED =====
  idCardCode: thaiIDCardSchema,                                    // ✅ Required
  patientHn: z                                                     // ❌ Optional
    .string()
    .max(20, 'Patient HN must be less than 20 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Patient HN contains invalid characters')
    .optional(),
  namePrefix: NamePrefixEnum,                                      // ✅ Required
  patientName: z                                                   // ✅ Required
    .string()
    .min(2, 'Patient name must be at least 2 characters')
    .max(255, 'Patient name must be less than 255 characters')
    .regex(/^[a-zA-Z\u0E00-\u0E7F\s.'-]+$/, 'Patient name contains invalid characters'),
  gender: GenderEnum,                                              // ✅ Required
  birthday: pastDateSchema,                                        // ✅ Required
  ageAtIllness: z                                                  // ✅ Required
    .number()
    .int('Age must be an integer')
    .min(0, 'Age cannot be negative')
    .max(150, 'Age cannot be more than 150'),
  nationality: z.string().min(2).max(50),                         // ✅ Required
  maritalStatus: MaritalStatusEnum,                                // ✅ Required
  occupation: z.string().min(2).max(255),                         // ✅ Required
  phoneNumber: thaiPhoneSchema,                                    // ✅ Required

  // ===== TAB 2: ที่อยู่ (Address Information) - REQUIRED =====
  // Current Address
  currentHouseNumber: z.string().min(1).max(50),                  // ✅ Required
  currentVillageNumber: z.string().min(1).max(10),                // ✅ Required
  currentRoadName: z.string().min(1).max(255),                    // ✅ Required
  currentProvince: z.string().min(2).max(100),                    // ✅ Required
  currentDistrict: z.string().min(2).max(100),                    // ✅ Required
  currentSubDistrict: z.string().min(2).max(100),                 // ✅ Required

  // Sick Address
  addressSickHouseNumber: z.string().min(1).max(50),              // ✅ Required
  addressSickVillageNumber: z.string().min(1).max(10),            // ✅ Required
  addressSickRoadName: z.string().min(1).max(255),                // ✅ Required
  addressSickProvince: z.string().min(2).max(100),                // ✅ Required
  addressSickDistrict: z.string().min(2).max(100),                // ✅ Required
  addressSickSubDistrict: z.string().min(2).max(100),             // ✅ Required

  // ===== TAB 3: การเจ็บป่วย (Illness Information) - REQUIRED =====
  diseaseId: z                                                     // ✅ Required
    .number()
    .int('Disease ID must be an integer')
    .positive('Disease ID must be positive'),
  symptomsOfDisease: z.string().min(1).max(2000),                 // ✅ Required
  treatmentArea: TreatmentAreaEnum,                                // ✅ Required
  treatmentHospital: z                                             // ✅ Required
    .string()
    .min(2, 'Treatment hospital name must be at least 2 characters')
    .max(255, 'Treatment hospital name must be less than 255 characters'),
  illnessDate: pastDateSchema,                                     // ✅ Required
  treatmentDate: dateStringSchema,                                 // ✅ Required
  diagnosisDate: dateStringSchema,                                 // ✅ Required

  // ===== TAB 4: ผลตรวจและสถานะ (Lab Results & Status) - REQUIRED =====
  labResult: LabResultSchema,                                      // ✅ Required - Now freetext
  ns1Result: NS1ResultSchema,                                      // ✅ Required - Now freetext
  patientType: PatientTypeEnum,                                    // ✅ Required
  patientCondition: PatientConditionEnum,                          // ✅ Required
  deathDate: dateStringSchema.optional(),                          // ❌ Optional (only if died)
  causeOfDeath: z.string().max(1000).optional(),                   // ❌ Optional (only if died)

  // ===== TAB 5: หมายเหตุ (Notes & Additional Info) - REQUIRED =====
  receivingProvince: z.string().min(2).max(100),                  // ✅ Required
  hospitalCode: z                                                  // ✅ Required
    .string()
    .min(5, 'Hospital code must be at least 5 characters')
    .max(50, 'Hospital code must be at most 50 characters')
    .regex(/^[A-Z0-9]{5,50}$/, 'Hospital code must be alphanumeric characters'),
  remarks: z.string().min(1).max(2000),                           // ✅ Required
})
.refine((data) => {
  // Business Logic: Treatment date should not be before illness date
  if (data.treatmentDate && data.illnessDate) {
    return new Date(data.treatmentDate) >= new Date(data.illnessDate);
  }
  return true;
}, {
  message: 'วันที่เริ่มรักษาต้องไม่ก่อนวันที่เจ็บป่วย',
  path: ['treatmentDate']
})
.refine((data) => {
  // Business Logic: Diagnosis date should not be before illness date
  if (data.diagnosisDate && data.illnessDate) {
    return new Date(data.diagnosisDate) >= new Date(data.illnessDate);
  }
  return true;
}, {
  message: 'วันที่วินิจฉัยต้องไม่ก่อนวันที่เจ็บป่วย',
  path: ['diagnosisDate']
})
.refine((data) => {
  // Business Logic: Death date should not be before illness date
  if (data.deathDate && data.illnessDate) {
    return new Date(data.deathDate) >= new Date(data.illnessDate);
  }
  return true;
}, {
  message: 'วันที่เสียชีวิตต้องไม่ก่อนวันที่เจ็บป่วย',
  path: ['deathDate']
})
.refine((data) => {
  // Business Logic: Age validation with birthday
  if (data.birthday && typeof data.ageAtIllness === 'number' && data.illnessDate) {
    const birthYear = new Date(data.birthday).getFullYear();
    const illnessYear = new Date(data.illnessDate).getFullYear();
    const calculatedAge = illnessYear - birthYear;
    // Allow 1 year tolerance for age calculation
    return Math.abs(calculatedAge - data.ageAtIllness) <= 1;
  }
  return true;
}, {
  message: 'อายุไม่สอดคล้องกับวันเดือนปีเกิดและวันที่เจ็บป่วย',
  path: ['ageAtIllness']
})
.refine((data) => {
  // Business Logic: If patient died, must have death date and cause
  if (data.patientCondition === 'เสียชีวิต') {
    return data.deathDate && data.causeOfDeath;
  }
  return true;
}, {
  message: 'หากผู้ป่วยเสียชีวิต ต้องระบุวันที่เสียชีวิตและสาเหตุ',
  path: ['deathDate']
});

/**
 * ✅ Update Patient Schema (all fields are optional)
 */
export const updatePatientSchema = z.object({
  // ===== TAB 1: ข้อมูลส่วนตัว (Personal Information) - OPTIONAL =====
  idCardCode: thaiIDCardSchema.optional(),
  patientHn: z
    .string()
    .max(20, 'Patient HN must be less than 20 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Patient HN contains invalid characters')
    .optional(),
  namePrefix: NamePrefixEnum.optional(),
  patientName: z
    .string()
    .min(2, 'Patient name must be at least 2 characters')
    .max(255, 'Patient name must be less than 255 characters')
    .regex(/^[a-zA-Z\u0E00-\u0E7F\s.'-]+$/, 'Patient name contains invalid characters')
    .optional(),
  gender: GenderEnum.optional(),
  birthday: pastDateSchema.optional(),
  ageAtIllness: z
    .number()
    .int('Age must be an integer')
    .min(0, 'Age cannot be negative')
    .max(150, 'Age cannot be more than 150')
    .optional(),
  nationality: z.string().min(2).max(50).optional(),
  maritalStatus: MaritalStatusEnum.optional(),
  occupation: z.string().min(2).max(255).optional(),
  phoneNumber: thaiPhoneSchema.optional(),

  // ===== TAB 2: ที่อยู่ (Address Information) - OPTIONAL =====
  currentHouseNumber: z.string().min(1).max(50).optional(),
  currentVillageNumber: z.string().min(1).max(10).optional(),
  currentRoadName: z.string().min(1).max(255).optional(),
  currentProvince: z.string().min(2).max(100).optional(),
  currentDistrict: z.string().min(2).max(100).optional(),
  currentSubDistrict: z.string().min(2).max(100).optional(),
  addressSickHouseNumber: z.string().min(1).max(50).optional(),
  addressSickVillageNumber: z.string().min(1).max(10).optional(),
  addressSickRoadName: z.string().min(1).max(255).optional(),
  addressSickProvince: z.string().min(2).max(100).optional(),
  addressSickDistrict: z.string().min(2).max(100).optional(),
  addressSickSubDistrict: z.string().min(2).max(100).optional(),

  // ===== TAB 3: การเจ็บป่วย (Illness Information) - OPTIONAL =====
  diseaseId: z
    .number()
    .int('Disease ID must be an integer')
    .positive('Disease ID must be positive')
    .optional(),
  symptomsOfDisease: z.string().min(1).max(2000).optional(),
  treatmentArea: TreatmentAreaEnum.optional(),
  treatmentHospital: z
    .string()
    .min(2, 'Treatment hospital name must be at least 2 characters')
    .max(255, 'Treatment hospital name must be less than 255 characters')
    .optional(),
  illnessDate: pastDateSchema.optional(),
  treatmentDate: dateStringSchema.optional(),
  diagnosisDate: dateStringSchema.optional(),

  // ===== TAB 4: ผลตรวจและสถานะ (Lab Results & Status) - OPTIONAL =====
  labResult: LabResultSchema.optional(),                           // ✅ UPDATED: Now freetext optional
  ns1Result: NS1ResultSchema.optional(),                           // ✅ UPDATED: Now freetext optional
  patientType: PatientTypeEnum.optional(),
  patientCondition: PatientConditionEnum.optional(),
  deathDate: dateStringSchema.optional(),
  causeOfDeath: z.string().max(1000).optional(),

  // ===== TAB 5: หมายเหตุ (Notes & Additional Info) - OPTIONAL =====
  receivingProvince: z.string().min(2).max(100).optional(),
  hospitalCode: z
    .string()
    .min(5, 'Hospital code must be at least 5 characters')
    .max(50, 'Hospital code must be at most 50 characters')
    .regex(/^[A-Z0-9]{5,50}$/, 'Hospital code must be alphanumeric characters')
    .optional(),
  remarks: z.string().min(1).max(2000).optional(),
  
  // Additional update-only fields
  isActive: z.boolean().optional(),
})
.refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
)
.refine((data) => {
  // Business Logic: Treatment date should not be before illness date
  if (data.treatmentDate && data.illnessDate) {
    return new Date(data.treatmentDate) >= new Date(data.illnessDate);
  }
  return true;
}, {
  message: 'วันที่เริ่มรักษาต้องไม่ก่อนวันที่เจ็บป่วย',
  path: ['treatmentDate']
})
.refine((data) => {
  // Business Logic: Diagnosis date should not be before illness date
  if (data.diagnosisDate && data.illnessDate) {
    return new Date(data.diagnosisDate) >= new Date(data.illnessDate);
  }
  return true;
}, {
  message: 'วันที่วินิจฉัยต้องไม่ก่อนวันที่เจ็บป่วย',
  path: ['diagnosisDate']
})
.refine((data) => {
  // Business Logic: Death date should not be before illness date
  if (data.deathDate && data.illnessDate) {
    return new Date(data.deathDate) >= new Date(data.illnessDate);
  }
  return true;
}, {
  message: 'วันที่เสียชีวิตต้องไม่ก่อนวันที่เจ็บป่วย',
  path: ['deathDate']
})
.refine((data) => {
  // Business Logic: If patient died, must have death date and cause
  if (data.patientCondition === 'เสียชีวิต') {
    return data.deathDate && data.causeOfDeath;
  }
  return true;
}, {
  message: 'หากผู้ป่วยเสียชีวิต ต้องระบุวันที่เสียชีวิตและสาเหตุ',
  path: ['deathDate']
});

// ========== QUERY & EXPORT SCHEMAS (ไม่เปลี่ยนแปลง) ==========

export const patientQuerySchema = z.object({
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
    .regex(/^[a-zA-Z0-9\u0E00-\u0E7F\s._-]*$/, 'Search term contains invalid characters')
    .optional(),

  hospitalCode: z
    .string()
    .min(5, 'Hospital code must be at least 5 characters')
    .max(50, 'Hospital code must be at most 50 characters')
    .optional(),

  treatmentHospital: z
    .string()
    .max(255, 'Treatment hospital name too long')
    .optional(),

  diseaseId: z
    .string()
    .regex(/^\d+$/, 'Disease ID must be a number')
    .transform(Number)
    .optional(),

  gender: GenderEnum.optional(),
  patientCondition: PatientConditionEnum.optional(),

  illnessDateFrom: dateStringSchema.optional(),
  illnessDateTo: dateStringSchema.optional(),

  sortBy: z
    .enum(['createdAt', 'illnessDate', 'patientName', 'updatedAt', 'treatmentHospital'])
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
}).refine(
  (data) => {
    if (data.illnessDateFrom && data.illnessDateTo) {
      return data.illnessDateFrom <= data.illnessDateTo;
    }
    return true;
  },
  {
    message: 'illnessDateFrom must be before or equal to illnessDateTo',
    path: ['illnessDateFrom'],
  }
);

export const exportPatientSchema = z.object({
  format: z.enum(['csv', 'excel'], {
    errorMap: () => ({ message: 'Format must be csv or excel' })
  }),

  filters: z.object({
    search: z.string().max(255).optional(),
    hospitalCode: z.string().min(5).max(50).optional(),
    treatmentHospital: z.string().max(255).optional(),
    diseaseId: z.number().int().positive().optional(),
    gender: GenderEnum.optional(),
    patientCondition: PatientConditionEnum.optional(),
    illnessDateFrom: dateStringSchema.optional(),
    illnessDateTo: dateStringSchema.optional(),
  }).optional(),

  includeHeaders: z.boolean().default(true),
  filename: z
    .string()
    .max(100, 'Filename too long')
    .regex(/^[a-zA-Z0-9\u0E00-\u0E7F._-]+$/, 'Filename contains invalid characters')
    .optional(),
});

export const patientIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Patient ID must be a number')
    .transform(Number)
    .refine((n) => n > 0, 'Patient ID must be positive'),
});

// ========== TYPE EXPORTS ==========

export type CreatePatientData = z.infer<typeof createPatientSchema>;
export type UpdatePatientData = z.infer<typeof updatePatientSchema>;
export type PatientQueryParams = z.infer<typeof patientQuerySchema>;
export type PatientIdParams = z.infer<typeof patientIdSchema>;
export type ExportPatientParams = z.infer<typeof exportPatientSchema>;

// ========== VALIDATION CONSTANTS - ✅ UPDATED ==========

export const PATIENT_FORM_STEPS = [
  { id: 1, title: 'ข้อมูลส่วนตัว', description: 'ข้อมูลพื้นฐานของผู้ป่วย' },
  { id: 2, title: 'ที่อยู่', description: 'ที่อยู่ปัจจุบันและที่อยู่ขณะป่วย' },
  { id: 3, title: 'การเจ็บป่วย', description: 'ข้อมูลการเจ็บป่วยและการรักษา' },
  { id: 4, title: 'ผลตรวจ', description: 'ผลการตรวจและสถานะผู้ป่วย' },
  { id: 5, title: 'หมายเหตุ', description: 'ข้อมูลเพิ่มเติมและหมายเหตุ' }
] as const;

export const REQUIRED_FIELDS_BY_STEP = {
  1: ['idCardCode', 'namePrefix', 'patientName', 'gender', 'birthday', 'ageAtIllness', 'nationality', 'maritalStatus', 'occupation', 'phoneNumber'],
  2: ['currentHouseNumber', 'currentVillageNumber', 'currentRoadName', 'currentProvince', 'currentDistrict', 'currentSubDistrict', 'addressSickHouseNumber', 'addressSickVillageNumber', 'addressSickRoadName', 'addressSickProvince', 'addressSickDistrict', 'addressSickSubDistrict'],
  3: ['diseaseId', 'symptomsOfDisease', 'treatmentArea', 'treatmentHospital', 'illnessDate', 'treatmentDate', 'diagnosisDate'],
  4: ['labResult', 'ns1Result', 'patientType', 'patientCondition'],
  5: ['receivingProvince', 'hospitalCode', 'remarks'],
} as const;

// ✅ Updated constants
export const PATIENT_GENDERS = [
  { value: 'M', label: 'ชาย' },
  { value: 'F', label: 'หญิง' }
] as const;

export const PATIENT_CONDITIONS = [
  { value: 'ไม่ทราบ', label: 'ไม่ทราบ' },
  { value: 'เสียชีวิต', label: 'เสียชีวิต' },
  { value: 'หายจากโรคแล้ว', label: 'หายจากโรคแล้ว' },
  { value: 'ยังรักษาตัวอยู่', label: 'ยังรักษาตัวอยู่' }
] as const;

// ✅ REMOVED: Old enum-based lab results constants
// Replaced with freetext validation

export const TREATMENT_AREAS = [
  { value: 'เทศบาล', label: 'เทศบาล' },
  { value: 'อบต.', label: 'อบต.' },
  { value: 'ไม่ทราบ', label: 'ไม่ทราบ' }
] as const;

export const NAME_PREFIXES = [
  { value: 'นาย', label: 'นาย' },
  { value: 'นาง', label: 'นาง' },
  { value: 'นางสาว', label: 'นางสาว' },
  { value: 'เด็กหญิง', label: 'เด็กหญิง' },
  { value: 'เด็กชาย', label: 'เด็กชาย' }
] as const;

// ========== VALIDATION HELPER FUNCTIONS ==========

export function validateThaiIdCard(idCard: string): boolean {
  if (!/^\d{13}$/.test(idCard)) return false;

  const digits = idCard.split('').map(Number);
  const checkDigit = digits[12];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (13 - i);
  }

  const remainder = sum % 11;
  const calculatedCheckDigit = remainder < 2 ? (1 - remainder) : (11 - remainder);

  return calculatedCheckDigit === checkDigit;
}

export function validateThaiPhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^(\+66|0)[0-9]{8,9}$/;
  return phoneRegex.test(phoneNumber);
}

// ✅ UPDATED: Lab result validation helpers
export function validateLabResult(labResult: string): boolean {
  return labResult.trim().length >= 1 && labResult.trim().length <= 100;
}

export function validateNS1Result(ns1Result: string): boolean {
  return ns1Result.trim().length >= 1 && ns1Result.trim().length <= 50;
}

export function validateFormStep(step: number, data: Partial<CreatePatientData>): {
  isValid: boolean;
  errors: Record<string, string>;
  canProceed: boolean;
} {
  const errors: Record<string, string> = {};
  const requiredFields = REQUIRED_FIELDS_BY_STEP[step as keyof typeof REQUIRED_FIELDS_BY_STEP] || [];

  // Check required fields
  requiredFields.forEach(field => {
    if (!data[field as keyof CreatePatientData]) {
      errors[field] = `${field} is required`;
    }
  });

  // Additional validations
  if (step === 1 && data.idCardCode && !validateThaiIdCard(data.idCardCode)) {
    errors.idCardCode = 'Invalid Thai ID card format';
  }

  if (step === 1 && data.phoneNumber && !validateThaiPhoneNumber(data.phoneNumber)) {
    errors.phoneNumber = 'Invalid Thai phone number format';
  }

  // ✅ UPDATED: Lab result validation for step 4
  if (step === 4) {
    if (data.labResult && !validateLabResult(data.labResult)) {
      errors.labResult = 'Lab result must be between 1 and 100 characters';
    }
    
    if (data.ns1Result && !validateNS1Result(data.ns1Result)) {
      errors.ns1Result = 'NS1 result must be between 1 and 50 characters';
    }
    
    if (data.patientCondition === 'เสียชีวิต' && !data.deathDate) {
      errors.deathDate = 'Death date is required when patient died';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    canProceed: Object.keys(errors).length === 0
  };
}