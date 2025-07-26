import { Vehicle, Driver } from '../models/index.js';

class VehicleService {
  // Add vehicle to driver
  static async addVehicle(driverId, vehicleData) {
    try {
      // Check if license plate already exists
      const existingVehicle = await Vehicle.findOne({
        where: { license_plate: vehicleData.license_plate },
      });

      if (existingVehicle) {
        throw new Error('License plate already registered');
      }

      const vehicle = await Vehicle.create({
        driver_id: driverId,
        ...vehicleData,
      });

      return vehicle;
    } catch (error) {
      console.error('Add vehicle error:', error.message);
      throw error;
    }
  }

  // Get driver's vehicles
  static async getDriverVehicles(driverId) {
    try {
      const vehicles = await Vehicle.findAll({
        where: { driver_id: driverId },
        order: [['created_at', 'DESC']],
      });

      return vehicles;
    } catch (error) {
      console.error('Get driver vehicles error:', error.message);
      throw error;
    }
  }

  // Update vehicle
  static async updateVehicle(vehicleId, driverId, updateData) {
    try {
      const vehicle = await Vehicle.findOne({
        where: { id: vehicleId, driver_id: driverId },
      });

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      await vehicle.update(updateData);
      return vehicle;
    } catch (error) {
      console.error('Update vehicle error:', error.message);
      throw error;
    }
  }
}

export default VehicleService;
