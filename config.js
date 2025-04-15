const config = {
    // AWS Configuration
    aws: {
        region: process.env.AWS_REGION // This is automatically set by Lambda
      },
      
    // Bedrock Configuration
    bedrock: {
      // Whether to use a Bedrock agent or direct model call
      useAgent: process.env.USE_BEDROCK_AGENT === 'true',
      
      // Model settings (used when useAgent is false)
      modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
      maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '1000', 10),
      temperature: parseFloat(process.env.BEDROCK_TEMPERATURE || '0.7'),
      
      // Agent settings (used when useAgent is true)
      agentId: process.env.BEDROCK_AGENT_ID,
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID
    },
    
    // Logging Configuration
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      includeTimestamp: true
    },
    
    // Security Configuration
    security: {
      includeErrorDetails: process.env.INCLUDE_ERROR_DETAILS === 'true'
    },
    
    // HTTP Configuration
    http: {
      allowedOrigins: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['*']
    }
  };
  
  module.exports = { config };