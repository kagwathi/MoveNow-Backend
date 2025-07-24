import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Driver = sequelize.define(
  'Driver',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    license_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'License number already exists',
      },
      validate: {
        notEmpty: { msg: 'License number is required' },
      },
    },
    license_expiry: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: { msg: 'Please provide a valid license expiry date' },
        isAfter: {
          args: new Date().toISOString(),
          msg: 'License must not be expired',
        },
      },
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Experience years cannot be negative' },
        max: { args: 50, msg: 'Experience years seems unrealistic' },
      },
    },
    current_location_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: { args: -90, msg: 'Invalid latitude' },
        max: { args: 90, msg: 'Invalid latitude' },
      },
    },
    current_location_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: { args: -180, msg: 'Invalid longitude' },
        max: { args: 180, msg: 'Invalid longitude' },
      },
    },
    current_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    availability_status: {
      type: DataTypes.ENUM('available', 'busy', 'offline'),
      defaultValue: 'offline',
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
      validate: {
        min: { args: 0, msg: 'Rating cannot be negative' },
        max: { args: 5, msg: 'Rating cannot exceed 5.0' },
      },
    },
    total_ratings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_trips: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    approval_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    documents_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'drivers',
  }
);

export default Driver;
