#!/usr/bin/env node

/**
 * Script CLI per test manuale della connessione MongoDB
 * Verifica il sistema di monitoring avanzato implementato in mongoSecure.js
 */

import { config } from 'dotenv';
import { 
  connectMongoSecure, 
  checkMongoHealth, 
  disconnectMongoSecure,
  getMongoConnectionState 
} from '../libs/security/mongoSecure.js';

// Carica le variabili d'ambiente
config();

// Configurazione
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/defi-dashboard';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

// Colori per output console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Funzioni di utility per output colorato
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  detail: (msg) => console.log(`${colors.magenta}  ${msg}${colors.reset}`)
};

// Funzione per formattare il tempo
const formatTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Funzione per formattare l'URI (maschera credenziali)
const maskUri = (uri) => {
  return uri.replace(/\/\/.*@/, '//***:***@');
};

// Funzione principale
async function checkMongoHealthCLI() {
  const startTime = Date.now();
  
  log.header('🔍 MongoDB Health Check CLI');
  log.info(`Testing MongoDB connection monitoring system`);
  log.detail(`URI: ${maskUri(MONGODB_URI)}`);
  log.detail(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log();

  try {
    // 1. Verifica stato iniziale
    log.info('1. Checking initial connection state...');
    const initialState = getMongoConnectionState();
    log.detail(`State: ${initialState.state}`);
    log.detail(`Connected: ${initialState.isConnected}`);
    log.detail(`Retry Count: ${initialState.retryCount}`);
    console.log();

    // 2. Tentativo di connessione
    log.info('2. Attempting secure connection with retry logic...');
    const connectionStartTime = Date.now();
    
    await connectMongoSecure();
    
    const connectionTime = Date.now() - connectionStartTime;
    log.success(`Connection established in ${formatTime(connectionTime)}`);
    console.log();

    // 3. Verifica stato dopo connessione
    log.info('3. Checking post-connection state...');
    const postConnectionState = getMongoConnectionState();
    log.detail(`State: ${postConnectionState.state}`);
    log.detail(`Connected: ${postConnectionState.isConnected}`);
    log.detail(`Retry Count: ${postConnectionState.retryCount}`);
    log.detail(`Last Error: ${postConnectionState.lastError || 'None'}`);
    console.log();

    // 4. Health check dettagliato
    log.info('4. Running detailed health check...');
    const healthStartTime = Date.now();
    const health = await checkMongoHealth();
    const healthTime = Date.now() - healthStartTime;
    
    if (health.status === 'ok') {
      log.success('Health check passed');
      log.detail(`Response Time: ${health.details.responseTime}`);
      log.detail(`Host: ${health.details.host}`);
      log.detail(`Port: ${health.details.port}`);
      log.detail(`Database: ${health.details.name}`);
      log.detail(`Ready State: ${health.details.readyState}`);
      log.detail(`Retry Count: ${health.details.retryCount}`);
    } else {
      log.error('Health check failed');
      log.detail(`Error: ${health.details.error || 'Unknown error'}`);
      log.detail(`State: ${health.details.state}`);
      log.detail(`Ready State: ${health.details.readyState}`);
    }
    console.log();

    // 5. Test di disconnessione
    log.info('5. Testing secure disconnection...');
    await disconnectMongoSecure();
    
    const finalState = getMongoConnectionState();
    if (!finalState.isConnected) {
      log.success('Disconnected successfully');
    } else {
      log.warn('Connection still active after disconnection attempt');
    }
    console.log();

    // 6. Riepilogo finale
    const totalTime = Date.now() - startTime;
    log.header('📊 Test Summary');
    log.detail(`Total Time: ${formatTime(totalTime)}`);
    log.detail(`Connection Time: ${formatTime(connectionTime)}`);
    log.detail(`Health Check Time: ${formatTime(healthTime)}`);
    log.detail(`Final Status: ${health.status === 'ok' ? 'SUCCESS' : 'FAILED'}`);
    console.log();

    if (health.status === 'ok') {
      log.success('🎉 All tests passed! MongoDB monitoring system is working correctly.');
      process.exit(0);
    } else {
      log.error('❌ Health check failed. Check the logs above for details.');
      process.exit(1);
    }

  } catch (error) {
    log.error(`Connection failed: ${error.message}`);
    log.detail(`Error Type: ${error.constructor.name}`);
    log.detail(`Stack: ${error.stack}`);
    console.log();

    // Verifica stato finale anche in caso di errore
    const errorState = getMongoConnectionState();
    log.info('Final state after error:');
    log.detail(`State: ${errorState.state}`);
    log.detail(`Connected: ${errorState.isConnected}`);
    log.detail(`Retry Count: ${errorState.retryCount}`);
    log.detail(`Last Error: ${errorState.lastError || 'None'}`);
    console.log();

    log.error('❌ Test failed due to connection error.');
    process.exit(1);
  }
}

// Gestione degli errori non catturati
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught Exception: ${error.message}`);
  log.detail(`Stack: ${error.stack}`);
  process.exit(1);
});

// Esegui lo script
if (import.meta.url === `file://${process.argv[1]}`) {
  checkMongoHealthCLI().catch((error) => {
    log.error(`Script execution failed: ${error.message}`);
    process.exit(1);
  });
}

export default checkMongoHealthCLI;
