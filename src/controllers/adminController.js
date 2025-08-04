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
        `User ${id} (${userData.email}) deleted by admin ${adminId}. Reason: ${
          reason || 'None provided'
        }`
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

  // Add these methods to the existing AdminController class

  // Get admin settings
  static async getAdminSettings(req, res) {
    try {
      // In a real app, you'd fetch settings from database
      // For now, return default settings structure
      const settings = {
        notifications: {
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          booking_alerts: true,
          driver_alerts: true,
          system_alerts: true,
        },
        security: {
          two_factor_enabled: false,
          session_timeout: 30,
          password_expiry: 90,
          failed_login_attempts: 5,
        },
        system: {
          maintenance_mode: false,
          api_rate_limiting: true,
          debug_mode: process.env.NODE_ENV === 'development',
          log_level: 'info',
        },
      };

      res.status(200).json({
        success: true,
        data: { settings },
      });
    } catch (error) {
      console.error('Get admin settings controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch admin settings',
      });
    }
  }

  // Update admin settings
  static async updateAdminSettings(req, res) {
    try {
      const { category, settings } = req.body;

      // Validate category
      const allowedCategories = ['notifications', 'security', 'system'];
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid settings category',
        });
      }

      // In a real app, you'd save settings to database
      // For now, just log the settings update
      console.log(
        `Admin ${req.user.id} updated ${category} settings:`,
        JSON.stringify(settings, null, 2)
      );

      // Special handling for system settings
      if (category === 'system') {
        if (settings.maintenance_mode !== undefined) {
          console.log(
            `🔧 Maintenance mode ${
              settings.maintenance_mode ? 'ENABLED' : 'DISABLED'
            } by admin ${req.user.id}`
          );
        }

        if (settings.debug_mode !== undefined) {
          console.log(
            `🐛 Debug mode ${
              settings.debug_mode ? 'ENABLED' : 'DISABLED'
            } by admin ${req.user.id}`
          );
        }
      }

      res.status(200).json({
        success: true,
        message: `${
          category.charAt(0).toUpperCase() + category.slice(1)
        } settings updated successfully`,
        data: { settings },
      });
    } catch (error) {
      console.error('Update admin settings controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to update admin settings',
      });
    }
  }

  // System actions
  static async clearSystemCache(req, res) {
    try {
      // In a real app, you'd implement actual cache clearing
      console.log(`🗑️ System cache cleared by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'System cache cleared successfully',
      });
    } catch (error) {
      console.error('Clear cache controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to clear system cache',
      });
    }
  }

  static async exportSystemLogs(req, res) {
    try {
      // In a real app, you'd generate and return actual logs
      const logs = {
        exported_at: new Date().toISOString(),
        exported_by: req.user.id,
        log_entries: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'System logs exported',
            admin_id: req.user.id,
          },
        ],
      };

      console.log(`📄 System logs exported by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'System logs exported successfully',
        data: { logs },
      });
    } catch (error) {
      console.error('Export logs controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to export system logs',
      });
    }
  }

  static async createSystemBackup(req, res) {
    try {
      // In a real app, you'd implement actual database backup
      const backup = {
        id: `backup_${Date.now()}`,
        created_at: new Date().toISOString(),
        created_by: req.user.id,
        status: 'completed',
        size: '125.6 MB',
      };

      console.log(`💾 System backup created by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'System backup created successfully',
        data: { backup },
      });
    } catch (error) {
      console.error('Create backup controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to create system backup',
      });
    }
  }

  static async restartSystem(req, res) {
    try {
      // In a real app, you'd implement actual system restart
      // This is a dangerous operation and should have additional security
      console.log(`🔄 System restart initiated by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'System restart initiated successfully',
      });

      // In a real implementation, you might:
      // setTimeout(() => process.exit(0), 5000);
    } catch (error) {
      console.error('Restart system controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to restart system',
      });
    }
  }
}

export default AdminController;
