// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface สำหรับ JWT payload
interface JWTPayload {
  userId: string;
  username: string;
  name: string;
  roleId: number;
  roleName: string;
}

// Register Controller
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, name, roleId } = req.body;

    // Basic validation
    if (!username || !password || !name || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: username, password, name, roleId'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        roleId
      },
      include: {
        role: true
      }
    });

    // *** ส่วนที่แก้ไข: เพิ่ม data: {} ครอบ user เพื่อความสอดคล้อง ***
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { // <-- เพิ่มตรงนี้
        user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            roleId: newUser.roleId,
            roleName: newUser.role.roleName,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

// Login Controller
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user with role information
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account is inactive'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.roleName
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'disease-surveillance-system',
        audience: 'dss-frontend'
      }
    );

    // Set secure httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,        // ป้องกัน XSS - JavaScript ไม่สามารถเข้าถึงได้
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',       // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    // Update last login time (optional)
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    // *** ส่วนที่ได้รับการแก้ไข: เพิ่ม data: {} ครอบ user ***
    res.json({
      success: true,
      message: 'Login successful',
      data: { // <-- เพิ่มตรงนี้
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          roleId: user.roleId,
          roleName: user.role.roleName,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

// Logout Controller
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear the auth cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

// Get Current User Profile (จาก JWT token)
export const getProfile = async (req: Request, res: Response) => {
  try {
    // หมายเหตุ: req.user จะถูกเพิ่มโดย authentication middleware
    const userFromToken = (req as any).user as JWTPayload;

    // ดึงข้อมูล user ล่าสุดจากฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { id: userFromToken.userId },
      include: { role: true }
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // *** ส่วนที่ได้รับการแก้ไข: เพิ่ม data: {} ครอบ user ***
    res.json({
      success: true,
      data: { // <-- เพิ่มตรงนี้
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          roleId: user.roleId,
          roleName: user.role.roleName,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile'
    });
  }
};