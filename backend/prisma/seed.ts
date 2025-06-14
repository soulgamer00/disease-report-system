// backend/prisma/seed.ts - Fixed version
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Roles
  console.log('📋 Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        roleName: 'SUPERUSER',
        description: 'System administrator with full access'
      }
    }),
    prisma.role.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        roleName: 'ADMIN',
        description: 'System manager with administrative privileges'
      }
    }),
    prisma.role.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        roleName: 'USER',
        description: 'Regular user with limited access'
      }
    })
  ]);

  // 2. Create Permissions
  console.log('🔐 Creating permissions...');
  const permissions = [
    // ========== SUPERUSER PERMISSIONS (Full Access) ==========
    // Hospital Management
    { roleId: 1, permissionCode: 'HOSPITAL_VIEW' },
    { roleId: 1, permissionCode: 'HOSPITAL_CREATE' },
    { roleId: 1, permissionCode: 'HOSPITAL_UPDATE' },
    { roleId: 1, permissionCode: 'HOSPITAL_DELETE' },
    
    // Patient Management
    { roleId: 1, permissionCode: 'PATIENT_VIEW_ALL' },
    { roleId: 1, permissionCode: 'PATIENT_CREATE' },
    { roleId: 1, permissionCode: 'PATIENT_UPDATE' },
    { roleId: 1, permissionCode: 'PATIENT_DELETE' },
    { roleId: 1, permissionCode: 'PATIENT_EXPORT' },
    
    // Population Management
    { roleId: 1, permissionCode: 'POPULATION_VIEW' },
    { roleId: 1, permissionCode: 'POPULATION_CREATE' },
    { roleId: 1, permissionCode: 'POPULATION_UPDATE' },
    { roleId: 1, permissionCode: 'POPULATION_DELETE' },
    { roleId: 1, permissionCode: 'POPULATION_EXPORT' },
    
    // Disease Management
    { roleId: 1, permissionCode: 'DISEASE_VIEW' },
    { roleId: 1, permissionCode: 'DISEASE_CREATE' },
    { roleId: 1, permissionCode: 'DISEASE_UPDATE' },
    { roleId: 1, permissionCode: 'DISEASE_DELETE' },
    
    // Symptom Management
    { roleId: 1, permissionCode: 'SYMPTOM_VIEW' },
    { roleId: 1, permissionCode: 'SYMPTOM_CREATE' },
    { roleId: 1, permissionCode: 'SYMPTOM_UPDATE' },
    { roleId: 1, permissionCode: 'SYMPTOM_DELETE' },
    
    // User Management
    { roleId: 1, permissionCode: 'USER_VIEW' },
    { roleId: 1, permissionCode: 'USER_CREATE' },
    { roleId: 1, permissionCode: 'USER_UPDATE' },
    { roleId: 1, permissionCode: 'USER_DELETE' },
    { roleId: 1, permissionCode: 'USER_EXPORT' },
    
    // Reports & Analytics
    { roleId: 1, permissionCode: 'REPORT_VIEW_ALL' },
    { roleId: 1, permissionCode: 'REPORT_EXPORT' },
    { roleId: 1, permissionCode: 'ANALYTICS_VIEW' },
    
    // ========== ADMIN PERMISSIONS (Limited Access) ==========
    // Hospital Management - View only
    { roleId: 2, permissionCode: 'HOSPITAL_VIEW' },
    
    // Patient Management
    { roleId: 2, permissionCode: 'PATIENT_VIEW_ALL' },
    { roleId: 2, permissionCode: 'PATIENT_CREATE' },
    { roleId: 2, permissionCode: 'PATIENT_UPDATE' },
    { roleId: 2, permissionCode: 'PATIENT_EXPORT' },
    
    // Population Management
    { roleId: 2, permissionCode: 'POPULATION_VIEW' },
    { roleId: 2, permissionCode: 'POPULATION_CREATE' },
    { roleId: 2, permissionCode: 'POPULATION_UPDATE' },
    { roleId: 2, permissionCode: 'POPULATION_EXPORT' },
    
    // Disease Management
    { roleId: 2, permissionCode: 'DISEASE_VIEW' },
    { roleId: 2, permissionCode: 'DISEASE_CREATE' },
    { roleId: 2, permissionCode: 'DISEASE_UPDATE' },
    
    // Symptom Management
    { roleId: 2, permissionCode: 'SYMPTOM_VIEW' },
    { roleId: 2, permissionCode: 'SYMPTOM_CREATE' },
    { roleId: 2, permissionCode: 'SYMPTOM_UPDATE' },
    
    // User Management - Limited
    { roleId: 2, permissionCode: 'USER_VIEW' },
    { roleId: 2, permissionCode: 'USER_CREATE' },
    { roleId: 2, permissionCode: 'USER_UPDATE' },
    
    // Reports & Analytics
    { roleId: 2, permissionCode: 'REPORT_VIEW_ALL' },
    { roleId: 2, permissionCode: 'REPORT_EXPORT' },
    { roleId: 2, permissionCode: 'ANALYTICS_VIEW' },
    
    // ========== USER PERMISSIONS (Own Hospital Only) ==========
    // Patient Management - Own hospital only
    { roleId: 3, permissionCode: 'PATIENT_VIEW_OWN' },
    { roleId: 3, permissionCode: 'PATIENT_CREATE' },
    { roleId: 3, permissionCode: 'PATIENT_UPDATE' },
    
    // Reports - Own hospital only
    { roleId: 3, permissionCode: 'REPORT_VIEW_OWN' }
  ];

  console.log(`🔐 Creating ${permissions.length} permissions...`);
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        roleId_permissionCode: {
          roleId: permission.roleId,
          permissionCode: permission.permissionCode
        }
      },
      update: { canAccess: true },
      create: { ...permission, canAccess: true }
    });
  }

  // 3. Create Sample Hospitals
  console.log('🏥 Creating sample hospitals...');
  const hospitals = await Promise.all([
    prisma.hospital.upsert({
      where: { hospitalCode5Digit: 'VCH01' },
      update: {},
      create: {
        hospitalName: 'โรงพยาบาลวิเชียรบุรี',
        hospitalCode5Digit: 'VCH01',
        hospitalCode9eDigit: 'VCH010001',
        hospitalCode9Digit: '123456789',
        organizationType: 'โรงพยาบาลรัฐ',
        healthServiceType: 'โรงพยาบาลทั่วไป',
        affiliation: 'กระทรวงสาธารณสุข',
        departmentDivision: 'เขตสุขภาพที่ 1'
      }
    }),
    prisma.hospital.upsert({
      where: { hospitalCode5Digit: 'TRG01' },
      update: {},
      create: {
        hospitalName: 'โรงพยาบาลส่งเสริมสุขภาพตำบลท่าโรง',
        hospitalCode5Digit: 'TRG01',
        hospitalCode9eDigit: 'TRG010001',
        organizationType: 'โรงพยาบาลส่งเสริมสุขภาพตำบล',
        healthServiceType: 'บริการปฐมภูมิ',
        affiliation: 'กระทรวงสาธารณสุข'
      }
    }),
    prisma.hospital.upsert({
      where: { hospitalCode5Digit: 'YSW01' },
      update: {},
      create: {
        hospitalName: 'โรงพยาบาลส่งเสริมสุขภาพตำบลยางสาว',
        hospitalCode5Digit: 'YSW01',
        hospitalCode9eDigit: 'YSW010001',
        organizationType: 'โรงพยาบาลส่งเสริมสุขภาพตำบล',
        healthServiceType: 'บริการปฐมภูมิ',
        affiliation: 'กระทรวงสาธารณสุข'
      }
    }),
    prisma.hospital.upsert({
      where: { hospitalCode5Digit: 'PSL01' },
      update: {},
      create: {
        hospitalName: 'โรงพยาบาลพิษณุโลก',
        hospitalCode5Digit: 'PSL01',
        hospitalCode9eDigit: 'PSL010001',
        hospitalCode9Digit: '987654321',
        organizationType: 'โรงพยาบาลศูนย์',
        healthServiceType: 'โรงพยาบาลตติยภูมิ',
        affiliation: 'กระทรวงสาธารณสุข',
        departmentDivision: 'เขตสุขภาพที่ 1'
      }
    })
  ]);

  // 4. Create Sample Diseases
  console.log('🦠 Creating sample diseases...');
  const diseases = await Promise.all([
    prisma.disease.upsert({
      where: { thaiName: 'ไข้เลือดออก' },
      update: {},
      create: {
        thaiName: 'ไข้เลือดออก',
        engName: 'Dengue Fever',
        daName: 'DF',
        details: 'โรคติดต่อที่เกิดจากเชื้อไวรัสเดงกี่ แพร่กระจายโดยยุงลาย',
        createdBy: 'system'
      }
    }),
    prisma.disease.upsert({
      where: { thaiName: 'ไข้จับสั่น' },
      update: {},
      create: {
        thaiName: 'ไข้จับสั่น',
        engName: 'Malaria',
        daName: 'MAL',
        details: 'โรคติดต่อที่เกิดจากเชื้อปลาสโมเดียม แพร่กระจายโดยยุงก้นปล่อง',
        createdBy: 'system'
      }
    }),
    prisma.disease.upsert({
      where: { thaiName: 'ไข้ชิคุนกุนยา' },
      update: {},
      create: {
        thaiName: 'ไข้ชิคุนกุนยา',
        engName: 'Chikungunya Fever',
        daName: 'CHIK',
        details: 'โรคติดต่อที่เกิดจากเชื้อไวรัสชิคุนกุนยา แพร่กระจายโดยยุงลาย',
        createdBy: 'system'
      }
    }),
    prisma.disease.upsert({
      where: { thaiName: 'ไข้ซิกา' },
      update: {},
      create: {
        thaiName: 'ไข้ซิกา',
        engName: 'Zika Fever',
        daName: 'ZIKA',
        details: 'โรคติดต่อที่เกิดจากเชื้อไวรัสซิกา แพร่กระจายโดยยุงลาย',
        createdBy: 'system'
      }
    })
  ]);

  // 5. Create Sample Symptoms
  console.log('😷 Creating sample symptoms...');
  await Promise.all([
    // Dengue symptoms
    prisma.symptom.upsert({
      where: { diseaseId_name: { diseaseId: diseases[0].id, name: 'ไข้สูง' } },
      update: {},
      create: { diseaseId: diseases[0].id, name: 'ไข้สูง', createdBy: 'system' }
    }),
    prisma.symptom.upsert({
      where: { diseaseId_name: { diseaseId: diseases[0].id, name: 'ปวดหัว' } },
      update: {},
      create: { diseaseId: diseases[0].id, name: 'ปวดหัว', createdBy: 'system' }
    }),
    prisma.symptom.upsert({
      where: { diseaseId_name: { diseaseId: diseases[0].id, name: 'ปวดกล้ามเนื้อ' } },
      update: {},
      create: { diseaseId: diseases[0].id, name: 'ปวดกล้ามเนื้อ', createdBy: 'system' }
    }),
    prisma.symptom.upsert({
      where: { diseaseId_name: { diseaseId: diseases[0].id, name: 'ผื่นแดง' } },
      update: {},
      create: { diseaseId: diseases[0].id, name: 'ผื่นแดง', createdBy: 'system' }
    }),
    
    // Malaria symptoms
    prisma.symptom.upsert({
      where: { diseaseId_name: { diseaseId: diseases[1].id, name: 'ไข้สั่นสะเทือน' } },
      update: {},
      create: { diseaseId: diseases[1].id, name: 'ไข้สั่นสะเทือน', createdBy: 'system' }
    }),
    prisma.symptom.upsert({
      where: { diseaseId_name: { diseaseId: diseases[1].id, name: 'เหงื่อออกมาก' } },
      update: {},
      create: { diseaseId: diseases[1].id, name: 'เหงื่อออกมาก', createdBy: 'system' }
    }),
    
    // Chikungunya symptoms
    prisma.symptom.upsert({
      where: { diseaseId_name: { diseaseId: diseases[2].id, name: 'ข้อต่อบวม' } },
      update: {},
      create: { diseaseId: diseases[2].id, name: 'ข้อต่อบวม', createdBy: 'system' }
    }),
    prisma.symptom.upsert({
      where: { diseaseId_name: { diseaseId: diseases[2].id, name: 'ปวดข้อรุนแรง' } },
      update: {},
      create: { diseaseId: diseases[2].id, name: 'ปวดข้อรุนแรง', createdBy: 'system' }
    })
  ]);

  // 6. Create Default Users
  console.log('👤 Creating default users...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  await Promise.all([
    prisma.user.upsert({
      where: { username: 'superadmin' },
      update: {},
      create: {
        username: 'superadmin',
        passwordHash: hashedPassword,
        name: 'Super Administrator',
        email: 'superadmin@ddc.go.th',
        roleId: 1, // SUPERUSER
        createdBy: 'system'
      }
    }),
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash: hashedPassword,
        name: 'System Administrator',
        email: 'admin@ddc.go.th',
        roleId: 2, // ADMIN
        createdBy: 'system'
      }
    }),
    prisma.user.upsert({
      where: { username: 'user_vch' },
      update: {},
      create: {
        username: 'user_vch',
        passwordHash: hashedPassword,
        name: 'เจ้าหน้าที่โรงพยาบาลวิเชียรบุรี',
        email: 'user@vch.go.th',
        roleId: 3, // USER
        hospitalCode: 'VCH01',
        createdBy: 'system'
      }
    })
  ]);

  // 7. Create Sample Population Data
  console.log('📊 Creating sample population data...');
  const currentYear = new Date().getFullYear();
  
  await Promise.all([
    prisma.population.upsert({
      where: { year_hospitalCode: { year: currentYear, hospitalCode: 'VCH01' } },
      update: {},
      create: {
        year: currentYear,
        population: 145000,
        hospitalCode: 'VCH01',
        createdBy: 'system'
      }
    }),
    prisma.population.upsert({
      where: { year_hospitalCode: { year: currentYear - 1, hospitalCode: 'VCH01' } },
      update: {},
      create: {
        year: currentYear - 1,
        population: 142000,
        hospitalCode: 'VCH01',
        createdBy: 'system'
      }
    }),
    prisma.population.upsert({
      where: { year_hospitalCode: { year: currentYear, hospitalCode: 'PSL01' } },
      update: {},
      create: {
        year: currentYear,
        population: 285000,
        hospitalCode: 'PSL01',
        createdBy: 'system'
      }
    })
  ]);

  // 8. Summary
  const roleCount = await prisma.role.count();
  const permissionCount = await prisma.permission.count();
  const hospitalCount = await prisma.hospital.count();
  const diseaseCount = await prisma.disease.count();
  const userCount = await prisma.user.count();

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 Database Summary:');
  console.log(`🏷️  Roles: ${roleCount}`);
  console.log(`🔐 Permissions: ${permissionCount}`);
  console.log(`🏥 Hospitals: ${hospitalCount}`);
  console.log(`🦠 Diseases: ${diseaseCount}`);
  console.log(`👤 Users: ${userCount}`);
  console.log('');
  console.log('🔑 Default Login Credentials:');
  console.log('📱 SUPERUSER: superadmin / password123');
  console.log('📱 ADMIN: admin / password123'); 
  console.log('📱 USER: user_vch / password123');
  console.log('');
  console.log('🏥 Sample Hospitals:');
  console.log('- VCH01: โรงพยาบาลวิเชียรบุรี');
  console.log('- TRG01: รพ.สต.ท่าโรง');
  console.log('- YSW01: รพ.สต.ยางสาว');
  console.log('- PSL01: โรงพยาบาลพิษณุโลก');
  console.log('');
  console.log('🦠 Sample Diseases:');
  console.log('- ไข้เลือดออก (Dengue Fever)');
  console.log('- ไข้จับสั่น (Malaria)');
  console.log('- ไข้ชิคุนกุนยา (Chikungunya)');
  console.log('- ไข้ซิกา (Zika Fever)');
  console.log('');
  console.log('🎯 Key Permissions Added:');
  console.log('✅ HOSPITAL_VIEW (ADMIN, SUPERUSER)');
  console.log('✅ HOSPITAL_CREATE/UPDATE/DELETE (SUPERUSER)');
  console.log('✅ ANALYTICS_VIEW (ADMIN, SUPERUSER)');
  console.log('✅ Export permissions for all modules');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });