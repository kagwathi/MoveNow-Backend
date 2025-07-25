import express from 'express';
import AuthController from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateRegistration,
  validateLogin,
  validateDriverRegistration,
  validatePasswordChange,
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);

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

// Driver-specific routes
router.post(
  '/register-driver',
  authorize('driver'),
  validateDriverRegistration,
  AuthController.registerDriver
);

// Future routes
router.post('/refresh-token', AuthController.refreshToken);

export default router;
