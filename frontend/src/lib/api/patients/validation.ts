// src/lib/api/patients/validation.ts
// ✅ SECURITY: Fixed Patient validation schemas with Zod

import { z } from 'zod';

// ===== Base Validation Schemas =====

// ✅ SECURITY: Strong ID card validation (Thai National ID)
const idCardSchema = z
  .string()
  .regex(/^\d{13}$/, 'รหัสบัตรประชาชนต้องเป็นตัวเลข 13 หลัก')
  .refine((idCard) => {
    // Thai ID card checksum validation
    if (idCard.length !== 13) return false;

    const digits = idCard.split('').map(Number);
    const checkDigit = digits[12];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (13 - i);
    }

    const remainder = sum % 11;
    const calculatedCheckDigit = remainder < 2 ? (1 - remainder) : (11 - remainder);

    return calculatedCheckDigit === checkDigit;
  }, 'รหัสบัตรประชาชนไม่ถูกต้อง')
  .optional();

// ✅ SECURITY: Patient name validation (prevent XSS)
const patientNameSchema = z
  .string()
  .min(2, 'ชื่อผู้ป่วยต้องมีอย่างน้อย 2 ตัวอักษร')
  .max(255, 'ชื่อผู้ป่วยต้องไม่เกิน 255 ตัวอักษร')
  .regex(/^[\u0E00-\u0E7Fa-zA-Z\s.-]+$/, 'ชื่อมีตัวอักษรที่ไม่อนุญาต')
  .refine(name => !/<[^>]*>/.test(name), 'ชื่อไม่สามารถมี HTML tags');

// ✅ SECURITY: Phone number validation (Thai format)
const phoneNumberSchema = z
  .string()
  .regex(/^(\+66|0)[0-9]{8,9}$/, 'หมายเลขโทรศัพท์ไม่ถูกต้อง (ต้องเป็นเลขไทย)')
  .optional();

// ✅ SECURITY: Hospital code validation
const hospitalCodeSchema = z
  .string()
  .length(5, 'รหัสโรงพยาบาลต้องเป็น 5 ตัวอักษร')
  .regex(/^[A-Z0-9]{5}$/, 'รหัสโรงพยาบาลต้องเป็นตัวอักษรพิมพ์ใหญ่และตัวเลข');

// ✅ SECURITY: Disease ID validation
const diseaseIdSchema = z
  .number()
  .int('รหัสโรคต้องเป็นจำนวนเต็ม')
  .min(1, 'รหัสโรคต้องมากกว่า 0');

// Date validation (ISO format YYYY-MM-DD)
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD')
  .refine((dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
  }, 'วันที่ไม่ถูกต้อง');

// Optional date schema
const optionalDateSchema = dateSchema.optional();

// Age validation
const ageSchema = z
  .number()
  .int('อายุต้องเป็นจำนวนเต็ม')
  .min(0, 'อายุไม่สามารถติดลบ')
  .max(150, 'อายุไม่สามารถเกิน 150 ปี')
  .optional();

// ===== Enum Validations =====

const genderSchema = z
  .enum(['M', 'F', 'OTHER'], {
    errorMap: () => ({ message: 'เพศต้องเป็น M (ชาย), F (หญิง), หรือ OTHER (อื่นๆ)' })
  })
  .optional();

const maritalStatusSchema = z
  .enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN'], {
    errorMap: () => ({ message: 'สถานภาพสมรสไม่ถูกต้อง' })
  })
  .optional();

const patientTypeSchema = z
  .enum(['IPD', 'OPD', 'ACF'], {
    errorMap: () => ({ message: 'ประเภทผู้ป่วยต้องเป็น IPD, OPD, หรือ ACF' })
  })
  .optional();

const patientConditionSchema = z
  .enum(['STABLE', 'CRITICAL', 'RECOVERING', 'DISCHARGED', 'DECEASED', 'UNKNOWN'], {
    errorMap: () => ({ message: 'สภาพผู้ป่วยไม่ถูกต้อง' })
  })
  .optional();

const labResultSchema = z
  .enum(['POSITIVE', 'NEGATIVE', 'PENDING', 'INCONCLUSIVE'], {
    errorMap: () => ({ message: 'ผลตรวจไม่ถูกต้อง' })
  })
  .optional();

// ===== Address Validation Schemas =====

const addressComponentSchema = z
  .string()
  .max(100, 'ข้อมูลที่อยู่แต่ละส่วนต้องไม่เกิน 100 ตัวอักษร')
  .optional();

const provinceSchema = z
  .string()
  .max(100, 'ชื่อจังหวัดต้องไม่เกิน 100 ตัวอักษร')
  .optional();

// ===== Create Patient Schema =====
export const createPatientSchema = z.object({
  // Personal Information (Required fields)
  patientName: patientNameSchema,
  diseaseId: diseaseIdSchema,
  hospitalCode: hospitalCodeSchema,
  illnessDate: dateSchema,

  // Personal Information (Optional)
  idCardCode: idCardSchema,
  patientHn: z.string().max(20, 'เลข HN ต้องไม่เกิน 20 ตัวอักษร').optional(),
  namePrefix: z.string().max(10, 'คำนำหน้าต้องไม่เกิน 10 ตัวอักษร').optional(),
  gender: genderSchema,
  birthday: optionalDateSchema,
  ageAtIllness: ageSchema,
  maritalStatus: maritalStatusSchema,
  nationality: z.string().max(50, 'สัญชาติต้องไม่เกิน 50 ตัวอักษร').optional(),
  occupation: z.string().max(255, 'อาชีพต้องไม่เกิน 255 ตัวอักษร').optional(),
  phoneNumber: phoneNumberSchema,

  // Current Address
  currentHouseNumber: addressComponentSchema,
  currentVillageNumber: z.string().max(10, 'หมู่บ้านต้องไม่เกิน 10 ตัวอักษร').optional(),
  currentRoadName: addressComponentSchema,
  currentProvince: provinceSchema,
  currentDistrict: addressComponentSchema,
  currentSubDistrict: addressComponentSchema,

  // Sick Address
  addressSickHouseNumber: addressComponentSchema,
  addressSickVillageNumber: z.string().max(10, 'หมู่บ้านต้องไม่เกิน 10 ตัวอักษร').optional(),
  addressSickRoadName: addressComponentSchema,
  addressSickProvince: provinceSchema,
  addressSickDistrict: addressComponentSchema,
  addressSickSubDistrict: addressComponentSchema,

  // Medical Information
  symptomsOfDisease: z.string().max(2000, 'อาการต้องไม่เกิน 2000 ตัวอักษร').optional(),
  treatmentArea: addressComponentSchema,
  treatmentHospital: z.string().max(255, 'โรงพยาบาลที่รักษาต้องไม่เกิน 255 ตัวอักษร').optional(),

  // Medical Timeline
  treatmentDate: optionalDateSchema,
  diagnosisDate: optionalDateSchema,
  deathDate: optionalDateSchema,

  // Lab Results & Status
  labResult: labResultSchema,
  ns1Result: z.string().max(50, 'ผล NS1 ต้องไม่เกิน 50 ตัวอักษร').optional(),
  patientType: patientTypeSchema,
  patientCondition: patientConditionSchema,
  causeOfDeath: z.string().max(500, 'สาเหตุการเสียชีวิตต้องไม่เกิน 500 ตัวอักษร').optional(),

  // Additional Information
  receivingProvince: provinceSchema,
  remarks: z.string().max(2000, 'หมายเหตุต้องไม่เกิน 2000 ตัวอักษร').optional(),
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
  // Business Logic: If patient died, must have death date
  if (data.patientCondition === 'DECEASED' && !data.deathDate) {
    return false;
  }
  return true;
}, {
  message: 'หากผู้ป่วยเสียชีวิต ต้องระบุวันที่เสียชีวิต',
  path: ['deathDate']
});

// ===== Update Patient Schema =====
export const updatePatientSchema = z.object({
  // All fields optional for updates, but same validation rules
  patientName: patientNameSchema.optional(),
  diseaseId: diseaseIdSchema.optional(),
  hospitalCode: hospitalCodeSchema.optional(),
  illnessDate: optionalDateSchema,

  idCardCode: idCardSchema,
  patientHn: z.string().max(20, 'เลข HN ต้องไม่เกิน 20 ตัวอักษร').optional(),
  namePrefix: z.string().max(10, 'คำนำหน้าต้องไม่เกิน 10 ตัวอักษร').optional(),
  gender: genderSchema,
  birthday: optionalDateSchema,
  ageAtIllness: ageSchema,
  maritalStatus: maritalStatusSchema,
  nationality: z.string().max(50, 'สัญชาติต้องไม่เกิน 50 ตัวอักษร').optional(),
  occupation: z.string().max(255, 'อาชีพต้องไม่เกิน 255 ตัวอักษร').optional(),
  phoneNumber: phoneNumberSchema,

  currentHouseNumber: addressComponentSchema,
  currentVillageNumber: z.string().max(10, 'หมู่บ้านต้องไม่เกิน 10 ตัวอักษร').optional(),
  currentRoadName: addressComponentSchema,
  currentProvince: provinceSchema,
  currentDistrict: addressComponentSchema,
  currentSubDistrict: addressComponentSchema,

  addressSickHouseNumber: addressComponentSchema,
  addressSickVillageNumber: z.string().max(10, 'หมู่บ้านต้องไม่เกิน 10 ตัวอักษร').optional(),
  addressSickRoadName: addressComponentSchema,
  addressSickProvince: provinceSchema,
  addressSickDistrict: addressComponentSchema,
  addressSickSubDistrict: addressComponentSchema,

  symptomsOfDisease: z.string().max(2000, 'อาการต้องไม่เกิน 2000 ตัวอักษร').optional(),
  treatmentArea: addressComponentSchema,
  treatmentHospital: z.string().max(255, 'โรงพยาบาลที่รักษาต้องไม่เกิน 255 ตัวอักษร').optional(),

  treatmentDate: optionalDateSchema,
  diagnosisDate: optionalDateSchema,
  deathDate: optionalDateSchema,

  labResult: labResultSchema,
  ns1Result: z.string().max(50, 'ผล NS1 ต้องไม่เกิน 50 ตัวอักษร').optional(),
  patientType: patientTypeSchema,
  patientCondition: patientConditionSchema,
  causeOfDeath: z.string().max(500, 'สาเหตุการเสียชีวิตต้องไม่เกิน 500 ตัวอักษร').optional(),

  receivingProvince: provinceSchema,
  remarks: z.string().max(2000, 'หมายเหตุต้องไม่เกิน 2000 ตัวอักษร').optional(),

  isActive: z.boolean().optional(),
})
.refine(data => Object.keys(data).length > 0, {
  message: 'ต้องมีอย่างน้อย 1 ฟิลด์สำหรับการอัปเดต'
})
.refine((data) => {
  if (data.treatmentDate && data.illnessDate) {
    return new Date(data.treatmentDate) >= new Date(data.illnessDate);
  }
  return true;
}, { 
  message: 'วันที่เริ่มรักษาต้องไม่ก่อนวันที่เจ็บป่วย', 
  path: ['treatmentDate'] 
})
.refine((data) => {
  if (data.diagnosisDate && data.illnessDate) {
    return new Date(data.diagnosisDate) >= new Date(data.illnessDate);
  }
  return true;
}, { 
  message: 'วันที่วินิจฉัยต้องไม่ก่อนวันที่เจ็บป่วย', 
  path: ['diagnosisDate'] 
})
.refine((data) => {
  if (data.deathDate && data.illnessDate) {
    return new Date(data.deathDate) >= new Date(data.illnessDate);
  }
  return true;
}, { 
  message: 'วันที่เสียชีวิตต้องไม่ก่อนวันที่เจ็บป่วย', 
  path: ['deathDate'] 
});

// ===== Query Parameters Schema =====
export const patientQuerySchema = z.object({
  // Pagination
  page: z
    .string()
    .regex(/^\d+$/, 'หน้าต้องเป็นตัวเลข')
    .transform(Number)
    .refine(n => n >= 1, 'หน้าต้องมากกว่าหรือเท่ากับ 1')
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'จำนวนรายการต้องเป็นตัวเลข')
    .transform(Number)
    .refine(n => n >= 1 && n <= 100, 'จำนวนรายการต้องอยู่ระหว่าง 1-100')
    .default('20'),

  // Search & Filters
  search: z
    .string()
    .max(255, 'คำค้นหาต้องไม่เกิน 255 ตัวอักษร')
    .regex(/^[a-zA-Z0-9\u0E00-\u0E7F\s._-]*$/, 'คำค้นหามีตัวอักษรที่ไม่อนุญาต')
    .optional(),

  diseaseId: z
    .string()
    .regex(/^\d+$/, 'รหัสโรคต้องเป็นตัวเลข')
    .transform(Number)
    .optional(),

  hospitalCode: hospitalCodeSchema.optional(),
  gender: genderSchema,
  patientCondition: patientConditionSchema,
  patientType: patientTypeSchema,

  // Date range filters
  illnessDateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่เริ่มต้นต้องอยู่ในรูปแบบ YYYY-MM-DD')
    .optional(),

  illnessDateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่สิ้นสุดต้องอยู่ในรูปแบบ YYYY-MM-DD')
    .optional(),

  // Age range filters
  ageFrom: z
    .string()
    .regex(/^\d+$/, 'อายุขั้นต่ำต้องเป็นตัวเลข')
    .transform(Number)
    .refine(n => n >= 0 && n <= 150, 'อายุต้องอยู่ระหว่าง 0-150')
    .optional(),

  ageTo: z
    .string()
    .regex(/^\d+$/, 'อายุสูงสุดต้องเป็นตัวเลข')
    .transform(Number)
    .refine(n => n >= 0 && n <= 150, 'อายุต้องอยู่ระหว่าง 0-150')
    .optional(),

  province: provinceSchema,

  isActive: z
    .string()
    .regex(/^(true|false)$/, 'สถานะต้องเป็น true หรือ false')
    .transform(val => val === 'true')
    .optional(),

  // Sorting
  sortBy: z
    .enum(['patientName', 'illnessDate', 'createdAt', 'updatedAt', 'ageAtIllness'])
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
})
.refine((data) => {
  // Date range validation
  if (data.illnessDateFrom && data.illnessDateTo) {
    return new Date(data.illnessDateFrom) <= new Date(data.illnessDateTo);
  }
  return true;
}, {
  message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด',
  path: ['illnessDateTo']
})
.refine((data) => {
  // Age range validation
  if (data.ageFrom && data.ageTo) {
    return data.ageFrom <= data.ageTo;
  }
  return true;
}, {
  message: 'อายุขั้นต่ำต้องไม่มากกว่าอายุสูงสุด',
  path: ['ageTo']
});

// ===== Patient ID Schema =====
export const patientIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'รหัสผู้ป่วยต้องเป็นตัวเลข')
    .transform(Number)
    .refine(n => n > 0, 'รหัสผู้ป่วยต้องมากกว่า 0'),
});

// ===== Search Schema =====
export const patientSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'คำค้นหาต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(100, 'คำค้นหาต้องไม่เกิน 100 ตัวอักษร')
    .regex(/^[a-zA-Z0-9\u0E00-\u0E7F\s._-]*$/, 'คำค้นหามีตัวอักษรที่ไม่อนุญาต'),

  limit: z
    .string()
    .regex(/^\d+$/, 'จำนวนผลลัพธ์ต้องเป็นตัวเลข')
    .transform(Number)
    .refine(n => n >= 1 && n <= 50, 'จำนวนผลลัพธ์ต้องอยู่ระหว่าง 1-50')
    .default('10'),

  hospitalCode: hospitalCodeSchema.optional(),
  diseaseId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// ===== Export Types =====
export type CreatePatientData = z.infer<typeof createPatientSchema>;
export type UpdatePatientData = z.infer<typeof updatePatientSchema>;
export type PatientQueryParams = z.infer<typeof patientQuerySchema>;
export type PatientSearchParams = z.infer<typeof patientSearchSchema>;
export type PatientIdParams = z.infer<typeof patientIdSchema>;

// ===== Validation Helper Functions =====

/**
 * ✅ SECURITY: Validate Thai National ID card checksum
 */
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

/**
 * ✅ SECURITY: Validate Thai phone number format
 */
export function validateThaiPhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^(\+66|0)[0-9]{8,9}$/;
  return phoneRegex.test(phoneNumber);
}

/**
 * Validate date is not in the future
 */
export function validateNotFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return date <= today;
}

/**
 * Validate age consistency with birthday and illness date
 */
export function validateAgeConsistency(
  birthday: string,
  illnessDate: string,
  ageAtIllness: number
): boolean {
  const birthYear = new Date(birthday).getFullYear();
  const illnessYear = new Date(illnessDate).getFullYear();
  const calculatedAge = illnessYear - birthYear;

  // Allow 1 year tolerance for age calculation
  return Math.abs(calculatedAge - ageAtIllness) <= 1;
}

/**
 * Validate date sequence (e.g., treatment after illness)
 */
export function validateDateSequence(earlierDate: string, laterDate: string): boolean {
  return new Date(earlierDate) <= new Date(laterDate);
}

/**
 * Form step validation for 5-tab patient form
 */
export function validateFormStep(step: number, data: Partial<CreatePatientData>): {
  isValid: boolean;
  errors: Record<string, string>;
  canProceed: boolean;
} {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1: // Personal Information Tab
      if (!data.patientName?.trim()) {
        errors.patientName = 'ชื่อผู้ป่วยจำเป็นต้องระบุ';
      }
      if (!data.diseaseId) {
        errors.diseaseId = 'ต้องเลือกโรค';
      }
      if (!data.illnessDate) {
        errors.illnessDate = 'วันที่เจ็บป่วยจำเป็นต้องระบุ';
      }
      if (data.idCardCode && !validateThaiIdCard(data.idCardCode)) {
        errors.idCardCode = 'รหัสบัตรประชาชนไม่ถูกต้อง';
      }
      break;

    case 2: // Address Tab
      if (data.phoneNumber && !validateThaiPhoneNumber(data.phoneNumber)) {
        errors.phoneNumber = 'หมายเลขโทรศัพท์ไม่ถูกต้อง';
      }
      break;

    case 3: // Illness Tab
      if (!data.hospitalCode?.trim()) {
        errors.hospitalCode = 'ต้องเลือกโรงพยาบาล';
      }
      if (data.treatmentDate && data.illnessDate) {
        if (!validateDateSequence(data.illnessDate, data.treatmentDate)) {
          errors.treatmentDate = 'วันที่เริ่มรักษาต้องไม่ก่อนวันที่เจ็บป่วย';
        }
      }
      break;

    case 4: // Lab Results Tab
      if (data.patientCondition === 'DECEASED' && !data.deathDate) {
        errors.deathDate = 'หากผู้ป่วยเสียชีวิต ต้องระบุวันที่เสียชีวิต';
      }
      break;

    case 5: // Notes Tab
      // Notes are optional
      break;

    default:
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    canProceed: Object.keys(errors).length === 0
  };
}

/**
 * ✅ SECURITY: Sanitize patient input data
 */
export function sanitizePatientData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };

  // Remove HTML tags from text fields
  const textFields = [
    'patientName', 'namePrefix', 'occupation', 'nationality',
    'currentRoadName', 'currentProvince', 'currentDistrict', 'currentSubDistrict',
    'addressSickRoadName', 'addressSickProvince', 'addressSickDistrict', 'addressSickSubDistrict',
    'treatmentArea', 'treatmentHospital', 'symptomsOfDisease', 'causeOfDeath', 'remarks'
  ];

  textFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field]
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();                  // Trim leading/trailing spaces
    }
  });

  // Normalize ID card (remove non-digits)
  if (sanitized.idCardCode && typeof sanitized.idCardCode === 'string') {
    sanitized.idCardCode = sanitized.idCardCode.replace(/\D/g, '');
  }

  // Normalize phone number (remove non-digits except +)
  if (sanitized.phoneNumber && typeof sanitized.phoneNumber === 'string') {
    sanitized.phoneNumber = sanitized.phoneNumber.replace(/[^\d+]/g, '');
  }

  // Normalize hospital code (uppercase)
  if (sanitized.hospitalCode && typeof sanitized.hospitalCode === 'string') {
    sanitized.hospitalCode = sanitized.hospitalCode.toUpperCase().trim();
  }

  return sanitized;
}

/**
 * ✅ BUSINESS LOGIC: Patient data validation rules
 */
export function validatePatientBusinessRules(data: Partial<CreatePatientData>): {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
} {
  const errors: Array<{ field: string; message: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];

  // Rule 1: Illness date should not be in the future
  if (data.illnessDate && !validateNotFutureDate(data.illnessDate)) {
    warnings.push({
      field: 'illnessDate',
      message: 'วันที่เจ็บป่วยไม่ควรเป็นวันในอนาคต'
    });
  }

  // Rule 2: Treatment date should be on or after illness date
  if (data.treatmentDate && data.illnessDate) {
    if (!validateDateSequence(data.illnessDate, data.treatmentDate)) {
      errors.push({
        field: 'treatmentDate',
        message: 'วันที่เริ่มรักษาต้องไม่ก่อนวันที่เจ็บป่วย'
      });
    }
  }

  // Rule 3: Diagnosis date should be on or after illness date
  if (data.diagnosisDate && data.illnessDate) {
    if (!validateDateSequence(data.illnessDate, data.diagnosisDate)) {
      errors.push({
        field: 'diagnosisDate',
        message: 'วันที่วินิจฉัยต้องไม่ก่อนวันที่เจ็บป่วย'
      });
    }
  }

  // Rule 4: Death date should be on or after illness date
  if (data.deathDate && data.illnessDate) {
    if (!validateDateSequence(data.illnessDate, data.deathDate)) {
      errors.push({
        field: 'deathDate',
        message: 'วันที่เสียชีวิตต้องไม่ก่อนวันที่เจ็บป่วย'
      });
    }
  }

  // Rule 5: Age consistency check
  if (data.birthday && data.illnessDate && typeof data.ageAtIllness === 'number') {
    if (!validateAgeConsistency(data.birthday, data.illnessDate, data.ageAtIllness)) {
      warnings.push({
        field: 'ageAtIllness',
        message: 'อายุไม่สอดคล้องกับวันเดือนปีเกิดและวันที่เจ็บป่วย'
      });
    }
  }

  // Rule 6: Deceased patients must have death date
  if (data.patientCondition === 'DECEASED' && !data.deathDate) {
    errors.push({
      field: 'deathDate',
      message: 'หากผู้ป่วยเสียชีวิต ต้องระบุวันที่เสียชีวิต'
    });
  }

  // Rule 7: Deceased patients should have cause of death
  if (data.patientCondition === 'DECEASED' && !data.causeOfDeath?.trim()) {
    warnings.push({
      field: 'causeOfDeath',
      message: 'หากผู้ป่วยเสียชีวิต ควรระบุสาเหตุการเสียชีวิต'
    });
  }

  // Rule 8: Birthday should not be in the future
  if (data.birthday && !validateNotFutureDate(data.birthday)) {
    errors.push({
      field: 'birthday',
      message: 'วันเดือนปีเกิดไม่สามารถเป็นวันในอนาคต'
    });
  }

  // Rule 9: Age should be reasonable (0-150)
  if (data.ageAtIllness !== undefined) {
    if (data.ageAtIllness < 0 || data.ageAtIllness > 150) {
      errors.push({
        field: 'ageAtIllness',
        message: 'อายุต้องอยู่ระหว่าง 0-150 ปี'
      });
    }
  }

  // Rule 10: Phone number format validation
  if (data.phoneNumber && !validateThaiPhoneNumber(data.phoneNumber)) {
    errors.push({
      field: 'phoneNumber',
      message: 'หมายเลขโทรศัพท์ไม่ถูกต้อง'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ===== Bulk Operations Schemas =====
export const bulkImportSchema = z.object({
  patients: z
    .array(createPatientSchema)
    .min(1, 'ต้องมีข้อมูลผู้ป่วยอย่างน้อย 1 คน')
    .max(1000, 'ไม่สามารถนำเข้าข้อมูลเกิน 1000 คนต่อครั้ง'),

  validateOnly: z.boolean().default(false),
  skipDuplicates: z.boolean().default(false),
  updateExisting: z.boolean().default(false),
});

export const bulkUpdateSchema = z.object({
  updates: z
    .array(z.object({
      id: z.number().int().min(1, 'รหัสผู้ป่วยต้องมากกว่า 0'),
      data: updatePatientSchema,
    }))
    .min(1, 'ต้องมีการอัปเดตอย่างน้อย 1 รายการ')
    .max(100, 'ไม่สามารถอัปเดตเกิน 100 รายการต่อครั้ง'),

  validateOnly: z.boolean().default(false),
});

export const bulkDeleteSchema = z.object({
  patientIds: z
    .array(z.number().int().min(1, 'รหัสผู้ป่วยต้องมากกว่า 0'))
    .min(1, 'ต้องเลือกผู้ป่วยอย่างน้อย 1 คน')
    .max(100, 'ไม่สามารถลบเกิน 100 คนต่อครั้ง'),

  reason: z
    .string()
    .min(10, 'เหตุผลในการลบต้องมีอย่างน้อย 10 ตัวอักษร')
    .max(500, 'เหตุผลต้องไม่เกิน 500 ตัวอักษร'),

  softDelete: z.boolean().default(true),
});

// ===== Export Schema =====
export const exportOptionsSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf'], {
    errorMap: () => ({ message: 'รูปแบบไฟล์ต้องเป็น csv, excel, หรือ pdf' })
  }),

  filters: patientQuerySchema.optional(),

  fields: z
    .array(z.string())
    .optional(),

  includeHeaders: z.boolean().default(true),

  filename: z
    .string()
    .max(100, 'ชื่อไฟล์ต้องไม่เกิน 100 ตัวอักษร')
    .regex(/^[a-zA-Z0-9\u0E00-\u0E7F._-]+$/, 'ชื่อไฟล์มีตัวอักษรที่ไม่อนุญาต')
    .optional(),
});

// ===== ID Card Validation Schema =====
export const idCardValidationSchema = z.object({
  idCard: z
    .string()
    .min(13, 'รหัสบัตรประชาชนต้องมี 13 หลัก')
    .max(13, 'รหัสบัตรประชาชนต้องมี 13 หลัก')
    .regex(/^\d{13}$/, 'รหัสบัตรประชาชนต้องเป็นตัวเลขเท่านั้น')
    .refine((idCard) => {
      // Thai ID card checksum validation
      const digits = idCard.split('').map(Number);
      const checkDigit = digits[12];

      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += digits[i] * (13 - i);
      }

      const remainder = sum % 11;
      const calculatedCheckDigit = remainder < 2 ? (1 - remainder) : (11 - remainder);

      return calculatedCheckDigit === checkDigit;
    }, 'รหัสบัตรประชาชนไม่ถูกต้อง'),
});

// ===== Statistics Schema =====
export const patientStatsSchema = z.object({
  hospitalCode: hospitalCodeSchema.optional(),
  diseaseId: z.number().int().min(1).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: z.array(z.enum(['gender', 'patientCondition', 'disease', 'hospital'])).optional(),
});

// ===== Advanced Search Schema =====
export const advancedSearchSchema = z.object({
  query: z.string().max(255).optional(),
  diseaseIds: z.array(z.number().int().min(1)).optional(),
  hospitalCodes: z.array(hospitalCodeSchema).optional(),

  dateRange: z.object({
    start: dateSchema,
    end: dateSchema,
  }).optional(),

  ageRange: z.object({
    min: z.number().int().min(0).max(150),
    max: z.number().int().min(0).max(150),
  }).optional(),

  gender: z.array(z.enum(['M', 'F', 'OTHER'])).optional(),
  conditions: z.array(z.enum(['STABLE', 'CRITICAL', 'RECOVERING', 'DISCHARGED', 'DECEASED', 'UNKNOWN'])).optional(),
  provinces: z.array(z.string()).optional(),
  includeInactive: z.boolean().default(false),
})
.refine((data) => {
  if (data.dateRange) {
    return new Date(data.dateRange.start) <= new Date(data.dateRange.end);
  }
  return true;
}, {
  message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด',
  path: ['dateRange', 'end']
})
.refine((data) => {
  if (data.ageRange) {
    return data.ageRange.min <= data.ageRange.max;
  }
  return true;
}, {
  message: 'อายุขั้นต่ำต้องไม่มากกว่าอายุสูงสุด',
  path: ['ageRange', 'max']
});

// ===== Additional Type Exports =====
export type BulkImportData = z.infer<typeof bulkImportSchema>;
export type BulkUpdateData = z.infer<typeof bulkUpdateSchema>;
export type BulkDeleteData = z.infer<typeof bulkDeleteSchema>;
export type ExportOptionsData = z.infer<typeof exportOptionsSchema>;
export type IdCardValidationData = z.infer<typeof idCardValidationSchema>;
export type PatientStatsParams = z.infer<typeof patientStatsSchema>;
export type AdvancedSearchData = z.infer<typeof advancedSearchSchema>;

// ===== Constants for validation =====
export const PATIENT_FORM_STEPS = [
  { id: 1, title: 'ข้อมูลส่วนตัว', description: 'ข้อมูลพื้นฐานของผู้ป่วย' },
  { id: 2, title: 'ที่อยู่', description: 'ที่อยู่ปัจจุบันและที่อยู่ขณะป่วย' },
  { id: 3, title: 'การเจ็บป่วย', description: 'ข้อมูลการเจ็บป่วยและการรักษา' },
  { id: 4, title: 'ผลตรวจ', description: 'ผลการตรวจและสถานะผู้ป่วย' },
  { id: 5, title: 'หมายเหตุ', description: 'ข้อมูลเพิ่มเติมและหมายเหตุ' }
] as const;

export const REQUIRED_FIELDS_BY_STEP = {
  1: ['patientName', 'diseaseId', 'illnessDate'],
  2: [], // No required fields in address tab
  3: ['hospitalCode'],
  4: [], // Lab results are optional
  5: [], // Notes are optional
} as const;

export const VALIDATION_ERROR_CODES = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_LENGTH: 'INVALID_LENGTH',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_ID_CARD: 'INVALID_ID_CARD',
  INVALID_PHONE: 'INVALID_PHONE',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  DATE_SEQUENCE_ERROR: 'DATE_SEQUENCE_ERROR',
  AGE_INCONSISTENCY: 'AGE_INCONSISTENCY',
} as const;

export type ValidationErrorCode = typeof VALIDATION_ERROR_CODES[keyof typeof VALIDATION_ERROR_CODES];

// ===== Patient Constants =====
export const PATIENT_GENDERS = ['M', 'F', 'OTHER'] as const;
export const PATIENT_CONDITIONS = [
  'STABLE', 'CRITICAL', 'RECOVERING', 'DISCHARGED', 'DECEASED', 'UNKNOWN'
] as const;
export const PATIENT_TYPES = ['IPD', 'OPD', 'ACF'] as const;
export const LAB_RESULTS = ['POSITIVE', 'NEGATIVE', 'PENDING', 'INCONCLUSIVE'] as const;
export const MARITAL_STATUSES = [
  'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN'
] as const;

export type PatientGender = typeof PATIENT_GENDERS[number];
export type PatientCondition = typeof PATIENT_CONDITIONS[number];
export type PatientType = typeof PATIENT_TYPES[number];
export type LabResult = typeof LAB_RESULTS[number];
export type MaritalStatus = typeof MARITAL_STATUSES[number];