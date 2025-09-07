const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directories exist
async function ensureDirectories() {
  const directories = [
    'public/uploads',
    'public/uploads/original',
    'public/uploads/swapped'
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
}

// Initialize directories
ensureDirectories();

/**
 * Configure multer storage for file uploads
 */
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const uploadPath = path.join(__dirname, '../public/uploads/original');
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error setting upload destination:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${timestamp}-${randomString}${extension}`;
    
    cb(null, filename);
  }
});

/**
 * File filter for image uploads
 */
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png'
  ];

  // Allowed extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Check both MIME type and extension
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, and PNG images are allowed'), false);
  }
};

/**
 * Configure multer upload middleware
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1, // Only one file allowed
    fields: 10, // Limit number of form fields
    fieldSize: 1024, // 1KB per field
    fieldNameSize: 100 // 100 bytes for field names
  }
});

/**
 * Single file upload middleware
 */
const uploadSingle = upload.single('image');

/**
 * Enhanced upload middleware with error handling
 */
const handleUpload = (req, res, next) => {
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).render('form', {
          error: 'File size too large. Maximum allowed size is 2MB.',
          formData: req.body || {}
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).render('form', {
          error: 'Unexpected file field. Please use the correct form.',
          formData: req.body || {}
        });
      }
      
      return res.status(400).render('form', {
        error: 'File upload error: ' + err.message,
        formData: req.body || {}
      });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).render('form', {
        error: err.message,
        formData: req.body || {}
      });
    }
    
    // Add file information to request for logging
    if (req.file) {
      console.log('File uploaded:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    
    next();
  });
};

/**
 * Clean up uploaded files (utility function)
 */
async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log('Cleaned up file:', filePath);
  } catch (error) {
    console.error('Error cleaning up file:', filePath, error);
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType) {
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png'
  };
  
  return mimeToExt[mimeType] || '.jpg';
}

/**
 * Validate file after upload
 */
async function validateUploadedFile(filePath) {
  try {
    const stats = await fs.stat(filePath);
    
    // Check file size
    if (stats.size > 2 * 1024 * 1024) {
      throw new Error('File size exceeds 2MB limit');
    }
    
    // Check if file exists and is readable
    await fs.access(filePath, fs.constants.R_OK);
    
    return true;
  } catch (error) {
    console.error('File validation error:', error);
    throw new Error('Invalid file upload');
  }
}

module.exports = {
  handleUpload,
  cleanupFile,
  getExtensionFromMimeType,
  validateUploadedFile,
  ensureDirectories
};