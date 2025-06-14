// backend/src/services/userService.ts

import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
  CreateUserData, 
  UpdateUserData, 
  ChangePasswordData,
  ResetPasswordData,
  UserQueryParams,
  BulkUserActionData,
  UserActivityLogParams,
  validateRoleAssignment,
  validateHospitalAccess
} from '../validations/userValidation';

const prisma = new PrismaClient();

// ✅ SECURITY: Define safe user data (exclude sensitive fields)
export interface SafeUserData {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  department?: string | null;
  position?: string | null;
  roleId: number;
  roleName: string;
  hospitalCode?: string | null;
  hospitalName?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface UserWithRelations extends Omit<User, 'passwordHash'> {
  role: {
    id: number;
    roleName: string;
    description: string | null;
  };
  hospital?: {
    id: number;
    hospitalName: string | null;
    hospitalCode5Digit: string;
    organizationType: string | null;
  } | null;
}

export interface PaginatedUserResponse {
  users: SafeUserData[];
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
    roleId?: number;
    hospitalCode?: string;
    isActive?: boolean;
    department?: string;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: Array<{
    roleId: number;
    roleName: string;
    count: number;
  }>;
  byHospital: Array<{
    hospitalCode: string;
    hospitalName: string | null;
    count: number;
  }>;
  newUsersThisMonth: number;
  lastLoginStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

// ✅ SECURITY: Hospital Access Context
export interface HospitalAccessContext {
  userRole: string;
  userHospitalCode?: string;
  permissions: string[];
  canAccessAllHospitals: boolean;
}

class UserService {
  private readonly SALT_ROUNDS = 12; // ✅ SECURITY: Strong salt rounds

  /**
   * ✅ SECURITY: Apply hospital filtering based on user permissions
   */
  private applyHospitalFilter(
    whereClause: any, 
    context?: HospitalAccessContext
  ): any {
    if (!context) return whereClause;

    // SUPERUSER and ADMIN can see all users
    if (context.canAccessAllHospitals) {
      return whereClause;
    }

    // USER can only see users from their own hospital
    if (context.userRole === 'USER' && context.userHospitalCode) {
      whereClause.hospitalCode = context.userHospitalCode;
    }

    return whereClause;
  }

  /**
   * ✅ SECURITY: Convert User to SafeUserData (exclude password)
   */
  private toSafeUserData(user: UserWithRelations): SafeUserData {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      department: user.department,
      position: user.position,
      roleId: user.roleId,
      roleName: user.role.roleName,
      hospitalCode: user.hospitalCode,
      hospitalName: user.hospital?.hospitalName || null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * ✅ SECURITY: Create new user with privilege escalation protection
   */
  async createUser(
    data: CreateUserData,
    createdBy: string,
    creatorRole: string,
    context?: HospitalAccessContext
  ): Promise<SafeUserData> {
    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId }
    });

    if (!role) {
      throw new Error(`Role with ID ${data.roleId} not found`);
    }

    // ✅ SECURITY: Prevent privilege escalation
    const roleValidation = validateRoleAssignment(creatorRole, data.roleId, role.roleName);
    if (!roleValidation.valid) {
      throw new Error(roleValidation.message || 'Unauthorized role assignment');
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (existingUser) {
      throw new Error(`Username "${data.username}" already exists`);
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: data.email }
      });

      if (existingEmail) {
        throw new Error(`Email "${data.email}" already exists`);
      }
    }

    // ✅ SECURITY: Validate hospital assignment
    if (data.hospitalCode) {
      const hospital = await prisma.hospital.findFirst({
        where: { 
          hospitalCode5Digit: data.hospitalCode,
          isActive: true 
        }
      });

      if (!hospital) {
        throw new Error(`Hospital with code ${data.hospitalCode} not found or inactive`);
      }

      // ✅ SECURITY: Check hospital access permissions
      const hospitalValidation = validateHospitalAccess(
        creatorRole,
        context?.userHospitalCode,
        data.hospitalCode
      );

      if (!hospitalValidation.valid) {
        throw new Error(hospitalValidation.message || 'Unauthorized hospital assignment');
      }
    }

    // ✅ SECURITY: Hash password with strong salt
    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        department: data.department,
        position: data.position,
        roleId: data.roleId,
        hospitalCode: data.hospitalCode,
        createdBy,
        updatedBy: createdBy,
      },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            description: true,
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

    // ✅ SECURITY: Log user creation activity
    await this.logUserActivity(newUser.id, 'USER_CREATED', createdBy, {
      createdRole: role.roleName,
      createdHospital: data.hospitalCode,
    });

    return this.toSafeUserData(newUser);
  }

  /**
   * ✅ SECURITY: Get paginated users with hospital filtering
   */
  async getUsers(
    params: UserQueryParams,
    context?: HospitalAccessContext
  ): Promise<PaginatedUserResponse> {
    const { page, limit, search, roleId, hospitalCode, isActive, department, sortBy, sortOrder } = params;

    // Build where clause
    let whereClause: any = {};

    // ✅ SECURITY: Apply hospital filtering
    whereClause = this.applyHospitalFilter(whereClause, context);

    // Apply filters
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId) {
      whereClause.roleId = roleId;
    }

    if (hospitalCode) {
      // ✅ SECURITY: Additional hospital access check
      const hospitalValidation = validateHospitalAccess(
        context?.userRole || '',
        context?.userHospitalCode,
        hospitalCode
      );

      if (!hospitalValidation.valid) {
        throw new Error(hospitalValidation.message || 'Unauthorized hospital access');
      }

      whereClause.hospitalCode = hospitalCode;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (department) {
      whereClause.department = department;
    }

    // Get total count
    const total = await prisma.user.count({ where: whereClause });

    // Calculate pagination
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === 'roleName') {
      orderBy = { role: { roleName: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy,
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            description: true,
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

    return {
      users: users.map(user => this.toSafeUserData(user)),
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
        roleId,
        hospitalCode,
        isActive,
        department,
      }
    };
  }

  /**
   * ✅ SECURITY: Get user by ID with access control
   */
  async getUserById(
    id: string,
    context?: HospitalAccessContext
  ): Promise<SafeUserData | null> {
    let whereClause: any = { id };

    // ✅ SECURITY: Apply hospital filtering
    whereClause = this.applyHospitalFilter(whereClause, context);

    const user = await prisma.user.findFirst({
      where: whereClause,
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            description: true,
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

    return user ? this.toSafeUserData(user) : null;
  }

  /**
   * ✅ SECURITY: Update user with privilege protection
   */
  async updateUser(
    id: string,
    data: UpdateUserData,
    updatedBy: string,
    updaterRole: string,
    context?: HospitalAccessContext
  ): Promise<SafeUserData> {
    // Check if user exists and has access
    const existingUser = await this.getUserById(id, context);

    if (!existingUser) {
      throw new Error(`User with ID ${id} not found or access denied`);
    }

    // ✅ SECURITY: Prevent self-role changes and privilege escalation
    if (data.roleId && data.roleId !== existingUser.roleId) {
      // Users cannot change their own role
      if (existingUser.id === updatedBy) {
        throw new Error('Users cannot change their own role');
      }

      // Get new role details
      const newRole = await prisma.role.findUnique({
        where: { id: data.roleId }
      });

      if (!newRole) {
        throw new Error(`Role with ID ${data.roleId} not found`);
      }

      // ✅ SECURITY: Validate role assignment
      const roleValidation = validateRoleAssignment(updaterRole, data.roleId, newRole.roleName);
      if (!roleValidation.valid) {
        throw new Error(roleValidation.message || 'Unauthorized role assignment');
      }
    }

    // ✅ SECURITY: Validate hospital assignment
    if (data.hospitalCode && data.hospitalCode !== existingUser.hospitalCode) {
      if (data.hospitalCode) {
        const hospital = await prisma.hospital.findFirst({
          where: { 
            hospitalCode5Digit: data.hospitalCode,
            isActive: true 
          }
        });

        if (!hospital) {
          throw new Error(`Hospital with code ${data.hospitalCode} not found or inactive`);
        }

        // ✅ SECURITY: Check hospital access permissions
        const hospitalValidation = validateHospitalAccess(
          updaterRole,
          context?.userHospitalCode,
          data.hospitalCode
        );

        if (!hospitalValidation.valid) {
          throw new Error(hospitalValidation.message || 'Unauthorized hospital assignment');
        }
      }
    }

    // Check email uniqueness (if being updated)
    if (data.email && data.email !== existingUser.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { 
          email: data.email,
          id: { not: id }
        }
      });

      if (existingEmail) {
        throw new Error(`Email "${data.email}" already exists`);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
      },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            description: true,
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

    // ✅ SECURITY: Log significant changes
    const changes: string[] = [];
    if (data.roleId && data.roleId !== existingUser.roleId) {
      changes.push(`role changed to ${updatedUser.role.roleName}`);
    }
    if (data.hospitalCode && data.hospitalCode !== existingUser.hospitalCode) {
      changes.push(`hospital changed to ${data.hospitalCode}`);
    }
    if (data.isActive !== undefined && data.isActive !== existingUser.isActive) {
      changes.push(`status changed to ${data.isActive ? 'active' : 'inactive'}`);
    }

    if (changes.length > 0) {
      await this.logUserActivity(id, 'PROFILE_UPDATE', updatedBy, {
        changes: changes.join(', ')
      });
    }

    return this.toSafeUserData(updatedUser);
  }

  /**
   * ✅ SECURITY: Change password with current password verification
   */
  async changePassword(
    userId: string,
    data: ChangePasswordData,
    requesterId: string
  ): Promise<void> {
    // Users can only change their own password unless they're SUPERUSER
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: { role: true }
    });

    if (!requester) {
      throw new Error('Requester not found');
    }

    if (userId !== requesterId && requester.role.roleName !== 'SUPERUSER') {
      throw new Error('Users can only change their own password');
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        isActive: true,
      }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // ✅ SECURITY: Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // ✅ SECURITY: Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedBy: requesterId,
        // Force re-login by updating a timestamp
        updatedAt: new Date(),
      }
    });

    // ✅ SECURITY: Log password change
    await this.logUserActivity(userId, 'PASSWORD_CHANGE', requesterId, {
      changedBy: userId === requesterId ? 'self' : requester.username
    });
  }

  /**
   * ✅ SECURITY: Reset password (SUPERUSER only)
   */
  async resetPassword(
    data: ResetPasswordData,
    resetBy: string,
    resetterRole: string
  ): Promise<void> {
    // ✅ SECURITY: Only SUPERUSER can reset passwords
    if (resetterRole !== 'SUPERUSER') {
      throw new Error('Only SUPERUSER can reset user passwords');
    }

    // Verify target user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        username: true,
        isActive: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // ✅ SECURITY: Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        passwordHash: newPasswordHash,
        updatedBy: resetBy,
        updatedAt: new Date(),
      }
    });

    // ✅ SECURITY: Log password reset with reason
    await this.logUserActivity(data.userId, 'PASSWORD_RESET', resetBy, {
      reason: data.reason,
      resetBy: resetBy
    });
  }

  /**
   * ✅ SECURITY: Soft delete user with access control
   */
  async deleteUser(
    id: string,
    deletedBy: string,
    deleterRole: string,
    context?: HospitalAccessContext
  ): Promise<void> {
    // Check if user exists and has access
    const user = await this.getUserById(id, context);

    if (!user) {
      throw new Error(`User with ID ${id} not found or access denied`);
    }

    // ✅ SECURITY: Prevent self-deletion
    if (user.id === deletedBy) {
      throw new Error('Users cannot delete their own account');
    }

    // ✅ SECURITY: Only SUPERUSER can delete SUPERUSER accounts
    if (user.roleName === 'SUPERUSER' && deleterRole !== 'SUPERUSER') {
      throw new Error('Only SUPERUSER can delete SUPERUSER accounts');
    }

    // ✅ SECURITY: ADMIN cannot delete SUPERUSER accounts
    if (user.roleName === 'SUPERUSER' && deleterRole === 'ADMIN') {
      throw new Error('ADMIN cannot delete SUPERUSER accounts');
    }

    // Soft delete user
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: deletedBy,
      }
    });

    // ✅ SECURITY: Log user deletion
    await this.logUserActivity(id, 'USER_DELETED', deletedBy, {
      deletedRole: user.roleName,
      deletedHospital: user.hospitalCode,
    });
  }

  /**
   * ✅ SECURITY: Bulk user actions with validation
   */
  async bulkUserAction(
    data: BulkUserActionData,
    actionBy: string,
    actionerRole: string,
    context?: HospitalAccessContext
  ): Promise<{ success: string[]; failed: Array<{ id: string; reason: string }> }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ id: string; reason: string }>
    };

    for (const userId of data.userIds) {
      try {
        // Check user access
        const user = await this.getUserById(userId, context);
        
        if (!user) {
          results.failed.push({
            id: userId,
            reason: 'User not found or access denied'
          });
          continue;
        }

        // ✅ SECURITY: Prevent self-actions
        if (user.id === actionBy) {
          results.failed.push({
            id: userId,
            reason: 'Cannot perform bulk actions on your own account'
          });
          continue;
        }

        // ✅ SECURITY: Role-based action validation
        if (user.roleName === 'SUPERUSER' && actionerRole !== 'SUPERUSER') {
          results.failed.push({
            id: userId,
            reason: 'Insufficient permissions for SUPERUSER account'
          });
          continue;
        }

        // Perform action
        switch (data.action) {
          case 'activate':
            await prisma.user.update({
              where: { id: userId },
              data: { isActive: true, updatedBy: actionBy }
            });
            break;

          case 'deactivate':
            await prisma.user.update({
              where: { id: userId },
              data: { isActive: false, updatedBy: actionBy }
            });
            break;

          case 'delete':
            await this.deleteUser(userId, actionBy, actionerRole, context);
            break;
        }

        // Log action
        await this.logUserActivity(userId, `BULK_${data.action.toUpperCase()}`, actionBy, {
          reason: data.reason,
          bulkAction: true
        });

        results.success.push(userId);

      } catch (error) {
        results.failed.push({
          id: userId,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * ✅ SECURITY: Get user statistics with hospital filtering
   */
  async getUserStats(context?: HospitalAccessContext): Promise<UserStats> {
    let baseWhere: any = {};
    baseWhere = this.applyHospitalFilter(baseWhere, context);

    // Total users
    const totalUsers = await prisma.user.count({
      where: baseWhere
    });

    // Active/Inactive users
    const activeUsers = await prisma.user.count({
      where: { ...baseWhere, isActive: true }
    });

    const inactiveUsers = totalUsers - activeUsers;

    // Users by role
    const roleStats = await prisma.user.groupBy({
      by: ['roleId'],
      where: { ...baseWhere, isActive: true },
      _count: { roleId: true },
    });

    const roles = await prisma.role.findMany({
      where: { id: { in: roleStats.map(s => s.roleId) } },
      select: { id: true, roleName: true }
    });

    const byRole = roleStats.map(stat => {
      const role = roles.find(r => r.id === stat.roleId);
      return {
        roleId: stat.roleId,
        roleName: role?.roleName || 'Unknown',
        count: stat._count.roleId,
      };
    });

    // Users by hospital
    const hospitalStats = await prisma.user.groupBy({
      by: ['hospitalCode'],
      where: { 
        ...baseWhere, 
        isActive: true,
        hospitalCode: { not: null }
      },
      _count: { hospitalCode: true },
    });

    const hospitals = await prisma.hospital.findMany({
      where: { 
        hospitalCode5Digit: { 
          in: hospitalStats.map(s => s.hospitalCode).filter(Boolean) as string[]
        }
      },
      select: { hospitalCode5Digit: true, hospitalName: true }
    });

    const byHospital = hospitalStats.map(stat => {
      const hospital = hospitals.find(h => h.hospitalCode5Digit === stat.hospitalCode);
      return {
        hospitalCode: stat.hospitalCode || 'Unknown',
        hospitalName: hospital?.hospitalName || null,
        count: stat._count.hospitalCode,
      };
    });

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await prisma.user.count({
      where: {
        ...baseWhere,
        createdAt: { gte: startOfMonth }
      }
    });

    // Login statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const lastLoginStats = {
      today: await prisma.user.count({
        where: {
          ...baseWhere,
          lastLoginAt: { gte: today }
        }
      }),
      thisWeek: await prisma.user.count({
        where: {
          ...baseWhere,
          lastLoginAt: { gte: startOfWeek }
        }
      }),
      thisMonth: await prisma.user.count({
        where: {
          ...baseWhere,
          lastLoginAt: { gte: startOfMonth }
        }
      }),
    };

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      byRole,
      byHospital,
      newUsersThisMonth,
      lastLoginStats,
    };
  }

  /**
   * ✅ SECURITY: Search users with access control
   */
  async searchUsers(
    searchTerm: string,
    limit: number = 10,
    context?: HospitalAccessContext
  ): Promise<SafeUserData[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    let whereClause: any = {
      isActive: true,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { username: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ]
    };

    // ✅ SECURITY: Apply hospital filtering
    whereClause = this.applyHospitalFilter(whereClause, context);

    const users = await prisma.user.findMany({
      where: whereClause,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            description: true,
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

    return users.map(user => this.toSafeUserData(user));
  }

  /**
   * ✅ SECURITY: Check username availability
   */
  async isUsernameAvailable(username: string, excludeId?: string): Promise<boolean> {
    let whereClause: any = { username };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existingUser = await prisma.user.findFirst({
      where: whereClause
    });

    return !existingUser;
  }

  /**
   * ✅ SECURITY: Check email availability
   */
  async isEmailAvailable(email: string, excludeId?: string): Promise<boolean> {
    let whereClause: any = { email };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existingUser = await prisma.user.findFirst({
      where: whereClause
    });

    return !existingUser;
  }

  /**
   * ✅ SECURITY: Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });

    await this.logUserActivity(userId, 'LOGIN', userId);
  }

  /**
   * ✅ SECURITY: Log user activities for audit trail
   */
  private async logUserActivity(
    userId: string,
    action: string,
    performedBy: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // This would typically log to a separate audit table
      // For now, we'll use console.log but in production this should be a proper audit log
      const logEntry = {
        userId,
        action,
        performedBy,
        timestamp: new Date().toISOString(),
        metadata: metadata || {},
      };

      console.log('USER_ACTIVITY_LOG:', JSON.stringify(logEntry));

      // TODO: Implement proper audit logging to database
      // await prisma.userActivityLog.create({
      //   data: logEntry
      // });
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Don't throw error - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * ✅ SECURITY: Get accessible hospitals for user assignment
   */
  async getAccessibleHospitals(context?: HospitalAccessContext): Promise<Array<{
    hospitalCode5Digit: string;
    hospitalName: string | null;
    organizationType: string | null;
    userCount: number;
  }>> {
    let whereClause: any = { isActive: true };

    // Apply hospital filtering for non-SUPERUSER users
    if (context?.userRole !== 'SUPERUSER' && context?.userHospitalCode) {
      whereClause.hospitalCode5Digit = context.userHospitalCode;
    }

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      select: {
        hospitalCode5Digit: true,
        hospitalName: true,
        organizationType: true,
        _count: {
          select: {
            users: { where: { isActive: true } }
          }
        }
      },
      orderBy: { hospitalName: 'asc' }
    });

    return hospitals.map(hospital => ({
      hospitalCode5Digit: hospital.hospitalCode5Digit,
      hospitalName: hospital.hospitalName,
      organizationType: hospital.organizationType,
      userCount: hospital._count.users,
    }));
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;