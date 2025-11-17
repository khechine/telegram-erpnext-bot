#!/usr/bin/env node

const config = require('./src/config');
const erpnext = require('./src/services/erpnext');
const rasaService = require('./src/services/rasa');
const logger = require('./src/utils/logger');

console.log('╔═══════════════════════════════════════════════╗');
console.log('║   🔍 Configuration Check                      ║');
console.log('╚═══════════════════════════════════════════════╝\n');

async function checkConfig() {
  let allOk = true;

  // Check Telegram configuration
  console.log('📱 Telegram Configuration:');
  if (config.telegram.botToken) {
    console.log('   ✅ Bot Token configured');
  } else {
    console.log('   ❌ Bot Token missing!');
    allOk = false;
  }

  if (config.features.webhook) {
    if (config.telegram.webhookDomain) {
      console.log(`   ✅ Webhook domain: ${config.telegram.webhookDomain}`);
    } else {
      console.log('   ⚠️  Webhook enabled but domain not configured');
    }
  } else {
    console.log('   ℹ️  Using polling mode');
  }

  // Check ERPNext configuration
  console.log('\n🏢 ERPNext Configuration:');
  if (config.erpnext.url) {
    console.log(`   ✅ URL: ${config.erpnext.url}`);
  } else {
    console.log('   ❌ ERPNext URL missing!');
    allOk = false;
  }

  if (config.erpnext.apiKey && config.erpnext.apiSecret) {
    console.log('   ✅ API credentials configured');
    
    // Test ERPNext connection
    console.log('   🔄 Testing ERPNext connection...');
    const erpnextOk = await erpnext.testConnection();
    if (erpnextOk) {
      console.log('   ✅ ERPNext connection successful!');
    } else {
      console.log('   ❌ ERPNext connection failed!');
      allOk = false;
    }
  } else {
    console.log('   ❌ ERPNext API credentials missing!');
    allOk = false;
  }

  // Check Rasa configuration
  console.log('\n🤖 Rasa Configuration:');
  if (config.features.rasa) {
    console.log(`   ✅ Rasa enabled`);
    console.log(`   ℹ️  URL: ${config.rasa.url}`);
    
    // Test Rasa connection
    console.log('   🔄 Testing Rasa connection...');
    const rasaOk = await rasaService.testConnection();
    if (rasaOk) {
      console.log('   ✅ Rasa connection successful!');
    } else {
      console.log('   ⚠️  Rasa connection failed - Bot will work in fallback mode');
    }
  } else {
    console.log('   ℹ️  Rasa disabled - Using fallback intent detection');
  }

  // Check application configuration
  console.log('\n⚙️  Application Configuration:');
  console.log(`   Environment: ${config.app.env}`);
  console.log(`   Log Level: ${config.app.logLevel}`);
  console.log(`   Port: ${config.app.port}`);

  // Summary
  console.log('\n' + '═'.repeat(47));
  if (allOk) {
    console.log('✅ Configuration is valid! You can start the bot.');
    console.log('\nRun: npm start');
  } else {
    console.log('❌ Configuration has errors! Please fix them before starting.');
    console.log('\nCheck your .env file and make sure all required fields are set.');
    process.exit(1);
  }
  console.log('═'.repeat(47) + '\n');
}

checkConfig().catch((error) => {
  console.error('\n❌ Error checking configuration:', error.message);
  process.exit(1);
});
