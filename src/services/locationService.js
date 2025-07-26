class LocationService {
  // Validate coordinates
  static validateCoordinates(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates: must be valid numbers');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    return { latitude, longitude };
  }

  // Check if coordinates are within service area (Nairobi and surrounding areas)
  static isWithinServiceArea(lat, lng) {
    const { latitude, longitude } = this.validateCoordinates(lat, lng);

    // Nairobi service area bounds (approximate)
    const service_bounds = {
      north: -1.163,
      south: -1.444,
      east: 37.103,
      west: 36.65,
    };

    return (
      latitude >= service_bounds.south &&
      latitude <= service_bounds.north &&
      longitude >= service_bounds.west &&
      longitude <= service_bounds.east
    );
  }

  // Calculate if the trip distance is reasonable
  static validateTripDistance(
    pickup_lat,
    pickup_lng,
    dropoff_lat,
    dropoff_lng
  ) {
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

    // Validate trip constraints
    if (distance < 0.5) {
      throw new Error('Trip too short: minimum distance is 0.5 km');
    }

    if (distance > 100) {
      throw new Error('Trip too long: maximum distance is 100 km');
    }

    return distance;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Format address for storage
  static formatAddress(address) {
    if (!address || typeof address !== 'string') {
      throw new Error('Address is required and must be a string');
    }

    return address.trim().substring(0, 500); // Limit length
  }

  // Validate pickup time
  static validatePickupTime(pickup_date, pickup_time) {
    const pickup_datetime = new Date(`${pickup_date}T${pickup_time}`);
    const now = new Date();
    const min_advance_time = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const max_advance_time = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    if (pickup_datetime < min_advance_time) {
      throw new Error('Pickup time must be at least 30 minutes from now');
    }

    if (pickup_datetime > max_advance_time) {
      throw new Error('Pickup time cannot be more than 7 days in advance');
    }

    return pickup_datetime;
  }
}

export default LocationService;
