import mongoose from "mongoose";

// MongoDB security configuration
const MONGODB_CONFIG = {
  // Connection options
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 2,  // Minimum number of connections in the pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take
  connectTimeoutMS: 10000, // How long to wait for initial connection
  
  // Retry configuration
  retryWrites: true,
  retryReads: true,
  maxRetryTime: 30000, // Maximum time to retry operations
  
  // Security options
  tls: true, // Enable TLS/SSL
  tlsAllowInvalidCertificates: false, // Don't allow invalid certificates
  tlsAllowInvalidHostnames: false, // Don't allow invalid hostnames
  
  // Compression
  compressors: ['zstd', 'zlib', 'snappy'], // Compression algorithms
  
  // Monitoring
  monitorCommands: process.env.NODE_ENV === 'development', // Log commands in dev
};

// Connection state tracking
let connectionState = {
  isConnected: false,
  isConnecting: false,
  lastError: null,
  connectionAttempts: 0,
  maxRetries: 3
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Calculate retry delay with exponential backoff
 * @param {number} attempt - Current attempt number
 * @returns {number} - Delay in milliseconds
 */
function calculateRetryDelay(attempt) {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * Wait for specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Connect to MongoDB with retry logic and security features
 * @returns {Promise<mongoose.Connection>} - Mongoose connection
 */
export async function connectMongoSecure() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI environment variable is required. Add it to your .env.local file."
    );
  }

  // If already connected, return existing connection
  if (connectionState.isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If already connecting, wait for it
  if (connectionState.isConnecting) {
    return new Promise((resolve, reject) => {
      const checkConnection = () => {
        if (connectionState.isConnected) {
          resolve(mongoose.connection);
        } else if (!connectionState.isConnecting && connectionState.lastError) {
          reject(connectionState.lastError);
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  connectionState.isConnecting = true;
  connectionState.lastError = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      connectionState.connectionAttempts = attempt;
      
      console.log(`Tentativo connessione MongoDB ${attempt}/${RETRY_CONFIG.maxRetries}...`);
      
      // Build connection options
      const options = {
        ...MONGODB_CONFIG,
        // Add retry-specific options
        retryWrites: true,
        retryReads: true,
        maxRetryTime: MONGODB_CONFIG.maxRetryTime,
      };

      // Add TLS options if URI contains ssl=true or tls=true
      const uri = process.env.MONGODB_URI;
      if (uri.includes('ssl=true') || uri.includes('tls=true')) {
        options.tls = true;
        options.tlsAllowInvalidCertificates = false;
        options.tlsAllowInvalidHostnames = false;
      }

      // Connect to MongoDB
      await mongoose.connect(uri, options);

      // Set up connection event handlers
      setupConnectionHandlers();

      connectionState.isConnected = true;
      connectionState.isConnecting = false;
      connectionState.lastError = null;
      connectionState.connectionAttempts = 0;

      console.log('✅ Connessione MongoDB stabilita con successo');
      return mongoose.connection;

    } catch (error) {
      connectionState.lastError = error;
      console.error(`❌ Tentativo connessione MongoDB ${attempt} fallito:`, error.message);

      if (attempt === RETRY_CONFIG.maxRetries) {
        connectionState.isConnecting = false;
        throw new Error(`Impossibile connettersi a MongoDB dopo ${RETRY_CONFIG.maxRetries} tentativi: ${error.message}`);
      }

      // Wait before retry with exponential backoff
      const delay = calculateRetryDelay(attempt);
      console.log(`⏳ Attesa ${delay}ms prima del prossimo tentativo...`);
      await sleep(delay);
    }
  }
}

/**
 * Set up MongoDB connection event handlers
 */
function setupConnectionHandlers() {
  // Connection established
  mongoose.connection.on('connected', () => {
    console.log('🔗 MongoDB connesso');
    connectionState.isConnected = true;
  });

  // Connection error
  mongoose.connection.on('error', (error) => {
    console.error('❌ Errore connessione MongoDB:', error);
    connectionState.isConnected = false;
    connectionState.lastError = error;
  });

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    console.log('🔌 MongoDB disconnesso');
    connectionState.isConnected = false;
  });

  // Connection reconnected
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB riconnesso');
    connectionState.isConnected = true;
  });

  // Process termination handlers
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔒 Connessione MongoDB chiusa per terminazione processo');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    console.log('🔒 Connessione MongoDB chiusa per terminazione processo');
    process.exit(0);
  });
}

/**
 * Check if MongoDB is connected
 * @returns {boolean} - true if connected
 */
export function isMongoConnected() {
  return connectionState.isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get connection status
 * @returns {Object} - Connection status information
 */
export function getConnectionStatus() {
  return {
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    readyState: mongoose.connection.readyState,
    lastError: connectionState.lastError?.message,
    connectionAttempts: connectionState.connectionAttempts,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
}

/**
 * Gracefully close MongoDB connection
 * @returns {Promise<void>}
 */
export async function closeMongoConnection() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      connectionState.isConnected = false;
      console.log('🔒 Connessione MongoDB chiusa correttamente');
    }
  } catch (error) {
    console.error('❌ Errore chiusura connessione MongoDB:', error);
  }
}

/**
 * Health check for MongoDB connection
 * @returns {Promise<Object>} - Health status
 */
export async function mongoHealthCheck() {
  try {
    if (!isMongoConnected()) {
      return {
        status: 'unhealthy',
        message: 'MongoDB non connesso',
        timestamp: new Date().toISOString()
      };
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      message: 'MongoDB connesso e funzionante',
      timestamp: new Date().toISOString(),
      connectionInfo: {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Errore MongoDB: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

// Backward compatibility - export the secure connection as default
export default connectMongoSecure;

// Export configuration for external use
export { MONGODB_CONFIG, RETRY_CONFIG };
