// backend/src/routes/auth.ts
import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/authController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Public routes (ไม่ต้อง authenticate)
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // ไม่ต้อง authenticate เพราะแค่ clear cookie

// Protected routes (ต้อง authenticate)
router.get('/profile', authenticateToken, getProfile);

// Example: Admin only route
router.get('/admin-only', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'SUPERUSER'), 
  (req, res) => {
    res.json({
      success: true,
      message: 'This is an admin-only endpoint',
      user: (req as any).user
    });
  }
);

// Example: Any authenticated user route
router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected endpoint',
    user: (req as any).user
  });
});

export default router;