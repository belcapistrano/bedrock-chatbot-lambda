// services/bedrock-service.js
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { logger } = require('../utils/logger');
const { config } = require('../config');

// Initialize the Bedrock client with proper region
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION // This is automatically set by Lambda
});

/**
 * Main function to handle a request to Bedrock (agent or model)
 * 
 * @param {string} message - User's message
 * @param {string} sessionId - Session identifier
 * @returns {Object} Response object with message field
 */
async function handleBedrockRequest(message, sessionId) {
  try {
    // Log the incoming request
    logger.info('Processing Bedrock request', { message, sessionId });
    
    // Determine whether to use an agent or direct model call
    if (config.bedrock.useAgent) {
      return await invokeBedrockAgent(message, sessionId);
    } else {
      return await invokeBedrockModel(message);
    }
  } catch (error) {
    logger.error('Error in Bedrock request handler', { error });
    throw error; // Let the main handler catch and format the error response
  }
}

/**
 * Call a Bedrock model directly
 * 
 * @param {string} message - User's message
 * @returns {Object} Response object with message field
 */
async function invokeBedrockModel(message) {
  try {
    logger.info('Calling Bedrock model', { 
      modelId: config.bedrock.modelId,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : '') // Log truncated message
    });
    
    // Prepare the request parameters based on the model
    const modelId = config.bedrock.modelId;
    const prompt = preparePromptForModel(message, modelId);
    
    logger.debug('Prepared prompt for model', { modelId, prompt: JSON.stringify(prompt) });
    
    // Prepare the request parameters
    const params = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(prompt)
    };
    
    // Call the Bedrock model
    const response = await bedrockClient.send(new InvokeModelCommand(params));
    
    // Parse and extract the response
    const responseText = extractModelResponse(response, modelId);
    
    logger.info('Successfully received model response', {
      responseLength: responseText.length
    });
    
    return { message: responseText };
  } catch (error) {
    logger.error('Error calling Bedrock model', { error });
    throw new Error(`Error calling Bedrock model: ${error.message}`);
  }
}

/**
 * Call a Bedrock agent
 * 
 * @param {string} message - User's message
 * @param {string} sessionId - Session identifier
 * @returns {Object} Response object with message field
 */
async function invokeBedrockAgent(message, sessionId) {
  try {
    logger.info('Calling Bedrock agent', { 
      agentId: config.bedrock.agentId, 
      agentAliasId: config.bedrock.agentAliasId,
      sessionId
    });

    // Note: This implementation needs to be completed based on AWS documentation
    // The actual API call will depend on the latest AWS SDK structure
    
    // Placeholder for actual agent implementation
    if (!config.bedrock.agentId || !config.bedrock.agentAliasId) {
      throw new Error('Bedrock agent configuration is incomplete');
    }
    
    logger.warn('Agent implementation is incomplete');
    
    return { 
      message: `This is a placeholder response. To implement an actual Bedrock agent, you'll need to follow AWS documentation for the specific API calls.`,
      implementationStatus: 'pending'
    };
  } catch (error) {
    logger.error('Error calling Bedrock agent', { error });
    throw new Error(`Error calling Bedrock agent: ${error.message}`);
  }
}

/**
 * Prepare a prompt for the selected model
 * 
 * @param {string} message - User message
 * @param {string} modelId - Bedrock model ID
 * @returns {Object} Formatted prompt object
 */
function preparePromptForModel(message, modelId) {
  // Different models require different prompt formats
  if (modelId.startsWith('anthropic.claude')) {
    // Claude models use a specific prompt format with max_tokens_to_sample (not max_tokens)
    return {
      prompt: `\n\nHuman: You are a helpful DevOps assistant. Please respond to this question: ${message}\n\nAssistant:`,
      max_tokens_to_sample: config.bedrock.maxTokens,
      temperature: config.bedrock.temperature,
      top_k: 250,
      top_p: 0.999,
      stop_sequences: ["\n\nHuman:"]
    };
  } else if (modelId.startsWith('ai21')) {
    // AI21 models use different parameters
    return {
      prompt: `You are a helpful DevOps assistant. Please respond to this question: ${message}`,
      maxTokens: config.bedrock.maxTokens,
      temperature: config.bedrock.temperature,
      topP: 0.9
    };
  } else if (modelId.startsWith('amazon.titan')) {
    // Titan models use different parameters
    return {
      inputText: `You are a helpful DevOps assistant. Please respond to this question: ${message}`,
      textGenerationConfig: {
        maxTokenCount: config.bedrock.maxTokens,
        temperature: config.bedrock.temperature,
        topP: 0.9
      }
    };
  } else if (modelId.startsWith('cohere')) {
    // Cohere models use different parameters
    return {
      prompt: `You are a helpful DevOps assistant. Please respond to this question: ${message}`,
      max_tokens: config.bedrock.maxTokens,
      temperature: config.bedrock.temperature,
      p: 0.9
    };
  } else {
    // Default format for other models
    logger.warn('Using default prompt format for unknown model type', { modelId });
    return {
      prompt: message,
      max_tokens_to_sample: config.bedrock.maxTokens,
      temperature: config.bedrock.temperature
    };
  }
}

/**
 * Extract and format the response from a model
 * 
 * @param {Object} response - Raw model response
 * @param {string} modelId - Bedrock model ID
 * @returns {string} Formatted text response
 */
function extractModelResponse(response, modelId) {
  // Parse the response body
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  logger.debug('Raw model response', { responseBody: JSON.stringify(responseBody) });
  
  // Different models return responses in different formats
  if (modelId.startsWith('anthropic.claude')) {
    return responseBody.completion || 'No response from Claude model';
  } else if (modelId.startsWith('ai21')) {
    return responseBody.completions?.[0]?.data?.text || 'No response from AI21 model';
  } else if (modelId.startsWith('amazon.titan')) {
    return responseBody.results?.[0]?.outputText || 'No response from Titan model';
  } else if (modelId.startsWith('cohere')) {
    return responseBody.generations?.[0]?.text || 'No response from Cohere model';
  } else {
    // Log the full response structure for debugging unknown models
    logger.debug('Unknown model response structure', { responseBody: JSON.stringify(responseBody) });
    
    // Try common response fields
    return responseBody.completion || 
           responseBody.generation || 
           responseBody.answer ||
           responseBody.response ||
           JSON.stringify(responseBody);
  }
}

module.exports = {
  handleBedrockRequest,
  invokeBedrockModel,
  invokeBedrockAgent
};