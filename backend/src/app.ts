// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users'; // 🚀 NEW: User Management Routes
import patientRoutes from './routes/patients';
import diseaseRoutes from './routes/diseases';
import symptomRoutes from './routes/symptoms';
import hospitalRoutes from './routes/hospitals';
import populationRoutes from './routes/populations';

// ✅ ADD: Import public routes
import publicRoutes from './routes/public';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Cookie parser middleware (ต้องมาก่อน routes ที่ใช้ cookies)
app.use(cookieParser());

// CORS configuration - ปรับปรุงให้รองรับ credentials
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // SvelteKit default port
  credentials: true, // สำคัญ: อนุญาตให้ส่ง cookies ระหว่าง domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'] // เพื่อให้ frontend สามารถเห็น Set-Cookie header
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (simple console log for development)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const hasAuthCookie = req.cookies?.auth_token ? '🔐' : '🔓';
  console.log(`[${timestamp}] ${hasAuthCookie} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'PostgreSQL',
      cache: 'Redis (planned)',
      authentication: 'JWT + httpOnly cookies',
      authorization: 'Permission-based access control',
    }
  });
});

// ✅ ADD: Public Routes (No Authentication Required) - MUST come before authenticated routes
app.use('/public', publicRoutes);

// API Routes (Authentication Required)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);        // 🚀 NEW: User Management API
app.use('/api/patients', patientRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/populations', populationRoutes);

// API Root endpoint with comprehensive documentation
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Disease Surveillance System API',
    version: '1.0.0',
    description: 'RESTful API for managing patient data, population statistics, and disease surveillance',
    
    endpoints: {
      health: {
        path: '/health',
        description: 'System health check and status'
      },

      // ✅ ADD: Public API Documentation
      public: {
        documentation: {
          method: 'GET',
          path: '/public',
          description: 'Public API documentation (no authentication required)',
          note: '🔓 Open access for transparency'
        },
        diseases: {
          method: 'GET',
          path: '/public/diseases',
          description: 'Get all active diseases for public display',
          note: '🔓 For homepage disease cards'
        },
        diseaseById: {
          method: 'GET',
          path: '/public/diseases/:id',
          description: 'Get specific disease information',
          note: '🔓 For disease detail pages'
        },
        statistics: {
          method: 'GET',
          path: '/public/stats',
          description: 'Get public health statistics',
          note: '🔓 For dashboard counters'
        },
        hospitals: {
          method: 'GET',
          path: '/public/hospitals',
          description: 'Get hospital list for dropdowns',
          note: '🔓 For report filtering'
        },
        reports: {
          ageGroups: {
            method: 'GET',
            path: '/public/reports/age-groups',
            description: 'Age distribution analysis by disease',
            requiredParams: ['diseaseId'],
            optionalParams: ['year', 'hospital', 'gender', 'occupation'],
            note: '🔓 Epidemiological analysis'
          },
          genderRatio: {
            method: 'GET',
            path: '/public/reports/gender-ratio',
            description: 'Gender ratio analysis by disease',
            requiredParams: ['diseaseId'],
            optionalParams: ['year', 'hospital', 'ageGroup', 'occupation'],
            note: '🔓 Gender distribution analysis'
          },
          incidenceRates: {
            method: 'GET',
            path: '/public/reports/incidence-rates',
            description: 'Disease incidence and mortality rates',
            requiredParams: ['diseaseId'],
            optionalParams: ['year', 'hospital', 'gender', 'ageGroup'],
            note: '🔓 Population health indicators'
          },
          occupation: {
            method: 'GET',
            path: '/public/reports/occupation',
            description: 'Occupation distribution analysis',
            requiredParams: ['diseaseId'],
            optionalParams: ['year', 'hospital', 'gender', 'ageGroup'],
            note: '🔓 Occupational health analysis'
          }
        }
      },
      
      authentication: {
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'User authentication with JWT tokens',
          requiredFields: ['username', 'password']
        },
        register: {
          method: 'POST', 
          path: '/api/auth/register',
          description: 'User registration (admin only)',
          requiredFields: ['username', 'password', 'name', 'roleId']
        },
        logout: {
          method: 'POST',
          path: '/api/auth/logout',
          description: 'User logout and token invalidation'
        },
        profile: {
          method: 'GET',
          path: '/api/auth/profile',
          description: 'Get current user profile',
          requiresAuth: true
        }
      },

      // 🚀 NEW: User Management Documentation
      users: {
        selfService: {
          profile: {
            method: 'GET',
            path: '/api/users/me',
            description: 'Get own user profile',
            requiredPermissions: 'All authenticated users',
            note: 'Self-service endpoint'
          },
          updateProfile: {
            method: 'PUT',
            path: '/api/users/me',
            description: 'Update own user profile',
            requiredPermissions: 'All authenticated users',
            note: 'Limited fields (no role/hospital changes)'
          },
          changePassword: {
            method: 'POST',
            path: '/api/users/me/change-password',
            description: 'Change own password',
            requiredPermissions: 'All authenticated users',
            requiredFields: ['currentPassword', 'newPassword', 'confirmPassword']
          }
        },
        administration: {
          list: {
            method: 'GET',
            path: '/api/users',
            description: 'Get paginated list of users',
            requiredPermissions: ['USER_VIEW'],
            accessRestriction: 'ADMIN, SUPERUSER'
          },
          create: {
            method: 'POST',
            path: '/api/users',
            description: 'Create new user account',
            requiredPermissions: ['USER_CREATE'],
            accessRestriction: 'ADMIN, SUPERUSER',
            requiredFields: ['username', 'password', 'name', 'roleId']
          },
          update: {
            method: 'PUT',
            path: '/api/users/:id',
            description: 'Update user account',
            requiredPermissions: ['USER_UPDATE'],
            accessRestriction: 'ADMIN, SUPERUSER'
          },
          delete: {
            method: 'DELETE',
            path: '/api/users/:id',
            description: 'Soft delete user account',
            requiredPermissions: ['USER_DELETE'],
            accessRestriction: 'SUPERUSER only'
          },
          resetPassword: {
            method: 'POST',
            path: '/api/users/reset-password',
            description: 'Reset user password (admin action)',
            requiredPermissions: ['USER_PASSWORD_RESET'],
            accessRestriction: 'SUPERUSER only',
            requiredFields: ['userId', 'newPassword', 'confirmPassword', 'reason']
          },
          bulkAction: {
            method: 'POST',
            path: '/api/users/bulk-action',
            description: 'Perform bulk actions on users',
            requiredPermissions: ['USER_UPDATE'],
            accessRestriction: 'ADMIN, SUPERUSER',
            requiredFields: ['userIds', 'action']
          }
        },
        utility: {
          search: {
            method: 'GET',
            path: '/api/users/search',
            description: 'Search users by name/username/email',
            requiredPermissions: ['USER_VIEW'],
            accessRestriction: 'ADMIN, SUPERUSER'
          },
          stats: {
            method: 'GET',
            path: '/api/users/stats',
            description: 'Get user statistics for dashboard',
            requiredPermissions: ['USER_VIEW'],
            accessRestriction: 'ADMIN, SUPERUSER'
          },
          checkUsername: {
            method: 'GET',
            path: '/api/users/check-username',
            description: 'Check username availability',
            requiredPermissions: ['USER_VIEW'],
            accessRestriction: 'ADMIN, SUPERUSER'
          },
          checkEmail: {
            method: 'GET',
            path: '/api/users/check-email',
            description: 'Check email availability',
            requiredPermissions: ['USER_VIEW'],
            accessRestriction: 'ADMIN, SUPERUSER'
          },
          accessibleHospitals: {
            method: 'GET',
            path: '/api/users/accessible-hospitals',
            description: 'Get hospitals for user assignment',
            requiredPermissions: ['USER_VIEW'],
            accessRestriction: 'ADMIN, SUPERUSER'
          }
        }
      },

      patients: {
        list: {
          method: 'GET',
          path: '/api/patients',
          description: 'Get paginated list of patients with filters',
          requiredPermissions: ['PATIENT_VIEW_ALL', 'PATIENT_VIEW_OWN'],
          hospitalScoped: true
        },
        create: {
          method: 'POST',
          path: '/api/patients',
          description: 'Create new patient record',
          requiredPermissions: ['PATIENT_CREATE'],
          hospitalScoped: true
        },
        getById: {
          method: 'GET',
          path: '/api/patients/:id',
          description: 'Get patient by ID',
          requiredPermissions: ['PATIENT_VIEW_ALL', 'PATIENT_VIEW_OWN'],
          hospitalScoped: true
        },
        update: {
          method: 'PUT',
          path: '/api/patients/:id',
          description: 'Update patient record',
          requiredPermissions: ['PATIENT_UPDATE'],
          hospitalScoped: true
        },
        delete: {
          method: 'DELETE',
          path: '/api/patients/:id',
          description: 'Soft delete patient record',
          requiredPermissions: ['PATIENT_DELETE'],
          note: 'SUPERUSER only'
        },
        search: {
          method: 'GET',
          path: '/api/patients/search',
          description: 'Search patients by multiple criteria',
          requiredPermissions: ['PATIENT_VIEW_ALL', 'PATIENT_VIEW_OWN'],
          hospitalScoped: true
        }
      },

      diseases: {
        active: {
          method: 'GET',
          path: '/api/diseases/active',
          description: 'Get all active diseases for dropdowns',
          requiredPermissions: 'All authenticated users',
          note: 'Public endpoint for patient forms'
        },
        search: {
          method: 'GET',
          path: '/api/diseases/search',
          description: 'Search diseases by name (autocomplete)',
          requiredPermissions: 'All authenticated users',
          note: 'Public endpoint for patient forms'
        },
        list: {
          method: 'GET',
          path: '/api/diseases',
          description: 'Get paginated list of diseases',
          requiredPermissions: ['DISEASE_VIEW'],
          accessRestriction: 'SUPERUSER only'
        },
        create: {
          method: 'POST',
          path: '/api/diseases',
          description: 'Create new disease record',
          requiredPermissions: ['DISEASE_CREATE'],
          accessRestriction: 'SUPERUSER only'
        }
      },

      symptoms: {
        byDisease: {
          method: 'GET',
          path: '/api/symptoms/by-disease/:diseaseId',
          description: 'Get symptoms for a specific disease',
          requiredPermissions: 'All authenticated users',
          note: 'Public endpoint for patient forms'
        },
        search: {
          method: 'GET',
          path: '/api/symptoms/search',
          description: 'Search symptoms by name (autocomplete)',
          requiredPermissions: 'All authenticated users',
          note: 'Public endpoint for patient forms'
        },
        list: {
          method: 'GET',
          path: '/api/symptoms',
          description: 'Get paginated list of symptoms',
          requiredPermissions: ['SYMPTOM_VIEW'],
          accessRestriction: 'SUPERUSER only'
        }
      },

      hospitals: {
        active: {
          method: 'GET',
          path: '/api/hospitals/active',
          description: 'Get all active hospitals for dropdowns',
          requiredPermissions: 'All authenticated users',
          note: 'Public endpoint for forms and user assignments'
        },
        search: {
          method: 'GET',
          path: '/api/hospitals/search',
          description: 'Search hospitals by name or code',
          requiredPermissions: 'All authenticated users',
          note: 'Public endpoint for autocomplete'
        },
        byCode: {
          method: 'GET',
          path: '/api/hospitals/code/:code',
          description: 'Get hospital by 5-digit code',
          requiredPermissions: 'All authenticated users',
          note: 'Public endpoint for reference'
        },
        list: {
          method: 'GET',
          path: '/api/hospitals',
          description: 'Get paginated list of hospitals',
          requiredPermissions: ['HOSPITAL_VIEW'],
          accessRestriction: 'ADMIN, SUPERUSER'
        }
      },

      // Future endpoints
      future: {
        populations: '/api/populations (coming soon)',
        reports: '/api/reports (coming soon)',
        analytics: '/api/analytics (coming soon)',
        notifications: '/api/notifications (coming soon)'
      }
    },

    // ✅ ADD: Public API Features Section
    publicApiFeatures: {
      description: 'Public endpoints for transparency and community access',
      authentication: 'None required - Open access',
      rateLimiting: 'Standard rate limits apply',
      dataSources: [
        'Disease information from active surveillance',
        'Population health statistics',
        'Epidemiological analysis reports',
        'Hospital directory information'
      ],
      reportTypes: [
        '📊 Age group distribution analysis',
        '👥 Gender ratio calculations', 
        '📈 Incidence and mortality rates',
        '💼 Occupation distribution patterns'
      ],
      useCases: [
        'Public health dashboard displays',
        'Academic research data access',
        'Community health awareness',
        'Epidemiological trend analysis',
        'Healthcare transparency initiatives'
      ],
      examples: {
        diseases: `${req.protocol}://${req.get('host')}/public/diseases`,
        ageReport: `${req.protocol}://${req.get('host')}/public/reports/age-groups?diseaseId=1&year=2024`,
        genderReport: `${req.protocol}://${req.get('host')}/public/reports/gender-ratio?diseaseId=1`,
        incidenceReport: `${req.protocol}://${req.get('host')}/public/reports/incidence-rates?diseaseId=1&hospital=VCH01`
      }
    },

    permissionSystem: {
      description: 'Role-based permission system with hospital-scoped access',
      roles: {
        SUPERUSER: {
          description: 'System administrator with full access',
          permissions: 'All permissions across all hospitals and users',
          hospitalScope: 'Global access',
          userManagement: 'Full access including SUPERUSER creation'
        },
        ADMIN: {
          description: 'System manager with administrative privileges',
          permissions: 'Patient, Population, User (limited), Reports and Analytics',
          hospitalScope: 'Global access',
          userManagement: 'Can create/update ADMIN and USER accounts'
        },
        USER: {
          description: 'Regular user with limited access',
          permissions: 'Patient management, Reports (own hospital), Self-service profile',
          hospitalScope: 'Own hospital only',
          userManagement: 'Self-service profile management only'
        }
      },
      permissionCategories: [
        'PATIENT_*: Patient data management',
        'POPULATION_*: Population data management (ADMIN+ only)',
        '🚀 USER_*: User account management (ADMIN+ only)',
        'DISEASE_*: Disease management (SUPERUSER only)',
        'SYMPTOM_*: Symptom management (SUPERUSER only)',  
        'HOSPITAL_*: Hospital management (ADMIN+ view, SUPERUSER manage)',
        'REPORT_*: Report generation and viewing',
        'ANALYTICS_*: Advanced analytics and insights'
      ]
    },

    security: {
      authentication: 'JWT tokens with httpOnly cookies',
      authorization: 'Permission-based access control',
      dataScoping: 'Hospital-level data isolation for USER role',
      encryption: 'bcrypt password hashing with salt rounds',
      cors: 'Configured for secure cross-origin requests',
      headers: 'Security headers via Helmet.js',
      inputValidation: 'Zod schema validation on all inputs',
      userManagement: '🚀 NEW: Privilege escalation protection, strong password requirements',
      publicApi: '✅ NEW: Open endpoints with rate limiting for transparency'
    },

    technical: {
      database: 'PostgreSQL with Prisma ORM',
      runtime: 'Node.js with Express.js',
      language: 'TypeScript (100% typed)',
      validation: 'Zod schemas for all inputs',
      documentation: 'OpenAPI-compatible endpoint descriptions',
      errorHandling: 'Consistent error response format',
      logging: 'Request logging with authentication status',
      userManagement: '🚀 NEW: Complete CRUD with security controls',
      publicApi: '✅ NEW: Public reporting endpoints for transparency'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    suggestion: 'Check the API documentation at /api for available endpoints',
    availableRoutes: [
      'GET /api - API documentation',
      'GET /health - System health check',
      '✅ GET /public - Public API (NEW)',
      '✅ GET /public/diseases - Public disease data (NEW)',
      'POST /api/auth/login - User authentication',
      '🚀 GET /api/users - User management (NEW)',
      'GET /api/patients - Patient management',
      'GET /api/diseases - Disease management',
      'GET /api/symptoms - Symptom management',
      'GET /api/hospitals - Hospital management',
      'GET /api/populations - Population management (ADMIN+ only)'
    ]
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: true,
    message,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
});

export default app;