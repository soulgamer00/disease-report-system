// backend/src/utils/permissionConstants.ts

/**
 * Permission-based Access Control Constants
 * Single source of truth for all permission codes
 */

// Permission naming convention: MODULE_ACTION_SCOPE
export const PERMISSIONS = {
  // ========== PATIENT MANAGEMENT ==========
  PATIENT_VIEW_ALL: 'PATIENT_VIEW_ALL',         // SUPERUSER, ADMIN - ดูผู้ป่วยทั้งหมด
  PATIENT_VIEW_OWN: 'PATIENT_VIEW_OWN',         // USER - ดูผู้ป่วยของ รพ.ตัวเอง
  PATIENT_CREATE: 'PATIENT_CREATE',             // SUPERUSER, ADMIN, USER - เพิ่มผู้ป่วย
  PATIENT_UPDATE: 'PATIENT_UPDATE',             // SUPERUSER, ADMIN, USER - แก้ไขผู้ป่วย
  PATIENT_DELETE: 'PATIENT_DELETE',             // SUPERUSER only - ลบผู้ป่วย
  PATIENT_EXPORT: 'PATIENT_EXPORT',             // SUPERUSER, ADMIN - Export ข้อมูล
  PATIENT_BULK_IMPORT: 'PATIENT_BULK_IMPORT',   // SUPERUSER, ADMIN - Import หลายรายการ
  
  // ========== POPULATION MANAGEMENT ==========
  POPULATION_VIEW: 'POPULATION_VIEW',           // SUPERUSER, ADMIN - ดูข้อมูลประชากร
  POPULATION_CREATE: 'POPULATION_CREATE',       // SUPERUSER, ADMIN - เพิ่มข้อมูลประชากร
  POPULATION_UPDATE: 'POPULATION_UPDATE',       // SUPERUSER, ADMIN - แก้ไขข้อมูลประชากร
  POPULATION_DELETE: 'POPULATION_DELETE',       // SUPERUSER only - ลบข้อมูลประชากร
  POPULATION_EXPORT: 'POPULATION_EXPORT',       // SUPERUSER, ADMIN - Export ข้อมูล
  
  // ========== DISEASE MANAGEMENT (Future) ==========
  DISEASE_VIEW: 'DISEASE_VIEW',                 // SUPERUSER only
  DISEASE_CREATE: 'DISEASE_CREATE',             // SUPERUSER only
  DISEASE_UPDATE: 'DISEASE_UPDATE',             // SUPERUSER only
  DISEASE_DELETE: 'DISEASE_DELETE',             // SUPERUSER only
  
  // ========== SYMPTOM MANAGEMENT (Future) ==========
  SYMPTOM_VIEW: 'SYMPTOM_VIEW',                 // SUPERUSER only
  SYMPTOM_CREATE: 'SYMPTOM_CREATE',             // SUPERUSER only
  SYMPTOM_UPDATE: 'SYMPTOM_UPDATE',             // SUPERUSER only
  SYMPTOM_DELETE: 'SYMPTOM_DELETE',             // SUPERUSER only
  
  // ========== HOSPITAL MANAGEMENT (Future) ==========
  HOSPITAL_VIEW: 'HOSPITAL_VIEW',               // SUPERUSER only
  HOSPITAL_CREATE: 'HOSPITAL_CREATE',           // SUPERUSER only
  HOSPITAL_UPDATE: 'HOSPITAL_UPDATE',           // SUPERUSER only
  HOSPITAL_DELETE: 'HOSPITAL_DELETE',           // SUPERUSER only
  
  // ========== USER MANAGEMENT (Future) ==========
  USER_VIEW: 'USER_VIEW',                       // SUPERUSER, ADMIN - ดูข้อมูลผู้ใช้งาน
  USER_CREATE: 'USER_CREATE',                   // SUPERUSER, ADMIN - เพิ่มผู้ใช้งานใหม่
  USER_UPDATE: 'USER_UPDATE',                   // SUPERUSER, ADMIN - แก้ไขข้อมูลผู้ใช้งาน
  USER_DELETE: 'USER_DELETE',                   // SUPERUSER only - ลบผู้ใช้งาน
  USER_EXPORT: 'USER_EXPORT',                   // SUPERUSER, ADMIN - Export ข้อมูลผู้ใช้
  USER_IMPORT: 'USER_IMPORT',                   // SUPERUSER, ADMIN - Import ผู้ใช้หลายคน
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',   // SUPERUSER only - รีเซ็ตรหัสผ่าน
  USER_ROLE_ASSIGN: 'USER_ROLE_ASSIGN',         // SUPERUSER only - กำหนดบท
  
  // ========== REPORTS & ANALYTICS ==========
  REPORT_VIEW_ALL: 'REPORT_VIEW_ALL',           // SUPERUSER, ADMIN - ดูรายงานทั้งหมด
  REPORT_VIEW_OWN: 'REPORT_VIEW_OWN',           // USER - ดูรายงานของ รพ.ตัวเอง
  REPORT_EXPORT: 'REPORT_EXPORT',               // SUPERUSER, ADMIN - Export รายงาน
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',             // SUPERUSER, ADMIN - ดู Analytics
} as const;

// Type safety for permission codes
export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission groups by role (for seeding database)
export const ROLE_PERMISSIONS = {
  SUPERUSER: [
    // Patient Management - Full Access
    PERMISSIONS.PATIENT_VIEW_ALL,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_DELETE,
    PERMISSIONS.PATIENT_EXPORT,
    PERMISSIONS.PATIENT_BULK_IMPORT,
    
    // Population Management - Full Access
    PERMISSIONS.POPULATION_VIEW,
    PERMISSIONS.POPULATION_CREATE,
    PERMISSIONS.POPULATION_UPDATE,
    PERMISSIONS.POPULATION_DELETE,
    PERMISSIONS.POPULATION_EXPORT,
    
    // Disease Management - Full Access
    PERMISSIONS.DISEASE_VIEW,
    PERMISSIONS.DISEASE_CREATE,
    PERMISSIONS.DISEASE_UPDATE,
    PERMISSIONS.DISEASE_DELETE,
    
    // Symptom Management - Full Access
    PERMISSIONS.SYMPTOM_VIEW,
    PERMISSIONS.SYMPTOM_CREATE,
    PERMISSIONS.SYMPTOM_UPDATE,
    PERMISSIONS.SYMPTOM_DELETE,
    
    // Hospital Management - Full Access
    PERMISSIONS.HOSPITAL_VIEW,
    PERMISSIONS.HOSPITAL_CREATE,
    PERMISSIONS.HOSPITAL_UPDATE,
    PERMISSIONS.HOSPITAL_DELETE,
    
    // User Management - Full Access
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    
    // Reports & Analytics - Full Access
    PERMISSIONS.REPORT_VIEW_ALL,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  
  ADMIN: [
    // Patient Management - Full Access (except delete)
    PERMISSIONS.PATIENT_VIEW_ALL,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_EXPORT,
    PERMISSIONS.PATIENT_BULK_IMPORT,
    
    // Population Management - Full Access (except delete)
    PERMISSIONS.POPULATION_VIEW,
    PERMISSIONS.POPULATION_CREATE,
    PERMISSIONS.POPULATION_UPDATE,
    PERMISSIONS.POPULATION_EXPORT,
    
    // Reports & Analytics - Full Access
    PERMISSIONS.REPORT_VIEW_ALL,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  
  USER: [
    // Patient Management - Own Hospital Only
    PERMISSIONS.PATIENT_VIEW_OWN,
    //PERMISSIONS.PATIENT_CREATE,//
    //PERMISSIONS.PATIENT_UPDATE,//
    
    // Reports - Own Hospital Only
    PERMISSIONS.REPORT_VIEW_OWN,
  ],
} as const;

// Permission descriptions for documentation
export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.PATIENT_VIEW_ALL]: 'ดูข้อมูลผู้ป่วยทั้งหมดในระบบ',
  [PERMISSIONS.PATIENT_VIEW_OWN]: 'ดูข้อมูลผู้ป่วยของโรงพยาบาลตัวเอง',
  [PERMISSIONS.PATIENT_CREATE]: 'เพิ่มข้อมูลผู้ป่วยใหม่',
  [PERMISSIONS.PATIENT_UPDATE]: 'แก้ไขข้อมูลผู้ป่วย',
  [PERMISSIONS.PATIENT_DELETE]: 'ลบข้อมูลผู้ป่วย (Soft Delete)',
  [PERMISSIONS.PATIENT_EXPORT]: 'Export ข้อมูลผู้ป่วยเป็นไฟล์',
  [PERMISSIONS.PATIENT_BULK_IMPORT]: 'Import ข้อมูลผู้ป่วยหลายรายการ',
  
  [PERMISSIONS.POPULATION_VIEW]: 'ดูข้อมูลประชากร',
  [PERMISSIONS.POPULATION_CREATE]: 'เพิ่มข้อมูลประชากรใหม่',
  [PERMISSIONS.POPULATION_UPDATE]: 'แก้ไขข้อมูลประชากร',
  [PERMISSIONS.POPULATION_DELETE]: 'ลบข้อมูลประชากร',
  [PERMISSIONS.POPULATION_EXPORT]: 'Export ข้อมูลประชากร',
  
  [PERMISSIONS.DISEASE_VIEW]: 'ดูข้อมูลโรค',
  [PERMISSIONS.DISEASE_CREATE]: 'เพิ่มข้อมูลโรคใหม่',
  [PERMISSIONS.DISEASE_UPDATE]: 'แก้ไขข้อมูลโรค',
  [PERMISSIONS.DISEASE_DELETE]: 'ลบข้อมูลโรค',
  
  [PERMISSIONS.SYMPTOM_VIEW]: 'ดูข้อมูลอาการ',
  [PERMISSIONS.SYMPTOM_CREATE]: 'เพิ่มข้อมูลอาการใหม่',
  [PERMISSIONS.SYMPTOM_UPDATE]: 'แก้ไขข้อมูลอาการ',
  [PERMISSIONS.SYMPTOM_DELETE]: 'ลบข้อมูลอาการ',
  
  [PERMISSIONS.HOSPITAL_VIEW]: 'ดูข้อมูลโรงพยาบาล',
  [PERMISSIONS.HOSPITAL_CREATE]: 'เพิ่มข้อมูลโรงพยาบาลใหม่',
  [PERMISSIONS.HOSPITAL_UPDATE]: 'แก้ไขข้อมูลโรงพยาบาล',
  [PERMISSIONS.HOSPITAL_DELETE]: 'ลบข้อมูลโรงพยาบาล',
  
  [PERMISSIONS.USER_VIEW]: 'ดูข้อมูลผู้ใช้งาน',
  [PERMISSIONS.USER_CREATE]: 'เพิ่มผู้ใช้งานใหม่',
  [PERMISSIONS.USER_UPDATE]: 'แก้ไขข้อมูลผู้ใช้งาน',
  [PERMISSIONS.USER_DELETE]: 'ลบผู้ใช้งาน',
  
  [PERMISSIONS.REPORT_VIEW_ALL]: 'ดูรายงานทั้งหมดในระบบ',
  [PERMISSIONS.REPORT_VIEW_OWN]: 'ดูรายงานของโรงพยาบาลตัวเอง',
  [PERMISSIONS.REPORT_EXPORT]: 'Export รายงาน',
  [PERMISSIONS.ANALYTICS_VIEW]: 'ดูข้อมูลวิเคราะห์และสถิติ',
} as const;

// Helper functions for permission checking
export class PermissionHelper {
  /**
   * Check if permission allows viewing all hospitals data
   */
  static isGlobalViewPermission(permission: PermissionCode): boolean {
    return [
      PERMISSIONS.PATIENT_VIEW_ALL,
      PERMISSIONS.REPORT_VIEW_ALL,
      PERMISSIONS.POPULATION_VIEW,
    ].includes(permission);
  }

  /**
   * Check if permission is hospital-scoped (for USER role)
   */
  static isHospitalScopedPermission(permission: PermissionCode): boolean {
    return [
      PERMISSIONS.PATIENT_VIEW_OWN,
      PERMISSIONS.REPORT_VIEW_OWN,
    ].includes(permission);
  }

  /**
   * Get all permissions for a role
   */
  static getPermissionsForRole(roleName: string): PermissionCode[] {
    return ROLE_PERMISSIONS[roleName as keyof typeof ROLE_PERMISSIONS] || [];
  }

  /**
   * Check if a role has a specific permission
   */
  static roleHasPermission(roleName: string, permission: PermissionCode): boolean {
    const rolePermissions = this.getPermissionsForRole(roleName);
    return rolePermissions.includes(permission);
  }

  /**
   * Get permission description
   */
  static getPermissionDescription(permission: PermissionCode): string {
    return PERMISSION_DESCRIPTIONS[permission] || 'ไม่มีคำอธิบาย';
  }
}

// Export for type safety
export default PERMISSIONS;