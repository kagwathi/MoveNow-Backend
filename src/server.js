import app from './app.js';
import { sequelize, testConnection } from './config/database.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database models (create tables if they don't exist)
    await sequelize.sync({
      force: false, // Set to true to drop and recreate tables (development only)
      alter: process.env.NODE_ENV === 'development', // Auto-update tables in development
    });

    console.log('📊 Database synchronized successfully');

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 MoveNow API Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

startServer();
