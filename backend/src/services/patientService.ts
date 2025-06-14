// backend/src/services/patientService.ts - ✅ UPDATED: ตรงตาม schema ใหม่

import { PrismaClient, PatientVisit } from '@prisma/client';
import { DateUtils } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import type { 
  CreatePatientData, 
  UpdatePatientData, 
  PatientQueryParams,
  ExportPatientParams 
} from '../validations/patientValidation';

const prisma = new PrismaClient();

// ✅ Type-safe where clause interfaces
interface PatientWhereClause {
  isActive: boolean;
  hospitalCode?: string;
  OR?: Array<{
    patientName?: { contains: string; mode: 'insensitive' };
    idCardCode?: { contains: string; mode: 'insensitive' };
    patientHn?: { contains: string; mode: 'insensitive' };
    phoneNumber?: { contains: string; mode: 'insensitive' };
  }>;
  diseaseId?: number;
  gender?: string;
  patientCondition?: string;
  treatmentHospital?: { contains: string; mode: 'insensitive' };
  illnessDate?: {
    gte?: Date;
    lte?: Date;
  };
}

// Types for service responses
export interface PatientWithRelations extends PatientVisit {
  disease: {
    id: number;
    thaiName: string;
    engName: string | null;
  };
  hospital: {
    id: number;
    hospitalName: string | null;
    hospitalCode5Digit: string;
  };
}

export interface PaginatedPatientResponse {
  patients: PatientWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search?: string;
    diseaseId?: number;
    hospitalCode?: string;
    treatmentHospital?: string;
    gender?: string;
    patientCondition?: string;
    illnessDateFrom?: string;
    illnessDateTo?: string;
  };
  summary: {
    totalRecords: number;
    exportedAt?: string;
  };
}

export interface HospitalAccessContext {
  userRole: string;
  userHospitalCode?: string;
  permissions: string[];
  canAccessAllHospitals: boolean;
}

export interface ImportResult {
  summary: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    skippedRows: number;
  };
  successful: Array<{
    rowNumber: number;
    patientId: number;
    patientName: string;
  }>;
  failed: Array<{
    rowNumber: number;
    errors: string[];
    data: any;
  }>;
  warnings: Array<{
    rowNumber: number;
    message: string;
  }>;
}

class PatientService {
  /**
   * ✅ Hospital filtering based on user permissions
   */
  private applyHospitalFilter(
    whereClause: PatientWhereClause, 
    context?: HospitalAccessContext
  ): PatientWhereClause {
    if (!context) return whereClause;

    if (context.canAccessAllHospitals) {
      return whereClause;
    }

    if (context.userRole === 'USER' && context.userHospitalCode) {
      whereClause.hospitalCode = context.userHospitalCode;
    }

    return whereClause;
  }

  // ========== CRUD OPERATIONS ==========

  async getPatients(
    params: PatientQueryParams,
    context?: HospitalAccessContext
  ): Promise<PaginatedPatientResponse> {
    const { 
      page, 
      limit, 
      search, 
      diseaseId, 
      hospitalCode, 
      treatmentHospital,
      gender, 
      patientCondition, 
      illnessDateFrom, 
      illnessDateTo, 
      sortBy, 
      sortOrder 
    } = params;
    
    let whereClause: PatientWhereClause = {
      isActive: true,
    };

    whereClause = this.applyHospitalFilter(whereClause, context);

    if (search) {
      whereClause.OR = [
        { patientName: { contains: search, mode: 'insensitive' } },
        { idCardCode: { contains: search, mode: 'insensitive' } },
        { patientHn: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (diseaseId) {
      whereClause.diseaseId = diseaseId;
    }

    if (hospitalCode) {
      if (context && !context.canAccessAllHospitals && context.userHospitalCode !== hospitalCode) {
        throw new Error(`Access denied: You can only view patients from hospital ${context.userHospitalCode}`);
      }
      whereClause.hospitalCode = hospitalCode;
    }

    if (treatmentHospital) {
      whereClause.treatmentHospital = { contains: treatmentHospital, mode: 'insensitive' };
    }

    if (gender) {
      whereClause.gender = gender;
    }

    if (patientCondition) {
      whereClause.patientCondition = patientCondition;
    }

    // Date range filter
    if (illnessDateFrom || illnessDateTo) {
      whereClause.illnessDate = {};
      if (illnessDateFrom) {
        whereClause.illnessDate.gte = typeof illnessDateFrom === 'string' 
          ? DateUtils.parseDate(illnessDateFrom) 
          : illnessDateFrom;
      }
      if (illnessDateTo) {
        whereClause.illnessDate.lte = typeof illnessDateTo === 'string' 
          ? DateUtils.parseDate(illnessDateTo) 
          : illnessDateTo;
      }
    }

    // Get total count for pagination
    const total = await prisma.patientVisit.count({ where: whereClause });

    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch patients with relations
    const patients = await prisma.patientVisit.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        disease: {
          select: {
            id: true,
            thaiName: true,
            engName: true,
          }
        },
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
          }
        }
      }
    });

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
      filters: {
        search,
        diseaseId,
        hospitalCode,
        treatmentHospital,
        gender,
        patientCondition,
        illnessDateFrom,
        illnessDateTo,
      },
      summary: {
        totalRecords: total,
      }
    };
  }

  /**
   * Get patient by ID with hospital access control
   */
  async getPatientById(
    id: number,
    context?: HospitalAccessContext
  ): Promise<PatientWithRelations | null> {
    let whereClause: PatientWhereClause & { id: number } = { 
      id, 
      isActive: true 
    };

    whereClause = { ...whereClause, ...this.applyHospitalFilter(whereClause, context) };

    const patient = await prisma.patientVisit.findFirst({
      where: whereClause,
      include: {
        disease: {
          select: {
            id: true,
            thaiName: true,
            engName: true,
            details: true,
          }
        },
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
            organizationType: true,
          }
        }
      }
    });

    return patient;
  }

  /**
   * ✅ UPDATED: Create patient with proper required field handling
   */
  async createPatient(
    data: CreatePatientData, 
    createdBy: string,
    context?: HospitalAccessContext
  ): Promise<PatientWithRelations> {
    // Hospital access validation for USER role
    if (context?.userRole === 'USER' && context.userHospitalCode) {
      if (data.hospitalCode !== context.userHospitalCode) {
        throw new Error(`Access denied: You can only create patients for hospital ${context.userHospitalCode}`);
      }
    }

    // Verify disease exists
    const disease = await prisma.disease.findFirst({
      where: { id: data.diseaseId, isActive: true }
    });

    if (!disease) {
      throw new Error(`Disease with ID ${data.diseaseId} not found or inactive`);
    }

    // Verify hospital exists
    const hospital = await prisma.hospital.findFirst({
      where: { hospitalCode5Digit: data.hospitalCode, isActive: true }
    });

    if (!hospital) {
      throw new Error(`Hospital with code ${data.hospitalCode} not found or inactive`);
    }

    // ✅ UPDATED: Process data with proper date conversion and required fields
    const processedData = {
      // Tab 1: Personal Information - All required (except patientHn)
      idCardCode: data.idCardCode,
      patientHn: data.patientHn || null, // Optional
      namePrefix: data.namePrefix,
      patientName: data.patientName,
      gender: data.gender,
      birthday: typeof data.birthday === 'string' ? DateUtils.parseDate(data.birthday) : data.birthday,
      ageAtIllness: data.ageAtIllness,
      nationality: data.nationality,
      maritalStatus: data.maritalStatus,
      occupation: data.occupation,
      phoneNumber: data.phoneNumber,

      // Tab 2: Address Information - All required
      currentHouseNumber: data.currentHouseNumber,
      currentVillageNumber: data.currentVillageNumber,
      currentRoadName: data.currentRoadName,
      currentProvince: data.currentProvince,
      currentDistrict: data.currentDistrict,
      currentSubDistrict: data.currentSubDistrict,
      addressSickHouseNumber: data.addressSickHouseNumber,
      addressSickVillageNumber: data.addressSickVillageNumber,
      addressSickRoadName: data.addressSickRoadName,
      addressSickProvince: data.addressSickProvince,
      addressSickDistrict: data.addressSickDistrict,
      addressSickSubDistrict: data.addressSickSubDistrict,

      // Tab 3: Illness Information - All required
      diseaseId: data.diseaseId,
      symptomsOfDisease: data.symptomsOfDisease,
      treatmentArea: data.treatmentArea,
      treatmentHospital: data.treatmentHospital,
      illnessDate: typeof data.illnessDate === 'string' ? DateUtils.parseDate(data.illnessDate) : data.illnessDate,
      treatmentDate: typeof data.treatmentDate === 'string' ? DateUtils.parseDate(data.treatmentDate) : data.treatmentDate,
      diagnosisDate: typeof data.diagnosisDate === 'string' ? DateUtils.parseDate(data.diagnosisDate) : data.diagnosisDate,

      // Tab 4: Lab Results - All required (except death fields)
      labResult: data.labResult,
      ns1Result: data.ns1Result,
      patientType: data.patientType,
      patientCondition: data.patientCondition,
      deathDate: data.deathDate ? (typeof data.deathDate === 'string' ? DateUtils.parseDate(data.deathDate) : data.deathDate) : null,
      causeOfDeath: data.causeOfDeath || null,

      // Tab 5: Notes - All required
      receivingProvince: data.receivingProvince,
      hospitalCode: data.hospitalCode,
      remarks: data.remarks,

      // Audit fields
      createdBy,
      updatedBy: createdBy,
    };

    const patient = await prisma.patientVisit.create({
      data: processedData,
      include: {
        disease: {
          select: {
            id: true,
            thaiName: true,
            engName: true,
          }
        },
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
          }
        }
      }
    });

    return patient;
  }

  /**
   * Update patient record with hospital access control
   */
  async updatePatient(
    id: number,
    data: UpdatePatientData,
    updatedBy: string,
    context?: HospitalAccessContext
  ): Promise<PatientWithRelations> {
    // Check if patient exists and user has access
    const existingPatient = await this.getPatientById(id, context);

    if (!existingPatient) {
      throw new Error(`Patient with ID ${id} not found or access denied`);
    }

    // Hospital access validation for USER role
    if (context?.userRole === 'USER' && context.userHospitalCode) {
      if (data.hospitalCode && data.hospitalCode !== context.userHospitalCode) {
        throw new Error(`Access denied: You can only update patients for hospital ${context.userHospitalCode}`);
      }
      
      if (existingPatient.hospitalCode !== context.userHospitalCode) {
        throw new Error(`Access denied: Patient belongs to different hospital`);
      }
    }

    // Verify disease exists (if being updated)
    if (data.diseaseId) {
      const disease = await prisma.disease.findFirst({
        where: { id: data.diseaseId, isActive: true }
      });

      if (!disease) {
        throw new Error(`Disease with ID ${data.diseaseId} not found or inactive`);
      }
    }

    // Verify hospital exists (if being updated)
    if (data.hospitalCode) {
      const hospital = await prisma.hospital.findFirst({
        where: { hospitalCode5Digit: data.hospitalCode, isActive: true }
      });

      if (!hospital) {
        throw new Error(`Hospital with code ${data.hospitalCode} not found or inactive`);
      }
    }

    // ✅ UPDATED: Process update data with proper date conversion
    const processedUpdateData: any = { ...data };
    
    // Convert date strings to Date objects if provided
    if (data.birthday && typeof data.birthday === 'string') {
      processedUpdateData.birthday = DateUtils.parseDate(data.birthday);
    }
    if (data.illnessDate && typeof data.illnessDate === 'string') {
      processedUpdateData.illnessDate = DateUtils.parseDate(data.illnessDate);
    }
    if (data.treatmentDate && typeof data.treatmentDate === 'string') {
      processedUpdateData.treatmentDate = DateUtils.parseDate(data.treatmentDate);
    }
    if (data.diagnosisDate && typeof data.diagnosisDate === 'string') {
      processedUpdateData.diagnosisDate = DateUtils.parseDate(data.diagnosisDate);
    }
    if (data.deathDate && typeof data.deathDate === 'string') {
      processedUpdateData.deathDate = DateUtils.parseDate(data.deathDate);
    }

    // Update patient record
    const updatedPatient = await prisma.patientVisit.update({
      where: { id },
      data: {
        ...processedUpdateData,
        updatedBy,
      },
      include: {
        disease: {
          select: {
            id: true,
            thaiName: true,
            engName: true,
          }
        },
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
          }
        }
      }
    });

    return updatedPatient;
  }

  /**
   * Soft delete patient record
   */
  async deletePatient(
    id: number, 
    deletedBy: string,
    context?: HospitalAccessContext
  ): Promise<boolean> {
    const patient = await this.getPatientById(id, context);

    if (!patient) {
      throw new Error(`Patient with ID ${id} not found or access denied`);
    }

    await prisma.patientVisit.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: deletedBy,
      }
    });

    return true;
  }

  // ========== IMPORT/EXPORT OPERATIONS ==========

  /**
   * Export patients to Excel/CSV
   */
  async exportPatients(
    params: ExportPatientParams,
    context?: HospitalAccessContext
  ): Promise<Buffer> {
    const { format, filters } = params;

    const queryParams: PatientQueryParams = {
      page: 1,
      limit: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...filters,
    };

    const result = await this.getPatients(queryParams, context);

    // ✅ UPDATED: Export data ตรงตาม schema ใหม่
    const exportData = result.patients.map((patient, index) => ({
      'ลำดับ': index + 1,
      'เลขบัตรประชาชน': patient.idCardCode || '',
      'เลข HN': patient.patientHn || '',
      'คำนำหน้า': patient.namePrefix || '',
      'ชื่อผู้ป่วย': patient.patientName,
      'เพศ': patient.gender === 'M' ? 'ชาย' : patient.gender === 'F' ? 'หญิง' : '',
      'วันเกิด': patient.birthday ? DateUtils.formatDate(patient.birthday) : '',
      'อายุ': patient.ageAtIllness || '',
      'สัญชาติ': patient.nationality || '',
      'สถานภาพ': patient.maritalStatus || '',
      'อาชีพ': patient.occupation || '',
      'เบอร์โทรศัพท์': patient.phoneNumber || '',
      
      // Address
      'บ้านเลขที่ปัจจุบัน': patient.currentHouseNumber || '',
      'หมู่ปัจจุบัน': patient.currentVillageNumber || '',
      'ถนนปัจจุบัน': patient.currentRoadName || '',
      'จังหวัดปัจจุบัน': patient.currentProvince || '',
      'อำเภอปัจจุบัน': patient.currentDistrict || '',
      'ตำบลปัจจุบัน': patient.currentSubDistrict || '',
      
      // Illness
      'โรค': patient.disease.thaiName,
      'อาการ': patient.symptomsOfDisease || '',
      'พื้นที่รักษา': patient.treatmentArea || '',
      'โรงพยาบาลหลัก': patient.treatmentHospital || '',
      'วันที่เจ็บป่วย': patient.illnessDate ? DateUtils.formatDate(patient.illnessDate) : '',
      'วันที่รักษา': patient.treatmentDate ? DateUtils.formatDate(patient.treatmentDate) : '',
      'วันที่วินิจฉัย': patient.diagnosisDate ? DateUtils.formatDate(patient.diagnosisDate) : '',
      
      // Lab Results
      'ผลตรวจ': patient.labResult || '',
      'ผล NS1': patient.ns1Result || '',
      'ประเภทผู้ป่วย': patient.patientType || '',
      'สภาพผู้ป่วย': patient.patientCondition || '',
      'วันที่เสียชีวิต': patient.deathDate ? DateUtils.formatDate(patient.deathDate) : '',
      'สาเหตุการเสียชีวิต': patient.causeOfDeath || '',
      
      // Notes
      'จังหวัดที่รับผิดชอบ': patient.receivingProvince || '',
      'รหัสโรงพยาบาล': patient.hospitalCode,
      'หมายเหตุ': patient.remarks || '',
      
      // Audit
      'วันที่บันทึก': DateUtils.formatDateTime(patient.createdAt),
      'ผู้บันทึก': patient.createdBy || '',
    }));

    if (format === 'csv') {
      return this.generateCSV(exportData);
    } else {
      return this.generateExcel(exportData, 'รายการผู้ป่วย');
    }
  }

  /**
   * Import patients from Excel/CSV
   */
  async importPatients(
    file: Express.Multer.File,
    createdBy: string,
    context?: HospitalAccessContext
  ): Promise<ImportResult> {
    const result: ImportResult = {
      summary: {
        totalRows: 0,
        successfulRows: 0,
        failedRows: 0,
        skippedRows: 0,
      },
      successful: [],
      failed: [],
      warnings: [],
    };

    try {
      const data = await this.parseImportFile(file);
      result.summary.totalRows = data.length;

      for (let i = 0; i < data.length; i++) {
        const rowData = data[i];
        const rowNumber = i + 2;

        try {
          const patientData = this.transformImportData(rowData, context);
          const validationResult = await this.validateImportData(patientData);
          
          if (!validationResult.isValid) {
            result.failed.push({
              rowNumber,
              errors: validationResult.errors,
              data: rowData,
            });
            result.summary.failedRows++;
            continue;
          }

          const patient = await this.createPatient(patientData, createdBy, context);
          
          result.successful.push({
            rowNumber,
            patientId: patient.id,
            patientName: patient.patientName,
          });
          result.summary.successfulRows++;

        } catch (error) {
          result.failed.push({
            rowNumber,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            data: rowData,
          });
          result.summary.failedRows++;
        }
      }

      return result;

    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate import template
   */
  async generateImportTemplate(format: 'excel' | 'csv'): Promise<Buffer> {
    // ✅ UPDATED: Template ตรงตาม schema ใหม่
    const templateData = [
      {
        'เลขบัตรประชาชน': '1234567890123',
        'เลข HN': 'HN001',
        'คำนำหน้า': 'นาย',
        'ชื่อผู้ป่วย': 'สมชาย ใจดี',
        'เพศ': 'M',
        'วันเกิด': '1990-01-01',
        'อายุ': 34,
        'สัญชาติ': 'ไทย',
        'สถานภาพ': 'SINGLE',
        'อาชีพ': 'เกษตรกร',
        'เบอร์โทรศัพท์': '0812345678',
        
        // Address
        'บ้านเลขที่ปัจจุบัน': '123',
        'หมู่ปัจจุบัน': '1',
        'ถนนปัจจุบัน': 'สายหลัก',
        'จังหวัดปัจจุบัน': 'เพชรบูรณ์',
        'อำเภอปัจจุบัน': 'วิเชียรบุรี',
        'ตำบลปัจจุบัน': 'ท่าโรง',
        'บ้านเลขที่ที่ป่วย': '123',
        'หมู่ที่ป่วย': '1',
        'ถนนที่ป่วย': 'สายหลัก',
        'จังหวัดที่ป่วย': 'เพชรบูรณ์',
        'อำเภอที่ป่วย': 'วิเชียรบุรี',
        'ตำบลที่ป่วย': 'ท่าโรง',
        
        // Illness
        'รหัสโรค': 1,
        'อาการ': 'ไข้สูง ปวดหัว',
        'พื้นที่รักษา': 'เทศบาล',
        'โรงพยาบาลหลัก': 'โรงพยาบาลวิเชียรบุรี',
        'วันที่เจ็บป่วย': '2024-01-15',
        'วันที่รักษา': '2024-01-16',
        'วันที่วินิจฉัย': '2024-01-16',
        
        // Lab Results
        'ผลตรวจ': 'Positive',
        'ผล NS1': 'Positive',
        'ประเภทผู้ป่วย': 'OPD',
        'สภาพผู้ป่วย': 'ยังรักษาตัวอยู่',
        
        // Notes
        'จังหวัดที่รับผิดชอบ': 'เพชรบูรณ์',
        'รหัสโรงพยาบาล': 'VCH010001',
        'หมายเหตุ': 'ตัวอย่างข้อมูล',
      }
    ];

    if (format === 'csv') {
      return this.generateCSV(templateData);
    } else {
      return this.generateExcel(templateData, 'Template นำเข้าข้อมูลผู้ป่วย');
    }
  }

  // ========== HELPER METHODS ==========

  private generateExcel(data: any[], sheetName: string): Buffer {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private generateCSV(data: any[]): Buffer {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return Buffer.from('\uFEFF' + csv, 'utf8');
  }

  private async parseImportFile(file: Express.Multer.File): Promise<any[]> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      throw new Error('Invalid file format. Please upload a valid Excel or CSV file.');
    }
  }

  /**
   * ✅ UPDATED: Transform import data ตรงตาม schema ใหม่
   */
  private transformImportData(rowData: any, context?: HospitalAccessContext): CreatePatientData {
    return {
      // Tab 1: Personal Info
      idCardCode: rowData['เลขบัตรประชาชน'],
      patientHn: rowData['เลข HN'],
      namePrefix: rowData['คำนำหน้า'],
      patientName: rowData['ชื่อผู้ป่วย'],
      gender: rowData['เพศ'],
      birthday: rowData['วันเกิด'],
      ageAtIllness: parseInt(rowData['อายุ']) || 0,
      nationality: rowData['สัญชาติ'],
      maritalStatus: rowData['สถานภาพ'],
      occupation: rowData['อาชีพ'],
      phoneNumber: rowData['เบอร์โทรศัพท์'],
      
      // Tab 2: Address
      currentHouseNumber: rowData['บ้านเลขที่ปัจจุบัน'],
      currentVillageNumber: rowData['หมู่ปัจจุบัน'],
      currentRoadName: rowData['ถนนปัจจุบัน'],
      currentProvince: rowData['จังหวัดปัจจุบัน'],
      currentDistrict: rowData['อำเภอปัจจุบัน'],
      currentSubDistrict: rowData['ตำบลปัจจุบัน'],
      addressSickHouseNumber: rowData['บ้านเลขที่ที่ป่วย'],
      addressSickVillageNumber: rowData['หมู่ที่ป่วย'],
      addressSickRoadName: rowData['ถนนที่ป่วย'],
      addressSickProvince: rowData['จังหวัดที่ป่วย'],
      addressSickDistrict: rowData['อำเภอที่ป่วย'],
      addressSickSubDistrict: rowData['ตำบลที่ป่วย'],
      
      // Tab 3: Illness
      diseaseId: parseInt(rowData['รหัสโรค']),
      symptomsOfDisease: rowData['อาการ'],
      treatmentArea: rowData['พื้นที่รักษา'],
      treatmentHospital: rowData['โรงพยาบาลหลัก'],
      illnessDate: rowData['วันที่เจ็บป่วย'],
      treatmentDate: rowData['วันที่รักษา'],
      diagnosisDate: rowData['วันที่วินิจฉัย'],
      
      // Tab 4: Lab Results
      labResult: rowData['ผลตรวจ'],
      ns1Result: rowData['ผล NS1'],
      patientType: rowData['ประเภทผู้ป่วย'],
      patientCondition: rowData['สภาพผู้ป่วย'],
      deathDate: rowData['วันที่เสียชีวิต'],
      causeOfDeath: rowData['สาเหตุการเสียชีวิต'],
      
      // Tab 5: Notes
      receivingProvince: rowData['จังหวัดที่รับผิดชอบ'],
      hospitalCode: rowData['รหัสโรงพยาบาล'],
      remarks: rowData['หมายเหตุ'],
    };
  }

  private async validateImportData(data: CreatePatientData): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // ✅ UPDATED: Validate required fields ตาม schema ใหม่
    if (!data.idCardCode?.trim()) {
      errors.push('เลขบัตรประชาชนจำเป็นต้องระบุ');
    }

    if (!data.namePrefix?.trim()) {
      errors.push('คำนำหน้าจำเป็นต้องระบุ');
    }

    if (!data.patientName?.trim()) {
      errors.push('ชื่อผู้ป่วยจำเป็นต้องระบุ');
    }

    if (!data.gender?.trim()) {
      errors.push('เพศจำเป็นต้องระบุ');
    }

    if (!data.birthday) {
      errors.push('วันเกิดจำเป็นต้องระบุ');
    }

    if (!data.diseaseId || data.diseaseId <= 0) {
      errors.push('รหัสโรคไม่ถูกต้อง');
    }

    if (!data.hospitalCode?.trim()) {
      errors.push('รหัสโรงพยาบาลจำเป็นต้องระบุ');
    }

    if (!data.illnessDate) {
      errors.push('วันที่เจ็บป่วยจำเป็นต้องระบุ');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const patientService = new PatientService();
export default patientService;