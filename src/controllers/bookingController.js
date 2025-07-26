import BookingService from '../services/bookingService.js';
import PricingService from '../services/pricingService.js';

class BookingController {
  // Get pricing estimate
  static async getPricingEstimate(req, res) {
    try {
      const {
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng,
        vehicle_type,
        load_type,
        pickup_date,
        pickup_time,
        requires_helpers,
        helpers_count,
      } = req.body;

      // Validate required fields
      if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
        return res.status(400).json({
          success: false,
          message: 'Pickup and dropoff coordinates are required',
        });
      }

      if (!pickup_date || !pickup_time) {
        return res.status(400).json({
          success: false,
          message: 'Pickup date and time are required',
        });
      }

      const pickup_datetime = new Date(`${pickup_date}T${pickup_time}`);

      // If specific vehicle type requested
      if (vehicle_type) {
        const estimate = PricingService.calculatePricing({
          pickup_lat: parseFloat(pickup_lat),
          pickup_lng: parseFloat(pickup_lng),
          dropoff_lat: parseFloat(dropoff_lat),
          dropoff_lng: parseFloat(dropoff_lng),
          vehicle_type,
          load_type: load_type || 'other',
          pickup_datetime,
          requires_helpers: requires_helpers || false,
          helpers_count: helpers_count || 0,
        });

        return res.status(200).json({
          success: true,
          data: { estimate },
        });
      }

      // Get estimates for all vehicle types
      const estimates = PricingService.calculateMultiVehiclePricing({
        pickup_lat: parseFloat(pickup_lat),
        pickup_lng: parseFloat(pickup_lng),
        dropoff_lat: parseFloat(dropoff_lat),
        dropoff_lng: parseFloat(dropoff_lng),
        load_type: load_type || 'other',
        pickup_datetime,
        requires_helpers: requires_helpers || false,
        helpers_count: helpers_count || 0,
      });

      res.status(200).json({
        success: true,
        data: { estimates },
      });
    } catch (error) {
      console.error('Pricing estimate error:', error.message);

      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Create new booking
  static async createBooking(req, res) {
    try {
      const result = await BookingService.createBooking(req.user.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: result,
      });
    } catch (error) {
      console.error('Create booking error:', error.message);

      if (
        error.message.includes('outside our service area') ||
        error.message.includes('Invalid coordinates') ||
        error.message.includes('Trip too') ||
        error.message.includes('Pickup time must')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create booking. Please try again.',
      });
    }
  }

  // Get user's bookings
  static async getUserBookings(req, res) {
    try {
      const filters = {
        status: req.query.status,
        limit: req.query.limit,
        offset: req.query.offset,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
      };

      const result = await BookingService.getUserBookings(req.user.id, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get user bookings error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings',
      });
    }
  }

  // Get booking details
  static async getBookingDetails(req, res) {
    try {
      const { id } = req.params;
      const booking = await BookingService.getBookingDetails(id, req.user.id);

      res.status(200).json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      console.error('Get booking details error:', error.message);

      if (error.message === 'Booking not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking details',
      });
    }
  }

  // Cancel booking
  static async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { cancellation_reason } = req.body;

      const booking = await BookingService.cancelBooking(
        id,
        req.user.id,
        cancellation_reason
      );

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: { booking },
      });
    } catch (error) {
      console.error('Cancel booking error:', error.message);

      if (error.message === 'Booking not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('Cannot cancel booking')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
      });
    }
  }

  // Track booking
  static async trackBooking(req, res) {
    try {
      const { id } = req.params;
      const tracking = await BookingService.getBookingTracking(id, req.user.id);

      res.status(200).json({
        success: true,
        data: tracking,
      });
    } catch (error) {
      console.error('Track booking error:', error.message);

      if (error.message === 'Booking not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking tracking',
      });
    }
  }
}

export default BookingController;
