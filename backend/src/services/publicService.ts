// backend/src/services/publicService.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========== TYPES ==========

interface ReportFilters {
  diseaseId: string;
  year?: string;
  hospital?: string;
  gender?: string;
  ageGroup?: string;
  occupation?: string;
}

interface DiseaseInfo {
  id: number;
  thaiName: string | null;
  engName: string | null;
  daName: string | null;
}

interface AgeGroupData {
  ageGroup: string;
  count: number;
  percentage: number;
  incidenceRate: number;
}

interface GenderData {
  total: number;
  male: number;
  female: number;
  other: number;
  notSpecified: number;
}

interface OccupationData {
  occupation: string;
  count: number;
  percentage: number;
}

// ========== HELPER FUNCTIONS ==========

/**
 * Build Prisma where conditions from filters
 */
function buildWhereConditions(filters: ReportFilters) {
  const where: any = {
    diseaseId: parseInt(filters.diseaseId),
    isActive: true
  };

  // Year filter
  if (filters.year && filters.year !== 'all') {
    const year = parseInt(filters.year);
    where.illnessDate = {
      gte: new Date(`${year}-01-01`),
      lte: new Date(`${year}-12-31`)
    };
  }

  // Hospital filter  
  if (filters.hospital && filters.hospital !== 'all') {
    where.hospitalCode = filters.hospital;
  }

  // Gender filter
  if (filters.gender && filters.gender !== 'all') {
    where.gender = filters.gender; // ✅ ใช้ gender field ที่มีใน schema
  }

  // Age group filter
  if (filters.ageGroup && filters.ageGroup !== 'all') {
    const ageRange = parseAgeGroup(filters.ageGroup);
    if (ageRange) {
      where.ageAtIllness = {
        gte: ageRange.min,
        lte: ageRange.max
      };
    }
  }

  // Occupation filter
  if (filters.occupation && filters.occupation !== 'all') {
    where.occupation = filters.occupation;
  }

  return where;
}

/**
 * Parse age group string to min/max values
 */
function parseAgeGroup(ageGroup: string): { min: number; max: number } | null {
  const ranges: Record<string, { min: number; max: number }> = {
    '0-10': { min: 0, max: 10 },
    '11-20': { min: 11, max: 20 },
    '21-30': { min: 21, max: 30 },
    '31-40': { min: 31, max: 40 },
    '41-50': { min: 41, max: 50 },
    '51+': { min: 51, max: 150 }
  };
  
  return ranges[ageGroup] || null;
}

/**
 * Calculate age from birthday and illness date
 */
function calculateAge(birthday: Date | null, illnessDate: Date | null): number {
  if (!birthday || !illnessDate) return 0;
  
  const birth = new Date(birthday);
  const illness = new Date(illnessDate);
  
  let age = illness.getFullYear() - birth.getFullYear();
  const monthDiff = illness.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && illness.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}

/**
 * Categorize age into groups
 */
function getAgeGroup(age: number): string {
  if (age < 1) return '< 1 ปี';
  if (age <= 4) return '1-4 ปี';
  if (age <= 9) return '5-9 ปี';
  if (age <= 14) return '10-14 ปี';
  if (age <= 24) return '15-24 ปี';
  if (age <= 34) return '25-34 ปี';
  if (age <= 44) return '35-44 ปี';
  if (age <= 54) return '45-54 ปี';
  if (age <= 64) return '55-64 ปี';
  return '65+ ปี';
}

// ========== SERVICE FUNCTIONS ==========

class PublicService {
  /**
   * Get all active diseases
   */
  async getAllDiseases() {
    return await prisma.disease.findMany({
      where: { isActive: true },
      select: {
        id: true,
        imageUrl: true,
        engName: true,
        thaiName: true,
        daName: true,
        details: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { id: 'asc' }
    });
  }

  /**
   * Get disease by ID
   */
  async getDiseaseById(id: number) {
    return await prisma.disease.findUnique({
      where: { 
        id,
        isActive: true 
      },
      select: {
        id: true,
        imageUrl: true,
        engName: true,
        thaiName: true,
        daName: true,
        details: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Get public statistics
   */
  async getPublicStats() {
    // Get total diseases
    const totalDiseases = await prisma.disease.count({
      where: { isActive: true }
    });
    
    // Get total patients from PatientVisit table
    const totalPatients = await prisma.patientVisit.count({
      where: { isActive: true }
    });
    
    // Get current month patients
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const currentMonthPatients = await prisma.patientVisit.count({
      where: {
        isActive: true,
        illnessDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });
    
    return {
      totalDiseases,
      totalPatients,
      currentMonthPatients
    };
  }

  /**
   * Get hospitals list
   */
  async getHospitals() {
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      select: {
        id: true,
        hospitalName: true,
        hospitalCode9eDigit: true,
        hospitalCode5Digit: true
      },
      orderBy: { hospitalName: 'asc' }
    });
    
    // Format for dropdown
    return hospitals.map(hospital => ({
      value: hospital.hospitalCode9eDigit || hospital.hospitalCode5Digit || hospital.id.toString(),
      label: hospital.hospitalName,
      code: hospital.hospitalCode9eDigit || hospital.hospitalCode5Digit
    }));
  }

  /**
   * Get disease information by ID
   */
  async getDiseaseInfo(diseaseId: string): Promise<DiseaseInfo | null> {
    try {
      const disease = await prisma.disease.findUnique({
        where: { 
          id: parseInt(diseaseId),
          isActive: true 
        },
        select: {
          id: true,
          thaiName: true,
          engName: true,
          daName: true
        }
      });
      
      return disease ? {
        id: disease.id,
        thaiName: disease.thaiName,
        engName: disease.engName,
        daName: disease.daName
      } : null;

    } catch (error) {
      console.error('Error fetching disease info:', error);
      return null;
    }
  }

  /**
   * Get population data for incidence rate calculation
   */
  async getPopulationData(filters: ReportFilters) {
    try {
      const where: any = { isActive: true };
      
      if (filters.year && filters.year !== 'all') {
        where.year = parseInt(filters.year);
      }
      
      if (filters.hospital && filters.hospital !== 'all') {
        where.hospitalCode = filters.hospital;
      }

      const populations = await prisma.population.findMany({
        where,
        include: {
          hospital: {
            select: {
              hospitalName: true,
              hospitalCode5Digit: true
            }
          }
        }
      });

      const totalPopulation = populations.reduce((sum, pop) => sum + pop.population, 0);
      
      return { totalPopulation, populations };
    } catch (error) {
      console.error('Error fetching population data:', error);
      return { totalPopulation: 0, populations: [] };
    }
  }

  /**
   * Get population statistics for public display
   */
  async getPopulationStats() {
    try {
      // Get current year population data
      const currentYear = new Date().getFullYear();
      
      const currentYearPops = await prisma.population.findMany({
        where: {
          isActive: true,
        },
        include: {
          hospital: {
            select: {
              hospitalName: true,
              hospitalCode5Digit: true
            }
          }
        }
      });

      // Get total population for current year
      const totalCurrentPopulation = currentYearPops.reduce((sum, pop) => sum + pop.population, 0);

      // Get hospital count with population data
      const hospitalsWithPopulation = currentYearPops.length;

      // Get years with population data
      const yearsWithData = await prisma.population.findMany({
        where: { isActive: true },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' }
      });

      return {
        currentYear,
        totalCurrentPopulation,
        hospitalsWithPopulation,
        availableYears: yearsWithData.map(p => p.year),
        hospitalBreakdown: currentYearPops.map(pop => ({
          hospitalCode: pop.hospitalCode,
          hospitalName: pop.hospital?.hospitalName,
          population: pop.population,
          year: pop.year
        }))
      };
    } catch (error) {
      console.error('Error fetching population stats:', error);
      return {
        currentYear: new Date().getFullYear(),
        totalCurrentPopulation: 0,
        hospitalsWithPopulation: 0,
        availableYears: [],
        hospitalBreakdown: []
      };
    }
  }

  /**
   * Calculate incidence rate per 100,000 population
   */
  async calculateIncidenceRate(patientCount: number, populationCount: number, per: number = 100000): Promise<number> {
    if (populationCount === 0) return 0;
    return Math.round((patientCount / populationCount) * per * 100) / 100; // 2 decimal places
  }

  /**
   * Age Groups Report
   */
  async getAgeGroupsReport(filters: ReportFilters) {
    // Get disease info
    const disease = await this.getDiseaseInfo(filters.diseaseId);
    if (!disease) {
      throw new Error('ไม่พบข้อมูลโรคที่ระบุ');
    }

    // Build where conditions
    const where = buildWhereConditions(filters);

    // Get patient data
    const patients = await prisma.patientVisit.findMany({
      where,
      select: {
        ageAtIllness: true,
        birthday: true,
        illnessDate: true
      }
    });

    // Calculate age groups
    const ageGroupCounts: Record<string, number> = {};
    const ageOrder = ['< 1 ปี', '1-4 ปี', '5-9 ปี', '10-14 ปี', '15-24 ปี', '25-34 ปี', '35-44 ปี', '45-54 ปี', '55-64 ปี', '65+ ปี'];

    // Initialize all age groups to 0
    ageOrder.forEach(group => {
      ageGroupCounts[group] = 0;
    });

    // Count patients in each age group
    patients.forEach(patient => {
      let age = patient.ageAtIllness || 0;
      
      // If age_at_illness is not available, calculate from birthday and illness_date
      if (!age && patient.birthday && patient.illnessDate) {
        age = calculateAge(patient.birthday, patient.illnessDate);
      }
      
      const ageGroup = getAgeGroup(age);
      ageGroupCounts[ageGroup] = (ageGroupCounts[ageGroup] || 0) + 1;
    });

    // Get population data for incidence rate calculation
    const { totalPopulation } = await this.getPopulationData(filters);

    // Calculate total patients
    const totalPatients = patients.length;

    // Format response
    const ageGroups: AgeGroupData[] = ageOrder.map(group => ({
      ageGroup: group,
      count: ageGroupCounts[group] || 0,
      percentage: totalPatients > 0 ? ((ageGroupCounts[group] || 0) / totalPatients) * 100 : 0,
      incidenceRate: totalPopulation > 0 ? ((ageGroupCounts[group] || 0) / totalPopulation) * 100000 : 0
    })).filter(group => group.count > 0); // Only include groups with patients

    return {
      disease: {
        id: disease.id,
        thaiName: disease.thaiName,
        engName: disease.engName,
        daName: disease.daName
      },
      filters,
      summary: {
        totalPatients,
        totalPopulation,
        hasPopulationData: totalPopulation > 0
      },
      ageGroups
    };
  }

  /**
   * Gender Ratio Report
   */
  async getGenderRatioReport(filters: ReportFilters) {
    const disease = await this.getDiseaseInfo(filters.diseaseId);
    if (!disease) {
      throw new Error('ไม่พบข้อมูลโรคที่ระบุ');
    }

    // Build where conditions (exclude gender from filter for analysis)
    const where = buildWhereConditions({ ...filters, gender: 'all' });

    // Get gender distribution
    const genderCounts = await prisma.patientVisit.groupBy({
      by: ['gender'],
      where,
      _count: {
        gender: true
      }
    });

    // Process gender data
    let genderData: GenderData = {
      total: 0,
      male: 0,
      female: 0,
      other: 0,
      notSpecified: 0
    };

    genderCounts.forEach(group => {
      const count = group._count.gender;
      genderData.total += count;

      switch (group.gender?.toLowerCase()) {
        case 'ชาย':
        case 'm':
        case 'male':
          genderData.male = count;
          break;
        case 'หญิง':
        case 'f':
        case 'female':
          genderData.female = count;
          break;
        case 'อื่นๆ':
        case 'other':
          genderData.other = count;
          break;
        default:
          genderData.notSpecified = count;
          break;
      }
    });

    // Get population data
    const { totalPopulation } = await this.getPopulationData(filters);

    // Calculate ratio
    let ratio = { male: 0, female: 0 };

    if (genderData.male > 0 && genderData.female > 0) {
      const normalizedMale = genderData.male / genderData.female;
      ratio.male = +normalizedMale.toFixed(2);
      ratio.female = 1;
    } else if (genderData.male > 0) {
      ratio.male = 1;
      ratio.female = 0;
    } else if (genderData.female > 0) {
      ratio.male = 0;
      ratio.female = 1;
    }

    // Calculate percentages
    const percentages = {
      male: genderData.total > 0 ? (genderData.male / genderData.total) * 100 : 0,
      female: genderData.total > 0 ? (genderData.female / genderData.total) * 100 : 0,
      other: genderData.total > 0 ? (genderData.other / genderData.total) * 100 : 0,
      notSpecified: genderData.total > 0 ? (genderData.notSpecified / genderData.total) * 100 : 0
    };

    return {
      disease: {
        id: disease.id,
        thaiName: disease.thaiName,
        engName: disease.engName,
        daName: disease.daName
      },
      filters,
      summary: {
        total: genderData.total,
        male: genderData.male,
        female: genderData.female,
        other: genderData.other,
        notSpecified: genderData.notSpecified,
        totalPopulation,
        hasPopulationData: totalPopulation > 0
      },
      ratio,
      percentages
    };
  }

  /**
   * Incidence Rates Report - Enhanced with better population handling
   */
  async getIncidenceRatesReport(filters: ReportFilters) {
    const disease = await this.getDiseaseInfo(filters.diseaseId);
    if (!disease) {
      throw new Error('ไม่พบข้อมูลโรคที่ระบุ');
    }

    const where = buildWhereConditions(filters);

    // Get total patients
    const totalPatients = await prisma.patientVisit.count({ where });

    // Get deaths (patients who died)
    const deaths = await prisma.patientVisit.count({
      where: {
        ...where,
        OR: [
          { patientCondition: 'เสียชีวิต' },
          { patientCondition: 'ตาย' },
          { deathDate: { not: null } }
        ]
      }
    });

    // Get population data
    const { totalPopulation, populations } = await this.getPopulationData(filters);

    // Calculate overall rates
    const incidenceRate = await this.calculateIncidenceRate(totalPatients, totalPopulation);
    const mortalityRate = await this.calculateIncidenceRate(deaths, totalPopulation);
    const caseFatalityRate = totalPatients > 0 ? Math.round((deaths / totalPatients) * 100 * 100) / 100 : 0;

    // Get hospitals data for detailed breakdown
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      select: {
        id: true,
        hospitalName: true,
        hospitalCode9eDigit: true,
        hospitalCode5Digit: true
      }
    });
    
    // Calculate rates by hospital
    const hospitalStats = await Promise.all(
      hospitals.map(async (hospital) => {
        const hospitalCode = hospital.hospitalCode9eDigit || hospital.hospitalCode5Digit;
        const hospitalWhere = {
          ...where,
          hospitalCode
        };

        const hospitalPatients = await prisma.patientVisit.count({ where: hospitalWhere });
        const hospitalDeaths = await prisma.patientVisit.count({
          where: {
            ...hospitalWhere,
            OR: [
              { patientCondition: 'เสียชีวิต' },
              { patientCondition: 'ตาย' },
              { deathDate: { not: null } }
            ]
          }
        });

        // Find population for this hospital
        const hospitalPopulation = populations
          .filter(pop => pop.hospitalCode === hospitalCode)
          .reduce((sum, pop) => sum + pop.population, 0);

        const hospitalIncidenceRate = await this.calculateIncidenceRate(hospitalPatients, hospitalPopulation);
        const hospitalMortalityRate = await this.calculateIncidenceRate(hospitalDeaths, hospitalPopulation);
        const hospitalCaseFatalityRate = hospitalPatients > 0 ? Math.round((hospitalDeaths / hospitalPatients) * 100 * 100) / 100 : 0;

        return {
          hospitalCode,
          hospitalName: hospital.hospitalName,
          population: hospitalPopulation,
          patients: hospitalPatients,
          deaths: hospitalDeaths,
          incidenceRate: hospitalIncidenceRate,
          mortalityRate: hospitalMortalityRate,
          caseFatalityRate: hospitalCaseFatalityRate,
          hasPopulationData: hospitalPopulation > 0
        };
      })
    );

    // Filter out hospitals with no patients and sort by patients count
    const activeHospitalStats = hospitalStats
      .filter(stat => stat.patients > 0)
      .sort((a, b) => b.patients - a.patients);

    return {
      disease: {
        id: disease.id,
        thaiName: disease.thaiName,
        engName: disease.engName,
        daName: disease.daName
      },
      filters,
      summary: {
        totalPopulation,
        totalPatients,
        deaths,
        incidenceRate,
        mortalityRate,
        caseFatalityRate,
        hasPopulationData: totalPopulation > 0,
        populationNote: totalPopulation === 0 ? 'ไม่มีข้อมูลประชากรสำหรับการคำนวณอัตราป่วย' : undefined
      },
      hospitals: activeHospitalStats,
      populationDetails: {
        totalHospitalsWithData: populations.length,
        yearsCovered: [...new Set(populations.map(p => p.year))].sort(),
        note: 'อัตราป่วยคำนวณจากจำนวนผู้ป่วยต่อประชากร 100,000 คน'
      }
    };
  }

  /**
   * Occupation Report
   */
  async getOccupationReport(filters: ReportFilters) {
    const disease = await this.getDiseaseInfo(filters.diseaseId);
    if (!disease) {
      throw new Error('ไม่พบข้อมูลโรคที่ระบุ');
    }

    // Build where conditions (exclude occupation from filter for analysis)
    const where = buildWhereConditions({ ...filters, occupation: 'all' });

    // Get occupation distribution
    const occupationCounts = await prisma.patientVisit.groupBy({
      by: ['occupation'],
      where,
      _count: {
        occupation: true
      },
      orderBy: {
        _count: {
          occupation: 'desc'
        }
      }
    });

    // Calculate total patients
    const totalPatients = await prisma.patientVisit.count({ where });

    // Format occupation data
    const occupations: OccupationData[] = occupationCounts.map(group => ({
      occupation: group.occupation || 'ไม่ระบุ',
      count: group._count.occupation,
      percentage: totalPatients > 0 ? (group._count.occupation / totalPatients) * 100 : 0
    }));

    return {
      disease: {
        id: disease.id,
        thaiName: disease.thaiName,
        engName: disease.engName,
        daName: disease.daName
      },
      filters,
      summary: {
        totalPatients,
        uniqueOccupations: occupations.length
      },
      occupations
    };
  }
}

export const publicService = new PublicService();