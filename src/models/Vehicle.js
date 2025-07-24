import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Vehicle = sequelize.define(
  'Vehicle',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    driver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'drivers',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    vehicle_type: {
      type: DataTypes.ENUM(
        'pickup',
        'small_truck',
        'medium_truck',
        'large_truck',
        'van'
      ),
      allowNull: false,
    },
    make: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vehicle make is required' },
      },
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vehicle model is required' },
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: 1990, msg: 'Vehicle year must be 1990 or later' },
        max: {
          args: new Date().getFullYear() + 1,
          msg: 'Invalid vehicle year',
        },
      },
    },
    license_plate: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: {
        msg: 'License plate already exists',
      },
      validate: {
        notEmpty: { msg: 'License plate is required' },
      },
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    capacity_weight: {
      type: DataTypes.DECIMAL(8, 2), // in kg
      allowNull: false,
      validate: {
        min: { args: 100, msg: 'Minimum capacity is 100kg' },
        max: { args: 50000, msg: 'Maximum capacity is 50,000kg' },
      },
    },
    capacity_volume: {
      type: DataTypes.DECIMAL(8, 2), // in cubic meters
      allowNull: false,
      validate: {
        min: { args: 1, msg: 'Minimum volume is 1 cubic meter' },
        max: { args: 200, msg: 'Maximum volume is 200 cubic meters' },
      },
    },
    insurance_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Insurance number is required' },
      },
    },
    insurance_expiry: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: { msg: 'Please provide a valid insurance expiry date' },
        isAfter: {
          args: new Date().toISOString(),
          msg: 'Insurance must not be expired',
        },
      },
    },
    registration_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: 'Registration number already exists',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    images: {
      type: DataTypes.JSON, // Store array of image URLs
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
    tableName: 'vehicles',
  }
);

export default Vehicle;
