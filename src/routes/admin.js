import express from 'express';
import AdminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateDriverApproval,
  validateAdminBookingStatusUpdate,
  validatePricingConfig,
  validateUserStatusToggle,
} from '../middleware/validation.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard and overview
router.get('/dashboard', AdminController.getDashboard);
router.get('/stats', AdminController.getSystemStats);

// User management
router.get('/users', AdminController.getAllUsers);
router.delete('/users/:id', AdminController.deleteUser);
router.put(
  '/users/:id/status',
  validateUserStatusToggle,
  AdminController.toggleUserStatus
);

// Driver management
router.put(
  '/drivers/:id/approve',
  validateDriverApproval,
  AdminController.updateDriverApproval
);

// Booking management
router.get('/bookings', AdminController.getAllBookings);
router.put(
  '/bookings/:id/status',
  validateAdminBookingStatusUpdate,
  AdminController.updateBookingStatus
);

// Pricing configuration
router.get('/pricing', AdminController.getPricingConfig);
router.put(
  '/pricing',
  validatePricingConfig,
  AdminController.updatePricingConfig
);
router.post('/pricing/reset', AdminController.resetPricingConfig);

// Reports
router.get('/reports/:type', AdminController.generateReports);

// Settings management
router.get('/settings', AdminController.getAdminSettings);
router.put('/settings', AdminController.updateAdminSettings);

// System actions
router.post('/system/clear-cache', AdminController.clearSystemCache);
router.get('/system/logs/export', AdminController.exportSystemLogs);
router.post('/system/backup', AdminController.createSystemBackup);
router.post('/system/restart', AdminController.restartSystem);

// System stats (already exists but included for completeness)
router.get('/system/stats', AdminController.getSystemStats);

export default router;
