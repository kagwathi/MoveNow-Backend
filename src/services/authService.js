import bcrypt from 'bcryptjs';
import { User, Driver } from '../models/index.js';
import { generateTokenPair } from '../config/jwt.js';
import { Op } from 'sequelize';

class AuthService {
  // Register new user
  static async registerUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email: userData.email }, { phone: userData.phone }],
        },
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new Error('Email address already registered');
        }
        if (existingUser.phone === userData.phone) {
          throw new Error('Phone number already registered');
        }
      }

      // Create new user
      const user = await User.create({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role || 'customer',
      });

      // Generate tokens
      const tokens = generateTokenPair(user);

      return {
        user: user.toJSON(),
        tokens,
      };
    } catch (error) {
      console.error('Registration error:', error.message);
      throw error;
    }
  }

  // Login user
  static async loginUser(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await user.update({
        last_login: new Date(),
      });

      // Generate tokens
      const tokens = generateTokenPair(user);

      // Get additional profile data for drivers
      let profile = null;
      if (user.role === 'driver') {
        profile = await Driver.findOne({
          where: { user_id: user.id },
          attributes: { exclude: ['created_at', 'updated_at'] },
        });
      }

      return {
        user: user.toJSON(),
        profile,
        tokens,
      };
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  }

  // Register driver profile
  static async registerDriver(userId, driverData) {
    try {
      // Check if user exists and is driver role
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.role !== 'driver') {
        throw new Error('User must have driver role');
      }

      // Check if driver profile already exists
      const existingDriver = await Driver.findOne({
        where: { user_id: userId },
      });

      if (existingDriver) {
        throw new Error('Driver profile already exists');
      }

      // Check if license number already exists
      const existingLicense = await Driver.findOne({
        where: { license_number: driverData.license_number },
      });

      if (existingLicense) {
        throw new Error('License number already registered');
      }

      // Create driver profile
      const driver = await Driver.create({
        user_id: userId,
        license_number: driverData.license_number,
        license_expiry: driverData.license_expiry,
        experience_years: driverData.experience_years || 0,
      });

      return driver;
    } catch (error) {
      console.error('Driver registration error:', error.message);
      throw error;
    }
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await user.update({ password: newPassword });

      return { message: 'Password changed successfully' };
    } catch (error) {
      console.error('Password change error:', error.message);
      throw error;
    }
  }

  // Get user profile
  static async getUserProfile(userId) {
    try {
      // First, get the user to check their role
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // If user is a driver, include driver profile
      if (user.role === 'driver') {
        const userWithDriver = await User.findByPk(userId, {
          attributes: { exclude: ['password'] },
          include: [
            {
              model: Driver,
              as: 'driverProfile',
              attributes: { exclude: ['created_at', 'updated_at'] },
            },
          ],
        });

        return userWithDriver;
      }

      return user;
    } catch (error) {
      console.error('Get profile error:', error.message);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Remove sensitive fields that shouldn't be updated this way
      const { password, role, is_verified, is_active, ...allowedUpdates } =
        updateData;

      await user.update(allowedUpdates);

      return user.toJSON();
    } catch (error) {
      console.error('Profile update error:', error.message);
      throw error;
    }
  }
}

export default AuthService;
