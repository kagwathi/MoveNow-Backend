import { Booking, User, Driver, Vehicle } from '../models/index.js';
import PricingService from './pricingService.js';
import LocationService from './locationService.js';

class BookingService {
  static async generateUniqueBookingNumber() {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const timestamp = Date.now().toString();
      const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const bookingNumber = `MN${timestamp.slice(-6)}${randomNum}`;

      // Check if this booking number already exists
      const existingBooking = await Booking.findOne({
        where: { booking_number: bookingNumber },
      });

      if (!existingBooking) {
        return bookingNumber;
      }

      attempts++;
      // Wait a bit before retrying to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error(
      'Failed to generate unique booking number after multiple attempts'
    );
  }
  // Create new booking
  static async createBooking(customerId, bookingData) {
    try {
      const {
        pickup_address,
        pickup_lat,
        pickup_lng,
        dropoff_address,
        dropoff_lat,
        dropoff_lng,
        pickup_date,
        pickup_time,
        vehicle_type_required,
        load_type,
        load_description,
        estimated_weight,
        requires_helpers,
        helpers_count,
        special_instructions,
      } = bookingData;

      // Validate locations
      LocationService.validateCoordinates(pickup_lat, pickup_lng);
      LocationService.validateCoordinates(dropoff_lat, dropoff_lng);

      if (!LocationService.isWithinServiceArea(pickup_lat, pickup_lng)) {
        throw new Error('Pickup location is outside our service area');
      }

      if (!LocationService.isWithinServiceArea(dropoff_lat, dropoff_lng)) {
        throw new Error('Dropoff location is outside our service area');
      }

      // Validate trip distance
      LocationService.validateTripDistance(
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng
      );

      // Validate pickup time
      const pickup_datetime = LocationService.validatePickupTime(
        pickup_date,
        pickup_time
      );

      // Calculate pricing
      const pricing = PricingService.calculatePricing({
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng,
        vehicle_type: vehicle_type_required,
        load_type,
        pickup_datetime,
        requires_helpers: requires_helpers || false,
        helpers_count: helpers_count || 0,
      });

      // Generate unique booking number
      const bookingNumber = await this.generateUniqueBookingNumber();

      // Create booking with explicit booking_number
      const booking = await Booking.create({
        booking_number: bookingNumber,
        customer_id: customerId,
        pickup_address: LocationService.formatAddress(pickup_address),
        pickup_lat,
        pickup_lng,
        dropoff_address: LocationService.formatAddress(dropoff_address),
        dropoff_lat,
        dropoff_lng,
        pickup_date: pickup_datetime,
        pickup_time,
        vehicle_type_required,
        load_type,
        load_description: load_description?.trim() || null,
        estimated_weight: estimated_weight || null,
        estimated_distance: pricing.estimated_distance,
        estimated_duration: pricing.estimated_duration,
        base_price: pricing.base_price,
        distance_price: pricing.distance_price,
        additional_charges: pricing.helper_charges,
        total_price: pricing.total_price,
        requires_helpers: requires_helpers || false,
        helpers_count: helpers_count || 0,
        special_instructions: special_instructions?.trim() || null,
        status: 'pending',
      });

      return {
        booking,
        pricing_breakdown: pricing.breakdown,
      };
    } catch (error) {
      console.error('Create booking error:', error.message);
      throw error;
    }
  }

  // Get user's bookings
  static async getUserBookings(userId, filters = {}) {
    try {
      const {
        status,
        limit = 20,
        offset = 0,
        sort_by = 'created_at',
        sort_order = 'DESC',
      } = filters;

      const whereClause = { customer_id: userId };

      if (status) {
        whereClause.status = status;
      }

      const bookings = await Booking.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Driver,
            as: 'driver',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name', 'phone'],
              },
              {
                model: Vehicle,
                as: 'vehicles',
                attributes: ['vehicle_type', 'make', 'model', 'license_plate'],
                limit: 1,
              },
            ],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort_by, sort_order.toUpperCase()]],
        attributes: { exclude: ['customer_id'] },
      });

      return {
        bookings: bookings.rows,
        total: bookings.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < bookings.count,
      };
    } catch (error) {
      console.error('Get user bookings error:', error.message);
      throw error;
    }
  }

  // Get booking details
  static async getBookingDetails(bookingId, userId = null) {
    try {
      const whereClause = { id: bookingId };

      // If userId provided, ensure user can only access their own bookings
      if (userId) {
        whereClause.customer_id = userId;
      }

      const booking = await Booking.findOne({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['first_name', 'last_name', 'phone', 'email'],
          },
          {
            model: Driver,
            as: 'driver',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name', 'phone'],
              },
              {
                model: Vehicle,
                as: 'vehicles',
                where: { is_active: true },
                required: false,
                limit: 1,
              },
            ],
            required: false,
          },
        ],
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      return booking;
    } catch (error) {
      console.error('Get booking details error:', error.message);
      throw error;
    }
  }

  // Cancel booking
  static async cancelBooking(bookingId, userId, cancellationReason = null) {
    try {
      const booking = await Booking.findOne({
        where: {
          id: bookingId,
          customer_id: userId,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check if booking can be cancelled
      const non_cancellable_statuses = ['completed', 'cancelled'];
      if (non_cancellable_statuses.includes(booking.status)) {
        throw new Error(`Cannot cancel booking with status: ${booking.status}`);
      }

      // Update booking status
      await booking.update({
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason:
          cancellationReason?.trim() || 'Cancelled by customer',
      });

      return booking;
    } catch (error) {
      console.error('Cancel booking error:', error.message);
      throw error;
    }
  }

  // Get booking tracking info
  static async getBookingTracking(bookingId, userId) {
    try {
      const booking = await Booking.findOne({
        where: {
          id: bookingId,
          customer_id: userId,
        },
        include: [
          {
            model: Driver,
            as: 'driver',
            attributes: [
              'current_location_lat',
              'current_location_lng',
              'current_address',
            ],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name', 'phone'],
              },
            ],
            required: false,
          },
        ],
        attributes: [
          'id',
          'booking_number',
          'status',
          'pickup_address',
          'pickup_lat',
          'pickup_lng',
          'dropoff_address',
          'dropoff_lat',
          'dropoff_lng',
          'pickup_date',
          'accepted_at',
          'started_at',
          'estimated_duration',
        ],
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Calculate estimated arrival times
      let estimated_pickup_arrival = null;
      let estimated_completion = null;

      if (booking.accepted_at && booking.estimated_duration) {
        estimated_completion = new Date(
          new Date(booking.accepted_at).getTime() +
            booking.estimated_duration * 60 * 1000
        );
      }

      return {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        status: booking.status,
        pickup_location: {
          address: booking.pickup_address,
          lat: booking.pickup_lat,
          lng: booking.pickup_lng,
        },
        dropoff_location: {
          address: booking.dropoff_address,
          lat: booking.dropoff_lat,
          lng: booking.dropoff_lng,
        },
        scheduled_pickup: booking.pickup_date,
        estimated_completion,
        driver: booking.driver
          ? {
              name: `${booking.driver.user.first_name} ${booking.driver.user.last_name}`,
              phone: booking.driver.user.phone,
              current_location: booking.driver.current_location_lat
                ? {
                    lat: booking.driver.current_location_lat,
                    lng: booking.driver.current_location_lng,
                    address: booking.driver.current_address,
                  }
                : null,
            }
          : null,
        timeline: {
          accepted_at: booking.accepted_at,
          started_at: booking.started_at,
        },
      };
    } catch (error) {
      console.error('Get booking tracking error:', error.message);
      throw error;
    }
  }
}

export default BookingService;
