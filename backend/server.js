const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Import routes
const propertyRoutes = require('./routes/properties');
const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');

// Import database to initialize
const database = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Good Foot Properties API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Good Foot Properties API',
    version: '1.0.0',
    endpoints: {
      properties: {
        'GET /api/properties': 'Get all properties',
        'GET /api/properties/category/:category': 'Get properties by category (lands, cars, apartments)',
        'GET /api/properties/:id': 'Get single property',
        'POST /api/properties': 'Add new property (admin only)',
        'PUT /api/properties/:id': 'Update property (admin only)',
        'DELETE /api/properties/:id': 'Delete property (admin only)',
        'GET /api/properties/admin/stats': 'Get dashboard stats (admin only)'
      },
      contact: {
        'POST /api/contact/submit': 'Submit contact message',
        'GET /api/contact': 'Get all messages (admin only)',
        'GET /api/contact/stats': 'Get contact stats (admin only)',
        'GET /api/contact/:id': 'Get single message (admin only)',
        'PUT /api/contact/:id/status': 'Update message status (admin only)',
        'DELETE /api/contact/:id': 'Delete message (admin only)'
      },
      auth: {
        'POST /api/auth/login': 'Admin login',
        'GET /api/auth/verify': 'Verify token (admin only)',
        'POST /api/auth/change-password': 'Change password (admin only)'
      }
    }
  });
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contact.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/admin.html'));
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: '/api'
  });
});

// Handle 404 for other routes (serve index.html for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum size limit'
      });
    }
  }

  // File type errors
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only image files are allowed'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server gracefully...');
  try {
    await database.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    await database.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Good Foot Properties API Server Started!
📍 Server running on: http://localhost:${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
�� API Documentation: http://localhost:${PORT}/api
🏠 Frontend: http://localhost:${PORT}
📧 Contact: http://localhost:${PORT}/contact
🔐 Admin: http://localhost:${PORT}/admin
  `);
});

module.exports = app;
