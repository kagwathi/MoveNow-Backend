import { Op } from 'sequelize';
import { Booking, User, Driver, Vehicle } from '../models/index.js';
import LocationService from './locationService.js';

class DriverJobService {
  // Get available jobs for a driver
  static async getAvailableJobs(driverId, filters = {}) {
    try {
      const {
        radius = 10, // km
        vehicle_types = [],
        limit = 20,
        offset = 0,
      } = filters;

      // Get driver details with ALL vehicles first
      const driver = await Driver.findOne({
        where: { id: driverId },
        include: [
          {
            model: Vehicle,
            as: 'vehicles',
            // Remove the where clause here to get all vehicles
            attributes: [
              'id',
              'vehicle_type',
              'capacity_weight',
              'capacity_volume',
              'is_active',
            ],
            required: false, // LEFT JOIN
          },
        ],
      });

      if (!driver) {
        throw new Error('Driver not found');
      }

      if (!driver.is_approved) {
        throw new Error('Driver account not approved');
      }

      // Filter for active vehicles after fetching
      const activeVehicles =
        driver.vehicles?.filter((v) => v.is_active === true) || [];

      console.log('Driver vehicles:', driver.vehicles); // Debug log
      console.log('Active vehicles:', activeVehicles); // Debug log

      if (activeVehicles.length === 0) {
        throw new Error('No active vehicles linked to this driver');
      }

      if (driver.availability_status !== 'available') {
        return {
          jobs: [],
          total: 0,
          message: `Driver status is ${driver.availability_status}. Set status to 'available' to see jobs.`,
        };
      }

      // Get driver's vehicle types from active vehicles
      const driverVehicleTypes = activeVehicles.map((v) => v.vehicle_type);
      console.log('Driver vehicle types:', driverVehicleTypes); // Debug log

      // Build where clause for available jobs
      let whereClause = {
        status: 'pending',
        driver_id: null, // Not yet assigned
        pickup_date: {
          [Op.gte]: new Date(), // Future pickups only
        },
      };

      // Filter by vehicle types if specified, otherwise use driver's vehicle types
      const allowedVehicleTypes =
        vehicle_types.length > 0
          ? vehicle_types.filter((vt) => driverVehicleTypes.includes(vt))
          : driverVehicleTypes;

      console.log('Allowed vehicle types:', allowedVehicleTypes); // Debug log

      whereClause.vehicle_type_required = {
        [Op.in]: allowedVehicleTypes,
      };

      // If driver has location, filter by radius
      if (driver.current_location_lat && driver.current_location_lng) {
        // Calculate lat/lng bounds for radius (approximate)
        const latDelta = radius / 111; // 111 km per degree latitude
        const lngDelta =
          radius /
          (111 * Math.cos((driver.current_location_lat * Math.PI) / 180));

        whereClause.pickup_lat = {
          [Op.between]: [
            driver.current_location_lat - latDelta,
            driver.current_location_lat + latDelta,
          ],
        };
        whereClause.pickup_lng = {
          [Op.between]: [
            driver.current_location_lng - lngDelta,
            driver.current_location_lng + lngDelta,
          ],
        };
      }

      console.log('Job search where clause:', whereClause); // Debug log

      // Get available jobs
      const jobs = await Booking.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['first_name', 'last_name', 'phone'],
          },
        ],
        order: [['pickup_date', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'id',
          'booking_number',
          'pickup_address',
          'pickup_lat',
          'pickup_lng',
          'dropoff_address',
          'dropoff_lat',
          'dropoff_lng',
          'pickup_date',
          'vehicle_type_required',
          'load_type',
          'estimated_distance',
          'estimated_duration',
          'total_price',
          'requires_helpers',
          'helpers_count',
          'special_instructions',
          'created_at',
        ],
      });

      console.log('Found jobs count:', jobs.count); // Debug log

      // Calculate distances if driver has location
      const jobsWithDistance = jobs.rows.map((job) => {
        let distance_from_driver = null;
        let estimated_travel_time = null;

        if (driver.current_location_lat && driver.current_location_lng) {
          distance_from_driver = this.calculateDistance(
            driver.current_location_lat,
            driver.current_location_lng,
            job.pickup_lat,
            job.pickup_lng
          );
          // Estimate travel time (25 km/h average city speed)
          estimated_travel_time = Math.round((distance_from_driver / 25) * 60);
        }

        return {
          ...job.toJSON(),
          distance_from_driver,
          estimated_travel_time,
        };
      });

      // Sort by distance if available
      if (driver.current_location_lat && driver.current_location_lng) {
        jobsWithDistance.sort(
          (a, b) =>
            (a.distance_from_driver || Infinity) -
            (b.distance_from_driver || Infinity)
        );
      }

      return {
        jobs: jobsWithDistance,
        total: jobs.count,
        driver_location: driver.current_location_lat
          ? {
              lat: driver.current_location_lat,
              lng: driver.current_location_lng,
              address: driver.current_address,
            }
          : null,
        search_radius: radius,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < jobs.count,
      };
    } catch (error) {
      console.error('Get available jobs error:', error.message);
      throw error;
    }
  }

  // Accept a job
  static async acceptJob(driverId, bookingId) {
    try {
      // Get driver with vehicles
      const driver = await Driver.findByPk(driverId, {
        include: [
          {
            model: Vehicle,
            as: 'vehicles',
            where: { is_active: true },
          },
        ],
      });

      if (!driver) {
        throw new Error('Driver not found');
      }

      if (!driver.is_approved) {
        throw new Error('Driver account not approved');
      }

      if (driver.availability_status !== 'available') {
        throw new Error(
          `Cannot accept job. Driver status is ${driver.availability_status}`
        );
      }

      // Check if driver already has an active job
      const activeJob = await Booking.findOne({
        where: {
          driver_id: driverId,
          status: {
            [Op.in]: [
              'accepted',
              'driver_assigned',
              'driver_en_route',
              'arrived_pickup',
              'loading',
              'in_transit',
              'arrived_destination',
              'unloading',
            ],
          },
        },
      });

      if (activeJob) {
        throw new Error('Driver already has an active job');
      }

      // Get the booking
      const booking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['first_name', 'last_name', 'phone', 'email'],
          },
        ],
      });

      if (!booking) {
        throw new Error('Job not found');
      }

      if (booking.status !== 'pending') {
        throw new Error(
          `Job is no longer available. Current status: ${booking.status}`
        );
      }

      if (booking.driver_id) {
        throw new Error('Job has already been accepted by another driver');
      }

      // Check if driver's vehicle can handle this job
      const driverVehicleTypes = driver.vehicles.map((v) => v.vehicle_type);
      if (!driverVehicleTypes.includes(booking.vehicle_type_required)) {
        throw new Error(
          `Driver does not have required vehicle type: ${booking.vehicle_type_required}`
        );
      }

      // Find suitable vehicle
      const suitableVehicle = driver.vehicles.find(
        (v) => v.vehicle_type === booking.vehicle_type_required
      );

      // Accept the job
      await booking.update({
        driver_id: driverId,
        vehicle_id: suitableVehicle.id,
        status: 'accepted',
        accepted_at: new Date(),
      });

      // Update driver availability
      await driver.update({
        availability_status: 'busy',
      });

      return {
        booking,
        message: 'Job accepted successfully',
      };
    } catch (error) {
      console.error('Accept job error:', error.message);
      throw error;
    }
  }

  // Get driver's current active job
  static async getCurrentJob(driverId) {
    try {
      const activeJob = await Booking.findOne({
        where: {
          driver_id: driverId,
          status: {
            [Op.in]: [
              'accepted',
              'driver_assigned',
              'driver_en_route',
              'arrived_pickup',
              'loading',
              'in_transit',
              'arrived_destination',
              'unloading',
            ],
          },
        },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['first_name', 'last_name', 'phone'],
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['vehicle_type', 'make', 'model', 'license_plate'],
          },
        ],
        order: [['accepted_at', 'DESC']],
      });

      if (!activeJob) {
        return null;
      }

      return activeJob;
    } catch (error) {
      console.error('Get current job error:', error.message);
      throw error;
    }
  }

  // Update job status
  static async updateJobStatus(
    driverId,
    bookingId,
    newStatus,
    additionalData = {}
  ) {
    try {
      const booking = await Booking.findOne({
        where: {
          id: bookingId,
          driver_id: driverId,
        },
      });

      if (!booking) {
        throw new Error('Job not found or not assigned to this driver');
      }

      // Define valid status transitions
      const validTransitions = {
        accepted: ['driver_en_route', 'cancelled'],
        driver_en_route: ['arrived_pickup', 'cancelled'],
        arrived_pickup: ['loading', 'cancelled'],
        loading: ['in_transit', 'cancelled'],
        in_transit: ['arrived_destination', 'cancelled'],
        arrived_destination: ['unloading', 'cancelled'],
        unloading: ['completed', 'cancelled'],
      };

      const allowedStatuses = validTransitions[booking.status];
      if (!allowedStatuses || !allowedStatuses.includes(newStatus)) {
        throw new Error(
          `Cannot change status from ${booking.status} to ${newStatus}`
        );
      }

      // Prepare update data
      const updateData = { status: newStatus };

      // Set timestamps based on status
      switch (newStatus) {
        case 'driver_en_route':
          updateData.started_at = new Date();
          break;
        case 'completed':
          updateData.completed_at = new Date();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date();
          updateData.cancellation_reason =
            additionalData.cancellation_reason || 'Cancelled by driver';
          break;
      }

      // Update booking
      await booking.update(updateData);

      // Update driver availability if job is completed or cancelled
      if (['completed', 'cancelled'].includes(newStatus)) {
        const driver = await Driver.findByPk(driverId);
        await driver.update({
          availability_status: 'available',
        });

        // Update driver stats if completed
        if (newStatus === 'completed') {
          await driver.update({
            total_trips: driver.total_trips + 1,
          });
        }
      }

      return booking;
    } catch (error) {
      console.error('Update job status error:', error.message);
      throw error;
    }
  }

  // Get driver's job history
  static async getJobHistory(driverId, filters = {}) {
    try {
      const { status, start_date, end_date, limit = 20, offset = 0 } = filters;

      const whereClause = { driver_id: driverId };

      if (status) {
        whereClause.status = status;
      }

      if (start_date && end_date) {
        whereClause.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        };
      }

      const jobs = await Booking.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['first_name', 'last_name'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'id',
          'booking_number',
          'pickup_address',
          'dropoff_address',
          'pickup_date',
          'status',
          'total_price',
          'accepted_at',
          'completed_at',
          'cancelled_at',
          'created_at',
        ],
      });

      return {
        jobs: jobs.rows,
        total: jobs.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < jobs.count,
      };
    } catch (error) {
      console.error('Get job history error:', error.message);
      throw error;
    }
  }

  // Update driver location
  static async updateDriverLocation(driverId, locationData) {
    try {
      const { latitude, longitude, address } = locationData;

      // Validate coordinates
      LocationService.validateCoordinates(latitude, longitude);

      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }

      await driver.update({
        current_location_lat: latitude,
        current_location_lng: longitude,
        current_address: address?.trim() || null,
      });

      return {
        message: 'Location updated successfully',
        location: {
          lat: latitude,
          lng: longitude,
          address: address?.trim() || null,
          updated_at: new Date(),
        },
      };
    } catch (error) {
      console.error('Update driver location error:', error.message);
      throw error;
    }
  }

  // Get driver earnings
  static async getDriverEarnings(driverId, filters = {}) {
    try {
      const {
        start_date,
        end_date,
        period = 'week', // week, month, all
      } = filters;

      let dateFilter = {};
      const now = new Date();

      switch (period) {
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - 7));
          dateFilter = { [Op.gte]: weekStart };
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { [Op.gte]: monthStart };
          break;
        default:
          if (start_date && end_date) {
            dateFilter = {
              [Op.between]: [new Date(start_date), new Date(end_date)],
            };
          }
      }

      const whereClause = {
        driver_id: driverId,
        status: 'completed',
      };

      if (Object.keys(dateFilter).length > 0) {
        whereClause.completed_at = dateFilter;
      }

      const completedJobs = await Booking.findAll({
        where: whereClause,
        attributes: ['total_price', 'completed_at', 'pickup_date'],
        order: [['completed_at', 'DESC']],
      });

      // Calculate earnings (assuming 80% goes to driver, 20% platform fee)
      const platformFeePercentage = 0.2;
      const driverPercentage = 1 - platformFeePercentage;

      const totalEarnings = completedJobs.reduce(
        (sum, job) => sum + job.total_price * driverPercentage,
        0
      );
      const totalPlatformFees = completedJobs.reduce(
        (sum, job) => sum + job.total_price * platformFeePercentage,
        0
      );
      const totalRevenue = completedJobs.reduce(
        (sum, job) => sum + job.total_price,
        0
      );

      return {
        period,
        total_jobs: completedJobs.length,
        total_revenue: Math.round(totalRevenue),
        total_earnings: Math.round(totalEarnings),
        platform_fees: Math.round(totalPlatformFees),
        average_per_job:
          completedJobs.length > 0
            ? Math.round(totalEarnings / completedJobs.length)
            : 0,
        currency: 'KES',
        jobs: completedJobs,
      };
    } catch (error) {
      console.error('Get driver earnings error:', error.message);
      throw error;
    }
  }

  // Helper method to calculate distance
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // 2 decimal places
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

export default DriverJobService;
