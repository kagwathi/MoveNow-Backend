import { Op } from 'sequelize';

class PricingService {
  // Base pricing configuration
  static PRICING_CONFIG = {
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
      peak_hours: 1.3, // 7-9 AM, 5-7 PM
      weekend: 1.2,
      night: 1.1, // 10 PM - 6 AM
    },
    helper_rate: 300, // per helper
    minimum_charge: 800,
  };

  // Calculate distance and duration using coordinates
  static calculateDistance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(dropoff_lat - pickup_lat);
    const dLng = this.toRadians(dropoff_lng - pickup_lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(pickup_lat)) *
        Math.cos(this.toRadians(dropoff_lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate duration (assuming average speed of 25 km/h in city)
    const estimated_duration = Math.round((distance / 25) * 60); // in minutes

    return {
      distance: Math.round(distance * 100) / 100, // 2 decimal places
      estimated_duration: Math.max(estimated_duration, 30), // minimum 30 minutes
    };
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get time multiplier based on pickup time
  static getTimeMultiplier(pickup_datetime) {
    const pickup_date = new Date(pickup_datetime);
    const hour = pickup_date.getHours();
    const day = pickup_date.getDay(); // 0 = Sunday, 6 = Saturday

    let multiplier = 1.0;

    // Peak hours (7-9 AM, 5-7 PM)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      multiplier = Math.max(
        multiplier,
        this.PRICING_CONFIG.time_multipliers.peak_hours
      );
    }

    // Weekend (Saturday, Sunday)
    if (day === 0 || day === 6) {
      multiplier = Math.max(
        multiplier,
        this.PRICING_CONFIG.time_multipliers.weekend
      );
    }

    // Night hours (10 PM - 6 AM)
    if (hour >= 22 || hour <= 6) {
      multiplier = Math.max(
        multiplier,
        this.PRICING_CONFIG.time_multipliers.night
      );
    }

    return multiplier;
  }

  // Calculate pricing estimate
  static calculatePricing(params) {
    try {
      const {
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng,
        vehicle_type,
        load_type,
        pickup_datetime,
        requires_helpers = false,
        helpers_count = 0,
      } = params;

      // Calculate distance and duration
      const { distance, estimated_duration } = this.calculateDistance(
        pickup_lat,
        pickup_lng,
        dropoff_lat,
        dropoff_lng
      );

      // Get base rates for vehicle type
      const vehicle_rates = this.PRICING_CONFIG.base_rates[vehicle_type];
      if (!vehicle_rates) {
        throw new Error(`Invalid vehicle type: ${vehicle_type}`);
      }

      // Calculate base pricing
      let base_price = vehicle_rates.base;
      let distance_price = distance * vehicle_rates.per_km;
      let time_price = estimated_duration * vehicle_rates.per_minute;

      // Apply load type multiplier
      const load_multiplier =
        this.PRICING_CONFIG.load_multipliers[load_type] || 1.0;

      // Apply time-based multiplier
      const time_multiplier = this.getTimeMultiplier(pickup_datetime);

      // Calculate helper charges
      let helper_charges = 0;
      if (requires_helpers && helpers_count > 0) {
        helper_charges = helpers_count * this.PRICING_CONFIG.helper_rate;
      }

      // Calculate subtotal
      let subtotal =
        (base_price + distance_price + time_price) *
        load_multiplier *
        time_multiplier;

      // Add helper charges
      subtotal += helper_charges;

      // Apply minimum charge
      const total_price = Math.max(
        subtotal,
        this.PRICING_CONFIG.minimum_charge
      );

      return {
        estimated_distance: distance,
        estimated_duration,
        base_price: Math.round(base_price),
        distance_price: Math.round(distance_price),
        time_price: Math.round(time_price),
        load_multiplier,
        time_multiplier,
        helper_charges,
        subtotal: Math.round(subtotal),
        total_price: Math.round(total_price),
        currency: 'KES',
        breakdown: {
          base_rate: `${vehicle_rates.base} KES (base rate for ${vehicle_type})`,
          distance_rate: `${distance.toFixed(2)} km × ${
            vehicle_rates.per_km
          } KES/km = ${Math.round(distance_price)} KES`,
          time_rate: `${estimated_duration} min × ${
            vehicle_rates.per_minute
          } KES/min = ${Math.round(time_price)} KES`,
          load_adjustment: `${(load_multiplier * 100).toFixed(
            0
          )}% (${load_type} load)`,
          time_adjustment: `${(time_multiplier * 100).toFixed(
            0
          )}% (time-based pricing)`,
          helpers: requires_helpers
            ? `${helpers_count} helper(s) × ${this.PRICING_CONFIG.helper_rate} KES = ${helper_charges} KES`
            : 'No helpers required',
          minimum_charge: `Minimum charge: ${this.PRICING_CONFIG.minimum_charge} KES`,
        },
      };
    } catch (error) {
      console.error('Pricing calculation error:', error.message);
      throw error;
    }
  }

  // Get pricing for multiple vehicle types
  static calculateMultiVehiclePricing(params) {
    const vehicle_types = [
      'pickup',
      'small_truck',
      'medium_truck',
      'large_truck',
      'van',
    ];
    const estimates = {};

    vehicle_types.forEach((vehicle_type) => {
      try {
        estimates[vehicle_type] = this.calculatePricing({
          ...params,
          vehicle_type,
        });
      } catch (error) {
        estimates[vehicle_type] = {
          error: error.message,
        };
      }
    });

    return estimates;
  }
}

export default PricingService;
