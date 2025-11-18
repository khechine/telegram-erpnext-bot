const { Markup } = require('telegraf');
const moment = require('moment');
const erpnext = require('../services/erpnext');
const logger = require('../utils/logger');

class ReportController {
  /**
   * Afficher le menu rapports
   */
  async showReportsMenu(ctx) {
    const text = '📊 *Rapports et Statistiques*\n\nChoisissez un rapport :';

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💰 Ventes', 'report_sales'),
        Markup.button.callback('👥 Clients', 'report_customers'),
      ],
      [
        Markup.button.callback('📦 Stock', 'report_stock'),
        Markup.button.callback('📈 Financier', 'report_financial'),
      ],
      [Markup.button.callback('📊 Dashboard', 'report_dashboard')],
      [Markup.button.callback('🏪 POS', 'report_pos_menu')],
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
   * Afficher le menu POS
   */
  async showPOSMenu(ctx) {
    const text = '🏪 *Rapports POS*\n\nChoisissez un rapport :';

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💵 Recette du jour', 'report_pos_daily')],
      [Markup.button.callback('🏆 Meilleurs articles', 'report_pos_bestsellers')],
      [Markup.button.callback('👑 Meilleur vendeur', 'report_pos_bestseller')],
      [Markup.button.callback('🏦 État de la caisse', 'report_pos_cashier')],
      [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      await ctx.answerCbQuery();
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  /**
   * Rapport des ventes
   */
  async showSalesReport(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Génération du rapport des ventes...');

      // Récupérer les factures du mois en cours
      const invoices = await erpnext.listSalesInvoices({}, 50);

      if (!invoices || invoices.length === 0) {
        await ctx.reply(
          '📭 Aucune facture trouvée.',
          Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ])
        );
        return;
      }

      // Analyser les données
      let totalAmount = 0;
      let totalOutstanding = 0;
      let paidCount = 0;
      let unpaidCount = 0;

      const statusCounts = {};

      invoices.forEach(invoice => {
        totalAmount += invoice.grand_total || 0;
        totalOutstanding += invoice.outstanding_amount || 0;

        if (invoice.status === 'Paid') {
          paidCount++;
        } else if (invoice.status === 'Unpaid' || invoice.status === 'Overdue') {
          unpaidCount++;
        }

        statusCounts[invoice.status] = (statusCounts[invoice.status] || 0) + 1;
      });

      // Formater le message
      let message = `💰 *Rapport des Ventes*\n\n`;
      message += `📊 *Statistiques Globales*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `📋 Total factures: ${invoices.length}\n`;
      message += `✅ Payées: ${paidCount}\n`;
      message += `⏳ Non payées: ${unpaidCount}\n\n`;

      message += `💵 *Montants*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `💰 Total: ${totalAmount.toFixed(2)} TND\n`;
      message += `✅ Encaissé: ${(totalAmount - totalOutstanding).toFixed(2)} TND\n`;
      message += `⏳ Restant: ${totalOutstanding.toFixed(2)} TND\n\n`;

      if (Object.keys(statusCounts).length > 0) {
        message += `📈 *Répartition par Statut*\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        Object.entries(statusCounts).forEach(([status, count]) => {
          const emoji = this.getStatusEmoji(status);
          message += `${emoji} ${status}: ${count}\n`;
        });
      }

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💰 Voir les factures', 'invoice_list')],
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Sales report error:', error);
      await ctx.reply('❌ Erreur lors de la génération du rapport.');
    }
  }

  /**
   * Rapport des clients
   */
  async showCustomersReport(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Génération du rapport clients...');

      const customers = await erpnext.listCustomers({}, 100);

      if (!customers || customers.length === 0) {
        await ctx.reply(
          '📭 Aucun client trouvé.',
          Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ])
        );
        return;
      }

      // Analyser les données
      const groupCounts = {};
      const territoryCounts = {};
      const typeCounts = {};

      customers.forEach(customer => {
        groupCounts[customer.customer_group] = (groupCounts[customer.customer_group] || 0) + 1;
        territoryCounts[customer.territory] = (territoryCounts[customer.territory] || 0) + 1;
        typeCounts[customer.customer_type] = (typeCounts[customer.customer_type] || 0) + 1;
      });

      let message = `👥 *Rapport des Clients*\n\n`;
      message += `📊 *Total: ${customers.length} clients*\n\n`;

      message += `🏷️ *Par Groupe*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      Object.entries(groupCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([group, count]) => {
          message += `• ${group}: ${count}\n`;
        });

      message += `\n🌍 *Par Territoire*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      Object.entries(territoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([territory, count]) => {
          message += `• ${territory}: ${count}\n`;
        });

      message += `\n📝 *Par Type*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      Object.entries(typeCounts).forEach(([type, count]) => {
        message += `• ${type}: ${count}\n`;
      });

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('👥 Voir les clients', 'customer_list')],
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Customers report error:', error);
      await ctx.reply('❌ Erreur lors de la génération du rapport.');
    }
  }

  /**
   * Rapport du stock
   */
  async showStockReport(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Génération du rapport de stock...');

      const items = await erpnext.listItems({}, 50);

      if (!items || items.length === 0) {
        await ctx.reply(
          '📭 Aucun article trouvé.',
          Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ])
        );
        return;
      }

      // Analyser les données
      const groupCounts = {};
      let stockItems = 0;
      let nonStockItems = 0;

      items.forEach(item => {
        groupCounts[item.item_group] = (groupCounts[item.item_group] || 0) + 1;
        if (item.is_stock_item) {
          stockItems++;
        } else {
          nonStockItems++;
        }
      });

      let message = `📦 *Rapport de Stock*\n\n`;
      message += `📊 *Statistiques*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `📋 Total articles: ${items.length}\n`;
      message += `📦 Articles en stock: ${stockItems}\n`;
      message += `📝 Articles hors stock: ${nonStockItems}\n\n`;

      message += `🏷️ *Par Groupe*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      Object.entries(groupCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([group, count]) => {
          message += `• ${group}: ${count}\n`;
        });

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Stock report error:', error);
      await ctx.reply('❌ Erreur lors de la génération du rapport.');
    }
  }

  /**
   * Rapport financier
   */
  async showFinancialReport(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Génération du rapport financier...');

      // Récupérer les factures et calculer les métriques
      const invoices = await erpnext.listSalesInvoices({}, 100);

      if (!invoices || invoices.length === 0) {
        await ctx.reply(
          '📭 Aucune donnée financière disponible.',
          Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ])
        );
        return;
      }

      // Calculer les métriques par mois
      const currentMonth = moment().format('YYYY-MM');
      const lastMonth = moment().subtract(1, 'month').format('YYYY-MM');

      let currentMonthTotal = 0;
      let lastMonthTotal = 0;
      let totalPaid = 0;
      let totalUnpaid = 0;

      invoices.forEach(invoice => {
        const invoiceMonth = moment(invoice.posting_date).format('YYYY-MM');
        const amount = invoice.grand_total || 0;

        if (invoiceMonth === currentMonth) {
          currentMonthTotal += amount;
        } else if (invoiceMonth === lastMonth) {
          lastMonthTotal += amount;
        }

        if (invoice.status === 'Paid') {
          totalPaid += amount;
        } else {
          totalUnpaid += invoice.outstanding_amount || 0;
        }
      });

      const growth = lastMonthTotal > 0 
        ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
        : 0;

      let message = `📈 *Rapport Financier*\n\n`;
      message += `💰 *Revenus*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `📅 Mois en cours: ${currentMonthTotal.toFixed(2)} TND\n`;
      message += `📅 Mois dernier: ${lastMonthTotal.toFixed(2)} TND\n`;
      message += `📊 Croissance: ${growth}%\n\n`;

      message += `💵 *Trésorerie*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `✅ Encaissé: ${totalPaid.toFixed(2)} TND\n`;
      message += `⏳ À encaisser: ${totalUnpaid.toFixed(2)} TND\n`;
      message += `💰 Total: ${(totalPaid + totalUnpaid).toFixed(2)} TND\n\n`;

      const paidPercentage = ((totalPaid / (totalPaid + totalUnpaid)) * 100).toFixed(1);
      message += `📊 *Taux de recouvrement*: ${paidPercentage}%`;

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💰 Voir les factures', 'invoice_list')],
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Financial report error:', error);
      await ctx.reply('❌ Erreur lors de la génération du rapport.');
    }
  }

  /**
   * Dashboard global
   */
  async showDashboard(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Génération du dashboard...');

      // Récupérer toutes les données en parallèle
      const [customers, invoices, quotations] = await Promise.all([
        erpnext.listCustomers({}, 100),
        erpnext.listSalesInvoices({}, 100),
        erpnext.listQuotations({}, 100),
      ]);

      // Calculer les métriques
      const totalCustomers = customers?.length || 0;
      const totalInvoices = invoices?.length || 0;
      const totalQuotations = quotations?.length || 0;

      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.grand_total || 0), 0) || 0;
      const totalOutstanding = invoices?.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0) || 0;

      const paidInvoices = invoices?.filter(inv => inv.status === 'Paid').length || 0;
      const unpaidInvoices = invoices?.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue').length || 0;

      const openQuotations = quotations?.filter(q => q.status === 'Open').length || 0;
      const orderedQuotations = quotations?.filter(q => q.status === 'Ordered').length || 0;

      let message = `📊 *Dashboard Global*\n\n`;
      message += `📅 ${moment().format('DD/MM/YYYY HH:mm')}\n\n`;

      message += `👥 *Clients*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `📋 Total: ${totalCustomers}\n\n`;

      message += `💰 *Ventes*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `📋 Factures: ${totalInvoices}\n`;
      message += `✅ Payées: ${paidInvoices}\n`;
      message += `⏳ En attente: ${unpaidInvoices}\n`;
      message += `💰 Revenu total: ${totalRevenue.toFixed(2)} TND\n`;
      message += `⏳ À encaisser: ${totalOutstanding.toFixed(2)} TND\n\n`;

      message += `📄 *Devis*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `📋 Total: ${totalQuotations}\n`;
      message += `📬 Ouverts: ${openQuotations}\n`;
      message += `✅ Convertis: ${orderedQuotations}\n\n`;

      const conversionRate = totalQuotations > 0 
        ? ((orderedQuotations / totalQuotations) * 100).toFixed(1)
        : 0;
      message += `📊 *Taux de conversion*: ${conversionRate}%`;

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('👥 Clients', 'customer_list'),
              Markup.button.callback('💰 Factures', 'invoice_list'),
            ],
            [Markup.button.callback('🔄 Actualiser', 'report_dashboard')],
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Dashboard error:', error);
      await ctx.reply('❌ Erreur lors de la génération du dashboard.');
    }
  }

  /**
   * Rapport POS - Recette du jour
   */
  async showPOSDailyReport(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Génération du rapport POS du jour...');

      const dailyData = await erpnext.getDailyPOSRevenue();

      let message = `🏪 *Recette du Jour (POS)*\n\n`;
      message += `📅 Date: ${moment(dailyData.date).format('DD/MM/YYYY')}\n\n`;

      message += `💰 *Résumé*\n`;
      message += `━━━━━━━━━━━━━━━━━\n`;
      message += `📋 Nombre de ventes: ${dailyData.invoiceCount}\n`;
      message += `💵 Total recettes: ${dailyData.totalRevenue.toFixed(2)} TND\n`;
      message += `✅ Total encaissé: ${dailyData.totalPaid.toFixed(2)} TND\n\n`;

      if (Object.keys(dailyData.byUser).length > 0) {
        message += `👥 *Par Vendeur*\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        Object.entries(dailyData.byUser)
          .sort((a, b) => b[1].total - a[1].total)
          .forEach(([user, data]) => {
            const userName = user.split('@')[0] || user;
            message += `• ${userName}: ${data.total.toFixed(2)} TND (${data.count} ventes)\n`;
          });
      }

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🏆 Meilleurs articles', 'report_pos_bestsellers')],
            [Markup.button.callback('🔄 Actualiser', 'report_pos_daily')],
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('POS daily report error:', error);
      await ctx.reply('❌ Erreur lors de la génération du rapport POS.');
    }
  }

  /**
   * Rapport POS - Meilleurs articles vendus
   */
  async showBestSellersReport(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Recherche des meilleurs articles...');

      const bestItems = await erpnext.getBestSellingItems(null, null, 10);

      if (!bestItems || bestItems.length === 0) {
        await ctx.reply(
          '📭 Aucune vente POS trouvée pour aujourd\'hui.',
          Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ])
        );
        return;
      }

      let message = `🏆 *Meilleurs Articles du Jour*\n\n`;

      bestItems.forEach((item, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} *${item.item_name}*\n`;
        message += `   📦 Qté vendue: ${item.qty}\n`;
        message += `   💰 Montant: ${item.amount.toFixed(2)} TND\n\n`;
      });

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💵 Recette du jour', 'report_pos_daily')],
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Best sellers report error:', error);
      await ctx.reply('❌ Erreur lors de la génération du rapport.');
    }
  }

  /**
   * Rapport POS - État de la caisse
   */
  async showCashierStatusReport(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Vérification de l\'état de la caisse...');

      const cashierData = await erpnext.getPOSCashierStatus();

      let message = `🏦 *État de la Caisse*\n\n`;
      message += `📅 Date: ${moment(cashierData.date).format('DD/MM/YYYY')}\n\n`;

      // Statut global
      if (cashierData.hasOpenSession) {
        message += `✅ *Statut: Caisse ouverte*\n\n`;
      } else {
        message += `🔴 *Statut: Caisse fermée*\n\n`;
      }

      // Ouvertures
      if (cashierData.openings && cashierData.openings.length > 0) {
        message += `📂 *Ouvertures du jour*\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        cashierData.openings.forEach(opening => {
          const userName = opening.user?.split('@')[0] || opening.user;
          const statusEmoji = opening.status === 'Open' ? '🟢' : '🔴';
          message += `${statusEmoji} ${opening.name}\n`;
          message += `   👤 ${userName}\n`;
          message += `   📍 ${opening.pos_profile || 'N/A'}\n\n`;
        });
      } else {
        message += `📂 Aucune ouverture de caisse aujourd'hui\n\n`;
      }

      // Fermetures
      if (cashierData.closings && cashierData.closings.length > 0) {
        message += `📁 *Fermetures du jour*\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        cashierData.closings.forEach(closing => {
          const userName = closing.user?.split('@')[0] || closing.user;
          message += `• ${closing.name}\n`;
          message += `   👤 ${userName}\n`;
          message += `   💰 Total: ${closing.grand_total?.toFixed(2) || 0} TND\n`;
          message += `   📦 Articles: ${closing.total_quantity || 0}\n\n`;
        });
      }

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💵 Recette du jour', 'report_pos_daily')],
            [Markup.button.callback('🔄 Actualiser', 'report_pos_cashier')],
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Cashier status report error:', error);
      await ctx.reply('❌ Erreur lors de la vérification de la caisse.');
    }
  }

  /**
   * Rapport POS - Meilleur vendeur
   */
  async showBestSellerReport(ctx) {
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
      }
      await ctx.reply('⏳ Analyse des performances vendeurs...');

      const salesPersonData = await erpnext.getSalesPersonStats();

      if (!salesPersonData || salesPersonData.length === 0) {
        await ctx.reply(
          '📭 Aucune vente POS trouvée pour aujourd\'hui.',
          Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ])
        );
        return;
      }

      let message = `👑 *Classement des Vendeurs*\n\n`;
      message += `📅 Date: ${moment().format('DD/MM/YYYY')}\n\n`;

      salesPersonData.forEach((person, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const userName = person.user?.split('@')[0] || person.user;
        message += `${medal} *${userName}*\n`;
        message += `   💰 Ventes: ${person.totalSales.toFixed(2)} TND\n`;
        message += `   📋 Transactions: ${person.invoiceCount}\n`;
        const avgSale = person.invoiceCount > 0 ? (person.totalSales / person.invoiceCount).toFixed(2) : 0;
        message += `   📊 Panier moyen: ${avgSale} TND\n\n`;
      });

      await ctx.reply(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('💵 Recette du jour', 'report_pos_daily')],
            [Markup.button.callback('🔄 Actualiser', 'report_pos_bestseller')],
            [Markup.button.callback('↩️ Menu rapports', 'menu_reports')],
          ]),
        }
      );

    } catch (error) {
      logger.error('Best seller report error:', error);
      await ctx.reply('❌ Erreur lors de la génération du classement.');
    }
  }

  /**
   * Obtenir l'emoji du statut
   */
  getStatusEmoji(status) {
    const emojiMap = {
      'Paid': '✅',
      'Unpaid': '⏳',
      'Overdue': '🔴',
      'Cancelled': '🚫',
      'Draft': '📝',
      'Submitted': '📤',
    };
    return emojiMap[status] || '📄';
  }
}

module.exports = new ReportController();
