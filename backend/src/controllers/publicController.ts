// backend/src/controllers/publicController.ts

import { Request, Response } from 'express';
import { publicService } from '../services/publicService';
import { ResponseUtils } from '../utils/responseUtils';

// ========== TYPES ==========

interface ReportFilters {
  diseaseId: string;
  year?: string;
  hospital?: string;
  gender?: string;
  ageGroup?: string;
  occupation?: string;
}

// ========== PUBLIC API CONTROLLERS ==========

/**
 * GET /public/diseases
 * Get all active diseases (for homepage cards)
 */
export async function getAllDiseasesPublic(_req: Request, res: Response) {
  try {
    const diseases = await publicService.getAllDiseases();
    return ResponseUtils.success(res, 'Diseases retrieved successfully', diseases);
  } catch (error) {
    console.error('Get public diseases error:', error);
    return ResponseUtils.internalError(res, 'Failed to retrieve diseases');
  }
}

/**
 * GET /public/diseases/:id  
 * Get specific disease by ID (for disease detail page)
 */
export async function getDiseaseByIdPublic(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return ResponseUtils.error(res, 'รหัสโรคไม่ถูกต้อง', 400);
    }
    
    const disease = await publicService.getDiseaseById(parseInt(id));
    
    if (!disease) {
      return ResponseUtils.notFound(res, 'ไม่พบข้อมูลโรคที่ระบุ');
    }
    
    return ResponseUtils.success(res, 'Disease retrieved successfully', disease);
  } catch (error) {
    console.error('Get disease by ID error:', error);
    return ResponseUtils.internalError(res, 'Failed to retrieve disease');
  }
}

/**
 * GET /public/stats
 * Get public statistics (for homepage)
 */
export async function getPublicStats(_req: Request, res: Response) {
  try {
    const stats = await publicService.getPublicStats();
    return ResponseUtils.success(res, 'Statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Get public stats error:', error);
    return ResponseUtils.internalError(res, 'Failed to retrieve statistics');
  }
}

/**
 * GET /public/hospitals
 * Get all active hospitals (for dropdowns)
 */
export async function getHospitalsPublic(_req: Request, res: Response) {
  try {
    console.log('🔓 Getting public hospitals list...');
    
    const hospitals = await publicService.getHospitals();
    
    console.log(`✅ Found ${hospitals.length} hospitals`);
    
    return ResponseUtils.success(res, 'Hospitals retrieved successfully', hospitals);
  } catch (error) {
    console.error('❌ Get public hospitals error:', error);
    return ResponseUtils.internalError(res, 'Failed to retrieve hospitals');
  }
}

// ========== PUBLIC REPORTS ==========

/**
 * GET /public/reports/age-groups
 * Public Age Groups Report
 */
export async function getAgeGroupsPublic(req: Request, res: Response) {
  try {
    const filters: ReportFilters = {
      diseaseId: req.query.diseaseId as string,
      year: req.query.year as string || 'all',
      hospital: req.query.hospital as string || 'all',
      gender: req.query.gender as string || 'all',
      occupation: req.query.occupation as string || 'all'
    };

    // Validate required parameters
    if (!filters.diseaseId) {
      return ResponseUtils.error(res, 'กรุณาระบุรหัสโรค (diseaseId)', 400);
    }

    const reportData = await publicService.getAgeGroupsReport(filters);
    return ResponseUtils.success(res, 'Age groups report generated successfully', reportData);

  } catch (error) {
    console.error('Public age groups report error:', error);
    if (error instanceof Error && error.message.includes('ไม่พบข้อมูลโรค')) {
      return ResponseUtils.notFound(res, error.message);
    }
    return ResponseUtils.internalError(res, 'เกิดข้อผิดพลาดในการสร้างรายงานกลุ่มอายุ');
  }
}

/**
 * GET /public/reports/gender-ratio
 * Public Gender Ratio Report
 */
export async function getGenderRatioPublic(req: Request, res: Response) {
  try {
    const filters: ReportFilters = {
      diseaseId: req.query.diseaseId as string,
      year: req.query.year as string || 'all',
      hospital: req.query.hospital as string || 'all',
      ageGroup: req.query.ageGroup as string || 'all',
      occupation: req.query.occupation as string || 'all'
    };

    if (!filters.diseaseId) {
      return ResponseUtils.error(res, 'กรุณาระบุรหัสโรค (diseaseId)', 400);
    }

    const reportData = await publicService.getGenderRatioReport(filters);
    return ResponseUtils.success(res, 'Gender ratio report generated successfully', reportData);

  } catch (error) {
    console.error('Public gender ratio report error:', error);
    if (error instanceof Error && error.message.includes('ไม่พบข้อมูลโรค')) {
      return ResponseUtils.notFound(res, error.message);
    }
    return ResponseUtils.internalError(res, 'เกิดข้อผิดพลาดในการสร้างรายงานอัตราส่วนเพศ');
  }
}

/**
 * GET /public/reports/incidence-rates
 * Public Incidence Rates Report
 */
export async function getIncidenceRatesPublic(req: Request, res: Response) {
  try {
    const filters: ReportFilters = {
      diseaseId: req.query.diseaseId as string,
      year: req.query.year as string || 'all',
      hospital: req.query.hospital as string || 'all',
      gender: req.query.gender as string || 'all',
      ageGroup: req.query.ageGroup as string || 'all',
      occupation: req.query.occupation as string || 'all'
    };

    if (!filters.diseaseId) {
      return ResponseUtils.error(res, 'กรุณาระบุรหัสโรค (diseaseId)', 400);
    }

    const reportData = await publicService.getIncidenceRatesReport(filters);
    return ResponseUtils.success(res, 'Incidence rates report generated successfully', reportData);

  } catch (error) {
    console.error('Public incidence rates report error:', error);
    if (error instanceof Error && error.message.includes('ไม่พบข้อมูลโรค')) {
      return ResponseUtils.notFound(res, error.message);
    }
    return ResponseUtils.internalError(res, 'เกิดข้อผิดพลาดในการสร้างรายงานอัตราการป่วย/ตาย');
  }
}

/**
 * GET /public/reports/occupation
 * Public Occupation Report
 */
export async function getOccupationPublic(req: Request, res: Response) {
  try {
    const filters: ReportFilters = {
      diseaseId: req.query.diseaseId as string,
      year: req.query.year as string || 'all',
      hospital: req.query.hospital as string || 'all',
      gender: req.query.gender as string || 'all',
      ageGroup: req.query.ageGroup as string || 'all'
    };

    if (!filters.diseaseId) {
      return ResponseUtils.error(res, 'กรุณาระบุรหัสโรค (diseaseId)', 400);
    }

    const reportData = await publicService.getOccupationReport(filters);
    return ResponseUtils.success(res, 'Occupation report generated successfully', reportData);

  } catch (error) {
    console.error('Public occupation report error:', error);
    if (error instanceof Error && error.message.includes('ไม่พบข้อมูลโรค')) {
      return ResponseUtils.notFound(res, error.message);
    }
    return ResponseUtils.internalError(res, 'เกิดข้อผิดพลาดในการสร้างรายงานอาชีพ');
  }
}

/**
 * GET /public/populations/stats
 * Get population statistics for public display
 */
export async function getPopulationStatsPublic(_req: Request, res: Response) {
  try {
    const stats = await publicService.getPopulationStats();
    return ResponseUtils.success(res, 'Population statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Get population stats error:', error);
    return ResponseUtils.internalError(res, 'Failed to retrieve population statistics');
  }
}