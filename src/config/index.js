require('dotenv').config();
const Joi = require('joi');

// Schéma de validation des variables d'environnement
const envSchema = Joi.object({
  // Telegram
  TELEGRAM_BOT_TOKEN: Joi.string().required(),
  TELEGRAM_WEBHOOK_DOMAIN: Joi.string().uri().optional(),
  TELEGRAM_WEBHOOK_PORT: Joi.number().default(3000),

  // ERPNext
  ERPNEXT_URL: Joi.string().uri().required(),
  ERPNEXT_API_KEY: Joi.string().required(),
  ERPNEXT_API_SECRET: Joi.string().required(),

  // Rasa
  RASA_URL: Joi.string().uri().default('http://localhost:5005'),
  RASA_TOKEN: Joi.string().optional(),

  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Cache
  CACHE_TTL: Joi.number().default(3600),
  CACHE_MAX_KEYS: Joi.number().default(1000),

  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(20),

  // Feature Flags
  ENABLE_RASA: Joi.boolean().default(true),
  ENABLE_WEBHOOK: Joi.boolean().default(false),
  ENABLE_REDIS: Joi.boolean().default(false),
}).unknown();

const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  telegram: {
    botToken: env.TELEGRAM_BOT_TOKEN,
    webhookDomain: env.TELEGRAM_WEBHOOK_DOMAIN,
    webhookPort: env.TELEGRAM_WEBHOOK_PORT,
  },
  erpnext: {
    url: env.ERPNEXT_URL,
    apiKey: env.ERPNEXT_API_KEY,
    apiSecret: env.ERPNEXT_API_SECRET,
  },
  rasa: {
    url: env.RASA_URL,
    token: env.RASA_TOKEN,
  },
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  cache: {
    ttl: env.CACHE_TTL,
    maxKeys: env.CACHE_MAX_KEYS,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  features: {
    rasa: env.ENABLE_RASA === 'true' || env.ENABLE_RASA === true,
    webhook: env.ENABLE_WEBHOOK === 'true' || env.ENABLE_WEBHOOK === true,
    redis: env.ENABLE_REDIS === 'true' || env.ENABLE_REDIS === true,
  },
};
