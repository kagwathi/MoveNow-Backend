import User from '../models/User.js';
import AdminService from '../services/adminService.js';
import PricingConfigService from '../services/pricingConfigService.js';

class AdminController {
  // Get dashboard metrics
  static async getDashboard(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
      };

      const metrics = await AdminService.getDashboardMetrics(filters);

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Get dashboard controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard metrics',
      });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      const filters = {
        role: req.query.role,
        status: req.query.status,
        search: req.query.search,
        limit: req.query.limit,
        offset: req.query.offset,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
      };

      const result = await AdminService.getAllUsers(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get all users controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
      });
    }
  }

  // Approve/reject driver
  static async updateDriverApproval(req, res) {
    try {
      const { id } = req.params;
      const { is_approved, reason } = req.body;

      const result = await AdminService.updateDriverApproval(
        id,
        is_approved,
        req.user.id,
        reason
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: { driver: result.driver },
      });
    } catch (error) {
      console.error('Update driver approval controller error:', error.message);

      if (error.message === 'Driver not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update driver approval',
      });
    }
  }

  // Get all bookings
  static async getAllBookings(req, res) {
    try {
      const filters = {
        status: req.query.status,
        customer_id: req.query.customer_id,
        driver_id: req.query.driver_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        limit: req.query.limit,
        offset: req.query.offset,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
      };

      const result = await AdminService.getAllBookings(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get all bookings controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings',
      });
    }
  }

  // Update booking status (admin override)
  static async updateBookingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const booking = await AdminService.updateBookingStatus(
        id,
        status,
        req.user.id,
        reason
      );

      res.status(200).json({
        success: true,
        message: `Booking status updated to ${status}`,
        data: { booking },
      });
    } catch (error) {
      console.error('Update booking status controller error:', error.message);

      if (error.message === 'Booking not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update booking status',
      });
    }
  }

  // Get pricing configuration
  static async getPricingConfig(req, res) {
    try {
      const config = PricingConfigService.getCurrentPricingConfig();

      res.status(200).json({
        success: true,
        data: { config },
      });
    } catch (error) {
      console.error('Get pricing config controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch pricing configuration',
      });
    }
  }

  // Update pricing configuration
  static async updatePricingConfig(req, res) {
    try {
      const result = PricingConfigService.updatePricingConfig(
        req.body,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: { config: result.config },
      });
    } catch (error) {
      console.error('Update pricing config controller error:', error.message);

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update pricing configuration',
      });
    }
  }

  // Reset pricing configuration to defaults
  static async resetPricingConfig(req, res) {
    try {
      const result = PricingConfigService.resetToDefaults(req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { config: result.config },
      });
    } catch (error) {
      console.error('Reset pricing config controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to reset pricing configuration',
      });
    }
  }

  // Generate reports
  static async generateReports(req, res) {
    try {
      const { type } = req.params;
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
      };

      const report = await AdminService.generateReports(type, filters);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Generate reports controller error:', error.message);

      if (error.message === 'Invalid report type') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
      });
    }
  }

  // Deactivate/activate user
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active, reason } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      await user.update({ is_active });

      console.log(
        `User ${id} ${is_active ? 'activated' : 'deactivated'} by admin ${
          req.user.id
        }. Reason: ${reason || 'None provided'}`
      );

      res.status(200).json({
        success: true,
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: { user: user.toJSON() },
      });
    } catch (error) {
      console.error('Toggle user status controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
      });
    }
  }

  // Get system statistics
  static async getSystemStats(req, res) {
    try {
      const stats = await AdminService.getDashboardMetrics();

      // Additional system statistics
      const systemInfo = {
        server_time: new Date().toISOString(),
        api_version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };

      res.status(200).json({
        success: true,
        data: {
          ...stats,
          system_info: systemInfo,
        },
      });
    } catch (error) {
      console.error('Get system stats controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch system statistics',
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      console.log('Attempting to delete user:', id, 'by admin:', adminId);

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Prevent deleting admin users or self
      if (user.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete admin user',
        });
      }

      if (user.id === adminId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
      }

      const userData = user.toJSON();
      await user.destroy();

      // Log the action
      console.log(
        `User ${id} (${
          userData.email
        }) deleted by admin ${adminId}. Reason: ${reason || 'None provided'}`
      );

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: { user: userData },
      });
    } catch (error) {
      console.error('Delete user controller error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
      });
    }
  }
}

export default AdminController;
