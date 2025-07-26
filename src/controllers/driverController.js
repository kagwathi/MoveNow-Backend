import DriverJobService from '../services/driverJobService.js';

class DriverController {
  // Get available jobs
  static async getAvailableJobs(req, res) {
    try {
      const filters = {
        radius: req.query.radius,
        vehicle_types: req.query.vehicle_types
          ? req.query.vehicle_types.split(',')
          : [],
        limit: req.query.limit,
        offset: req.query.offset,
      };

      const result = await DriverJobService.getAvailableJobs(
        req.driver.id,
        filters
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get available jobs controller error:', error.message);

      if (
        error.message.includes('not approved') ||
        error.message.includes('not found') ||
        error.message.includes('No active vehicles')
      ) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch available jobs',
      });
    }
  }

  // Accept a job
  static async acceptJob(req, res) {
    try {
      const { id } = req.params;
      const result = await DriverJobService.acceptJob(req.driver.id, id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { booking: result.booking },
      });
    } catch (error) {
      console.error('Accept job controller error:', error.message);

      if (
        error.message.includes('not found') ||
        error.message.includes('not available') ||
        error.message.includes('already') ||
        error.message.includes('not approved') ||
        error.message.includes('does not have required vehicle')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to accept job',
      });
    }
  }

  // Get current active job
  static async getCurrentJob(req, res) {
    try {
      const job = await DriverJobService.getCurrentJob(req.driver.id);

      if (!job) {
        return res.status(200).json({
          success: true,
          data: { job: null },
          message: 'No active job found',
        });
      }

      res.status(200).json({
        success: true,
        data: { job },
      });
    } catch (error) {
      console.error('Get current job controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch current job',
      });
    }
  }

  // Update job status
  static async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, cancellation_reason } = req.body;

      const booking = await DriverJobService.updateJobStatus(
        req.driver.id,
        id,
        status,
        { cancellation_reason }
      );

      res.status(200).json({
        success: true,
        message: `Job status updated to ${status}`,
        data: { booking },
      });
    } catch (error) {
      console.error('Update job status controller error:', error.message);

      if (
        error.message.includes('not found') ||
        error.message.includes('Cannot change status')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update job status',
      });
    }
  }

  // Get job history
  static async getJobHistory(req, res) {
    try {
      const filters = {
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: req.query.limit,
        offset: req.query.offset,
      };

      const result = await DriverJobService.getJobHistory(
        req.driver.id,
        filters
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get job history controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch job history',
      });
    }
  }

  // Update driver location
  static async updateLocation(req, res) {
    try {
      const { latitude, longitude, address } = req.body;

      const result = await DriverJobService.updateDriverLocation(
        req.driver.id,
        {
          latitude,
          longitude,
          address,
        }
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: { location: result.location },
      });
    } catch (error) {
      console.error('Update location controller error:', error.message);

      if (error.message.includes('Invalid coordinates')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update location',
      });
    }
  }

  // Get driver earnings
  static async getEarnings(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        period: req.query.period,
      };

      const earnings = await DriverJobService.getDriverEarnings(
        req.driver.id,
        filters
      );

      res.status(200).json({
        success: true,
        data: earnings,
      });
    } catch (error) {
      console.error('Get earnings controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch earnings',
      });
    }
  }

  // Update driver availability status
  static async updateAvailabilityStatus(req, res) {
    try {
      const { status } = req.body;

      if (!['available', 'busy', 'offline'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: available, busy, or offline',
        });
      }

      await req.driver.update({ availability_status: status });

      res.status(200).json({
        success: true,
        message: `Availability status updated to ${status}`,
        data: {
          driver: {
            id: req.driver.id,
            availability_status: status,
          },
        },
      });
    } catch (error) {
      console.error(
        'Update availability status controller error:',
        error.message
      );

      res.status(500).json({
        success: false,
        message: 'Failed to update availability status',
      });
    }
  }
}

export default DriverController;
