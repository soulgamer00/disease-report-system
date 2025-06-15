// backend/src/server.ts - Updated with Public API info

import app from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server
const server = app.listen(PORT, () => {
  console.log('🚀 ===============================================');
  console.log('🏥 Disease Surveillance System - Backend API');
  console.log('🚀 ===============================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log('📋 ===============================================');
  console.log('📊 System Health:');
  console.log(`   ❤️  Health check: http://localhost:${PORT}/health`);
  console.log('📋 ===============================================');
  console.log('🔓 Public API (No Auth Required):');
  console.log(`   📖 Documentation: http://localhost:${PORT}/public`);
  console.log(`   🦠 Diseases: http://localhost:${PORT}/public/diseases`);
  console.log(`   📈 Reports: http://localhost:${PORT}/public/reports/age-groups?diseaseId=1`);
  console.log('📋 ===============================================');
  console.log('🔒 Authenticated API (JWT Required):');
  console.log(`   📖 Documentation: http://localhost:${PORT}/api`);
  console.log(`   🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`   🏥 Patients: http://localhost:${PORT}/api/patients`);
  console.log('🚀 ===============================================');
  
  if (NODE_ENV === 'development') {
    console.log('🔄 Development mode - Auto-restart enabled');
    console.log('📝 API request logs will appear below...\n');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default server;