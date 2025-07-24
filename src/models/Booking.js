import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Booking = sequelize.define(
  'Booking',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    booking_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    driver_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'drivers',
        key: 'id',
      },
    },
    vehicle_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'vehicles',
        key: 'id',
      },
    },

    // Pickup details
    pickup_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pickup_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    pickup_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    pickup_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    pickup_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    // Dropoff details
    dropoff_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dropoff_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    dropoff_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },

    // Load details
    load_type: {
      type: DataTypes.ENUM(
        'furniture',
        'appliances',
        'boxes',
        'electronics',
        'fragile',
        'other'
      ),
      allowNull: false,
    },
    load_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimated_weight: {
      type: DataTypes.DECIMAL(8, 2), // in kg
      allowNull: true,
    },
    vehicle_type_required: {
      type: DataTypes.ENUM(
        'pickup',
        'small_truck',
        'medium_truck',
        'large_truck',
        'van'
      ),
      allowNull: false,
    },

    // Pricing details
    estimated_distance: {
      type: DataTypes.DECIMAL(8, 2), // in km
      allowNull: false,
    },
    estimated_duration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: false,
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    distance_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    additional_charges: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Status and tracking
    status: {
      type: DataTypes.ENUM(
        'pending',
        'accepted',
        'driver_assigned',
        'driver_en_route',
        'arrived_pickup',
        'loading',
        'in_transit',
        'arrived_destination',
        'unloading',
        'completed',
        'cancelled'
      ),
      defaultValue: 'pending',
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending',
    },

    // Special requirements
    requires_helpers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    helpers_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    special_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Timestamps for tracking
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'bookings',
    hooks: {
      beforeCreate: async (booking) => {
        // Generate unique booking number
        const timestamp = Date.now().toString();
        const randomNum = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0');
        booking.booking_number = `MN${timestamp.slice(-6)}${randomNum}`;
      },
    },
  }
);

export default Booking;
