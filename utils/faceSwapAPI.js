const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');


class FaceSwapAPI {
  constructor() {
    this.apiKey = process.env.REMAKER_API_KEY;
    this.apiUrl = process.env.REMAKER_API_URL;
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Perform face swap operation
   * @param {string} originalImagePath - Path to the original image
   * @param {string} targetImagePath - Path to the target face image (optional)
   * @returns {Promise<Object>} Result object with swapped image data
   */
  async swapFace(originalImagePath, targetImagePath = null) {
    try {
      if (!this.apiKey) {
        throw new Error('Remaker API key not configured');
      }

      // For this demo, we'll simulate the face swap with a predefined target
      // In production, you would integrate with the actual Remaker API
      const result = await this.simulateFaceSwap(originalImagePath);
      
      return result;
    } catch (error) {
      console.error('Face swap error:', error);
      throw new Error('Face swap operation failed: ' + error.message);
    }
  }

  /**
   * Simulate face swap operation (for demo purposes)
   * In production, replace this with actual API integration
   * @param {string} originalImagePath - Path to the original image
   * @returns {Promise<Object>} Simulated result
   */
  async simulateFaceSwap(originalImagePath) {
    try {
      // Read the original image
      const originalImageBuffer = await fs.readFile(originalImagePath);
      
      // Generate output filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(originalImagePath);
      const outputFilename = `swapped_${timestamp}_${randomString}${extension}`;
      const outputPath = path.join(__dirname, '../public/uploads/swapped', outputFilename);

      // For demo purposes, copy the original image as the "swapped" version
      // In production, this would be the result from the API
      await fs.copyFile(originalImagePath, outputPath);

      // Add some processing delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        swappedImagePath: outputPath,
        swappedImageFilename: outputFilename,
        originalSize: originalImageBuffer.length,
        processedSize: originalImageBuffer.length,
        processingTime: 2000
      };
    } catch (error) {
      console.error('Simulated face swap error:', error);
      throw error;
    }
  }

  /**
   * Actual Remaker API integration (template)
   * Uncomment and modify this method when you have a real API key
   * @param {string} originalImagePath - Path to the original image
   * @param {string} targetImagePath - Path to the target face image
   * @returns {Promise<Object>} API result
   */
  async callRemakerAPI(originalImagePath, targetImagePath = null) {
    try {
      const formData = new FormData();
      
      
      const originalImageBuffer = await fs.readFile(originalImagePath);
      const originalImageBlob = new Blob([originalImageBuffer]);
      
      formData.append('source_image', originalImageBlob, path.basename(originalImagePath));
      
      if (targetImagePath) {
        const targetImageBuffer = await fs.readFile(targetImagePath);
        const targetImageBlob = new Blob([targetImageBuffer]);
        formData.append('target_image', targetImageBlob, path.basename(targetImagePath));
      }

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: this.timeout,
        responseType: 'json'
      });

      if (response.data && response.data.success) {
        // Save the swapped image from API response
        const swappedImageData = response.data.result_image; // Base64 or URL
        const outputFilename = `swapped_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
        const outputPath = path.join(__dirname, '../public/uploads/swapped', outputFilename);

        // Handle different response formats
        if (typeof swappedImageData === 'string' && swappedImageData.startsWith('data:image')) {
          // Base64 image
          const base64Data = swappedImageData.split(',')[1];
          const imageBuffer = Buffer.from(base64Data, 'base64');
          await fs.writeFile(outputPath, imageBuffer);
        } else if (typeof swappedImageData === 'string' && swappedImageData.startsWith('http')) {
          // URL to download
          const imageResponse = await axios.get(swappedImageData, { responseType: 'arraybuffer' });
          await fs.writeFile(outputPath, imageResponse.data);
        } else {
          throw new Error('Unsupported image format from API');
        }

        return {
          success: true,
          swappedImagePath: outputPath,
          swappedImageFilename: outputFilename,
          apiResponse: response.data
        };
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('API Request Error:', error.request);
        throw new Error('Failed to connect to face swap API');
      } else {
        console.error('API Setup Error:', error.message);
        throw new Error('Face swap API configuration error');
      }
    }
  }

  /**
   * Validate image for face swap processing
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} Validation result
   */
  async validateImage(imagePath) {
    try {
      const stats = await fs.stat(imagePath);
      const imageBuffer = await fs.readFile(imagePath);

      // Check file size (max 2MB)
      if (stats.size > 2 * 1024 * 1024) {
        return {
          valid: false,
          error: 'Image file is too large (max 2MB allowed)'
        };
      }

      // Check if it's a valid image by reading the header
      const isValidImage = this.isValidImageBuffer(imageBuffer);
      if (!isValidImage) {
        return {
          valid: false,
          error: 'Invalid image format'
        };
      }

      return {
        valid: true,
        size: stats.size,
        format: this.getImageFormat(imageBuffer)
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate image: ' + error.message
      };
    }
  }

  /**
   * Check if buffer contains a valid image
   * @param {Buffer} buffer - Image buffer
   * @returns {boolean} True if valid image
   */
  isValidImageBuffer(buffer) {
    if (!buffer || buffer.length < 4) {
      return false;
    }

    // Check for common image signatures
    const signatures = {
      jpg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46]
    };

    for (const [format, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get image format from buffer
   * @param {Buffer} buffer - Image buffer
   * @returns {string} Image format
   */
  getImageFormat(buffer) {
    if (!buffer || buffer.length < 4) {
      return 'unknown';
    }

    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'gif';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'webp';
    }

    return 'unknown';
  }

  /**
   * Clean up temporary files
   * @param {Array<string>} filePaths - Array of file paths to clean up
   */
  async cleanup(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        console.log('Cleaned up file:', filePath);
      } catch (error) {
        console.error('Failed to clean up file:', filePath, error);
      }
    }
  }

  /**
   * Get processing status (for async operations)
   * @param {string} jobId - Processing job ID
   * @returns {Promise<Object>} Status result
   */
  async getProcessingStatus(jobId) {
    try {
      const response = await axios.get(`${this.apiUrl}/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get processing status:', error);
      throw new Error('Failed to check processing status');
    }
  }
}

// Create singleton instance
const faceSwapAPI = new FaceSwapAPI();

module.exports = faceSwapAPI;