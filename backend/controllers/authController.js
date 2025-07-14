const bcrypt = require('bcryptjs');
const database = require('../models/database');
const { generateToken } = require('../middleware/auth');

class AuthController {
  // Admin login
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          error: 'Missing credentials',
          message: 'Username and password are required'
        });
      }

      // Find admin user
      const admin = await database.get(
        'SELECT * FROM admin_users WHERE username = ?',
        [username]
      );

      if (!admin) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Username or password is incorrect'
        });
      }

      // Verify password
      const isValidPassword = bcrypt.compare(password, admin.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Username or password is incorrect'
        });
      }

      // Update last login
      await database.run(
        'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [admin.id]
      );

      // Generate JWT token
      const token = generateToken({
        id: admin.id,
        username: admin.username,
        role: 'admin'
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: admin.id,
          username: admin.username,
          role: 'admin'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during login. Please try again.'
      });
    }
  }

  // Verify token endpoint
  async verifyToken(req, res) {
    try {
      // If we reach here, token is valid (middleware passed)
      res.json({
        success: true,
        message: 'Token is valid',
        user: req.user
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        error: 'Verification failed',
        message: 'Unable to verify token'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Missing passwords',
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'Password too short',
          message: 'New password must be at least 6 characters long'
        });
      }

      // Get current admin
      const admin = await database.get(
        'SELECT * FROM admin_users WHERE id = ?',
        [userId]
      );

      if (!admin) {
        return res.status(404).json({
          error: 'User not found',
          message: 'Admin user not found'
        });
      }

      // Verify current password
      const isValidPassword = bcrypt.compareSync(currentPassword, admin.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid current password',
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hashSync(newPassword, 10);

      // Update password
      await database.run(
        'UPDATE admin_users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Password change failed',
        message: 'An error occurred while changing password'
      });
    }
  }
}

module.exports = new AuthController();
