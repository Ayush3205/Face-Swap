const { MongoClient } = require('mongodb');

let db;
let client;

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    client = new MongoClient(process.env.MONGODB_URI, {
      useUnifiedTopology: true,
    });

    await client.connect();
    db = client.db();
    
    console.log('Successfully connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get database instance
 * @returns {Db} MongoDB database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  try {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  connectDatabase,
  getDatabase,
  closeDatabase
};