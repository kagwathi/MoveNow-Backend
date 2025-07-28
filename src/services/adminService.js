import { Op } from 'sequelize';
import {
  User,
  Driver,
  Booking,
  Vehicle,
  Payment,
  sequelize,
} from '../models/index.js';

class AdminService {
  // Get dashboard overview metrics
  static async getDashboardMetrics(filters = {}) {
    try {
      const { start_date, end_date } = filters;

      // Date range filter
      let dateFilter = {};
      if (start_date && end_date) {
        dateFilter = {
          created_at: {
            [Op.between]: [new Date(start_date), new Date(end_date)],
          },
        };
      }

      // Get basic counts
      const [
        totalUsers,
        totalDrivers,
        totalBookings,
        activeBookings,
        completedBookings,
        pendingDriverApprovals,
        totalRevenue,
      ] = await Promise.all([
        User.count(),
        Driver.count(),
        Booking.count(dateFilter.created_at ? { where: dateFilter } : {}),
        Booking.count({
          where: {
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
        }),
        Booking.count({
          where: {
            status: 'completed',
            ...(dateFilter.created_at && dateFilter),
          },
        }),
        Driver.count({
          where: { is_approved: false },
        }),
        Booking.sum('total_price', {
          where: {
            status: 'completed',
            ...(dateFilter.created_at && dateFilter),
          },
        }) || 0,
      ]);

      // Get recent activity
      const recentBookings = await Booking.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['first_name', 'last_name'],
          },
        ],
        attributes: [
          'id',
          'booking_number',
          'status',
          'total_price',
          'created_at',
        ],
      });

      // Get revenue by day (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const dailyRevenue = await Booking.findAll({
        where: {
          status: 'completed',
          completed_at: {
            [Op.gte]: sevenDaysAgo,
          },
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('completed_at')), 'date'],
          [sequelize.fn('SUM', sequelize.col('total_price')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        ],
        group: [sequelize.fn('DATE', sequelize.col('completed_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('completed_at')), 'ASC']],
      });

      // Get top performing drivers
      const topDrivers = await Driver.findAll({
        limit: 5,
        order: [['total_trips', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name'],
          },
        ],
        attributes: ['id', 'total_trips', 'rating'],
        where: { total_trips: { [Op.gt]: 0 } },
      });

      // Platform statistics
      const platformStats = {
        conversion_rate:
          totalBookings > 0
            ? ((completedBookings / totalBookings) * 100).toFixed(2)
            : 0,
        average_booking_value:
          completedBookings > 0
            ? Math.round(totalRevenue / completedBookings)
            : 0,
        platform_fee: Math.round(totalRevenue * 0.2), // 20% platform fee
        driver_payouts: Math.round(totalRevenue * 0.8), // 80% to drivers
      };

      return {
        overview: {
          total_users: totalUsers,
          total_drivers: totalDrivers,
          total_bookings: totalBookings,
          active_bookings: activeBookings,
          completed_bookings: completedBookings,
          pending_approvals: pendingDriverApprovals,
          total_revenue: Math.round(totalRevenue),
        },
        platform_stats: platformStats,
        recent_activity: recentBookings,
        daily_revenue: dailyRevenue,
        top_drivers: topDrivers,
        currency: 'KES',
      };
    } catch (error) {
      console.error('Get dashboard metrics error:', error.message);
      throw error;
    }
  }

  // Get all users with filtering
  static async getAllUsers(filters = {}) {
    try {
      const {
        role,
        status,
        search,
        limit = 50,
        offset = 0,
        sort_by = 'created_at',
        sort_order = 'DESC',
      } = filters;

      let whereClause = {};

      if (role) {
        whereClause.role = role;
      }

      if (status === 'active') {
        whereClause.is_active = true;
      } else if (status === 'inactive') {
        whereClause.is_active = false;
      }

      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ];
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Driver,
            as: 'driverProfile',
            required: false,
            attributes: [
              'id',
              'is_approved',
              'rating',
              'total_trips',
              'availability_status',
            ],
          },
        ],
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort_by, sort_order.toUpperCase()]],
      });

      return {
        users: users.rows,
        total: users.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < users.count,
      };
    } catch (error) {
      console.error('Get all users error:', error.message);
      throw error;
    }
  }

  // Approve/reject driver
  static async updateDriverApproval(
    driverId,
    isApproved,
    adminId,
    reason = null
  ) {
    try {
      const driver = await Driver.findByPk(driverId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email'],
          },
        ],
      });

      if (!driver) {
        throw new Error('Driver not found');
      }

      const updateData = {
        is_approved: isApproved,
        approval_date: isApproved ? new Date() : null,
        documents_verified: isApproved,
      };

      await driver.update(updateData);

      // Log the approval action (you could create an admin_actions table for this)
      console.log(
        `Driver ${driverId} ${
          isApproved ? 'approved' : 'rejected'
        } by admin ${adminId}. Reason: ${reason || 'None provided'}`
      );

      return {
        driver,
        action: isApproved ? 'approved' : 'rejected',
        message: `Driver ${isApproved ? 'approved' : 'rejected'} successfully`,
      };
    } catch (error) {
      console.error('Update driver approval error:', error.message);
      throw error;
    }
  }

  // Get all bookings with comprehensive filtering
  static async getAllBookings(filters = {}) {
    try {
      const {
        status,
        customer_id,
        driver_id,
        date_from,
        date_to,
        search,
        limit = 50,
        offset = 0,
        sort_by = 'created_at',
        sort_order = 'DESC',
      } = filters;

      let whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (customer_id) {
        whereClause.customer_id = customer_id;
      }

      if (driver_id) {
        whereClause.driver_id = driver_id;
      }

      if (date_from && date_to) {
        whereClause.created_at = {
          [Op.between]: [new Date(date_from), new Date(date_to)],
        };
      }

      if (search) {
        whereClause[Op.or] = [
          { booking_number: { [Op.like]: `%${search}%` } },
          { pickup_address: { [Op.like]: `%${search}%` } },
          { dropoff_address: { [Op.like]: `%${search}%` } },
        ];
      }

      const bookings = await Booking.findAndCountAll({
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
            ],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort_by, sort_order.toUpperCase()]],
      });

      return {
        bookings: bookings.rows,
        total: bookings.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < bookings.count,
      };
    } catch (error) {
      console.error('Get all bookings error:', error.message);
      throw error;
    }
  }

  // Override booking status (admin only)
  static async updateBookingStatus(
    bookingId,
    newStatus,
    adminId,
    reason = null
  ) {
    try {
      const booking = await Booking.findByPk(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      const updateData = { status: newStatus };

      // Set appropriate timestamps
      switch (newStatus) {
        case 'completed':
          updateData.completed_at = new Date();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date();
          updateData.cancellation_reason = reason || 'Cancelled by admin';
          break;
      }

      await booking.update(updateData);

      // Log the admin action
      console.log(
        `Booking ${bookingId} status changed to ${newStatus} by admin ${adminId}. Reason: ${
          reason || 'None provided'
        }`
      );

      return booking;
    } catch (error) {
      console.error('Update booking status error:', error.message);
      throw error;
    }
  }

  // Generate comprehensive reports
  static async generateReports(reportType, filters = {}) {
    try {
      const { start_date, end_date } = filters;

      let dateFilter = {};
      if (start_date && end_date) {
        dateFilter = {
          created_at: {
            [Op.between]: [new Date(start_date), new Date(end_date)],
          },
        };
      }

      switch (reportType) {
        case 'revenue':
          return await this.generateRevenueReport(dateFilter);

        case 'bookings':
          return await this.generateBookingsReport(dateFilter);

        case 'drivers':
          return await this.generateDriversReport(dateFilter);

        case 'customers':
          return await this.generateCustomersReport(dateFilter);

        default:
          throw new Error('Invalid report type');
      }
    } catch (error) {
      console.error('Generate reports error:', error.message);
      throw error;
    }
  }

  // Revenue report
  static async generateRevenueReport(dateFilter) {
    const completedBookings = await Booking.findAll({
      where: {
        status: 'completed',
        ...(dateFilter.created_at && { completed_at: dateFilter.created_at }),
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('completed_at')), 'date'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'total_revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_bookings'],
        [
          sequelize.fn('AVG', sequelize.col('total_price')),
          'average_booking_value',
        ],
      ],
      group: [sequelize.fn('DATE', sequelize.col('completed_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('completed_at')), 'DESC']],
    });

    const totalRevenue = completedBookings.reduce(
      (sum, day) => sum + parseFloat(day.dataValues.total_revenue || 0),
      0
    );
    const totalBookings = completedBookings.reduce(
      (sum, day) => sum + parseInt(day.dataValues.total_bookings || 0),
      0
    );

    return {
      type: 'revenue',
      summary: {
        total_revenue: Math.round(totalRevenue),
        total_bookings: totalBookings,
        average_booking_value:
          totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
        platform_fees: Math.round(totalRevenue * 0.2),
        driver_payouts: Math.round(totalRevenue * 0.8),
        currency: 'KES',
      },
      daily_breakdown: completedBookings.map((day) => ({
        date: day.dataValues.date,
        revenue: Math.round(parseFloat(day.dataValues.total_revenue || 0)),
        bookings: parseInt(day.dataValues.total_bookings || 0),
        average_value: Math.round(
          parseFloat(day.dataValues.average_booking_value || 0)
        ),
      })),
    };
  }

  // Bookings report
  static async generateBookingsReport(dateFilter) {
    const bookingStats = await Booking.findAll({
      where: dateFilter,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    const vehicleTypeStats = await Booking.findAll({
      where: dateFilter,
      attributes: [
        'vehicle_type_required',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('total_price')), 'average_price'],
      ],
      group: ['vehicle_type_required'],
    });

    return {
      type: 'bookings',
      status_breakdown: bookingStats.map((stat) => ({
        status: stat.status,
        count: parseInt(stat.dataValues.count),
      })),
      vehicle_type_breakdown: vehicleTypeStats.map((stat) => ({
        vehicle_type: stat.vehicle_type_required,
        count: parseInt(stat.dataValues.count),
        average_price: Math.round(
          parseFloat(stat.dataValues.average_price || 0)
        ),
      })),
    };
  }

  // Drivers report
  static async generateDriversReport(dateFilter) {
    const driverStats = await Driver.findAll({
      where: dateFilter,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name', 'created_at'],
        },
      ],
      attributes: [
        'id',
        'is_approved',
        'total_trips',
        'rating',
        'availability_status',
      ],
    });

    const approvedDrivers = driverStats.filter((d) => d.is_approved).length;
    const pendingDrivers = driverStats.filter((d) => !d.is_approved).length;
    const activeDrivers = driverStats.filter(
      (d) => d.availability_status === 'available'
    ).length;

    return {
      type: 'drivers',
      summary: {
        total_drivers: driverStats.length,
        approved_drivers: approvedDrivers,
        pending_drivers: pendingDrivers,
        active_drivers: activeDrivers,
        average_rating:
          driverStats.length > 0
            ? (
                driverStats.reduce(
                  (sum, d) => sum + parseFloat(d.rating || 0),
                  0
                ) / driverStats.length
              ).toFixed(2)
            : 0,
      },
      driver_details: driverStats.map((driver) => ({
        id: driver.id,
        name: `${driver.user.first_name} ${driver.user.last_name}`,
        is_approved: driver.is_approved,
        total_trips: driver.total_trips,
        rating: parseFloat(driver.rating || 0),
        status: driver.availability_status,
        joined_date: driver.user.created_at,
      })),
    };
  }

  // Customers report
  static async generateCustomersReport(dateFilter) {
    const customerStats = await User.findAll({
      where: {
        role: 'customer',
        ...(dateFilter.created_at && dateFilter),
      },
      attributes: [
        'id',
        'first_name',
        'last_name',
        'email',
        'created_at',
        'is_active',
      ],
    });

    // Get booking counts per customer
    const customerBookings = await Booking.findAll({
      attributes: [
        'customer_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'booking_count'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'total_spent'],
      ],
      group: ['customer_id'],
    });

    const bookingMap = customerBookings.reduce((map, cb) => {
      map[cb.customer_id] = {
        bookings: parseInt(cb.dataValues.booking_count),
        total_spent: parseFloat(cb.dataValues.total_spent || 0),
      };
      return map;
    }, {});

    return {
      type: 'customers',
      summary: {
        total_customers: customerStats.length,
        active_customers: customerStats.filter((c) => c.is_active).length,
        customers_with_bookings: Object.keys(bookingMap).length,
      },
      customer_details: customerStats.map((customer) => ({
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        is_active: customer.is_active,
        joined_date: customer.created_at,
        total_bookings: bookingMap[customer.id]?.bookings || 0,
        total_spent: Math.round(bookingMap[customer.id]?.total_spent || 0),
      })),
    };
  }
}

export default AdminService;
