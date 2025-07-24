import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    payment_method: {
      type: DataTypes.ENUM('mpesa', 'stripe', 'cash', 'bank_transfer'),
      allowNull: false,
    },
    payment_provider: {
      type: DataTypes.STRING(50), // 'mpesa', 'stripe', etc.
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: 0, msg: 'Amount cannot be negative' },
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'KES',
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded'
      ),
      defaultValue: 'pending',
    },
    gateway_response: {
      type: DataTypes.JSON, // Store full gateway response
      allowNull: true,
    },
    reference_number: {
      type: DataTypes.STRING(100), // External payment reference
      allowNull: true,
    },

    // Commission and fees
    platform_fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    driver_payout: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    payout_status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    payout_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Refund details
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Timestamps
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failure_reason: {
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
    tableName: 'payments',
  }
);

export default Payment;
