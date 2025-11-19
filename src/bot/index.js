const { Telegraf, Markup } = require('telegraf');
const config = require('../config');
const logger = require('../utils/logger');
const rasaService = require('../services/rasa');
const erpnext = require('../services/erpnext');

// Controllers
const customerController = require('../controllers/customerController');
const quotationController = require('../controllers/quotationController');
const invoiceController = require('../controllers/invoiceController');
const reportController = require('../controllers/reportController');

class TelegramBot {
  constructor() {
    this.bot = new Telegraf(config.telegram.botToken);
    this.sessions = new Map(); // Stocker les sessions utilisateur
    this.setupMiddleware();
    this.setupCommands();
    this.setupCallbacks();
    this.setupMessageHandler();
  }

  /**
   * Configurer les middleware
   */
  setupMiddleware() {
    // Logger middleware
    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      logger.info(`${ctx.updateType} from ${ctx.from?.id} (${ms}ms)`);
    });

    // Session middleware simple
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      if (userId && !this.sessions.has(userId)) {
        this.sessions.set(userId, {
          userId,
          state: {},
          createdAt: new Date(),
        });
      }
      ctx.session = this.sessions.get(userId);
      await next();
    });

    // Error handler
    this.bot.catch((err, ctx) => {
      logger.error('Bot error:', err);
      ctx.reply('❌ Une erreur est survenue. Veuillez réessayer.').catch(() => {});
    });
  }

  /**
   * Configurer les commandes
   */
  setupCommands() {
    // Commande /start
    this.bot.command('start', async (ctx) => {
      const userName = ctx.from.first_name || 'utilisateur';
      await ctx.reply(
        `👋 Bienvenue ${userName} !\n\n` +
        `Je suis votre assistant ERPNext intelligent.\n\n` +
        `🤖 Je peux vous aider avec :\n` +
        `• 👥 Gestion des clients\n` +
        `• 📄 Devis et factures\n` +
        `• 📦 Stock et articles\n` +
        `• 📊 Rapports et statistiques\n\n` +
        `Utilisez le menu ci-dessous ou tapez simplement ce que vous voulez faire !`,
        this.getMainMenu()
      );
    });

    // Commande /help
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        `📚 *Guide d'utilisation*\n\n` +
        `*Commandes disponibles :*\n` +
        `/start - Démarrer le bot\n` +
        `/help - Afficher cette aide\n` +
        `/customers - Gérer les clients\n` +
        `/reports - Voir les rapports\n` +
        `/menu - Menu principal\n\n` +
        `*Exemples de requêtes :*\n` +
        `• "Créer un client Dupont avec email dupont@example.com"\n` +
        `• "Liste des clients"\n` +
        `• "Rapport des ventes"\n` +
        `• "Niveau de stock"\n` +
        `• "Dashboard"\n\n` +
        `*Utilisation des boutons :*\n` +
        `Vous pouvez aussi naviguer avec les boutons interactifs !`,
        { parse_mode: 'Markdown' }
      );
    });

    // Commande /menu
    this.bot.command('menu', async (ctx) => {
      await ctx.reply('📋 Menu principal :', this.getMainMenu());
    });

    // Commande /customers
    this.bot.command('customers', async (ctx) => {
      await customerController.listCustomers(ctx);
    });

    // Commande /reports
    this.bot.command('reports', async (ctx) => {
      await reportController.showReportsMenu(ctx);
    });
  }

  /**
   * Configurer les callbacks des boutons
   */
  setupCallbacks() {
    // Menu principal
    this.bot.action('menu_customers', (ctx) => customerController.showCustomersMenu(ctx));
    this.bot.action('menu_quotations', (ctx) => quotationController.showQuotationsMenu(ctx));
    this.bot.action('menu_invoices', (ctx) => invoiceController.showInvoicesMenu(ctx));
    this.bot.action('menu_reports', (ctx) => reportController.showReportsMenu(ctx));
    this.bot.action('main_menu', (ctx) => this.showMainMenu(ctx));

    // Clients
    this.bot.action('customer_create', (ctx) => customerController.startCreateCustomer(ctx));
    this.bot.action('customer_list', (ctx) => customerController.listCustomers(ctx));
    this.bot.action('customer_search', (ctx) => customerController.startSearchCustomer(ctx));

    // Devis
    this.bot.action('quotation_create', (ctx) => quotationController.startCreateQuotation(ctx));
    this.bot.action('quotation_list', (ctx) => quotationController.listQuotations(ctx));
    this.bot.action('quotation_send', (ctx) => quotationController.startSendQuotation(ctx));
    this.bot.action(/^quotation_view_(.+)$/, (ctx) => {
      const quotationName = ctx.match[1];
      return quotationController.viewQuotation(ctx, quotationName);
    });
    this.bot.action(/^quotation_send_(.+)$/, (ctx) => {
      const quotationName = ctx.match[1];
      return quotationController.sendQuotationByEmail(ctx, quotationName);
    });
    this.bot.action(/^item_select_(.+)$/, (ctx) => {
      const itemCode = ctx.match[1];
      return quotationController.handleItemSelect(ctx, itemCode);
    });

    // Factures
    this.bot.action('invoice_list', (ctx) => invoiceController.listInvoices(ctx));
    this.bot.action(/^invoice_view_(.+)$/, (ctx) => invoiceController.viewInvoice(ctx));

    // Rapports
    this.bot.action('report_sales', (ctx) => reportController.showSalesReport(ctx));
    this.bot.action('report_customers', (ctx) => reportController.showCustomersReport(ctx));
    this.bot.action('report_stock', (ctx) => reportController.showStockReport(ctx));
    this.bot.action('report_financial', (ctx) => reportController.showFinancialReport(ctx));
    this.bot.action('report_dashboard', (ctx) => reportController.showDashboard(ctx));

    // Rapports POS
    this.bot.action('report_pos_menu', (ctx) => reportController.showPOSMenu(ctx));
    this.bot.action('report_pos_daily', (ctx) => reportController.showPOSDailyReport(ctx));
    this.bot.action('report_pos_bestsellers', (ctx) => reportController.showBestSellersReport(ctx));
    this.bot.action('report_pos_bestseller', (ctx) => reportController.showBestSellerReport(ctx));
    this.bot.action('report_pos_cashier', (ctx) => reportController.showCashierStatusReport(ctx));
  }

  /**
   * Gérer les messages texte
   */
  setupMessageHandler() {
    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      const userId = ctx.from.id;

      logger.debug(`Message from ${userId}: ${text}`);

      // Vérifier si on est dans un flux de création
      if (ctx.session.state?.waitingFor) {
        await this.handleStateMessage(ctx);
        return;
      }

      // Analyser avec Rasa
      const analysis = await rasaService.analyze(text, userId.toString());
      
      logger.debug('Intent detected:', {
        intent: analysis.intent.name,
        confidence: analysis.intent.confidence,
        entities: Object.keys(analysis.entities),
      });

      // Router vers le bon handler
      await this.routeIntent(ctx, analysis);
    });
  }

  /**
   * Gérer les messages en fonction de l'état
   */
  async handleStateMessage(ctx) {
    const state = ctx.session.state;
    
    switch (state.waitingFor) {
      case 'customer_name':
        await customerController.handleCustomerName(ctx);
        break;
      case 'customer_email':
        await customerController.handleCustomerEmail(ctx);
        break;
      case 'customer_phone':
        await customerController.handleCustomerPhone(ctx);
        break;
      
      // Devis
      case 'quotation_customer':
        await quotationController.handleQuotationCustomer(ctx);
        break;
      case 'quotation_item_code':
        await quotationController.handleQuotationItemCode(ctx);
        break;
      case 'quotation_item_qty':
        await quotationController.handleQuotationItemQty(ctx);
        break;
      case 'quotation_valid_till':
        await quotationController.handleQuotationValidTill(ctx);
        break;
      case 'quotation_terms':
        await quotationController.handleQuotationTerms(ctx);
        break;
      case 'send_quotation_name':
        await quotationController.sendQuotationByEmail(ctx);
        break;
      
      default:
        await ctx.reply('❌ État inconnu. Retour au menu principal.', this.getMainMenu());
        ctx.session.state = {};
    }
  }

  /**
   * Router les intentions
   */
  async routeIntent(ctx, analysis) {
    const intent = analysis.intent.name;
    const entities = analysis.entities;

    try {
      switch (intent) {
        // Menu & Navigation
        case 'menu':
        case 'start':
          await this.showMainMenu(ctx);
          break;

        case 'help':
          await ctx.reply('📚 Utilisez /help pour voir toutes les commandes disponibles.');
          break;

        // Clients
        case 'create_customer':
          await customerController.createCustomer(ctx, entities);
          break;

        case 'list_customers':
          await customerController.listCustomers(ctx);
          break;

        case 'search_customer':
          await customerController.searchCustomer(ctx, entities);
          break;

        // Devis
        case 'create_quotation':
          await quotationController.createQuotation(ctx, entities);
          break;

        case 'list_quotations':
          await quotationController.listQuotations(ctx);
          break;

        case 'send_quotation':
          await quotationController.startSendQuotation(ctx);
          break;

        // Factures
        case 'list_invoices':
          await invoiceController.listInvoices(ctx);
          break;

        // Stock
        case 'list_items':
        case 'check_stock':
          await reportController.showStockReport(ctx);
          break;

        // Rapports
        case 'sales_report':
          await reportController.showSalesReport(ctx);
          break;

        case 'financial_report':
          await reportController.showFinancialReport(ctx);
          break;

        case 'stock_report':
          await reportController.showStockReport(ctx);
          break;

        case 'reports_menu':
          await reportController.showReportsMenu(ctx);
          break;

        // POS
        case 'pos_daily':
        case 'daily_revenue':
        case 'recette_jour':
          await reportController.showPOSDailyReport(ctx);
          break;

        case 'pos_bestsellers':
        case 'best_items':
        case 'meilleurs_articles':
          await reportController.showBestSellersReport(ctx);
          break;

        case 'pos_bestseller':
        case 'best_seller':
        case 'meilleur_vendeur':
          await reportController.showBestSellerReport(ctx);
          break;

        case 'pos_cashier':
        case 'cashier_status':
        case 'etat_caisse':
          await reportController.showCashierStatusReport(ctx);
          break;

        case 'pos_menu':
          await reportController.showPOSMenu(ctx);
          break;

        // Inconnu
        case 'unknown':
        default:
          await ctx.reply(
            `🤔 Je n'ai pas compris votre demande.\n\n` +
            `Essayez :\n` +
            `• "Liste des clients"\n` +
            `• "Créer un client"\n` +
            `• "Rapport des ventes"\n` +
            `• Ou utilisez le menu ci-dessous`,
            this.getMainMenu()
          );
      }
    } catch (error) {
      logger.error('Route intent error:', error);
      await ctx.reply('❌ Une erreur est survenue. Veuillez réessayer.');
    }
  }

  /**
   * Afficher le menu principal
   */
  async showMainMenu(ctx) {
    const text = '📋 *Menu Principal*\n\nQue souhaitez-vous faire ?';
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...this.getMainMenu(),
      });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...this.getMainMenu(),
      });
    }
  }

  /**
   * Obtenir le menu principal
   */
  getMainMenu() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('👥 Clients', 'menu_customers'),
        Markup.button.callback('📄 Devis', 'menu_quotations'),
      ],
      [
        Markup.button.callback('💰 Factures', 'menu_invoices'),
        Markup.button.callback('📊 Rapports', 'menu_reports'),
      ],
    ]);
  }

  /**
   * Démarrer le bot
   */
  async start() {
    try {
      // Tester les connexions
      logger.info('🔍 Testing connections...');
      await erpnext.testConnection();
      await rasaService.testConnection();

      // Démarrer le bot
      if (config.features.webhook) {
        // Mode webhook
        this.bot.launch({
          webhook: {
            domain: config.telegram.webhookDomain,
            port: config.telegram.webhookPort,
          },
        });
        logger.info(`🚀 Bot started in webhook mode on ${config.telegram.webhookDomain}`);
      } else {
        // Mode polling
        this.bot.launch();
        logger.info('🚀 Bot started in polling mode');
      }

      // Graceful stop
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));

    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  /**
   * Arrêter le bot
   */
  stop(signal) {
    logger.info(`${signal} received, stopping bot...`);
    this.bot.stop(signal);
    process.exit(0);
  }
}

module.exports = TelegramBot;
