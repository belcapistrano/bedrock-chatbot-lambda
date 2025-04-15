// utils/logger.js
/**
 * Simple logger utility with different levels
 * Designed for AWS Lambda with structured logging
 */

// Import config (using require function to avoid circular dependencies)
let config;
try {
  config = require('../config').config;
} catch (error) {
  // Fallback defaults if config can't be imported
  config = {
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      includeTimestamp: true
    }
  };
}

// Define log levels and their priorities
const LOG_LEVELS = {
  error: 0,
  warn: 1, 
  info: 2,
  debug: 3,
  trace: 4
};

// Get the configured log level
const configuredLevel = (config.logging.level || 'info').toLowerCase();
const logLevelLimit = LOG_LEVELS[configuredLevel] !== undefined ? 
  LOG_LEVELS[configuredLevel] : 
  LOG_LEVELS.info;

/**
 * Main logger function
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [details] - Additional details to log
 */
function log(level, message, details = {}) {
  // Check if this level should be logged
  if (LOG_LEVELS[level] > logLevelLimit) {
    return;
  }
  
  // Prepare the log data
  const logData = {
    level,
    message,
    ...details
  };
  
  // Add timestamp if configured
  if (config.logging.includeTimestamp) {
    logData.timestamp = new Date().toISOString();
  }
  
  // Format errors properly
  if (details.error instanceof Error) {
    logData.errorMessage = details.error.message;
    logData.errorStack = details.error.stack;
    logData.errorName = details.error.name;
    delete logData.error;
  }
  
  // Output to console in JSON format for CloudWatch
  console.log(JSON.stringify(logData));
}

// Create logger object with methods for each level
const logger = {
  error: (message, details) => log('error', message, details),
  warn: (message, details) => log('warn', message, details),
  info: (message, details) => log('info', message, details),
  debug: (message, details) => log('debug', message, details),
  trace: (message, details) => log('trace', message, details)
};

module.exports = { logger };