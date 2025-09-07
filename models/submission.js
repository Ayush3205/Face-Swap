const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'submissions';

/**
 * Submission Model - handles all database operations for submissions
 */
class SubmissionModel {
  /**
   * Create a new submission
   * @param {Object} submissionData - The submission data
   * @returns {Promise<Object>} Created submission
   */
  static async create(submissionData) {
    try {
      const db = getDatabase();
      const collection = db.collection(COLLECTION_NAME);
      
      const submission = {
        ...submissionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(submission);
      
      return {
        _id: result.insertedId,
        ...submission
      };
    } catch (error) {
      console.error('Error creating submission:', error);
      throw new Error('Failed to create submission');
    }
  }

  /**
   * Find all submissions
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of submissions
   */
  static async findAll(options = {}) {
    try {
      const db = getDatabase();
      const collection = db.collection(COLLECTION_NAME);
      
      const {
        limit = 50,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;
      
      const submissions = await collection
        .find({})
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(skip)
        .toArray();
      
      return submissions;
    } catch (error) {
      console.error('Error finding submissions:', error);
      throw new Error('Failed to retrieve submissions');
    }
  }

  /**
   * Find a submission by ID
   * @param {string} id - Submission ID
   * @returns {Promise<Object|null>} Submission or null if not found
   */
  static async findById(id) {
    try {
      const db = getDatabase();
      const collection = db.collection(COLLECTION_NAME);
      
      if (!ObjectId.isValid(id)) {
        return null;
      }
      
      const submission = await collection.findOne({ _id: new ObjectId(id) });
      return submission;
    } catch (error) {
      console.error('Error finding submission by ID:', error);
      throw new Error('Failed to retrieve submission');
    }
  }

  /**
   * Update a submission by ID
   * @param {string} id - Submission ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated submission or null if not found
   */
  static async updateById(id, updateData) {
    try {
      const db = getDatabase();
      const collection = db.collection(COLLECTION_NAME);
      
      if (!ObjectId.isValid(id)) {
        return null;
      }
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updatedData },
        { returnDocument: 'after' }
      );
      
      return result.value;
    } catch (error) {
      console.error('Error updating submission:', error);
      throw new Error('Failed to update submission');
    }
  }

  /**
   * Delete a submission by ID
   * @param {string} id - Submission ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async deleteById(id) {
    try {
      const db = getDatabase();
      const collection = db.collection(COLLECTION_NAME);
      
      if (!ObjectId.isValid(id)) {
        return false;
      }
      
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw new Error('Failed to delete submission');
    }
  }

  /**
   * Count total submissions
   * @returns {Promise<number>} Total count
   */
  static async count() {
    try {
      const db = getDatabase();
      const collection = db.collection(COLLECTION_NAME);
      
      const count = await collection.countDocuments();
      return count;
    } catch (error) {
      console.error('Error counting submissions:', error);
      throw new Error('Failed to count submissions');
    }
  }

  /**
   * Find submissions by email
   * @param {string} email - Email address
   * @returns {Promise<Array>} Array of submissions
   */
  static async findByEmail(email) {
    try {
      const db = getDatabase();
      const collection = db.collection(COLLECTION_NAME);
      
      const submissions = await collection
        .find({ email: email.toLowerCase() })
        .sort({ createdAt: -1 })
        .toArray();
      
      return submissions;
    } catch (error) {
      console.error('Error finding submissions by email:', error);
      throw new Error('Failed to retrieve submissions');
    }
  }
}

module.exports = SubmissionModel;