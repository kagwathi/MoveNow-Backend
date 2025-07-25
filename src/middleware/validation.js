import { body, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

// Registration validation rules
export const validateRegistration = [
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),

  body('phone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10-15 digits'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),

  body('role')
    .optional()
    .isIn(['customer', 'driver'])
    .withMessage('Role must be either customer or driver'),

  handleValidationErrors,
];

// Login validation rules
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

// Driver registration validation
export const validateDriverRegistration = [
  body('license_number')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('License number must be between 5-50 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage(
      'License number can only contain uppercase letters, numbers, and hyphens'
    ),

  body('license_expiry')
    .isISO8601()
    .withMessage('Please provide a valid license expiry date')
    .custom((value) => {
      const expiryDate = new Date(value);
      const today = new Date();
      if (expiryDate <= today) {
        throw new Error('License expiry date must be in the future');
      }
      return true;
    }),

  body('experience_years')
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be between 0-50'),

  handleValidationErrors,
];

// Password change validation
export const validatePasswordChange = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),

  body('new_password')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  body('confirm_new_password').custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error('New password confirmation does not match new password');
    }
    return true;
  }),

  handleValidationErrors,
];
