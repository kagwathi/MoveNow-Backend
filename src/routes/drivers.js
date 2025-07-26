import express from 'express';
import DriverController from '../controllers/driverController.js';
import { authenticate, requireDriver } from '../middleware/auth.js';
import VehicleService from '../services/vehicleService.js';
import {
  validateJobStatusUpdate,
  validateLocationUpdate,
  validateAvailabilityStatus,
} from '../middleware/validation.js';

const router = express.Router();

// All driver routes require authentication and driver role
router.use(authenticate);
router.use(requireDriver);

// Job management
router.get('/jobs/available', DriverController.getAvailableJobs);
router.post('/jobs/:id/accept', DriverController.acceptJob);
router.get('/jobs/current', DriverController.getCurrentJob);
router.get('/jobs/history', DriverController.getJobHistory);
router.put(
  '/jobs/:id/status',
  validateJobStatusUpdate,
  DriverController.updateJobStatus
);

// Driver location and status
router.put(
  '/location',
  validateLocationUpdate,
  DriverController.updateLocation
);
router.put(
  '/availability',
  validateAvailabilityStatus,
  DriverController.updateAvailabilityStatus
);

// Earnings
router.get('/earnings', DriverController.getEarnings);

// Vehicle management
router.post('/vehicles', async (req, res) => {
  try {
    const vehicle = await VehicleService.addVehicle(req.driver.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: { vehicle },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await VehicleService.getDriverVehicles(req.driver.id);
    res.status(200).json({
      success: true,
      data: { vehicles },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
    });
  }
});

export default router;
