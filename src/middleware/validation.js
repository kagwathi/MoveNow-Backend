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
    .withMessage('Please provide a valid license expiry date (YYYY-MM-DD)')
    .custom((value) => {
      const expiryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      if (expiryDate <= today) {
        throw new Error('License expiry date must be in the future');
      }
      return true;
    }),

  body('experience_years')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be a number between 0-50')
    .toInt(), // Convert to integer

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

// Pricing estimate validation
export const validatePricingEstimate = [
  body('pickup_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be between -90 and 90'),

  body('pickup_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be between -180 and 180'),

  body('dropoff_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Dropoff latitude must be between -90 and 90'),

  body('dropoff_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Dropoff longitude must be between -180 and 180'),

  body('pickup_date')
    .isISO8601()
    .withMessage('Please provide a valid pickup date (YYYY-MM-DD)'),

  body('pickup_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid pickup time (HH:MM)'),

  body('vehicle_type')
    .optional()
    .isIn(['pickup', 'small_truck', 'medium_truck', 'large_truck', 'van'])
    .withMessage('Invalid vehicle type'),

  body('load_type')
    .optional()
    .isIn([
      'furniture',
      'appliances',
      'boxes',
      'electronics',
      'fragile',
      'other',
    ])
    .withMessage('Invalid load type'),

  body('requires_helpers')
    .optional()
    .isBoolean()
    .withMessage('Requires helpers must be true or false'),

  body('helpers_count')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Helpers count must be between 0 and 5'),

  handleValidationErrors,
];

// Booking creation validation
export const validateBookingCreation = [
  body('pickup_address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Pickup address must be between 10-500 characters'),

  body('dropoff_address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Dropoff address must be between 10-500 characters'),

  body('pickup_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be between -90 and 90'),

  body('pickup_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be between -180 and 180'),

  body('dropoff_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Dropoff latitude must be between -90 and 90'),

  body('dropoff_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Dropoff longitude must be between -180 and 180'),

  body('pickup_date')
    .isISO8601()
    .withMessage('Please provide a valid pickup date (YYYY-MM-DD)'),

  body('pickup_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid pickup time (HH:MM)'),

  body('vehicle_type_required')
    .isIn(['pickup', 'small_truck', 'medium_truck', 'large_truck', 'van'])
    .withMessage('Invalid vehicle type'),

  body('load_type')
    .isIn([
      'furniture',
      'appliances',
      'boxes',
      'electronics',
      'fragile',
      'other',
    ])
    .withMessage('Invalid load type'),

  body('load_description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Load description must be less than 1000 characters'),

  body('estimated_weight')
    .optional()
    .isFloat({ min: 1, max: 50000 })
    .withMessage('Estimated weight must be between 1-50000 kg'),

  body('requires_helpers')
    .optional()
    .isBoolean()
    .withMessage('Requires helpers must be true or false'),

  body('helpers_count')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Helpers count must be between 0 and 5'),

  body('special_instructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special instructions must be less than 1000 characters'),

  handleValidationErrors,
];

// Booking cancellation validation
export const validateBookingCancellation = [
  body('cancellation_reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must be less than 500 characters'),

  handleValidationErrors,
];

// Job status update validation
export const validateJobStatusUpdate = [
  body('status')
    .isIn([
      'driver_en_route',
      'arrived_pickup',
      'loading',
      'in_transit',
      'arrived_destination',
      'unloading',
      'completed',
      'cancelled',
    ])
    .withMessage('Invalid job status'),

  body('cancellation_reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must be less than 500 characters'),

  handleValidationErrors,
];

// Driver location update validation
export const validateLocationUpdate = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),

  handleValidationErrors,
];

// Availability status validation
export const validateAvailabilityStatus = [
  body('status')
    .isIn(['available', 'busy', 'offline'])
    .withMessage('Status must be: available, busy, or offline'),

  handleValidationErrors,
];
