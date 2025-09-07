const express = require('express');
const SubmissionController = require('../controllers/submissionController');
const ValidationMiddleware = require('../middleware/validation');
const { handleUpload } = require('../middleware/upload');

const router = express.Router();

/**
 * Main form page
 * GET / - Render the submission form
 */
router.get('/', SubmissionController.renderForm);

/**
 * Form submission
 * POST /submit - Handle form submission with file upload
 */
router.post('/submit',
  ValidationMiddleware.rateLimit,
  handleUpload,
  ValidationMiddleware.validateSubmission,
  SubmissionController.handleSubmission
);

/**
 * Submissions list page
 * GET /submissions - Show all submissions with pagination
 */
router.get('/submissions',
  ValidationMiddleware.validateSubmissionsQuery,
  SubmissionController.renderSubmissions
);

/**
 * Single submission details (API endpoint)
 * GET /submissions/:id - Get specific submission details in JSON format
 */
router.get('/submissions/:id',
  ValidationMiddleware.validateObjectId('id'),
  SubmissionController.getSubmissionDetails
);

/**
 * Download swapped image
 * GET /submissions/:id/download - Download the face-swapped image
 */
router.get('/submissions/:id/download',
  ValidationMiddleware.validateObjectId('id'),
  SubmissionController.downloadSwappedImage
);

/**
 * Delete submission (admin functionality)
 * DELETE /submissions/:id - Delete a specific submission
 */
router.delete('/submissions/:id',
  ValidationMiddleware.validateObjectId('id'),
  SubmissionController.deleteSubmission
);

/**
 * Get submission statistics (API endpoint)
 * GET /api/stats - Get overall submission statistics
 */
router.get('/api/stats', SubmissionController.getSubmissionStats);

/**
 * Static file serving for uploaded images
 * Serve original and swapped images from uploads directory
 */
router.use('/uploads', express.static('public/uploads'));

/**

 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API documentation endpoint
 * GET /api/docs - Basic API documentation
 */
router.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: 'Face Swap App API',
    version: '1.0.0',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Render submission form'
      },
      {
        method: 'POST',
        path: '/submit',
        description: 'Submit form with image for face swap',
        parameters: {
          name: 'string (4-30 chars, alphabetic)',
          email: 'string (valid email format)',
          phone: 'string (exactly 10 digits)',
          terms: 'boolean (required)',
          image: 'file (JPG/PNG, max 2MB)'
        }
      },
      {
        method: 'GET',
        path: '/submissions',
        description: 'List all submissions with pagination',
        parameters: {
          page: 'number (optional, default: 1)',
          limit: 'number (optional, default: 10, max: 50)',
          sort: 'string (optional, fields: name, email, createdAt)'
        }
      },
      {
        method: 'GET',
        path: '/submissions/:id',
        description: 'Get specific submission details'
      },
      {
        method: 'GET',
        path: '/submissions/:id/download',
        description: 'Download face-swapped image'
      },
      {
        method: 'DELETE',
        path: '/submissions/:id',
        description: 'Delete submission (admin only)'
      },
      {
        method: 'GET',
        path: '/api/stats',
        description: 'Get submission statistics'
      }
    ]
  };

  res.json(apiDocs);
});

/**
 * Error handling for invalid routes
 */


module.exports = router;