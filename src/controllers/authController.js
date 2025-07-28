import AuthService from '../services/authService.js';
import { User } from '../models/index.js';

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const result = await AuthService.registerUser(req.body);

      res.status(201).json({
        success: true,
        message: `${result.user.role} account created successfully`,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      console.error('Registration controller error:', error.message);

      // Handle specific errors
      if (
        error.message.includes('already registered') ||
        error.message.includes('already exists')
      ) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.',
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginUser(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      console.error('Login controller error:', error.message);

      // Handle specific errors
      if (
        error.message.includes('Invalid email or password') ||
        error.message.includes('deactivated')
      ) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
      });
    }
  }

  // Register driver profile
  static async registerDriver(req, res) {
    try {
      const driver = await AuthService.registerDriver(req.user.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Driver profile created successfully. Awaiting approval.',
        data: { driver },
      });
    } catch (error) {
      console.error('Driver registration controller error:', error.message);

      if (
        error.message.includes('already exists') ||
        error.message.includes('already registered')
      ) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('must have driver role')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Driver registration failed. Please try again.',
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await AuthService.getUserProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error('Get profile controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const user = await AuthService.updateUserProfile(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error) {
      console.error('Update profile controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Profile update failed. Please try again.',
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      const result = await AuthService.changePassword(
        req.user.id,
        current_password,
        new_password
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Change password controller error:', error.message);

      if (error.message.includes('incorrect')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Password change failed. Please try again.',
      });
    }
  }

  // Logout (client-side token removal, server-side can implement token blacklisting)
  static async logout(req, res) {
    try {
      // In a more advanced implementation, you might:
      // 1. Add token to blacklist
      // 2. Log the logout event
      // 3. Clear any server-side sessions

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }

  // Refresh token (for future implementation)
  static async refreshToken(req, res) {
    try {
      // This would implement token refresh logic
      res.status(501).json({
        success: false,
        message: 'Token refresh not implemented yet',
      });
    } catch (error) {
      console.error('Refresh token controller error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
      });
    }
  }

  // Safe admin creation endpoint with multiple security layers
  static async createAdmin(req, res) {
    try {
      // SECURITY LAYER 1: Environment check
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not found' });
      }

      // SECURITY LAYER 2: Secret key requirement
      const { admin_secret } = req.body;
      const expectedSecret =
        process.env.ADMIN_CREATION_SECRET || 'dev-only-secret-2025';

      if (!admin_secret || admin_secret !== expectedSecret) {
        return res.status(403).json({
          success: false,
          message: 'Invalid admin creation secret',
        });
      }

      // SECURITY LAYER 3: Check if ANY admin already exists
      const existingAdmin = await User.findOne({
        where: { role: 'admin' },
      });

      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: 'Admin user already exists in the system',
        });
      }

      // SECURITY LAYER 4: Rate limiting check (simple in-memory)
      const clientIP = req.ip || req.connection.remoteAddress;
      const attemptKey = `admin_creation_${clientIP}`;

      // This would be better with Redis in production
      if (!global.adminCreationAttempts) {
        global.adminCreationAttempts = new Map();
      }

      const attempts = global.adminCreationAttempts.get(attemptKey) || 0;
      if (attempts >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Too many admin creation attempts. Please try again later.',
        });
      }

      // Increment attempts
      global.adminCreationAttempts.set(attemptKey, attempts + 1);

      // Get admin details from request or use defaults
      const {
        first_name = 'System',
        last_name = 'Administrator',
        email = 'admin@movenow.com',
        phone = '254700000000',
        password = 'Admin123!',
      } = req.body;

      // SECURITY LAYER 5: Validate admin email domain (optional)
      const allowedDomains = process.env.ADMIN_EMAIL_DOMAINS?.split(',') || [
        'movenow.com',
      ];
      const emailDomain = email.split('@')[1];

      if (!allowedDomains.includes(emailDomain)) {
        return res.status(400).json({
          success: false,
          message: 'Admin email must use an approved domain',
        });
      }

      // Check if specific admin email already exists
      const existingUser = await User.findOne({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Create admin user
      const adminUser = await User.create({
        first_name,
        last_name,
        email,
        phone,
        password, // Will be hashed by model hook
        role: 'admin',
        is_verified: true,
        is_active: true,
      });

      // SECURITY: Log admin creation (without sensitive data)
      console.log(
        `🔐 Admin user created: ${email} from IP: ${clientIP} at ${new Date().toISOString()}`
      );

      // Clear attempts on success
      global.adminCreationAttempts.delete(attemptKey);

      // SECURITY: Don't return sensitive information
      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          created_at: adminUser.created_at,
        },
        // Only show credentials in development
        ...(process.env.NODE_ENV === 'development' && {
          login_info: {
            email: adminUser.email,
            note: 'Use the password you provided in the request',
          },
        }),
      });
    } catch (error) {
      const clientIP = req.ip || req.connection.remoteAddress;
      console.error(
        `❌ Admin creation failed from IP: ${clientIP}:`,
        error.message
      );

      res.status(500).json({
        success: false,
        message: 'Failed to create admin user',
        // Only show error details in development
        ...(process.env.NODE_ENV === 'development' && {
          error: error.message,
        }),
      });
    }
  }

  // Add this method to your existing AuthController class

  // Logout (client-side token removal, server-side can implement token blacklisting)
  static async logout(req, res) {
    try {
      // In a more advanced implementation, you might:
      // 1. Add token to blacklist/revoked tokens table
      // 2. Log the logout event for security auditing
      // 3. Clear any server-side sessions
      // 4. Invalidate refresh tokens

      const userId = req.user?.id;
      const userEmail = req.user?.email;

      // Log the logout event (optional but recommended for security)
      console.log(
        `User logout: ${userEmail} (${userId}) at ${new Date().toISOString()}`
      );

      // Here you could add token to a blacklist table if implementing token blacklisting
      // await TokenBlacklist.create({
      //   token: req.headers.authorization?.split(' ')[1],
      //   user_id: userId,
      //   blacklisted_at: new Date()
      // });

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout controller error:', error.message);

      // Even if there's an error, we should still return success
      // because the client will clear the token regardless
      res.status(200).json({
        success: true,
        message: 'Logout completed',
      });
    }
  }
}

export default AuthController;
