// backend/src/services/populationService.ts
// ✅ FIXED: Handle soft delete conflicts properly

import { PrismaClient, Population } from '@prisma/client';
import { DateUtils } from '../utils/dateUtils';
import type { 
  CreatePopulationData, 
  UpdatePopulationData, 
  PopulationQueryParams,
  IncidenceRateParams
} from '../validations/populationValidation';

const prisma = new PrismaClient();

// ✅ FIXED: Type-safe where clause interfaces for population operations
interface PopulationWhereClause {
  isActive: boolean;
  hospitalCode?: string;
  year?: number;
  population?: {
    gte?: number;
    lte?: number;
  };
}

interface PopulationCountWhereClause {
  isActive: boolean;
  hospitalCode?: string;
  year?: number;
}

interface PatientVisitWhereClause {
  isActive: boolean;
  hospitalCode?: string;
  illnessDate: {
    gte: Date;
    lte: Date;
  };
  diseaseId?: number;
}

// Types for service responses
export interface PopulationWithRelations extends Population {
  hospital: {
    id: number;
    hospitalName: string | null;
    hospitalCode5Digit: string;
  };
}

export interface PaginatedPopulationResponse {
  populations: PopulationWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    year?: number;
    hospitalCode?: string;
    minPopulation?: number;
    maxPopulation?: number;
  };
}

export interface IncidenceRateResult {
  hospitalCode: string;
  hospitalName: string | null;
  year: number;
  population: number;
  patientCount: number;
  incidenceRate: number;
  per: number;
  disease?: {
    id: number;
    thaiName: string;
    engName: string | null;
  };
}

// 🚀 Hospital Access Context for Population Service
export interface HospitalAccessContext {
  userRole: string;
  userHospitalCode?: string;
  permissions: string[];
  canAccessAllHospitals: boolean;
}

class PopulationService {
  /**
   * ✅ FIXED: Type-safe hospital filtering based on user permissions
   * NOTE: Population data access is restricted to ADMIN and SUPERUSER only
   * USER role should not have access to population data
   */
  private applyHospitalFilter(
    whereClause: PopulationWhereClause, 
    context?: HospitalAccessContext
  ): PopulationWhereClause {
    if (!context) return whereClause;

    // 🚨 SECURITY: USER role should never access population data
    if (context.userRole === 'USER') {
      throw new Error('Access denied: USER role cannot access population data');
    }

    // SUPERUSER and ADMIN with global permissions can see all
    if (context.canAccessAllHospitals) {
      return whereClause;
    }

    // If for some reason an ADMIN is hospital-scoped (future feature)
    if (context.userHospitalCode) {
      whereClause.hospitalCode = context.userHospitalCode;
    }

    return whereClause;
  }

  /**
   * ✅ FIXED: Type-safe hospital filtering for count operations
   */
  private applyHospitalFilterToCount(
    whereClause: PopulationCountWhereClause, 
    context?: HospitalAccessContext
  ): PopulationCountWhereClause {
    if (!context) return whereClause;

    // 🚨 SECURITY: USER role should never access population data
    if (context.userRole === 'USER') {
      throw new Error('Access denied: USER role cannot access population data');
    }

    // SUPERUSER and ADMIN with global permissions can see all
    if (context.canAccessAllHospitals) {
      return whereClause;
    }

    // If for some reason an ADMIN is hospital-scoped (future feature)
    if (context.userHospitalCode) {
      whereClause.hospitalCode = context.userHospitalCode;
    }

    return whereClause;
  }

  /**
   * ✅ FIXED: Type-safe hospital filtering for patient visit queries
   */
  private applyHospitalFilterToPatientVisit(
    whereClause: PatientVisitWhereClause, 
    context?: HospitalAccessContext
  ): PatientVisitWhereClause {
    if (!context) return whereClause;

    // 🚨 SECURITY: USER role should never access population data
    if (context.userRole === 'USER') {
      throw new Error('Access denied: USER role cannot access population data');
    }

    // SUPERUSER and ADMIN with global permissions can see all
    if (context.canAccessAllHospitals) {
      return whereClause;
    }

    // If for some reason an ADMIN is hospital-scoped (future feature)
    if (context.userHospitalCode) {
      whereClause.hospitalCode = context.userHospitalCode;
    }

    return whereClause;
  }

  /**
   * 🚀 NEW: Handle soft delete conflicts - reactivate existing records
   */
  private async handleSoftDeleteConflict(
    data: CreatePopulationData,
    createdBy: string
  ): Promise<PopulationWithRelations | null> {
    // Look for any existing record (including soft deleted ones)
    const existingRecord = await prisma.population.findFirst({
      where: {
        year: data.year,
        hospitalCode: data.hospitalCode,
        // Don't filter by isActive - we want to find even deleted records
      },
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
          }
        }
      }
    });

    if (existingRecord) {
      if (existingRecord.isActive) {
        // Record exists and is active - this is a real conflict
        throw new Error(`Population data for year ${data.year} and hospital ${data.hospitalCode} already exists`);
      } else {
        // Record exists but is soft deleted - reactivate it with new data
        console.log(`Reactivating soft-deleted population record ID ${existingRecord.id}`);
        
        const reactivatedRecord = await prisma.population.update({
          where: { id: existingRecord.id },
          data: {
            population: data.population, // Update with new population count
            isActive: true,
            updatedBy: createdBy,
            updatedAt: new Date(),
          },
          include: {
            hospital: {
              select: {
                id: true,
                hospitalName: true,
                hospitalCode5Digit: true,
              }
            }
          }
        });

        return reactivatedRecord;
      }
    }

    return null; // No existing record found, safe to create new
  }

  /**
   * ✅ FIXED: Create population record with soft delete handling
   */
  async createPopulation(
    data: CreatePopulationData,
    createdBy: string,
    context?: HospitalAccessContext
  ): Promise<PopulationWithRelations> {
    // 🚨 Security check - only ADMIN and SUPERUSER can create population data
    if (context?.userRole === 'USER') {
      throw new Error('Access denied: USER role cannot create population data');
    }

    // Verify hospital exists
    const hospital = await prisma.hospital.findFirst({
      where: { hospitalCode5Digit: data.hospitalCode, isActive: true }
    });

    if (!hospital) {
      throw new Error(`Hospital with code ${data.hospitalCode} not found or inactive`);
    }

    // 🚀 NEW: Handle soft delete conflicts
    const reactivatedRecord = await this.handleSoftDeleteConflict(data, createdBy);
    if (reactivatedRecord) {
      return reactivatedRecord;
    }

    // No conflict, create new record
    try {
      const population = await prisma.population.create({
        data: {
          ...data,
          createdBy,
          updatedBy: createdBy,
        },
        include: {
          hospital: {
            select: {
              id: true,
              hospitalName: true,
              hospitalCode5Digit: true,
            }
          }
        }
      });

      return population;
    } catch (error: any) {
      // If we still get a unique constraint error, it means there's a race condition
      // Try to handle it one more time
      if (error.code === 'P2002' && error.meta?.target?.includes('year') && error.meta?.target?.includes('hospital_code')) {
        console.log('Handling race condition in population creation');
        const retryReactivation = await this.handleSoftDeleteConflict(data, createdBy);
        if (retryReactivation) {
          return retryReactivation;
        }
      }
      
      // Re-throw the original error if we can't handle it
      throw error;
    }
  }

  /**
   * ✅ FIXED: Type-safe get paginated populations with filters and hospital access control
   */
  async getPopulations(
    params: PopulationQueryParams,
    context?: HospitalAccessContext
  ): Promise<PaginatedPopulationResponse> {
    const { page, limit, year, hospitalCode, minPopulation, maxPopulation, sortBy, sortOrder } = params;

    // ✅ FIXED: Type-safe where clause
    let whereClause: PopulationWhereClause = {
      isActive: true,
    };

    // 🚀 Apply hospital filtering based on user permissions
    whereClause = this.applyHospitalFilter(whereClause, context);

    if (year) {
      whereClause.year = year;
    }

    if (hospitalCode) {
      // Additional hospital filter validation
      if (context && context.userRole !== 'SUPERUSER' && context.userHospitalCode && context.userHospitalCode !== hospitalCode) {
        throw new Error(`Access denied: You can only view population data for hospital ${context.userHospitalCode}`);
      }
      whereClause.hospitalCode = hospitalCode;
    }

    if (minPopulation || maxPopulation) {
      whereClause.population = {};
      if (minPopulation) {
        whereClause.population.gte = minPopulation;
      }
      if (maxPopulation) {
        whereClause.population.lte = maxPopulation;
      }
    }

    // Get total count
    const total = await prisma.population.count({ where: whereClause });

    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch populations
    const populations = await prisma.population.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
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
      populations,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
      filters: {
        year,
        hospitalCode,
        minPopulation,
        maxPopulation,
      }
    };
  }

  /**
   * ✅ FIXED: Type-safe get population by ID with hospital access control
   */
  async getPopulationById(
    id: number,
    context?: HospitalAccessContext
  ): Promise<PopulationWithRelations | null> {
    let whereClause: any = { id, isActive: true };

    // 🚀 Apply hospital filtering
    whereClause = this.applyHospitalFilter(whereClause, context);

    const population = await prisma.population.findFirst({
      where: whereClause,
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
          }
        }
      }
    });

    return population;
  }

  /**
   * ✅ FIXED: Type-safe update population record with hospital access control and soft delete handling
   */
  async updatePopulation(
    id: number,
    data: UpdatePopulationData,
    updatedBy: string,
    context?: HospitalAccessContext
  ): Promise<PopulationWithRelations> {
    // Check if population exists and user has access
    const existingPopulation = await this.getPopulationById(id, context);

    if (!existingPopulation) {
      throw new Error(`Population record with ID ${id} not found or access denied`);
    }

    // 🚨 Hospital access validation
    if (context?.userRole !== 'SUPERUSER' && context?.userHospitalCode) {
      if (data.hospitalCode && data.hospitalCode !== context.userHospitalCode) {
        throw new Error(`Access denied: You can only update population data for hospital ${context.userHospitalCode}`);
      }
      
      if (existingPopulation.hospitalCode !== context.userHospitalCode) {
        throw new Error(`Access denied: Population record belongs to different hospital`);
      }
    }

    // If updating year or hospitalCode, check for duplicates (only active records)
    if (data.year || data.hospitalCode) {
      const checkYear = data.year || existingPopulation.year;
      const checkHospitalCode = data.hospitalCode || existingPopulation.hospitalCode;

      const duplicatePopulation = await prisma.population.findFirst({
        where: {
          year: checkYear,
          hospitalCode: checkHospitalCode,
          isActive: true, // ✅ FIXED: Only check for active duplicates
          id: { not: id }
        }
      });

      if (duplicatePopulation) {
        throw new Error(`Population data for year ${checkYear} and hospital ${checkHospitalCode} already exists`);
      }
    }

    // Verify hospital exists (if updating hospitalCode)
    if (data.hospitalCode) {
      const hospital = await prisma.hospital.findFirst({
        where: { hospitalCode5Digit: data.hospitalCode, isActive: true }
      });

      if (!hospital) {
        throw new Error(`Hospital with code ${data.hospitalCode} not found or inactive`);
      }
    }

    const updatedPopulation = await prisma.population.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
          }
        }
      }
    });

    return updatedPopulation;
  }

  /**
   * ✅ FIXED: Type-safe soft delete population record with hospital access control
   */
  async deletePopulation(
    id: number, 
    deletedBy: string,
    context?: HospitalAccessContext
  ): Promise<boolean> {
    // Check if population exists and user has access
    const population = await this.getPopulationById(id, context);

    if (!population) {
      throw new Error(`Population record with ID ${id} not found or access denied`);
    }

    // 🚨 Only SUPERUSER can delete population data (enforced in routes)
    if (context?.userRole !== 'SUPERUSER') {
      throw new Error('Access denied: Only SUPERUSER can delete population data');
    }

    await prisma.population.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: deletedBy,
      }
    });

    console.log(`Soft deleted population record ID ${id} for year ${population.year}, hospital ${population.hospitalCode}`);
    return true;
  }

  // ... (rest of the methods remain unchanged)
  
  /**
   * ✅ FIXED: Type-safe calculate incidence rate with hospital access control
   */
  async calculateIncidenceRate(
    params: IncidenceRateParams,
    context?: HospitalAccessContext
  ): Promise<IncidenceRateResult[]> {
    const { hospitalCode, year, diseaseId, per } = params;

    // 🚨 Security check - only ADMIN and SUPERUSER can calculate incidence rates
    if (context?.userRole === 'USER') {
      throw new Error('Access denied: USER role cannot access incidence rate calculations');
    }

    // ✅ FIXED: Type-safe base query conditions
    let populationWhere: PopulationCountWhereClause = {
      year,
      isActive: true,
    };

    let patientWhere: PatientVisitWhereClause = {
      isActive: true,
      illnessDate: {
        gte: DateUtils.getStartOfYear(year),
        lte: DateUtils.getEndOfYear(year),
      }
    };

    // Apply hospital filtering
    if (hospitalCode) {
      // Validate hospital access
      if (context && context.userRole !== 'SUPERUSER' && context.userHospitalCode && context.userHospitalCode !== hospitalCode) {
        throw new Error(`Access denied: You can only calculate incidence rates for hospital ${context.userHospitalCode}`);
      }
      populationWhere.hospitalCode = hospitalCode;
      patientWhere.hospitalCode = hospitalCode;
    } else if (context?.userHospitalCode && context.userRole !== 'SUPERUSER') {
      // If no specific hospital requested but user is hospital-scoped
      populationWhere.hospitalCode = context.userHospitalCode;
      patientWhere.hospitalCode = context.userHospitalCode;
    }

    if (diseaseId) {
      patientWhere.diseaseId = diseaseId;
    }

    // Get population data
    const populations = await prisma.population.findMany({
      where: populationWhere,
      include: {
        hospital: {
          select: {
            hospitalName: true,
          }
        }
      }
    });

    if (populations.length === 0) {
      throw new Error(`No population data found for year ${year}${hospitalCode ? ` and hospital ${hospitalCode}` : ''}`);
    }

    // Calculate incidence rates
    const results: IncidenceRateResult[] = [];

    for (const population of populations) {
      // ✅ FIXED: Type-safe patient count query
      const patientCountWhere: PatientVisitWhereClause = {
        ...patientWhere,
        hospitalCode: population.hospitalCode,
      };

      const patientCount = await prisma.patientVisit.count({
        where: patientCountWhere
      });

      // Calculate incidence rate
      const incidenceRate = (patientCount / population.population) * per;

      // Get disease info if specified
      let disease = undefined;
      if (diseaseId) {
        disease = await prisma.disease.findFirst({
          where: { id: diseaseId, isActive: true },
          select: {
            id: true,
            thaiName: true,
            engName: true,
          }
        });
      }

      results.push({
        hospitalCode: population.hospitalCode,
        hospitalName: population.hospital.hospitalName,
        year: population.year,
        population: population.population,
        patientCount,
        incidenceRate: Math.round(incidenceRate * 100) / 100, // Round to 2 decimal places
        per,
        disease,
      });
    }

    return results;
  }

  /**
   * ✅ FIXED: Type-safe get population by hospital and year with access control
   */
  async getPopulationByHospitalYear(
    hospitalCode: string,
    year: number,
    context?: HospitalAccessContext
  ): Promise<PopulationWithRelations | null> {
    // 🚨 Hospital access validation
    if (context && context.userRole !== 'SUPERUSER' && context.userHospitalCode && context.userHospitalCode !== hospitalCode) {
      throw new Error(`Access denied: You can only view population data for hospital ${context.userHospitalCode}`);
    }

    let whereClause: PopulationWhereClause = {
      hospitalCode,
      year,
      isActive: true,
    };

    // Apply hospital filtering
    whereClause = this.applyHospitalFilter(whereClause, context);

    const population = await prisma.population.findFirst({
      where: whereClause,
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
          }
        }
      }
    });

    return population;
  }

  /**
   * ✅ FIXED: Type-safe get population trends for a hospital with access control
   */
  async getPopulationTrends(
    hospitalCode: string,
    startYear?: number,
    endYear?: number,
    context?: HospitalAccessContext
  ): Promise<PopulationWithRelations[]> {
    // 🚨 Hospital access validation
    if (context && context.userRole !== 'SUPERUSER' && context.userHospitalCode && context.userHospitalCode !== hospitalCode) {
      throw new Error(`Access denied: You can only view population trends for hospital ${context.userHospitalCode}`);
    }

    const currentYear = DateUtils.getCurrentYear();
    const fromYear = startYear || currentYear - 5;
    const toYear = endYear || currentYear;

    let whereClause: PopulationWhereClause = {
      hospitalCode,
      year: {
        gte: fromYear,
        lte: toYear,
      },
      isActive: true,
    };

    // Apply hospital filtering
    whereClause = this.applyHospitalFilter(whereClause, context);

    const populations = await prisma.population.findMany({
      where: whereClause,
      orderBy: {
        year: 'asc',
      },
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            hospitalCode5Digit: true,
          }
        }
      }
    });

    return populations;
  }

  /**
   * ✅ FIXED: Type-safe get population statistics with hospital filtering
   */
  async getPopulationStats(context?: HospitalAccessContext) {
    // 🚨 Security check
    if (context?.userRole === 'USER') {
      throw new Error('Access denied: USER role cannot access population statistics');
    }

    const currentYear = DateUtils.getCurrentYear();

    let baseWhere: PopulationCountWhereClause = { isActive: true };
    baseWhere = this.applyHospitalFilterToCount(baseWhere, context);

    // Total population records
    const totalRecords = await prisma.population.count({
      where: baseWhere
    });

    // ✅ FIXED: Type-safe aggregate operations
    const currentYearWhere: PopulationCountWhereClause = {
      ...baseWhere,
      year: currentYear,
    };

    const currentYearSum = await prisma.population.aggregate({
      where: currentYearWhere,
      _sum: {
        population: true,
      },
      _count: {
        hospitalCode: true,
      }
    });

    const previousYearWhere: PopulationCountWhereClause = {
      ...baseWhere,
      year: currentYear - 1,
    };

    const previousYearSum = await prisma.population.aggregate({
      where: previousYearWhere,
      _sum: {
        population: true,
      }
    });

    return {
      totalRecords,
      currentYear: {
        year: currentYear,
        totalPopulation: currentYearSum._sum.population || 0,
        hospitalCount: currentYearSum._count.hospitalCode,
      },
      previousYear: {
        year: currentYear - 1,
        totalPopulation: previousYearSum._sum.population || 0,
      },
      populationChange: currentYearSum._sum.population && previousYearSum._sum.population
        ? currentYearSum._sum.population - previousYearSum._sum.population
        : null,
      accessScope: context?.canAccessAllHospitals ? 'ALL_HOSPITALS' : 'LIMITED_HOSPITALS',
      userHospital: context?.userHospitalCode || null,
    };
  }

  /**
   * 🚀 NEW: Type-safe get hospitals accessible to user for population management
   */
  async getAccessibleHospitals(context?: HospitalAccessContext): Promise<Array<{
    hospitalCode5Digit: string;
    hospitalName: string | null;
    hasPopulationData: boolean;
  }>> {
    // 🚨 Security check
    if (context?.userRole === 'USER') {
      throw new Error('Access denied: USER role cannot access hospital population data');
    }

    // ✅ FIXED: Type-safe hospital query conditions
    interface HospitalWhereClause {
      isActive: boolean;
      hospitalCode5Digit?: string;
    }

    let hospitalWhere: HospitalWhereClause = { isActive: true };

    // Apply hospital filtering for non-SUPERUSER
    if (context?.userRole !== 'SUPERUSER' && context?.userHospitalCode) {
      hospitalWhere.hospitalCode5Digit = context.userHospitalCode;
    }

    const hospitals = await prisma.hospital.findMany({
      where: hospitalWhere,
      select: {
        hospitalCode5Digit: true,
        hospitalName: true,
        populations: {
          where: { isActive: true }, // ✅ FIXED: Only count active population records
          take: 1, // Just to check if any population data exists
        }
      },
      orderBy: {
        hospitalName: 'asc',
      }
    });

    return hospitals.map(hospital => ({
      hospitalCode5Digit: hospital.hospitalCode5Digit,
      hospitalName: hospital.hospitalName,
      hasPopulationData: hospital.populations.length > 0,
    }));
  }

  /**
   * 🚀 NEW: Type-safe validate hospital access for population operations
   */
  validateHospitalAccess(
    requestedHospitalCode: string,
    context?: HospitalAccessContext
  ): boolean {
    if (!context) return true;

    // SUPERUSER can access all hospitals
    if (context.userRole === 'SUPERUSER') {
      return true;
    }

    // ADMIN with global permissions can access all hospitals
    if (context.canAccessAllHospitals) {
      return true;
    }

    // Hospital-scoped users can only access their own hospital
    if (context.userHospitalCode) {
      return context.userHospitalCode === requestedHospitalCode;
    }

    return false;
  }
}

// Export singleton instance
export const populationService = new PopulationService();
export default populationService;