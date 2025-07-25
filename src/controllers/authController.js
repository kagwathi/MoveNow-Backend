import AuthService from '../services/authService.js';

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
}

export default AuthController;
