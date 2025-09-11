import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { adminUsers } from '../shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

interface JWTPayload {
  adminId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// JWT Secret - should be set via environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper function to hash passwords
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Helper function to verify passwords
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (payload: { adminId: string; username: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'hamburgueria-admin',
    audience: 'admin-panel'
  }) as string;
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'hamburgueria-admin',
      audience: 'admin-panel'
    }) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

// Secure JWT-based authentication middleware
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. Bearer token required.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token format.' 
      });
    }

    // Verify JWT token
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ 
        message: 'Access denied. Invalid or expired token.' 
      });
    }

    // Verify admin still exists and is active (additional security check)
    const admin = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.id, payload.adminId))
      .limit(1);
    
    if (admin.length === 0 || !admin[0].isActive) {
      return res.status(401).json({ 
        message: 'Access denied. Admin account no longer active.' 
      });
    }

    // Set user data in request for use in subsequent middleware/routes
    req.user = {
      id: payload.adminId,
      username: payload.username,
      role: payload.role
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      message: 'Internal server error during authentication.' 
    });
  }
};

// Admin role verification middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      message: 'Too many authentication attempts. Please try again later.'
    });
  }
});

// Rate limiting for admin operations (more lenient)
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Allow more operations for admin panel
  message: {
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false
});