import express from 'express';
import BookingController from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';
import { validatePricingEstimate } from '../middleware/validation.js';

const router = express.Router();

// Pricing routes (require authentication)
router.use(authenticate);

router.post(
  '/estimate',
  validatePricingEstimate,
  BookingController.getPricingEstimate
);

export default router;
