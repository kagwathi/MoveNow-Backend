import PricingService from './pricingService.js';

class PricingConfigService {
  // Get current pricing configuration
  static getCurrentPricingConfig() {
    try {
      return {
        base_rates: PricingService.PRICING_CONFIG.base_rates,
        load_multipliers: PricingService.PRICING_CONFIG.load_multipliers,
        time_multipliers: PricingService.PRICING_CONFIG.time_multipliers,
        helper_rate: PricingService.PRICING_CONFIG.helper_rate,
        minimum_charge: PricingService.PRICING_CONFIG.minimum_charge,
        currency: 'KES',
      };
    } catch (error) {
      console.error('Get pricing config error:', error.message);
      throw error;
    }
  }

  // Update pricing configuration
  static updatePricingConfig(newConfig, adminId) {
    try {
      // Validate the configuration structure
      this.validatePricingConfig(newConfig);

      // In a real application, you'd save this to a database
      // For now, we'll update the in-memory configuration
      if (newConfig.base_rates) {
        Object.assign(
          PricingService.PRICING_CONFIG.base_rates,
          newConfig.base_rates
        );
      }

      if (newConfig.load_multipliers) {
        Object.assign(
          PricingService.PRICING_CONFIG.load_multipliers,
          newConfig.load_multipliers
        );
      }

      if (newConfig.time_multipliers) {
        Object.assign(
          PricingService.PRICING_CONFIG.time_multipliers,
          newConfig.time_multipliers
        );
      }

      if (newConfig.helper_rate !== undefined) {
        PricingService.PRICING_CONFIG.helper_rate = newConfig.helper_rate;
      }

      if (newConfig.minimum_charge !== undefined) {
        PricingService.PRICING_CONFIG.minimum_charge = newConfig.minimum_charge;
      }

      // Log the configuration change
      console.log(
        `Pricing configuration updated by admin ${adminId}:`,
        newConfig
      );

      return {
        message: 'Pricing configuration updated successfully',
        config: this.getCurrentPricingConfig(),
      };
    } catch (error) {
      console.error('Update pricing config error:', error.message);
      throw error;
    }
  }

  // Validate pricing configuration
  static validatePricingConfig(config) {
    if (config.base_rates) {
      const requiredVehicleTypes = [
        'pickup',
        'small_truck',
        'medium_truck',
        'large_truck',
        'van',
      ];
      const requiredRateFields = ['base', 'per_km', 'per_minute'];

      for (const vehicleType of requiredVehicleTypes) {
        if (config.base_rates[vehicleType]) {
          for (const field of requiredRateFields) {
            if (
              config.base_rates[vehicleType][field] === undefined ||
              config.base_rates[vehicleType][field] < 0
            ) {
              throw new Error(`Invalid ${field} rate for ${vehicleType}`);
            }
          }
        }
      }
    }

    if (config.load_multipliers) {
      const requiredLoadTypes = [
        'furniture',
        'appliances',
        'boxes',
        'electronics',
        'fragile',
        'other',
      ];
      for (const loadType of requiredLoadTypes) {
        if (
          config.load_multipliers[loadType] !== undefined &&
          (config.load_multipliers[loadType] < 0.5 ||
            config.load_multipliers[loadType] > 3.0)
        ) {
          throw new Error(
            `Invalid load multiplier for ${loadType}. Must be between 0.5 and 3.0`
          );
        }
      }
    }

    if (config.helper_rate !== undefined && config.helper_rate < 0) {
      throw new Error('Helper rate cannot be negative');
    }

    if (config.minimum_charge !== undefined && config.minimum_charge < 0) {
      throw new Error('Minimum charge cannot be negative');
    }
  }

  // Reset to default configuration
  static resetToDefaults(adminId) {
    try {
      // Default configuration
      const defaultConfig = {
        base_rates: {
          pickup: { base: 500, per_km: 50, per_minute: 5 },
          small_truck: { base: 800, per_km: 70, per_minute: 8 },
          medium_truck: { base: 1200, per_km: 90, per_minute: 12 },
          large_truck: { base: 1800, per_km: 120, per_minute: 18 },
          van: { base: 700, per_km: 60, per_minute: 7 },
        },
        load_multipliers: {
          furniture: 1.2,
          appliances: 1.3,
          electronics: 1.1,
          fragile: 1.4,
          boxes: 1.0,
          other: 1.1,
        },
        time_multipliers: {
          peak_hours: 1.3,
          weekend: 1.2,
          night: 1.1,
        },
        helper_rate: 300,
        minimum_charge: 800,
      };

      // Update the configuration
      PricingService.PRICING_CONFIG = defaultConfig;

      console.log(
        `Pricing configuration reset to defaults by admin ${adminId}`
      );

      return {
        message: 'Pricing configuration reset to defaults',
        config: this.getCurrentPricingConfig(),
      };
    } catch (error) {
      console.error('Reset pricing config error:', error.message);
      throw error;
    }
  }
}

export default PricingConfigService;
