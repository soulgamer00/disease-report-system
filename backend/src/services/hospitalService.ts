// backend/src/services/hospitalService.ts

import { PrismaClient, Hospital } from '@prisma/client';
import type { 
  CreateHospitalData, 
  UpdateHospitalData, 
  HospitalQueryParams,
  BulkCreateHospitalsData,
  HospitalAssignmentData
} from '../validations/hospitalValidation';

const prisma = new PrismaClient();

// Types for service responses
export interface HospitalWithCounts extends Hospital {
  _count: {
    users: number;
    patientVisits: number;
    populations: number;
  };
}

export interface PaginatedHospitalResponse {
  hospitals: HospitalWithCounts[];
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
    organizationType?: string;
    healthServiceType?: string;
    affiliation?: string;
    isActive?: boolean;
  };
}

export interface HospitalStats {
  totalHospitals: number;
  activeHospitals: number;
  inactiveHospitals: number;
  byOrganizationType: Array<{
    type: string;
    count: number;
  }>;
  byHealthServiceType: Array<{
    type: string;
    count: number;
  }>;
  withUsers: number;
  withoutUsers: number;
  totalPatients: number;
  totalPopulationRecords: number;
  mostActiveHospital?: {
    id: number;
    name: string;
    code: string;
    patientCount: number;
    userCount: number;
  };
}

// 🚀 NEW: Hospital Access Context for filtering
export interface HospitalAccessContext {
  userRole: string;
  userHospitalCode?: string;
  permissions: string[];
  canAccessAllHospitals: boolean;
}

class HospitalService {
  /**
   * 🚀 NEW: Apply hospital filtering based on user permissions
   * Unlike other services, hospitals have special access rules:
   * - SUPERUSER: Can see and manage all
   * - ADMIN: Can see all (for reports/analytics)
   * - USER: Can see all (for reference) but can only be assigned to one
   */
  private applyHospitalFilter(
    whereClause: any, 
    context?: HospitalAccessContext,
    includeInactive: boolean = false
  ): any {
    // For hospital listings, we generally don't filter by user's hospital
    // because users need to see all hospitals for reference/dropdowns
    
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    return whereClause;
  }

  /**
   * Create a new hospital record
   */
  async createHospital(
    data: CreateHospitalData,
    createdBy: string
  ): Promise<HospitalWithCounts> {
    // Check for duplicate hospital code
    const existingHospital = await prisma.hospital.findFirst({
      where: { 
        hospitalCode5Digit: data.hospitalCode5Digit,
      }
    });

    if (existingHospital) {
      throw new Error(`Hospital with code "${data.hospitalCode5Digit}" already exists`);
    }

    // Check for duplicate 9e digit code (if provided)
    if (data.hospitalCode9eDigit) {
      const existing9eCode = await prisma.hospital.findFirst({
        where: { 
          hospitalCode9eDigit: data.hospitalCode9eDigit,
          isActive: true 
        }
      });

      if (existing9eCode) {
        throw new Error(`Hospital with 9E code "${data.hospitalCode9eDigit}" already exists`);
      }
    }

    // Check for duplicate 9 digit code (if provided)
    if (data.hospitalCode9Digit) {
      const existing9Code = await prisma.hospital.findFirst({
        where: { 
          hospitalCode9Digit: data.hospitalCode9Digit,
          isActive: true 
        }
      });

      if (existing9Code) {
        throw new Error(`Hospital with 9 digit code "${data.hospitalCode9Digit}" already exists`);
      }
    }

    const hospital = await prisma.hospital.create({
      data: {
        ...data,
        // Note: Hospital table doesn't have createdBy/updatedBy fields in current schema
        // This would need to be added to the Prisma schema if audit trail is needed
      },
      include: {
        _count: {
          select: {
            users: true,
            patientVisits: { where: { isActive: true } },
            populations: { where: { isActive: true } },
          }
        }
      }
    });

    return hospital;
  }

  /**
   * Get paginated list of hospitals with filters
   */
  async getHospitals(
    params: HospitalQueryParams,
    context?: HospitalAccessContext
  ): Promise<PaginatedHospitalResponse> {
    const { page, limit, search, organizationType, healthServiceType, affiliation, isActive, sortBy, sortOrder } = params;
    
    // Build where clause
    let whereClause: any = {};

    // Apply hospital filtering (though usually no filtering for hospitals)
    whereClause = this.applyHospitalFilter(whereClause, context);

    // Active/Inactive filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    // Search across multiple fields
    if (search) {
      whereClause.OR = [
        { hospitalName: { contains: search, mode: 'insensitive' } },
        { hospitalCode5Digit: { contains: search, mode: 'insensitive' } },
        { hospitalCode9eDigit: { contains: search, mode: 'insensitive' } },
        { hospitalCode9Digit: { contains: search, mode: 'insensitive' } },
        { organizationType: { contains: search, mode: 'insensitive' } },
        { affiliation: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (organizationType) {
      whereClause.organizationType = organizationType;
    }

    if (healthServiceType) {
      whereClause.healthServiceType = healthServiceType;
    }

    if (affiliation) {
      whereClause.affiliation = affiliation;
    }

    // Get total count for pagination
    const total = await prisma.hospital.count({ where: whereClause });

    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch hospitals with counts
    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        _count: {
          select: {
            users: true,
            patientVisits: { where: { isActive: true } },
            populations: { where: { isActive: true } },
          }
        }
      }
    });

    return {
      hospitals,
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
        organizationType,
        healthServiceType,
        affiliation,
        isActive,
      }
    };
  }

  /**
   * Get hospital by ID
   */
  async getHospitalById(id: number): Promise<HospitalWithCounts | null> {
    const hospital = await prisma.hospital.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            patientVisits: { where: { isActive: true } },
            populations: { where: { isActive: true } },
          }
        }
      }
    });

    return hospital;
  }

  /**
   * Get hospital by code
   */
  async getHospitalByCode(code: string): Promise<HospitalWithCounts | null> {
    const hospital = await prisma.hospital.findFirst({
      where: { hospitalCode5Digit: code },
      include: {
        _count: {
          select: {
            users: true,
            patientVisits: { where: { isActive: true } },
            populations: { where: { isActive: true } },
          }
        }
      }
    });

    return hospital;
  }

  /**
   * Update hospital record
   */
  async updateHospital(
    id: number,
    data: UpdateHospitalData,
    updatedBy: string
  ): Promise<HospitalWithCounts> {
    // Check if hospital exists
    const existingHospital = await prisma.hospital.findFirst({
      where: { id }
    });

    if (!existingHospital) {
      throw new Error(`Hospital with ID ${id} not found`);
    }

    // Check for duplicate hospital code (if being updated)
    if (data.hospitalCode5Digit && data.hospitalCode5Digit !== existingHospital.hospitalCode5Digit) {
      const duplicateHospital = await prisma.hospital.findFirst({
        where: { 
          hospitalCode5Digit: data.hospitalCode5Digit,
          id: { not: id }
        }
      });

      if (duplicateHospital) {
        throw new Error(`Hospital with code "${data.hospitalCode5Digit}" already exists`);
      }
    }

    // Check duplicate 9e digit code (if being updated)
    if (data.hospitalCode9eDigit && data.hospitalCode9eDigit !== existingHospital.hospitalCode9eDigit) {
      const duplicate9eCode = await prisma.hospital.findFirst({
        where: { 
          hospitalCode9eDigit: data.hospitalCode9eDigit,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicate9eCode) {
        throw new Error(`Hospital with 9E code "${data.hospitalCode9eDigit}" already exists`);
      }
    }

    // Check duplicate 9 digit code (if being updated)
    if (data.hospitalCode9Digit && data.hospitalCode9Digit !== existingHospital.hospitalCode9Digit) {
      const duplicate9Code = await prisma.hospital.findFirst({
        where: { 
          hospitalCode9Digit: data.hospitalCode9Digit,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicate9Code) {
        throw new Error(`Hospital with 9 digit code "${data.hospitalCode9Digit}" already exists`);
      }
    }

    const updatedHospital = await prisma.hospital.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            users: true,
            patientVisits: { where: { isActive: true } },
            populations: { where: { isActive: true } },
          }
        }
      }
    });

    return updatedHospital;
  }

  /**
   * Soft delete hospital record
   */
  async deleteHospital(id: number, deletedBy: string): Promise<boolean> {
    // Check if hospital exists
    const hospital = await prisma.hospital.findFirst({
      where: { id }
    });

    if (!hospital) {
      throw new Error(`Hospital with ID ${id} not found`);
    }

    // Check if hospital has active users assigned
    const userCount = await prisma.user.count({
      where: { 
        hospitalCode: hospital.hospitalCode5Digit,
        isActive: true 
      }
    });

    if (userCount > 0) {
      throw new Error(`Cannot delete hospital: ${userCount} active users are assigned to this hospital`);
    }

    // Check if hospital has active patient records
    const patientCount = await prisma.patientVisit.count({
      where: { 
        hospitalCode: hospital.hospitalCode5Digit,
        isActive: true 
      }
    });

    if (patientCount > 0) {
      throw new Error(`Cannot delete hospital: ${patientCount} active patient records are associated with this hospital`);
    }

    // Soft delete the hospital
    await prisma.hospital.update({
      where: { id },
      data: {
        isActive: false,
      }
    });

    return true;
  }

  /**
   * Get hospital statistics
   */
  async getHospitalStats(): Promise<HospitalStats> {
    // Get total hospitals
    const totalHospitals = await prisma.hospital.count();

    // Get active/inactive counts
    const activeHospitals = await prisma.hospital.count({
      where: { isActive: true }
    });

    const inactiveHospitals = totalHospitals - activeHospitals;

    // Get hospitals by organization type
    const orgTypeStats = await prisma.hospital.groupBy({
      by: ['organizationType'],
      where: { isActive: true },
      _count: { organizationType: true }
    });

    const byOrganizationType = orgTypeStats
      .filter(stat => stat.organizationType)
      .map(stat => ({
        type: stat.organizationType!,
        count: stat._count.organizationType,
      }))
      .sort((a, b) => b.count - a.count);

    // Get hospitals by health service type
    const serviceTypeStats = await prisma.hospital.groupBy({
      by: ['healthServiceType'],
      where: { isActive: true },
      _count: { healthServiceType: true }
    });

    const byHealthServiceType = serviceTypeStats
      .filter(stat => stat.healthServiceType)
      .map(stat => ({
        type: stat.healthServiceType!,
        count: stat._count.healthServiceType,
      }))
      .sort((a, b) => b.count - a.count);

    // Get hospitals with/without users
    const withUsers = await prisma.hospital.count({
      where: {
        isActive: true,
        users: {
          some: {
            isActive: true
          }
        }
      }
    });

    const withoutUsers = activeHospitals - withUsers;

    // Get total patients and population records
    const totalPatients = await prisma.patientVisit.count({
      where: { isActive: true }
    });

    const totalPopulationRecords = await prisma.population.count({
      where: { isActive: true }
    });

    // Find most active hospital
    const hospitalsWithCounts = await prisma.hospital.findMany({
      where: { isActive: true },
      select: {
        id: true,
        hospitalName: true,
        hospitalCode5Digit: true,
        _count: {
          select: {
            users: { where: { isActive: true } },
            patientVisits: { where: { isActive: true } },
          }
        }
      },
      orderBy: {
        patientVisits: {
          _count: 'desc'
        }
      },
      take: 1
    });

    const mostActiveHospital = hospitalsWithCounts[0] ? {
      id: hospitalsWithCounts[0].id,
      name: hospitalsWithCounts[0].hospitalName || 'Unnamed Hospital',
      code: hospitalsWithCounts[0].hospitalCode5Digit,
      patientCount: hospitalsWithCounts[0]._count.patientVisits,
      userCount: hospitalsWithCounts[0]._count.users,
    } : undefined;

    return {
      totalHospitals,
      activeHospitals,
      inactiveHospitals,
      byOrganizationType,
      byHealthServiceType,
      withUsers,
      withoutUsers,
      totalPatients,
      totalPopulationRecords,
      mostActiveHospital,
    };
  }

  /**
   * Get all active hospitals (for dropdowns)
   */
  async getActiveHospitals(): Promise<Array<{
    id: number;
    hospitalCode5Digit: string;
    hospitalName: string | null;
    organizationType: string | null;
    userCount: number;
    patientCount: number;
  }>> {
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      orderBy: { hospitalName: 'asc' },
      select: {
        id: true,
        hospitalCode5Digit: true,
        hospitalName: true,
        organizationType: true,
        _count: {
          select: {
            users: { where: { isActive: true } },
            patientVisits: { where: { isActive: true } },
          }
        }
      }
    });

    return hospitals.map(hospital => ({
      id: hospital.id,
      hospitalCode5Digit: hospital.hospitalCode5Digit,
      hospitalName: hospital.hospitalName,
      organizationType: hospital.organizationType,
      userCount: hospital._count.users,
      patientCount: hospital._count.patientVisits,
    }));
  }

  /**
   * Search hospitals by name or code (for autocomplete)
   */
  async searchHospitals(
    searchTerm: string,
    limit: number = 10
  ): Promise<Array<{
    id: number;
    hospitalCode5Digit: string;
    hospitalName: string | null;
    organizationType: string | null;
  }>> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const hospitals = await prisma.hospital.findMany({
      where: {
        isActive: true,
        OR: [
          { hospitalName: { contains: searchTerm, mode: 'insensitive' } },
          { hospitalCode5Digit: { contains: searchTerm, mode: 'insensitive' } },
          { hospitalCode9eDigit: { contains: searchTerm, mode: 'insensitive' } },
          { hospitalCode9Digit: { contains: searchTerm, mode: 'insensitive' } },
        ]
      },
      take: limit,
      orderBy: { hospitalName: 'asc' },
      select: {
        id: true,
        hospitalCode5Digit: true,
        hospitalName: true,
        organizationType: true,
      }
    });

    return hospitals;
  }

  /**
   * Bulk create hospitals
   */
  async bulkCreateHospitals(
    data: BulkCreateHospitalsData,
    createdBy: string
  ): Promise<Array<HospitalWithCounts>> {
    // Check for existing hospital codes
    const codes = data.hospitals.map(h => h.hospitalCode5Digit);
    const existingHospitals = await prisma.hospital.findMany({
      where: {
        hospitalCode5Digit: { in: codes }
      },
      select: { hospitalCode5Digit: true }
    });

    if (existingHospitals.length > 0) {
      const duplicateCodes = existingHospitals.map(h => h.hospitalCode5Digit);
      throw new Error(`The following hospital codes already exist: ${duplicateCodes.join(', ')}`);
    }

    // Create hospitals using transaction
    const createdHospitals = await prisma.$transaction(
      data.hospitals.map(hospital =>
        prisma.hospital.create({
          data: hospital,
          include: {
            _count: {
              select: {
                users: true,
                patientVisits: { where: { isActive: true } },
                populations: { where: { isActive: true } },
              }
            }
          }
        })
      )
    );

    return createdHospitals;
  }

  /**
   * Assign hospital to user
   */
  async assignHospitalToUser(data: HospitalAssignmentData): Promise<boolean> {
    // Verify user exists and is active
    const user = await prisma.user.findFirst({
      where: { id: data.userId, isActive: true }
    });

    if (!user) {
      throw new Error(`User with ID ${data.userId} not found or inactive`);
    }

    // Verify hospital exists and is active
    const hospital = await prisma.hospital.findFirst({
      where: { hospitalCode5Digit: data.hospitalCode, isActive: true }
    });

    if (!hospital) {
      throw new Error(`Hospital with code ${data.hospitalCode} not found or inactive`);
    }

    // Update user's hospital assignment
    await prisma.user.update({
      where: { id: data.userId },
      data: { hospitalCode: data.hospitalCode }
    });

    return true;
  }

  /**
   * Check if hospital code is available
   */
  async isHospitalCodeAvailable(
    code: string,
    excludeId?: number
  ): Promise<boolean> {
    let whereClause: any = {
      hospitalCode5Digit: code,
    };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existingHospital = await prisma.hospital.findFirst({
      where: whereClause
    });

    return !existingHospital;
  }
}

// Export singleton instance
export const hospitalService = new HospitalService();
export default hospitalService;