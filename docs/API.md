# 📚 API Documentation

Cette documentation décrit l'architecture interne du bot et comment étendre ses fonctionnalités.

## 🏗️ Architecture

### Services

Les services encapsulent la logique d'accès aux API externes.

#### ERPNext Service (`src/services/erpnext.js`)

```javascript
const erpnext = require('./services/erpnext');

// Clients
await erpnext.createCustomer({ name, email, phone });
await erpnext.getCustomer(customerName);
await erpnext.listCustomers(filters, limit, offset);
await erpnext.updateCustomer(customerName, data);
await erpnext.deleteCustomer(customerName);

// Devis
await erpnext.createQuotation(data);
await erpnext.getQuotation(quotationName);
await erpnext.listQuotations(filters, limit);

// Factures
await erpnext.createSalesInvoice(data);
await erpnext.getSalesInvoice(invoiceName);
await erpnext.listSalesInvoices(filters, limit);

// Articles
await erpnext.getItem(itemCode);
await erpnext.listItems(filters, limit);
await erpnext.getStockLevels(itemCode, warehouse);

// Rapports
await erpnext.getReport(reportName, filters);
await erpnext.getSalesReport(fromDate, toDate);
await erpnext.getFinancialDashboard();

// Utilitaires
await erpnext.testConnection();
```

#### Rasa Service (`src/services/rasa.js`)

```javascript
const rasaService = require('./services/rasa');

// Analyser un message
const analysis = await rasaService.analyze(text, userId);
// Retourne: { text, intent: { name, confidence }, entities, intents }

// Déterminer l'intention (fallback sans Rasa)
const intent = rasaService.determineIntentFromText(text);

// Extraire les entités (fallback sans Rasa)
const entities = rasaService.extractEntitiesFromText(text);

// Tester la connexion
await rasaService.testConnection();
```

### Contrôleurs

Les contrôleurs gèrent la logique métier et l'interaction Telegram.

#### Customer Controller (`src/controllers/customerController.js`)

```javascript
const customerController = require('./controllers/customerController');

// Méthodes principales
await customerController.showCustomersMenu(ctx);
await customerController.listCustomers(ctx, page);
await customerController.startCreateCustomer(ctx);
await customerController.createCustomer(ctx, entities);
await customerController.searchCustomer(ctx, entities);

// Handlers pour états
await customerController.handleCustomerName(ctx);
await customerController.handleCustomerEmail(ctx);
await customerController.handleCustomerPhone(ctx);
```

### Bot Telegram (`src/bot/index.js`)

```javascript
const TelegramBot = require('./bot');

const bot = new TelegramBot();

// Démarrer le bot
await bot.start();

// Arrêter le bot
bot.stop('SIGTERM');

// Accéder au bot Telegraf
bot.bot.command('custom', async (ctx) => {
  // Votre logique
});
```

## 🔧 Ajouter une Nouvelle Fonctionnalité

### 1. Créer un nouveau contrôleur

```javascript
// src/controllers/myController.js
const { Markup } = require('telegraf');
const erpnext = require('../services/erpnext');
const logger = require('../utils/logger');

class MyController {
  async showMenu(ctx) {
    const text = '🎯 *Mon Menu*\n\nChoisissez une option :';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Option 1', 'my_option_1')],
      [Markup.button.callback('Retour', 'main_menu')],
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  async handleOption1(ctx) {
    try {
      await ctx.reply('⏳ Traitement en cours...');
      
      // Votre logique ici
      const data = await erpnext.someMethod();
      
      await ctx.reply(`✅ Résultat : ${data}`);
    } catch (error) {
      logger.error('Error:', error);
      await ctx.reply('❌ Une erreur est survenue.');
    }
  }
}

module.exports = new MyController();
```

### 2. Ajouter les routes dans le bot

```javascript
// src/bot/index.js
const myController = require('../controllers/myController');

// Dans setupCommands()
this.bot.command('mymenu', (ctx) => myController.showMenu(ctx));

// Dans setupCallbacks()
this.bot.action('my_option_1', (ctx) => myController.handleOption1(ctx));

// Dans routeIntent()
case 'my_custom_intent':
  await myController.handleOption1(ctx);
  break;
```

### 3. Ajouter l'intention dans Rasa (optionnel)

```yaml
# rasa/nlu.yml
- intent: my_custom_intent
  examples: |
    - mon menu
    - afficher mon menu
    - ouvrir mon menu
```

Puis réentraîner :
```bash
cd rasa && rasa train
```

## 🎨 Personnaliser les Messages

### Formatage Markdown

```javascript
await ctx.reply(
  `*Gras* _Italique_ \`Code\` [Lien](https://example.com)`,
  { parse_mode: 'Markdown' }
);
```

### Boutons Inline

```javascript
const keyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('Bouton 1', 'callback_1'),
    Markup.button.callback('Bouton 2', 'callback_2'),
  ],
  [Markup.button.url('Lien externe', 'https://example.com')],
]);

await ctx.reply('Choisissez une option :', keyboard);
```

### Emojis

Utilisez les emojis pour améliorer l'UX :
```javascript
const emojis = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  loading: '⏳',
  money: '💰',
  user: '👤',
  calendar: '📅',
};
```

## 🔄 Gestion de l'État

### Stocker l'état utilisateur

```javascript
// Dans un contrôleur
ctx.session.state = {
  action: 'mon_action',
  waitingFor: 'user_input',
  data: {
    step: 1,
    values: {},
  },
};
```

### Lire l'état

```javascript
if (ctx.session.state?.waitingFor === 'user_input') {
  const input = ctx.message.text;
  // Traiter l'input
  ctx.session.state.data.values.userInput = input;
}
```

### Réinitialiser l'état

```javascript
ctx.session.state = {};
```

## 📊 Logging

```javascript
const logger = require('../utils/logger');

logger.error('Message d\'erreur', { context: 'info' });
logger.warn('Avertissement');
logger.info('Information');
logger.debug('Debug détaillé');
```

## 🧪 Tests

### Tester un service

```javascript
// tests/services/erpnext.test.js
const erpnext = require('../../src/services/erpnext');

describe('ERPNext Service', () => {
  test('should list customers', async () => {
    const customers = await erpnext.listCustomers({}, 10);
    expect(Array.isArray(customers)).toBe(true);
  });
});
```

### Tester un contrôleur

```javascript
// tests/controllers/customer.test.js
const customerController = require('../../src/controllers/customerController');

describe('Customer Controller', () => {
  test('should have showCustomersMenu method', () => {
    expect(typeof customerController.showCustomersMenu).toBe('function');
  });
});
```

## 🔒 Sécurité

### Validation des entrées

```javascript
const Joi = require('joi');

const schema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/),
  name: Joi.string().min(2).max(100).required(),
});

const { error, value } = schema.validate(data);
if (error) {
  throw new Error(`Validation error: ${error.message}`);
}
```

### Rate Limiting

```javascript
// À implémenter avec rate-limiter-flexible
const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requêtes
  duration: 60, // par minute
});

// Dans un middleware
try {
  await rateLimiter.consume(ctx.from.id);
  await next();
} catch (error) {
  await ctx.reply('⚠️ Trop de requêtes. Veuillez patienter.');
}
```

## 🚀 Performance

### Cache

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

// Mettre en cache
cache.set('key', data);

// Récupérer du cache
const cached = cache.get('key');
if (cached) {
  return cached;
}

// Supprimer du cache
cache.del('key');
```

### Requêtes parallèles

```javascript
const [customers, invoices, quotations] = await Promise.all([
  erpnext.listCustomers(),
  erpnext.listSalesInvoices(),
  erpnext.listQuotations(),
]);
```

## 📞 Support

Pour toute question sur l'API :
- Consulter le code source dans `src/`
- Voir les exemples dans `tests/`
- Créer une issue sur GitHub

---

**Développé avec ❤️ par Mehdi**
