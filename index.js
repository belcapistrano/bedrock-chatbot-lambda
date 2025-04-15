const { handleBedrockRequest } = require('./services/bedrock-service');
const { formatResponse, validateRequest } = require('./utils/helpers');
const { logger } = require('./utils/logger');

exports.handler = async (event) => {
  try {
    logger.info('Received event', { event });
    
    // Parse and validate the request
    const { valid, body, error } = validateRequest(event);
    if (!valid) {
      logger.warn('Invalid request', { error });
      return formatResponse(400, { error });
    }
    
    // Extract the relevant data
    const { message, sessionId } = body;
    
    // Process the request through Bedrock
    const result = await handleBedrockRequest(message, sessionId);
    
    // Return the formatted response
    return formatResponse(200, result);
  } catch (error) {
    logger.error('Unhandled error in Lambda handler', { error });
    return formatResponse(500, { 
      error: 'Internal server error', 
      message: process.env.INCLUDE_ERROR_DETAILS === 'true' ? error.message : undefined 
    });
  }
};