const { Markup } = require('telegraf');
const erpnext = require('../services/erpnext');
const logger = require('../utils/logger');

class QuotationController {
  /**
   * Afficher le menu devis
   */
  async showQuotationsMenu(ctx) {
    const text = '📄 *Gestion des Devis*\n\nQue souhaitez-vous faire ?';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('➕ Créer un devis', 'quotation_create')],
      [Markup.button.callback('📋 Liste des devis', 'quotation_list')],
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
        message += `   💰 Montant: ${quotation.grand_total?.toFixed(2)} TND\n`;
        message += `   ${statusEmoji} Statut: ${quotation.status}\n\n`;
      });

      message += `📊 Total: ${quotations.length} devis`;

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Créer un devis', 'quotation_create')],
            [Markup.button.callback('↩️ Menu devis', 'menu_quotations')],
          ]),
        }
      );

    } catch (error) {
      logger.error('List quotations error:', error);
      await ctx.reply('❌ Erreur lors de la récupération des devis.');
    }
  }

  /**
   * Démarrer la création d'un devis
   */
  async startCreateQuotation(ctx) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    await ctx.reply(
      '➕ *Création d\'un nouveau devis*\n\n' +
      '⚠️ Cette fonctionnalité nécessite plusieurs étapes.\n\n' +
      'Veuillez utiliser l\'interface web ERPNext pour créer des devis complexes.\n\n' +
      'Cette fonctionnalité sera bientôt disponible !',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('↩️ Menu devis', 'menu_quotations')],
        ]),
      }
    );
  }

  /**
   * Créer un devis (placeholder)
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
