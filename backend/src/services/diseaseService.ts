// backend/src/services/diseaseService.ts

import { PrismaClient, Disease } from '@prisma/client';
import type { 
  CreateDiseaseData, 
  UpdateDiseaseData, 
  DiseaseQueryParams 
} from '../validations/diseaseValidation';

const prisma = new PrismaClient();

// Types for service responses
export interface DiseaseWithSymptoms extends Disease {
  symptoms: Array<{
    id: number;
    name: string;
    isActive: boolean;
  }>;
}

export interface PaginatedDiseaseResponse {
  diseases: DiseaseWithSymptoms[];
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
    isActive?: boolean;
  };
}

export interface DiseaseStats {
  totalDiseases: number;
  activeDiseases: number;
  inactiveDiseases: number;
  withSymptoms: number;
  withoutSymptoms: number;
  mostRecentDisease?: {
    id: number;
    thaiName: string;
    createdAt: Date;
  };
}

class DiseaseService {
  /**
   * Create a new disease record
   */
  async createDisease(
    data: CreateDiseaseData,
    createdBy: string
  ): Promise<DiseaseWithSymptoms> {
    // Check for duplicate Thai name
    const existingDisease = await prisma.disease.findFirst({
      where: { 
        thaiName: data.thaiName,
        isActive: true 
      }
    });

    if (existingDisease) {
      throw new Error(`Disease with Thai name "${data.thaiName}" already exists`);
    }

    // Check for duplicate English name (if provided)
    if (data.engName) {
      const existingEngDisease = await prisma.disease.findFirst({
        where: { 
          engName: data.engName,
          isActive: true 
        }
      });

      if (existingEngDisease) {
        throw new Error(`Disease with English name "${data.engName}" already exists`);
      }
    }

    const disease = await prisma.disease.create({
      data: {
        ...data,
        createdBy,
        updatedBy: createdBy,
      },
      include: {
        symptoms: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    return disease;
  }

  /**
   * Get paginated list of diseases with filters
   */
  async getDiseases(params: DiseaseQueryParams): Promise<PaginatedDiseaseResponse> {
    const { page, limit, search, isActive, sortBy, sortOrder } = params;
    
    // Build where clause
    let whereClause: any = {};

    // Active/Inactive filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    // Search across multiple fields
    if (search) {
      whereClause.OR = [
        { thaiName: { contains: search, mode: 'insensitive' } },
        { engName: { contains: search, mode: 'insensitive' } },
        { daName: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.disease.count({ where: whereClause });

    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch diseases with symptoms
    const diseases = await prisma.disease.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        symptoms: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    return {
      diseases,
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
        isActive,
      }
    };
  }

  /**
   * Get disease by ID
   */
  async getDiseaseById(id: number): Promise<DiseaseWithSymptoms | null> {
    const disease = await prisma.disease.findFirst({
      where: { id },
      include: {
        symptoms: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    return disease;
  }

  /**
   * Update disease record
   */
  async updateDisease(
    id: number,
    data: UpdateDiseaseData,
    updatedBy: string
  ): Promise<DiseaseWithSymptoms> {
    // Check if disease exists
    const existingDisease = await prisma.disease.findFirst({
      where: { id }
    });

    if (!existingDisease) {
      throw new Error(`Disease with ID ${id} not found`);
    }

    // Check for duplicate Thai name (if being updated)
    if (data.thaiName && data.thaiName !== existingDisease.thaiName) {
      const duplicateThaiDisease = await prisma.disease.findFirst({
        where: { 
          thaiName: data.thaiName,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicateThaiDisease) {
        throw new Error(`Disease with Thai name "${data.thaiName}" already exists`);
      }
    }

    // Check for duplicate English name (if being updated)
    if (data.engName && data.engName !== existingDisease.engName) {
      const duplicateEngDisease = await prisma.disease.findFirst({
        where: { 
          engName: data.engName,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicateEngDisease) {
        throw new Error(`Disease with English name "${data.engName}" already exists`);
      }
    }

    const updatedDisease = await prisma.disease.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
      include: {
        symptoms: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    return updatedDisease;
  }

  /**
   * Soft delete disease record
   */
  async deleteDisease(id: number, deletedBy: string): Promise<boolean> {
    // Check if disease exists
    const disease = await prisma.disease.findFirst({
      where: { id }
    });

    if (!disease) {
      throw new Error(`Disease with ID ${id} not found`);
    }

    // Check if disease is being used by patients
    const patientCount = await prisma.patientVisit.count({
      where: { 
        diseaseId: id,
        isActive: true 
      }
    });

    if (patientCount > 0) {
      throw new Error(`Cannot delete disease: ${patientCount} active patient records are using this disease`);
    }

    // Soft delete the disease and its symptoms
    await prisma.$transaction([
      // Deactivate all symptoms of this disease
      prisma.symptom.updateMany({
        where: { diseaseId: id },
        data: {
          isActive: false,
          updatedBy: deletedBy,
        }
      }),
      // Deactivate the disease
      prisma.disease.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: deletedBy,
        }
      })
    ]);

    return true;
  }

  /**
   * Get disease statistics
   */
  async getDiseaseStats(): Promise<DiseaseStats> {
    // Get total diseases
    const totalDiseases = await prisma.disease.count();

    // Get active/inactive counts
    const activeDiseases = await prisma.disease.count({
      where: { isActive: true }
    });

    const inactiveDiseases = totalDiseases - activeDiseases;

    // Get diseases with/without symptoms
    const diseasesWithSymptoms = await prisma.disease.count({
      where: {
        isActive: true,
        symptoms: {
          some: {
            isActive: true
          }
        }
      }
    });

    const withoutSymptoms = activeDiseases - diseasesWithSymptoms;

    // Get most recent disease
    const mostRecentDisease = await prisma.disease.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        thaiName: true,
        createdAt: true,
      }
    });

    return {
      totalDiseases,
      activeDiseases,
      inactiveDiseases,
      withSymptoms: diseasesWithSymptoms,
      withoutSymptoms,
      mostRecentDisease,
    };
  }

  /**
   * Search diseases by name (for dropdowns)
   */
  async searchDiseases(searchTerm: string, limit: number = 10): Promise<Array<{
    id: number;
    thaiName: string;
    engName: string | null;
  }>> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const diseases = await prisma.disease.findMany({
      where: {
        isActive: true,
        OR: [
          { thaiName: { contains: searchTerm, mode: 'insensitive' } },
          { engName: { contains: searchTerm, mode: 'insensitive' } },
        ]
      },
      take: limit,
      orderBy: { thaiName: 'asc' },
      select: {
        id: true,
        thaiName: true,
        engName: true,
      }
    });

    return diseases;
  }

  /**
   * Get all active diseases (for dropdowns)
   */
  async getActiveDiseases(): Promise<Array<{
    id: number;
    thaiName: string;
    engName: string | null;
    symptomCount: number;
  }>> {
    const diseases = await prisma.disease.findMany({
      where: { isActive: true },
      orderBy: { thaiName: 'asc' },
      select: {
        id: true,
        thaiName: true,
        engName: true,
        _count: {
          select: {
            symptoms: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    return diseases.map(disease => ({
      id: disease.id,
      thaiName: disease.thaiName,
      engName: disease.engName,
      symptomCount: disease._count.symptoms,
    }));
  }

  /**
   * Check if disease name is available
   */
  async isDiseaseNameAvailable(thaiName: string, engName?: string, excludeId?: number): Promise<{
    thaiNameAvailable: boolean;
    engNameAvailable: boolean;
  }> {
    const whereConditions: any = {
      isActive: true,
    };

    if (excludeId) {
      whereConditions.id = { not: excludeId };
    }

    // Check Thai name
    const thaiNameExists = await prisma.disease.findFirst({
      where: {
        ...whereConditions,
        thaiName,
      }
    });

    // Check English name (if provided)
    let engNameExists = null;
    if (engName) {
      engNameExists = await prisma.disease.findFirst({
        where: {
          ...whereConditions,
          engName,
        }
      });
    }

    return {
      thaiNameAvailable: !thaiNameExists,
      engNameAvailable: engName ? !engNameExists : true,
    };
  }
}

// Export singleton instance
export const diseaseService = new DiseaseService();
export default diseaseService;