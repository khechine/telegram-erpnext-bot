const { Markup } = require('telegraf');
const erpnext = require('../services/erpnext');
const logger = require('../utils/logger');

class CustomerController {
  /**
   * Afficher le menu clients
   */
  async showCustomersMenu(ctx) {
    const text = '👥 *Gestion des Clients*\n\nQue souhaitez-vous faire ?';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('➕ Créer un client', 'customer_create')],
      [Markup.button.callback('📋 Liste des clients', 'customer_list')],
      [Markup.button.callback('🔍 Rechercher un client', 'customer_search')],
      [Markup.button.callback('↩️ Menu principal', 'main_menu')],
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  /**
   * Lister les clients
   */
  async listCustomers(ctx, page = 0) {
    try {
      await ctx.reply('⏳ Récupération des clients...');

      const limit = 10;
      const offset = page * limit;
      const customers = await erpnext.listCustomers({}, limit, offset);

      if (!customers || customers.length === 0) {
        await ctx.reply(
          '📭 Aucun client trouvé.\n\n' +
          'Souhaitez-vous en créer un ?',
          Markup.inlineKeyboard([
            [Markup.button.callback('➕ Créer un client', 'customer_create')],
            [Markup.button.callback('↩️ Menu clients', 'menu_customers')],
          ])
        );
        return;
      }

      let message = `👥 *Liste des Clients* (Page ${page + 1})\n\n`;
      
      customers.forEach((customer, index) => {
        message += `${index + 1}. *${customer.customer_name}*\n`;
        message += `   📧 ${customer.email_id || 'N/A'}\n`;
        message += `   📱 ${customer.mobile_no || 'N/A'}\n`;
        message += `   🏷️ ${customer.customer_group}\n`;
        message += `   🌍 ${customer.territory}\n\n`;
      });

      message += `💼 Total: ${customers.length} client(s)`;

      const buttons = [];
      if (page > 0) {
        buttons.push(Markup.button.callback('⬅️ Précédent', `customer_list_${page - 1}`));
      }
      if (customers.length === limit) {
        buttons.push(Markup.button.callback('➡️ Suivant', `customer_list_${page + 1}`));
      }

      const keyboard = Markup.inlineKeyboard([
        buttons,
        [Markup.button.callback('➕ Créer un client', 'customer_create')],
        [Markup.button.callback('↩️ Menu clients', 'menu_customers')],
      ]);

      await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });

    } catch (error) {
      logger.error('List customers error:', error);
      await ctx.reply('❌ Erreur lors de la récupération des clients.');
    }
  }

  /**
   * Démarrer la création d'un client
   */
  async startCreateCustomer(ctx) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    ctx.session.state = {
      action: 'create_customer',
      waitingFor: 'customer_name',
      data: {},
    };

    await ctx.reply(
      '➕ *Création d\'un nouveau client*\n\n' +
      '👤 Veuillez entrer le nom du client :',
      { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
    );
  }

  /**
   * Créer un client (avec entités Rasa)
   */
  async createCustomer(ctx, entities) {
    // Extraire les entités
    const name = entities.name?.[0]?.value;
    const email = entities.email?.[0]?.value;
    const phone = entities.phone?.[0]?.value;

    if (!name) {
      await this.startCreateCustomer(ctx);
      return;
    }

    try {
      // Créer le client
      const customerData = {
        name: name,
        email: email,
        phone: phone,
        type: 'Individual',
        group: 'Individual',
        territory: 'All Territories',
      };

      const customer = await erpnext.createCustomer(customerData);

      await ctx.reply(
        `✅ *Client créé avec succès !*\n\n` +
        `👤 Nom: ${customer.customer_name}\n` +
        `📧 Email: ${customer.email_id || 'N/A'}\n` +
        `📱 Téléphone: ${customer.mobile_no || 'N/A'}\n` +
        `🆔 ID: ${customer.name}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Créer un autre', 'customer_create')],
            [Markup.button.callback('📋 Voir les clients', 'customer_list')],
            [Markup.button.callback('↩️ Menu clients', 'menu_customers')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Create customer error:', error);
      await ctx.reply(
        `❌ Erreur lors de la création du client:\n${error.message}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Réessayer', 'customer_create')],
          [Markup.button.callback('↩️ Menu clients', 'menu_customers')],
        ])
      );
    }
  }

  /**
   * Gérer le nom du client
   */
  async handleCustomerName(ctx) {
    const name = ctx.message.text.trim();
    
    if (!name || name.length < 2) {
      await ctx.reply('❌ Le nom doit contenir au moins 2 caractères. Réessayez :');
      return;
    }

    ctx.session.state.data.name = name;
    ctx.session.state.waitingFor = 'customer_email';

    await ctx.reply(
      `✅ Nom enregistré: *${name}*\n\n` +
      '📧 Veuillez entrer l\'email du client (ou tapez "skip" pour passer) :',
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Gérer l'email du client
   */
  async handleCustomerEmail(ctx) {
    const email = ctx.message.text.trim();

    if (email.toLowerCase() === 'skip') {
      ctx.session.state.data.email = null;
    } else {
      // Validation email simple
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        await ctx.reply('❌ Email invalide. Veuillez entrer un email valide (ou "skip") :');
        return;
      }
      ctx.session.state.data.email = email;
    }

    ctx.session.state.waitingFor = 'customer_phone';

    await ctx.reply(
      '📱 Veuillez entrer le numéro de téléphone (ou tapez "skip" pour terminer) :',
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Gérer le téléphone et créer le client
   */
  async handleCustomerPhone(ctx) {
    const phone = ctx.message.text.trim();

    if (phone.toLowerCase() !== 'skip') {
      ctx.session.state.data.phone = phone;
    }

    // Créer le client
    try {
      await ctx.reply('⏳ Création du client en cours...');

      const customer = await erpnext.createCustomer(ctx.session.state.data);

      await ctx.reply(
        `✅ *Client créé avec succès !*\n\n` +
        `👤 Nom: ${customer.customer_name}\n` +
        `📧 Email: ${customer.email_id || 'N/A'}\n` +
        `📱 Téléphone: ${customer.mobile_no || 'N/A'}\n` +
        `🆔 ID: ${customer.name}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Créer un autre', 'customer_create')],
            [Markup.button.callback('📋 Voir les clients', 'customer_list')],
            [Markup.button.callback('↩️ Menu clients', 'menu_customers')],
          ]),
        }
      );

      // Réinitialiser l'état
      ctx.session.state = {};

    } catch (error) {
      logger.error('Create customer error:', error);
      await ctx.reply(
        `❌ Erreur lors de la création du client:\n${error.message}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Réessayer', 'customer_create')],
          [Markup.button.callback('↩️ Menu clients', 'menu_customers')],
        ])
      );
      ctx.session.state = {};
    }
  }

  /**
   * Démarrer la recherche de client
   */
  async startSearchCustomer(ctx) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    ctx.session.state = {
      action: 'search_customer',
      waitingFor: 'customer_search_query',
    };

    await ctx.reply(
      '🔍 *Recherche de client*\n\n' +
      'Entrez le nom du client à rechercher :',
      { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
    );
  }

  /**
   * Rechercher un client
   */
  async searchCustomer(ctx, entities) {
    const searchQuery = entities.name?.[0]?.value || ctx.message?.text;

    if (!searchQuery) {
      await this.startSearchCustomer(ctx);
      return;
    }

    try {
      await ctx.reply('⏳ Recherche en cours...');

      const customers = await erpnext.listCustomers({ search: searchQuery }, 10);

      if (!customers || customers.length === 0) {
        await ctx.reply(
          `📭 Aucun client trouvé pour "${searchQuery}"`,
          Markup.inlineKeyboard([
            [Markup.button.callback('🔍 Nouvelle recherche', 'customer_search')],
            [Markup.button.callback('↩️ Menu clients', 'menu_customers')],
          ])
        );
        return;
      }

      let message = `🔍 *Résultats pour "${searchQuery}"*\n\n`;
      
      customers.forEach((customer, index) => {
        message += `${index + 1}. *${customer.customer_name}*\n`;
        message += `   📧 ${customer.email_id || 'N/A'}\n`;
        message += `   📱 ${customer.mobile_no || 'N/A'}\n\n`;
      });

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔍 Nouvelle recherche', 'customer_search')],
            [Markup.button.callback('↩️ Menu clients', 'menu_customers')],
          ]),
        }
      );

      ctx.session.state = {};

    } catch (error) {
      logger.error('Search customer error:', error);
      await ctx.reply('❌ Erreur lors de la recherche.');
      ctx.session.state = {};
    }
  }
}

module.exports = new CustomerController();
