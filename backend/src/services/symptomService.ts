// backend/src/services/symptomService.ts

import { PrismaClient, Symptom } from '@prisma/client';
import type { 
  CreateSymptomData, 
  UpdateSymptomData, 
  SymptomQueryParams,
  BulkCreateSymptomsData
} from '../validations/symptomValidation';

const prisma = new PrismaClient();

// Types for service responses
export interface SymptomWithDisease extends Symptom {
  disease: {
    id: number;
    thaiName: string;
    engName: string | null;
  };
}

export interface PaginatedSymptomResponse {
  symptoms: SymptomWithDisease[];
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
    isActive?: boolean;
  };
}

export interface SymptomStats {
  totalSymptoms: number;
  activeSymptoms: number;
  inactiveSymptoms: number;
  byDisease: Array<{
    diseaseId: number;
    diseaseName: string;
    symptomCount: number;
  }>;
  mostRecentSymptom?: {
    id: number;
    name: string;
    diseaseName: string;
    createdAt: Date;
  };
}

class SymptomService {
  /**
   * Create a new symptom record
   */
  async createSymptom(
    data: CreateSymptomData,
    createdBy: string
  ): Promise<SymptomWithDisease> {
    // Verify disease exists and is active
    const disease = await prisma.disease.findFirst({
      where: { id: data.diseaseId, isActive: true }
    });

    if (!disease) {
      throw new Error(`Disease with ID ${data.diseaseId} not found or inactive`);
    }

    // Check for duplicate symptom name within the same disease
    const existingSymptom = await prisma.symptom.findFirst({
      where: { 
        diseaseId: data.diseaseId,
        name: data.name,
        isActive: true 
      }
    });

    if (existingSymptom) {
      throw new Error(`Symptom "${data.name}" already exists for disease "${disease.thaiName}"`);
    }

    const symptom = await prisma.symptom.create({
      data: {
        ...data,
        createdBy,
        updatedBy: createdBy,
      },
      include: {
        disease: {
          select: {
            id: true,
            thaiName: true,
            engName: true,
          }
        }
      }
    });

    return symptom;
  }

  /**
   * Get paginated list of symptoms with filters
   */
  async getSymptoms(params: SymptomQueryParams): Promise<PaginatedSymptomResponse> {
    const { page, limit, search, diseaseId, isActive, sortBy, sortOrder } = params;
    
    // Build where clause
    let whereClause: any = {};

    // Active/Inactive filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    // Disease filter
    if (diseaseId) {
      whereClause.diseaseId = diseaseId;
    }

    // Search by symptom name
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // Get total count for pagination
    const total = await prisma.symptom.count({ where: whereClause });

    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch symptoms with disease info
    const symptoms = await prisma.symptom.findMany({
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
        }
      }
    });

    return {
      symptoms,
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
        isActive,
      }
    };
  }

  /**
   * Get symptom by ID
   */
  async getSymptomById(id: number): Promise<SymptomWithDisease | null> {
    const symptom = await prisma.symptom.findFirst({
      where: { id },
      include: {
        disease: {
          select: {
            id: true,
            thaiName: true,
            engName: true,
          }
        }
      }
    });

    return symptom;
  }

  /**
   * Update symptom record
   */
  async updateSymptom(
    id: number,
    data: UpdateSymptomData,
    updatedBy: string
  ): Promise<SymptomWithDisease> {
    // Check if symptom exists
    const existingSymptom = await prisma.symptom.findFirst({
      where: { id }
    });

    if (!existingSymptom) {
      throw new Error(`Symptom with ID ${id} not found`);
    }

    // If updating disease, verify new disease exists and is active
    if (data.diseaseId && data.diseaseId !== existingSymptom.diseaseId) {
      const disease = await prisma.disease.findFirst({
        where: { id: data.diseaseId, isActive: true }
      });

      if (!disease) {
        throw new Error(`Disease with ID ${data.diseaseId} not found or inactive`);
      }
    }

    // Check for duplicate symptom name within the same disease (if name or disease is being updated)
    if (data.name || data.diseaseId) {
      const checkName = data.name || existingSymptom.name;
      const checkDiseaseId = data.diseaseId || existingSymptom.diseaseId;

      const duplicateSymptom = await prisma.symptom.findFirst({
        where: {
          diseaseId: checkDiseaseId,
          name: checkName,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicateSymptom) {
        const disease = await prisma.disease.findFirst({
          where: { id: checkDiseaseId }
        });
        throw new Error(`Symptom "${checkName}" already exists for disease "${disease?.thaiName}"`);
      }
    }

    const updatedSymptom = await prisma.symptom.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
      include: {
        disease: {
          select: {
            id: true,
            thaiName: true,
            engName: true,
          }
        }
      }
    });

    return updatedSymptom;
  }

  /**
   * Soft delete symptom record
   */
  async deleteSymptom(id: number, deletedBy: string): Promise<boolean> {
    // Check if symptom exists
    const symptom = await prisma.symptom.findFirst({
      where: { id }
    });

    if (!symptom) {
      throw new Error(`Symptom with ID ${id} not found`);
    }

    // Check if symptom is being used in patient records
    const patientCount = await prisma.patientVisit.count({
      where: { 
        symptomsOfDisease: {
          contains: symptom.name // Simple check - in production, this might be more complex
        },
        isActive: true 
      }
    });

    if (patientCount > 0) {
      throw new Error(`Cannot delete symptom: ${patientCount} active patient records may be using this symptom`);
    }

    // Soft delete the symptom
    await prisma.symptom.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: deletedBy,
      }
    });

    return true;
  }

  /**
   * Get symptoms by disease ID (for dropdowns/patient forms)
   */
  async getSymptomsByDisease(diseaseId: number): Promise<Array<{
    id: number;
    name: string;
  }>> {
    // Verify disease exists and is active
    const disease = await prisma.disease.findFirst({
      where: { id: diseaseId, isActive: true }
    });

    if (!disease) {
      throw new Error(`Disease with ID ${diseaseId} not found or inactive`);
    }

    const symptoms = await prisma.symptom.findMany({
      where: {
        diseaseId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      }
    });

    return symptoms;
  }

  /**
   * Search symptoms by name (for autocomplete)
   */
  async searchSymptoms(
    searchTerm: string,
    diseaseId?: number,
    limit: number = 10
  ): Promise<Array<{
    id: number;
    name: string;
    diseaseId: number;
    diseaseName: string;
  }>> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    let whereClause: any = {
      isActive: true,
      name: { contains: searchTerm, mode: 'insensitive' },
      disease: { isActive: true }, // Only include symptoms from active diseases
    };

    if (diseaseId) {
      whereClause.diseaseId = diseaseId;
    }

    const symptoms = await prisma.symptom.findMany({
      where: whereClause,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        diseaseId: true,
        disease: {
          select: {
            thaiName: true,
          }
        }
      }
    });

    return symptoms.map(symptom => ({
      id: symptom.id,
      name: symptom.name,
      diseaseId: symptom.diseaseId,
      diseaseName: symptom.disease.thaiName,
    }));
  }

  /**
   * Get symptom statistics
   */
  async getSymptomStats(): Promise<SymptomStats> {
    // Get total symptoms
    const totalSymptoms = await prisma.symptom.count();

    // Get active/inactive counts
    const activeSymptoms = await prisma.symptom.count({
      where: { isActive: true }
    });

    const inactiveSymptoms = totalSymptoms - activeSymptoms;

    // Get symptoms by disease
    const symptomsByDisease = await prisma.symptom.groupBy({
      by: ['diseaseId'],
      where: { isActive: true },
      _count: { diseaseId: true },
    });

    // Get disease names for the stats
    const diseaseIds = symptomsByDisease.map(s => s.diseaseId);
    const diseases = await prisma.disease.findMany({
      where: { id: { in: diseaseIds } },
      select: { id: true, thaiName: true }
    });

    const byDisease = symptomsByDisease.map(stat => {
      const disease = diseases.find(d => d.id === stat.diseaseId);
      return {
        diseaseId: stat.diseaseId,
        diseaseName: disease?.thaiName || 'Unknown Disease',
        symptomCount: stat._count.diseaseId,
      };
    }).sort((a, b) => b.symptomCount - a.symptomCount);

    // Get most recent symptom
    const mostRecentSymptom = await prisma.symptom.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        disease: {
          select: { thaiName: true }
        }
      }
    });

    return {
      totalSymptoms,
      activeSymptoms,
      inactiveSymptoms,
      byDisease,
      mostRecentSymptom: mostRecentSymptom ? {
        id: mostRecentSymptom.id,
        name: mostRecentSymptom.name,
        diseaseName: mostRecentSymptom.disease.thaiName,
        createdAt: mostRecentSymptom.createdAt,
      } : undefined,
    };
  }

  /**
   * Bulk create symptoms for a disease
   */
  async bulkCreateSymptoms(
    data: BulkCreateSymptomsData,
    createdBy: string
  ): Promise<Array<SymptomWithDisease>> {
    // Verify disease exists and is active
    const disease = await prisma.disease.findFirst({
      where: { id: data.diseaseId, isActive: true }
    });

    if (!disease) {
      throw new Error(`Disease with ID ${data.diseaseId} not found or inactive`);
    }

    // Check for existing symptoms with the same names
    const existingSymptoms = await prisma.symptom.findMany({
      where: {
        diseaseId: data.diseaseId,
        name: { in: data.symptoms.map(s => s.name) },
        isActive: true,
      },
      select: { name: true }
    });

    if (existingSymptoms.length > 0) {
      const duplicateNames = existingSymptoms.map(s => s.name);
      throw new Error(`The following symptoms already exist for disease "${disease.thaiName}": ${duplicateNames.join(', ')}`);
    }

    // Create symptoms using transaction
    const createdSymptoms = await prisma.$transaction(
      data.symptoms.map(symptom =>
        prisma.symptom.create({
          data: {
            diseaseId: data.diseaseId,
            name: symptom.name,
            createdBy,
            updatedBy: createdBy,
          },
          include: {
            disease: {
              select: {
                id: true,
                thaiName: true,
                engName: true,
              }
            }
          }
        })
      )
    );

    return createdSymptoms;
  }

  /**
   * Check if symptom name is available for a disease
   */
  async isSymptomNameAvailable(
    diseaseId: number,
    name: string,
    excludeId?: number
  ): Promise<boolean> {
    let whereClause: any = {
      diseaseId,
      name,
      isActive: true,
    };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existingSymptom = await prisma.symptom.findFirst({
      where: whereClause
    });

    return !existingSymptom;
  }
}

// Export singleton instance
export const symptomService = new SymptomService();
export default symptomService;