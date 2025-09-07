const faceSwapAPI = require('../utils/faceSwapAPI'); // Assuming you move the file you shared
const fs = require('fs').promises;
const path = require('path');

// Mock database - replace with your actual database model
let submissions = [];
let submissionId = 1;

/**
 * Render the main form page
 */
const renderForm = (req, res) => {
  try {
    res.render('form', { 
      title: 'Face Swap Form',
      errors: null,
      formData: null
    });
  } catch (error) {
    console.error('Error rendering form:', error);
    res.status(500).send('Error loading form page');
  }
};

/**
 * Handle form submission with file upload and face swap
 */
const handleSubmission = async (req, res) => {
  try {
    const { name, email, phone, terms } = req.body;
    const uploadedFile = req.file;

    // Validate required fields (additional validation beyond middleware)
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }

    // Validate image
    const imageValidation = await faceSwapAPI.validateImage(uploadedFile.path);
    if (!imageValidation.valid) {
      return res.status(400).json({
        success: false,
        error: imageValidation.error
      });
    }

    // Perform face swap
    const faceSwapResult = await faceSwapAPI.swapFace(uploadedFile.path);

    if (!faceSwapResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Face swap processing failed'
      });
    }

    // Save submission to database (mock implementation)
    const submission = {
      id: submissionId++,
      name,
      email,
      phone,
      terms: terms === 'on' || terms === true,
      originalImagePath: uploadedFile.path,
      originalImageFilename: uploadedFile.filename,
      swappedImagePath: faceSwapResult.swappedImagePath,
      swappedImageFilename: faceSwapResult.swappedImageFilename,
      processingTime: faceSwapResult.processingTime,
      createdAt: new Date(),
      status: 'completed'
    };

    submissions.push(submission);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Face swap completed successfully!',
      submissionId: submission.id,
      swappedImageUrl: `/uploads/swapped/${submission.swappedImageFilename}`,
      processingTime: submission.processingTime
    });

  } catch (error) {
    console.error('Submission handling error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during processing'
    });
  }
};

/**
 * Render submissions list page with pagination
 */
const renderSubmissions = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const sort = req.query.sort || 'createdAt';
    
    // Sort submissions
    const sortedSubmissions = [...submissions].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'email') return a.email.localeCompare(b.email);
      return new Date(b.createdAt) - new Date(a.createdAt); // Default: newest first
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSubmissions = sortedSubmissions.slice(startIndex, endIndex);

    const totalPages = Math.ceil(submissions.length / limit);

    // Transform submissions to match template expectations
    const transformedSubmissions = paginatedSubmissions.map(submission => ({
      ...submission,
      _id: submission.id, // Template expects _id
      originalImageUrl: `/uploads/${submission.originalImageFilename}`,
      swappedImageUrl: `/uploads/swapped/${submission.swappedImageFilename}`,
      downloadUrl: `/submissions/${submission.id}/download`,
      createdAt: new Date(submission.createdAt).toLocaleString()
    }));

    res.render('submissions', {
      title: 'Submissions List',
      submissions: transformedSubmissions,
      pagination: {
        totalCount: submissions.length,
        currentPage: page,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      }
    });

  } catch (error) {
    console.error('Error rendering submissions:', error);
    res.status(500).send('Error loading submissions page');
  }
};

/**
 * Get specific submission details (API endpoint)
 */
const getSubmissionDetails = (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const submission = submissions.find(s => s.id === submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Return submission details without sensitive file paths
    const submissionDetails = {
      id: submission.id,
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      createdAt: submission.createdAt,
      status: submission.status,
      processingTime: submission.processingTime,
      originalImageUrl: `/uploads/${submission.originalImageFilename}`,
      swappedImageUrl: `/uploads/swapped/${submission.swappedImageFilename}`
    };

    res.json({
      success: true,
      submission: submissionDetails
    });

  } catch (error) {
    console.error('Error getting submission details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Download swapped image
 */
const downloadSwappedImage = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const submission = submissions.find(s => s.id === submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (!submission.swappedImagePath) {
      return res.status(404).json({
        success: false,
        error: 'Swapped image not found'
      });
    }

    // Check if file exists
    try {
      await fs.access(submission.swappedImagePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Swapped image file not found on server'
      });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="swapped_${submission.name}_${submission.id}${path.extname(submission.swappedImageFilename)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Send file
    res.sendFile(path.resolve(submission.swappedImagePath));

  } catch (error) {
    console.error('Error downloading swapped image:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Delete submission (admin functionality)
 */
const deleteSubmission = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const submissionIndex = submissions.findIndex(s => s.id === submissionId);

    if (submissionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const submission = submissions[submissionIndex];

    // Clean up associated files
    const filesToCleanup = [submission.originalImagePath, submission.swappedImagePath].filter(Boolean);
    await faceSwapAPI.cleanup(filesToCleanup);

    // Remove from array (in production, remove from database)
    submissions.splice(submissionIndex, 1);

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get submission statistics
 */
const getSubmissionStats = (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: submissions.length,
      today: submissions.filter(s => new Date(s.createdAt) >= today).length,
      thisWeek: submissions.filter(s => new Date(s.createdAt) >= thisWeek).length,
      thisMonth: submissions.filter(s => new Date(s.createdAt) >= thisMonth).length,
      completed: submissions.filter(s => s.status === 'completed').length,
      processing: submissions.filter(s => s.status === 'processing').length,
      failed: submissions.filter(s => s.status === 'failed').length,
      averageProcessingTime: submissions.length > 0 
        ? submissions.reduce((sum, s) => sum + (s.processingTime || 0), 0) / submissions.length 
        : 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting submission stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  renderForm,
  handleSubmission,
  renderSubmissions,
  getSubmissionDetails,
  downloadSwappedImage,
  deleteSubmission,
  getSubmissionStats
};