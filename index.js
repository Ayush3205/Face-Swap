const express = require('express');
const path = require('path');
require('dotenv').config();

const { connectDatabase } = require('./config/database');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/', submissionRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('form', {
      error: 'File size too large. Maximum allowed size is 2MB.',
      formData: {}
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).render('form', {
      error: 'Invalid file field name.',
      formData: {}
    });
  }
  
  res.status(500).render('form', {
    error: 'An internal server error occurred. Please try again.',
    formData: {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('form', {
    error: 'Page not found.',
    formData: {}
  });
});

// Start server
async function startServer() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB Atlas');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT} to access the application`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;