const { Markup } = require('telegraf');
const erpnext = require('../services/erpnext');
const logger = require('../utils/logger');

class InvoiceController {
  /**
   * Afficher le menu factures
   */
  async showInvoicesMenu(ctx) {
    const text = '💰 *Gestion des Factures*\n\nQue souhaitez-vous faire ?';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 Toutes les factures', 'invoice_list')],
      [
        Markup.button.callback('✅ Payées', 'invoice_list_paid'),
        Markup.button.callback('⏳ En attente', 'invoice_list_unpaid'),
      ],
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
   * Lister les factures
   */
  async listInvoices(ctx, filters = {}) {
    try {
      // Gérer les filtres depuis les callbacks
      if (ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        if (data === 'invoice_list_paid') {
          filters.status = 'Paid';
        } else if (data === 'invoice_list_unpaid') {
          filters.status = 'Unpaid';
        }
        await ctx.answerCbQuery();
      }

      await ctx.reply('⏳ Récupération des factures...');

      const invoices = await erpnext.listSalesInvoices(filters, 10);

      if (!invoices || invoices.length === 0) {
        await ctx.reply(
          '📭 Aucune facture trouvée.',
          Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu factures', 'menu_invoices')],
          ])
        );
        return;
      }

      let message = `💰 *Factures de Vente*`;
      if (filters.status) {
        message += ` (${this.getStatusLabel(filters.status)})`;
      }
      message += `\n\n`;
      
      let totalAmount = 0;
      let totalOutstanding = 0;

      invoices.forEach((invoice, index) => {
        const statusEmoji = this.getStatusEmoji(invoice.status);
        message += `${index + 1}. *${invoice.name}*\n`;
        message += `   👤 Client: ${invoice.customer}\n`;
        message += `   📅 Date: ${this.formatDate(invoice.posting_date)}\n`;
        message += `   💰 Montant: ${invoice.grand_total?.toFixed(2)} TND\n`;
        
        if (invoice.outstanding_amount > 0) {
          message += `   ⏳ Restant: ${invoice.outstanding_amount?.toFixed(2)} TND\n`;
        }
        
        message += `   ${statusEmoji} ${invoice.status}\n\n`;

        totalAmount += invoice.grand_total || 0;
        totalOutstanding += invoice.outstanding_amount || 0;
      });

      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `💰 Total: ${totalAmount.toFixed(2)} TND\n`;
      if (totalOutstanding > 0) {
        message += `⏳ Montant restant: ${totalOutstanding.toFixed(2)} TND\n`;
      }
      message += `📊 ${invoices.length} facture(s)`;

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Payées', 'invoice_list_paid'),
              Markup.button.callback('⏳ En attente', 'invoice_list_unpaid'),
            ],
            [Markup.button.callback('📋 Toutes', 'invoice_list')],
            [Markup.button.callback('↩️ Menu factures', 'menu_invoices')],
          ]),
        }
      );

    } catch (error) {
      logger.error('List invoices error:', error);
      await ctx.reply('❌ Erreur lors de la récupération des factures.');
    }
  }

  /**
   * Voir une facture détaillée
   */
  async viewInvoice(ctx) {
    try {
      const invoiceName = ctx.match[1];
      await ctx.answerCbQuery();
      await ctx.reply('⏳ Chargement de la facture...');

      const invoice = await erpnext.getSalesInvoice(invoiceName);

      let message = `💰 *Facture ${invoice.name}*\n\n`;
      message += `👤 *Client:* ${invoice.customer}\n`;
      message += `📅 *Date:* ${this.formatDate(invoice.posting_date)}\n`;
      message += `📅 *Échéance:* ${this.formatDate(invoice.due_date)}\n\n`;
      
      message += `📦 *Articles:*\n`;
      invoice.items?.forEach((item, index) => {
        message += `${index + 1}. ${item.item_name}\n`;
        message += `   Qté: ${item.qty} × ${item.rate} TND\n`;
        message += `   Total: ${item.amount} TND\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `💰 *Total:* ${invoice.grand_total?.toFixed(2)} TND\n`;
      
      if (invoice.outstanding_amount > 0) {
        message += `⏳ *Restant:* ${invoice.outstanding_amount?.toFixed(2)} TND\n`;
      }
      
      const statusEmoji = this.getStatusEmoji(invoice.status);
      message += `${statusEmoji} *Statut:* ${invoice.status}`;

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Liste des factures', 'invoice_list')],
          ]),
        }
      );

    } catch (error) {
      logger.error('View invoice error:', error);
      await ctx.reply('❌ Erreur lors du chargement de la facture.');
    }
  }

  /**
   * Obtenir l'emoji du statut
   */
  getStatusEmoji(status) {
    const emojiMap = {
      'Draft': '📝',
      'Submitted': '📤',
      'Paid': '✅',
      'Unpaid': '⏳',
      'Overdue': '🔴',
      'Cancelled': '🚫',
      'Return': '↩️',
    };
    return emojiMap[status] || '📄';
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(status) {
    const labelMap = {
      'Paid': '✅ Payées',
      'Unpaid': '⏳ Non payées',
      'Overdue': '🔴 En retard',
    };
    return labelMap[status] || status;
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

module.exports = new InvoiceController();
