const { Markup } = require('telegraf');
const erpnext = require('../services/erpnext');
const emailService = require('../services/email');
const logger = require('../utils/logger');
const moment = require('moment');

class QuotationController {
  /**
   * Afficher le menu devis
   */
  async showQuotationsMenu(ctx) {
    const text = '📄 *Gestion des Devis*\n\nQue souhaitez-vous faire ?';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('➕ Créer un devis', 'quotation_create')],
      [Markup.button.callback('📋 Liste des devis', 'quotation_list')],
      [Markup.button.callback('📧 Envoyer un devis', 'quotation_send')],
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
   * Lister les devis
   */
  async listQuotations(ctx, filters = {}) {
    try {
      await ctx.reply('⏳ Récupération des devis...');

      const quotations = await erpnext.listQuotations(filters, 10);

      if (!quotations || quotations.length === 0) {
        await ctx.reply(
          '📭 Aucun devis trouvé.\n\n' +
          'Souhaitez-vous en créer un ?',
          Markup.inlineKeyboard([
            [Markup.button.callback('➕ Créer un devis', 'quotation_create')],
            [Markup.button.callback('↩️ Menu devis', 'menu_quotations')],
          ])
        );
        return;
      }

      let message = `📄 *Liste des Devis*\n\n`;
      
      quotations.forEach((quotation, index) => {
        const statusEmoji = this.getStatusEmoji(quotation.status);
        message += `${index + 1}. *${quotation.name}*\n`;
        message += `   👤 Client: ${quotation.party_name}\n`;
        message += `   📅 Date: ${this.formatDate(quotation.transaction_date)}\n`;
        message += `   ⏰ Valide: ${this.formatDate(quotation.valid_till)}\n`;
        message += `   💰 Montant: ${quotation.grand_total?.toFixed(2)} TND\n`;
        message += `   ${statusEmoji} Statut: ${quotation.status}\n\n`;
      });

      message += `📊 Total: ${quotations.length} devis`;

      // Créer les boutons avec vue et envoi pour chaque devis
      const buttons = [];
      quotations.slice(0, 5).forEach(quotation => {
        buttons.push([
          Markup.button.callback(`👁️ ${quotation.name}`, `quotation_view_${quotation.name}`),
          Markup.button.callback(`📧`, `quotation_send_${quotation.name}`),
        ]);
      });
      buttons.push([Markup.button.callback('➕ Créer un devis', 'quotation_create')]);
      buttons.push([Markup.button.callback('↩️ Menu devis', 'menu_quotations')]);

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(buttons),
        }
      );

    } catch (error) {
      logger.error('List quotations error:', error);
      await ctx.reply('❌ Erreur lors de la récupération des devis.');
    }
  }

  /**
   * Voir un devis détaillé
   */
  async viewQuotation(ctx, quotationName) {
    try {
      await ctx.answerCbQuery();
      await ctx.reply('⏳ Chargement du devis...');

      const quotation = await erpnext.getQuotation(quotationName);

      let message = `📄 *Devis ${quotation.name}*\n\n`;
      message += `👤 *Client:* ${quotation.party_name}\n`;
      message += `📅 *Date:* ${this.formatDate(quotation.transaction_date)}\n`;
      message += `⏰ *Valide jusqu'au:* ${this.formatDate(quotation.valid_till)}\n\n`;
      
      message += `📦 *Articles:*\n`;
      quotation.items?.forEach((item, index) => {
        message += `${index + 1}. ${item.item_name}\n`;
        message += `   Qté: ${item.qty} × ${item.rate?.toFixed(2)} TND\n`;
        message += `   Total: ${item.amount?.toFixed(2)} TND\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `💰 *Total:* ${quotation.grand_total?.toFixed(2)} TND\n`;
      
      const statusEmoji = this.getStatusEmoji(quotation.status);
      message += `${statusEmoji} *Statut:* ${quotation.status}`;

      if (quotation.terms) {
        message += `\n\n📋 *Conditions:*\n${quotation.terms}`;
      }

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📧 Envoyer par email', `quotation_send_${quotation.name}`)],
            [Markup.button.callback('↩️ Liste des devis', 'quotation_list')],
          ]),
        }
      );

    } catch (error) {
      logger.error('View quotation error:', error);
      await ctx.reply('❌ Erreur lors du chargement du devis.');
    }
  }

  /**
   * Démarrer la création d'un devis
   */
  async startCreateQuotation(ctx) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    ctx.session.state = {
      action: 'create_quotation',
      waitingFor: 'quotation_customer',
      data: {
        items: [],
      },
    };

    await ctx.reply(
      '➕ *Création d\'un nouveau devis*\n\n' +
      '👤 Entrez le nom du client :',
      { parse_mode: 'Markdown', ...Markup.removeKeyboard() }
    );
  }

  /**
   * Gérer le nom du client pour le devis
   */
  async handleQuotationCustomer(ctx) {
    const customerName = ctx.message.text.trim();
    
    try {
      // Vérifier que le client existe
      const customer = await erpnext.getCustomer(customerName);
      
      ctx.session.state.data.customer = customerName;
      ctx.session.state.data.customerEmail = customer.email_id;
      ctx.session.state.waitingFor = 'quotation_item_code';

      await ctx.reply(
        `✅ Client: *${customerName}*\n` +
        `📧 Email: ${customer.email_id || 'Non renseigné'}\n\n` +
        '📦 Entrez le nom ou code de l\'article (ou "fini" pour terminer) :',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Get customer error:', error);
      await ctx.reply(
        `❌ Client "${customerName}" introuvable.\n\n` +
        'Veuillez entrer un nom de client valide ou tapez "annuler" :',
        Markup.inlineKeyboard([
          [Markup.button.callback('❌ Annuler', 'menu_quotations')],
        ])
      );
    }
  }

  /**
   * Gérer le code/nom article
   */
  async handleQuotationItemCode(ctx) {
    const itemSearch = ctx.message.text.trim();

    if (itemSearch.toLowerCase() === 'fini') {
      if (ctx.session.state.data.items.length === 0) {
        await ctx.reply('❌ Vous devez ajouter au moins un article. Entrez un nom ou code article :');
        return;
      }

      // Passer à la date de validité
      ctx.session.state.waitingFor = 'quotation_valid_till';

      const itemsList = ctx.session.state.data.items
        .map((item, i) => `${i + 1}. ${item.name} × ${item.qty}`)
        .join('\n');

      await ctx.reply(
        `📦 *Articles ajoutés:*\n${itemsList}\n\n` +
        '⏰ Entrez la date de validité (jours) (ex: 30) :',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    try {
      let item = null;

      // D'abord essayer par code exact
      try {
        item = await erpnext.getItem(itemSearch);
      } catch {
        // Si pas trouvé par code, chercher par nom
        const items = await erpnext.listItems({ search: itemSearch }, 10);

        if (!items || items.length === 0) {
          await ctx.reply(
            `❌ Aucun article trouvé pour "${itemSearch}".\n\n` +
            'Entrez un nom ou code article valide, ou "fini" pour terminer :'
          );
          return;
        }

        if (items.length === 1) {
          // Un seul résultat, l'utiliser directement
          item = await erpnext.getItem(items[0].item_code);
        } else {
          // Plusieurs résultats, afficher la liste pour choisir
          let message = `🔍 *${items.length} articles trouvés pour "${itemSearch}":*\n\n`;

          const buttons = [];
          items.slice(0, 5).forEach((it, index) => {
            message += `${index + 1}. *${it.item_name}*\n`;
            message += `   Code: ${it.item_code}\n`;
            message += `   Prix: ${it.standard_rate?.toFixed(2) || '0.00'} TND\n\n`;
            buttons.push([
              Markup.button.callback(`${index + 1}. ${it.item_name.substring(0, 30)}`, `item_select_${it.item_code}`)
            ]);
          });

          message += 'Sélectionnez un article ou tapez un autre nom :';

          // Sauvegarder l'état pour la sélection
          ctx.session.state.waitingFor = 'quotation_item_code';

          await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons),
          });
          return;
        }
      }

      ctx.session.state.data.currentItem = {
        code: item.item_code || item.name,
        name: item.item_name,
        rate: item.standard_rate || 0,
      };
      ctx.session.state.waitingFor = 'quotation_item_qty';

      await ctx.reply(
        `✅ Article: *${item.item_name}*\n` +
        `💰 Prix: ${item.standard_rate?.toFixed(2) || '0.00'} TND\n\n` +
        '🔢 Entrez la quantité :',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Get item error:', error);
      await ctx.reply(
        `❌ Erreur lors de la recherche de "${itemSearch}".\n\n` +
        'Entrez un nom ou code article valide, ou "fini" pour terminer :'
      );
    }
  }

  /**
   * Gérer la sélection d'un article depuis la liste
   */
  async handleItemSelect(ctx, itemCode) {
    try {
      await ctx.answerCbQuery();

      const item = await erpnext.getItem(itemCode);

      ctx.session.state.data.currentItem = {
        code: item.item_code || item.name,
        name: item.item_name,
        rate: item.standard_rate || 0,
      };
      ctx.session.state.waitingFor = 'quotation_item_qty';

      await ctx.reply(
        `✅ Article sélectionné: *${item.item_name}*\n` +
        `💰 Prix: ${item.standard_rate?.toFixed(2) || '0.00'} TND\n\n` +
        '🔢 Entrez la quantité :',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Item select error:', error);
      await ctx.reply('❌ Erreur lors de la sélection de l\'article.');
    }
  }

  /**
   * Gérer la quantité de l'article
   */
  async handleQuotationItemQty(ctx) {
    const qty = parseFloat(ctx.message.text.trim());

    if (isNaN(qty) || qty <= 0) {
      await ctx.reply('❌ Quantité invalide. Entrez un nombre positif :');
      return;
    }

    const currentItem = ctx.session.state.data.currentItem;
    ctx.session.state.data.items.push({
      code: currentItem.code,
      name: currentItem.name,
      qty: qty,
      rate: currentItem.rate,
      description: currentItem.name,
    });

    delete ctx.session.state.data.currentItem;
    ctx.session.state.waitingFor = 'quotation_item_code';

    const total = qty * currentItem.rate;
    await ctx.reply(
      `✅ Article ajouté: ${currentItem.name} × ${qty} = ${total.toFixed(2)} TND\n\n` +
      '📦 Entrez le nom ou code d\'un autre article, ou "fini" pour terminer :'
    );
  }

  /**
   * Gérer la date de validité
   */
  async handleQuotationValidTill(ctx) {
    const days = parseInt(ctx.message.text.trim());

    if (isNaN(days) || days <= 0) {
      await ctx.reply('❌ Nombre de jours invalide. Entrez un nombre positif :');
      return;
    }

    const validTill = moment().add(days, 'days').format('YYYY-MM-DD');
    ctx.session.state.data.validTill = validTill;
    ctx.session.state.waitingFor = 'quotation_terms';

    await ctx.reply(
      `✅ Valide jusqu'au: ${this.formatDate(validTill)}\n\n` +
      '📋 Entrez les conditions (ou "skip" pour passer) :',
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Gérer les conditions et créer le devis
   */
  async handleQuotationTerms(ctx) {
    const terms = ctx.message.text.trim();

    if (terms.toLowerCase() !== 'skip') {
      ctx.session.state.data.terms = terms;
    }

    // Créer le devis
    try {
      await ctx.reply('⏳ Création du devis en cours...');

      const quotationData = ctx.session.state.data;
      const quotation = await erpnext.createQuotation(quotationData);

      // Soumettre le devis automatiquement
      try {
        await erpnext.submitQuotation(quotation.name);
        quotation.status = 'Submitted';
      } catch (submitError) {
        logger.warn('Could not auto-submit quotation:', submitError.message);
      }

      const total = quotationData.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

      await ctx.reply(
        `✅ *Devis créé avec succès !*\n\n` +
        `📄 Numéro: ${quotation.name}\n` +
        `👤 Client: ${quotationData.customer}\n` +
        `📦 Articles: ${quotationData.items.length}\n` +
        `💰 Total: ${total.toFixed(2)} TND\n` +
        `⏰ Valide jusqu'au: ${this.formatDate(quotationData.validTill)}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📧 Envoyer par email', `quotation_send_${quotation.name}`)],
            [Markup.button.callback('👁️ Voir le devis', `quotation_view_${quotation.name}`)],
            [Markup.button.callback('➕ Créer un autre', 'quotation_create')],
            [Markup.button.callback('↩️ Menu devis', 'menu_quotations')],
          ]),
        }
      );

      // Réinitialiser l'état
      ctx.session.state = {};

    } catch (error) {
      logger.error('Create quotation error:', error);
      await ctx.reply(
        `❌ Erreur lors de la création du devis:\n${error.message}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Réessayer', 'quotation_create')],
          [Markup.button.callback('↩️ Menu devis', 'menu_quotations')],
        ])
      );
      ctx.session.state = {};
    }
  }

  /**
   * Démarrer l'envoi d'un devis par email
   */
  async startSendQuotation(ctx) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    ctx.session.state = {
      action: 'send_quotation',
      waitingFor: 'send_quotation_name',
    };

    await ctx.reply(
      '📧 *Envoi de devis par email*\n\n' +
      '📄 Entrez le numéro du devis :',
      { parse_mode: 'Markdown' }
    );
  }

  /**
   * Envoyer un devis par email
   */
  async sendQuotationByEmail(ctx, quotationName = null) {
    try {
      // Si appelé depuis un callback avec le nom
      if (quotationName) {
        await ctx.answerCbQuery();
      } else {
        // Si appelé depuis un message texte
        quotationName = ctx.message.text.trim();
      }

      await ctx.reply('⏳ Récupération du devis...');

      // Récupérer le devis
      const quotation = await erpnext.getQuotation(quotationName);

      // Vérifier l'email du client
      if (!quotation.party_name) {
        throw new Error('Client non trouvé dans le devis');
      }

      const customer = await erpnext.getCustomer(quotation.party_name);
      const customerEmail = customer.email_id;

      if (!customerEmail) {
        await ctx.reply(
          `❌ Le client ${quotation.party_name} n'a pas d'email renseigné.\n\n` +
          'Veuillez ajouter un email au client dans ERPNext.',
          Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu devis', 'menu_quotations')],
          ])
        );
        return;
      }

      await ctx.reply(`📧 Envoi du devis à ${customerEmail}...`);

      // Envoyer l'email
      const result = await emailService.sendQuotation(quotation, customerEmail);

      await ctx.reply(
        `✅ *Devis envoyé avec succès !*\n\n` +
        `📄 Devis: ${quotation.name}\n` +
        `👤 Client: ${quotation.party_name}\n` +
        `📧 Email: ${customerEmail}\n` +
        `💰 Montant: ${quotation.grand_total?.toFixed(2)} TND\n\n` +
        `Message ID: ${result.messageId}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('👁️ Voir le devis', `quotation_view_${quotation.name}`)],
            [Markup.button.callback('📋 Liste des devis', 'quotation_list')],
            [Markup.button.callback('↩️ Menu devis', 'menu_quotations')],
          ]),
        }
      );

      // Réinitialiser l'état
      ctx.session.state = {};

    } catch (error) {
      logger.error('Send quotation error:', error);
      
      let errorMessage = '❌ Erreur lors de l\'envoi du devis:\n';
      
      if (error.message.includes('Email service is not configured')) {
        errorMessage += '\n⚠️ Le service email n\'est pas configuré.\n' +
          'Veuillez configurer EMAIL_USER et EMAIL_PASSWORD dans le fichier .env';
      } else {
        errorMessage += error.message;
      }

      await ctx.reply(
        errorMessage,
        Markup.inlineKeyboard([
          [Markup.button.callback('↩️ Menu devis', 'menu_quotations')],
        ])
      );
      
      ctx.session.state = {};
    }
  }

  /**
   * Créer un devis (avec entités Rasa)
   */
  async createQuotation(ctx, entities) {
    await this.startCreateQuotation(ctx);
  }

  /**
   * Obtenir l'emoji du statut
   */
  getStatusEmoji(status) {
    const emojiMap = {
      'Draft': '📝',
      'Open': '📬',
      'Submitted': '📤',
      'Ordered': '✅',
      'Lost': '❌',
      'Cancelled': '🚫',
    };
    return emojiMap[status] || '📄';
  }

  /**
   * Formater une date
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }
}

module.exports = new QuotationController();
