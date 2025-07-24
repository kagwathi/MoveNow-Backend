import express, { json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// // Import routes
// import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
// import bookingRoutes from './routes/bookings';
// import driverRoutes from './routes/drivers';
// import adminRoutes from './routes/admin';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MoveNow API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/drivers', driverRoutes);
// app.use('/api/admin', adminRoutes);

// Catch 404 and forward to error handler
app.use(notFound);

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;
