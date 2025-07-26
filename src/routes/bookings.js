import express from 'express';
import BookingController from '../controllers/bookingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validatePricingEstimate,
  validateBookingCreation,
  validateBookingCancellation,
} from '../middleware/validation.js';

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// Pricing estimate (public for authenticated users)
router.post(
  '/pricing/estimate',
  validatePricingEstimate,
  BookingController.getPricingEstimate
);

// Customer booking routes
router.post(
  '/',
  authorize('customer'),
  validateBookingCreation,
  BookingController.createBooking
);
router.get('/', BookingController.getUserBookings);
router.get('/:id', BookingController.getBookingDetails);
router.put(
  '/:id/cancel',
  validateBookingCancellation,
  BookingController.cancelBooking
);
router.get('/:id/track', BookingController.trackBooking);

export default router;
