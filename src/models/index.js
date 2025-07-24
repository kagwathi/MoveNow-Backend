import { sequelize } from '../config/database.js';
import User from './User.js';
import Driver from './Driver.js';
import Vehicle from './Vehicle.js';
import Booking from './Booking.js';
import Payment from './Payment.js';

// Define associations

// User associations
User.hasOne(Driver, {
  foreignKey: 'user_id',
  as: 'driverProfile',
  onDelete: 'CASCADE',
});

User.hasMany(Booking, {
  foreignKey: 'customer_id',
  as: 'customerBookings',
  onDelete: 'CASCADE',
});

User.hasMany(Payment, {
  foreignKey: 'customer_id',
  as: 'payments',
  onDelete: 'CASCADE',
});

// Driver associations
Driver.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Driver.hasMany(Vehicle, {
  foreignKey: 'driver_id',
  as: 'vehicles',
  onDelete: 'CASCADE',
});

Driver.hasMany(Booking, {
  foreignKey: 'driver_id',
  as: 'driverBookings',
});

Driver.hasMany(Payment, {
  foreignKey: 'driver_id',
  as: 'earnings',
});

// Vehicle associations
Vehicle.belongsTo(Driver, {
  foreignKey: 'driver_id',
  as: 'driver',
});

Vehicle.hasMany(Booking, {
  foreignKey: 'vehicle_id',
  as: 'bookings',
});

// Booking associations
Booking.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

Booking.belongsTo(Driver, {
  foreignKey: 'driver_id',
  as: 'driver',
});

Booking.belongsTo(Vehicle, {
  foreignKey: 'vehicle_id',
  as: 'vehicle',
});

Booking.hasOne(Payment, {
  foreignKey: 'booking_id',
  as: 'payment',
  onDelete: 'CASCADE',
});

// Payment associations
Payment.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking',
});

Payment.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer',
});

Payment.belongsTo(Driver, {
  foreignKey: 'driver_id',
  as: 'driver',
});

const models = {
  User,
  Driver,
  Vehicle,
  Booking,
  Payment,
  sequelize,
};

export default models;
export { User, Driver, Vehicle, Booking, Payment, sequelize };
