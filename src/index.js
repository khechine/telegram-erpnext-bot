const logger = require('./utils/logger');
const config = require('./config');
const TelegramBot = require('./bot');

// Banner
const banner = `
╔═══════════════════════════════════════════════╗
║   🤖 Telegram ERPNext Bot with Rasa NLU      ║
║                                               ║
║   Environment: ${config.app.env.padEnd(30)}║
║   Version: 1.0.0                              ║
╚═══════════════════════════════════════════════╝
`;

console.log(banner);

// Logger startup info
logger.info('Starting Telegram ERPNext Bot...');
logger.info(`Environment: ${config.app.env}`);
logger.info(`Log Level: ${config.app.logLevel}`);
logger.info(`ERPNext URL: ${config.erpnext.url}`);
logger.info(`Rasa URL: ${config.rasa.url}`);
logger.info(`Rasa Enabled: ${config.features.rasa}`);
logger.info(`Webhook Mode: ${config.features.webhook}`);

// Create and start bot
const bot = new TelegramBot();

bot.start().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
