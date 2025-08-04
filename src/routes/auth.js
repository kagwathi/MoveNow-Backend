import express from 'express';
import AuthController from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateRegistration,
  validateLogin,
  validateDriverRegistration,
  validatePasswordChange,
} from '../middleware/validation.js';
import { adminCreationLimiter } from '../middleware/rateLimiting.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);

// DEVELOPMENT ONLY: Admin creation endpoint
// This endpoint is disabled in production and requires a secret key
router.post('/create-admin', adminCreationLimiter, AuthController.createAdmin);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post(
  '/change-password',
  validatePasswordChange,
  AuthController.changePassword
);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);

// Driver-specific routes
router.post(
  '/register-driver',
  authorize('driver'),
  validateDriverRegistration,
  AuthController.registerDriver
);

// Future routes
router.post('/refresh-token', AuthController.refreshToken);

router.get(
  '/admin/profile',
  authenticate,
  authorize('admin'),
  AuthController.getAdminProfile
);
router.put(
  '/admin/profile',
  authenticate,
  authorize('admin'),
  AuthController.updateAdminProfile
);
router.put(
  '/admin/password',
  authenticate,
  authorize('admin'),
  AuthController.changeAdminPassword
);

export default router;
