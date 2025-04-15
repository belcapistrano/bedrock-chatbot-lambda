// utils/helpers.js
const { config } = require('../config');
const { logger } = require('./logger');

/**
 * Format HTTP response in API Gateway format
 * 
 * @param {number} statusCode - HTTP status code
 * @param {Object} body - Response body
 * @returns {Object} Formatted response
 */
function formatResponse(statusCode, body) {
  // Determine CORS headers based on configuration
  const corsHeaders = getCorsHeaders();
  
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
    body: JSON.stringify(body)
  };
}

/**
 * Get appropriate CORS headers based on configuration
 * 
 * @returns {Object} CORS headers
 */
function getCorsHeaders() {
  const allowedOrigins = config.http.allowedOrigins;
  
  // If wildcard is allowed, use simplified headers
  if (allowedOrigins.includes('*')) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    };
  }
  
  // Otherwise, more complex implementation would be needed
  // This is a placeholder for a more sophisticated CORS implementation
  logger.warn('Specific CORS origins are configured but not fully implemented');
  return {
    'Access-Control-Allow-Origin': allowedOrigins[0], // Just use the first one for now
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
  };
}

/**
 * Validate and parse the incoming request
 * 
 * @param {Object} event - API Gateway event
 * @returns {Object} Validation result with parsed body
 */
function validateRequest(event) {
  try {
    // Check if body exists
    if (!event.body) {
      return { valid: false, error: 'Request body is required' };
    }
    
    // Parse the body
    const body = JSON.parse(event.body);
    
    // Validate required fields
    if (!body.message) {
      return { valid: false, error: 'Message is required' };
    }
    
    // Optionally generate a session ID if not provided
    if (!body.sessionId) {
      body.sessionId = generateSessionId();
      logger.info('Generated session ID for request', { sessionId: body.sessionId });
    }
    
    return { valid: true, body };
  } catch (error) {
    logger.error('Error validating request', { error });
    return { valid: false, error: 'Invalid request format' };
  }
}

/**
 * Generate a random session ID
 * 
 * @returns {string} Random session ID
 */
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

module.exports = {
  formatResponse,
  validateRequest,
  getCorsHeaders,
  generateSessionId
};