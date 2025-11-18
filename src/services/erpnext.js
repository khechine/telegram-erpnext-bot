const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class ERPNextClient {
  constructor() {
    this.baseURL = config.erpnext.url;
    this.apiKey = config.erpnext.apiKey;
    this.apiSecret = config.erpnext.apiSecret;

    this.client = axios.create({
      baseURL: `${this.baseURL}/api`,
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Intercepteur pour logger les requêtes
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`ERPNext Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('ERPNext Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour logger les réponses
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`ERPNext Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('ERPNext Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  // ==================== CUSTOMERS ====================

  /**
   * Créer un nouveau client
   */
  async createCustomer(data) {
    try {
      const response = await this.client.post('/resource/Customer', {
        customer_name: data.name,
        customer_type: data.type || 'Individual',
        customer_group: data.group || 'Individual',
        territory: data.territory || 'All Territories',
        email_id: data.email,
        mobile_no: data.phone,
        primary_address: data.address,
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir un client par nom
   */
  async getCustomer(customerName) {
    try {
      const response = await this.client.get(`/resource/Customer/${customerName}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Lister les clients avec filtres
   */
  async listCustomers(filters = {}, limit = 20, offset = 0) {
    try {
      const params = {
        fields: JSON.stringify([
          'name',
          'customer_name',
          'customer_type',
          'customer_group',
          'territory',
          'email_id',
          'mobile_no',
        ]),
        limit_start: offset,
        limit_page_length: limit,
      };

      if (filters.search) {
        params.filters = JSON.stringify([
          ['customer_name', 'like', `%${filters.search}%`],
        ]);
      }

      const response = await this.client.get('/resource/Customer', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mettre à jour un client
   */
  async updateCustomer(customerName, data) {
    try {
      const response = await this.client.put(`/resource/Customer/${customerName}`, data);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer un client
   */
  async deleteCustomer(customerName) {
    try {
      await this.client.delete(`/resource/Customer/${customerName}`);
      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== QUOTATIONS ====================

  /**
   * Créer un devis
   */
  async createQuotation(data) {
    try {
      const response = await this.client.post('/resource/Quotation', {
        party_name: data.customer,
        quotation_to: 'Customer',
        items: data.items.map(item => ({
          item_code: item.code,
          qty: item.qty,
          rate: item.rate,
          description: item.description,
        })),
        valid_till: data.validTill,
        terms: data.terms || '',
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir un devis
   */
  async getQuotation(quotationName) {
    try {
      const response = await this.client.get(`/resource/Quotation/${quotationName}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Lister les devis
   */
  async listQuotations(filters = {}, limit = 20) {
    try {
      const params = {
        fields: JSON.stringify([
          'name',
          'party_name',
          'transaction_date',
          'valid_till',
          'grand_total',
          'status',
        ]),
        limit_page_length: limit,
      };

      if (filters.customer) {
        params.filters = JSON.stringify([
          ['party_name', '=', filters.customer],
        ]);
      }

      const response = await this.client.get('/resource/Quotation', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Soumettre un devis (changer le statut de Draft à Submitted)
   */
  async submitQuotation(quotationName) {
    try {
      const response = await this.client.post(`/resource/Quotation/${quotationName}/submit`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir le PDF d'un devis
   */
  async getQuotationPDF(quotationName) {
    try {
      const response = await this.client.get(
        `/method/frappe.utils.print_format.download_pdf`,
        {
          params: {
            doctype: 'Quotation',
            name: quotationName,
            format: 'Standard',
            no_letterhead: 0,
          },
          responseType: 'arraybuffer',
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir l'URL du PDF d'un devis
   */
  getQuotationPDFUrl(quotationName) {
    return `${this.baseURL}/api/method/frappe.utils.print_format.download_pdf?doctype=Quotation&name=${quotationName}&format=Standard&no_letterhead=0`;
  }

  // ==================== SALES INVOICES ====================

  /**
   * Créer une facture de vente
   */
  async createSalesInvoice(data) {
    try {
      const response = await this.client.post('/resource/Sales Invoice', {
        customer: data.customer,
        items: data.items.map(item => ({
          item_code: item.code,
          qty: item.qty,
          rate: item.rate,
          description: item.description,
        })),
        due_date: data.dueDate,
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir une facture de vente
   */
  async getSalesInvoice(invoiceName) {
    try {
      const response = await this.client.get(`/resource/Sales Invoice/${invoiceName}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Lister les factures de vente
   */
  async listSalesInvoices(filters = {}, limit = 20) {
    try {
      const params = {
        fields: JSON.stringify([
          'name',
          'customer',
          'posting_date',
          'due_date',
          'grand_total',
          'outstanding_amount',
          'status',
        ]),
        limit_page_length: limit,
        order_by: 'posting_date desc',
      };

      if (filters.customer) {
        params.filters = JSON.stringify([
          ['customer', '=', filters.customer],
        ]);
      }

      if (filters.status) {
        params.filters = JSON.stringify([
          ['status', '=', filters.status],
        ]);
      }

      const response = await this.client.get('/resource/Sales Invoice', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== ITEMS (STOCK) ====================

  /**
   * Obtenir un article
   */
  async getItem(itemCode) {
    try {
      const response = await this.client.get(`/resource/Item/${itemCode}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Lister les articles
   */
  async listItems(filters = {}, limit = 50) {
    try {
      const params = {
        fields: JSON.stringify([
          'name',
          'item_code',
          'item_name',
          'item_group',
          'stock_uom',
          'standard_rate',
          'is_stock_item',
        ]),
        limit_page_length: limit,
      };

      if (filters.search) {
        params.filters = JSON.stringify([
          ['item_name', 'like', `%${filters.search}%`],
        ]);
      }

      const response = await this.client.get('/resource/Item', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les niveaux de stock
   */
  async getStockLevels(itemCode, warehouse = null) {
    try {
      const params = {
        item_code: itemCode,
      };

      if (warehouse) {
        params.warehouse = warehouse;
      }

      const response = await this.client.get('/method/erpnext.stock.utils.get_stock_balance', {
        params,
      });
      return response.data.message;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== POS ====================

  /**
   * Lister les factures POS
   */
  async listPOSInvoices(filters = {}, limit = 50) {
    try {
      const params = {
        fields: JSON.stringify([
          'name',
          'customer',
          'posting_date',
          'posting_time',
          'grand_total',
          'paid_amount',
          'status',
          'pos_profile',
          'owner',
        ]),
        filters: JSON.stringify([
          ['is_pos', '=', 1],
          ...(filters.date ? [['posting_date', '=', filters.date]] : []),
          ...(filters.status ? [['status', '=', filters.status]] : []),
        ]),
        limit_page_length: limit,
        order_by: 'posting_date desc, posting_time desc',
      };

      const response = await this.client.get('/resource/Sales Invoice', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les recettes du jour (POS)
   */
  async getDailyPOSRevenue(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const invoices = await this.listPOSInvoices({ date: targetDate }, 100);

      let totalRevenue = 0;
      let totalPaid = 0;
      let invoiceCount = 0;
      const byUser = {};
      const byPaymentMethod = {};

      invoices.forEach(invoice => {
        totalRevenue += invoice.grand_total || 0;
        totalPaid += invoice.paid_amount || 0;
        invoiceCount++;

        // Par utilisateur
        const user = invoice.owner || 'Unknown';
        if (!byUser[user]) {
          byUser[user] = { count: 0, total: 0 };
        }
        byUser[user].count++;
        byUser[user].total += invoice.grand_total || 0;
      });

      return {
        date: targetDate,
        totalRevenue,
        totalPaid,
        invoiceCount,
        byUser,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les meilleurs articles vendus
   */
  async getBestSellingItems(fromDate = null, toDate = null, limit = 10) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = fromDate || today;
      const endDate = toDate || today;

      // Récupérer les factures POS de la période
      const params = {
        fields: JSON.stringify([
          'name',
        ]),
        filters: JSON.stringify([
          ['is_pos', '=', 1],
          ['posting_date', '>=', startDate],
          ['posting_date', '<=', endDate],
          ['status', '!=', 'Cancelled'],
        ]),
        limit_page_length: 100,
      };

      const invoicesResponse = await this.client.get('/resource/Sales Invoice', { params });
      const invoices = invoicesResponse.data.data || [];

      // Récupérer les items de chaque facture
      const itemSales = {};

      for (const invoice of invoices) {
        try {
          const invoiceDetail = await this.getSalesInvoice(invoice.name);
          if (invoiceDetail.items) {
            invoiceDetail.items.forEach(item => {
              const key = item.item_code;
              if (!itemSales[key]) {
                itemSales[key] = {
                  item_code: item.item_code,
                  item_name: item.item_name,
                  qty: 0,
                  amount: 0,
                };
              }
              itemSales[key].qty += item.qty || 0;
              itemSales[key].amount += item.amount || 0;
            });
          }
        } catch {
          // Ignorer les erreurs individuelles
        }
      }

      // Trier par quantité vendue
      const sortedItems = Object.values(itemSales)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limit);

      return sortedItems;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir l'état de la caisse (POS Opening/Closing)
   */
  async getPOSCashierStatus(posProfile = null) {
    try {
      // Récupérer les ouvertures de caisse du jour
      const today = new Date().toISOString().split('T')[0];

      const openingParams = {
        fields: JSON.stringify([
          'name',
          'pos_profile',
          'user',
          'posting_date',
          'balance_details',
          'status',
        ]),
        filters: JSON.stringify([
          ['posting_date', '=', today],
          ...(posProfile ? [['pos_profile', '=', posProfile]] : []),
        ]),
        limit_page_length: 10,
        order_by: 'creation desc',
      };

      const openingResponse = await this.client.get('/resource/POS Opening Entry', { params: openingParams });
      const openings = openingResponse.data.data || [];

      // Récupérer les fermetures de caisse du jour
      const closingParams = {
        fields: JSON.stringify([
          'name',
          'pos_profile',
          'user',
          'posting_date',
          'grand_total',
          'net_total',
          'total_quantity',
        ]),
        filters: JSON.stringify([
          ['posting_date', '=', today],
          ...(posProfile ? [['pos_profile', '=', posProfile]] : []),
        ]),
        limit_page_length: 10,
        order_by: 'creation desc',
      };

      const closingResponse = await this.client.get('/resource/POS Closing Entry', { params: closingParams });
      const closings = closingResponse.data.data || [];

      return {
        date: today,
        openings,
        closings,
        hasOpenSession: openings.some(o => o.status === 'Open'),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les statistiques des vendeurs
   */
  async getSalesPersonStats(fromDate = null, toDate = null) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = fromDate || today;
      const endDate = toDate || today;

      const params = {
        fields: JSON.stringify([
          'name',
          'owner',
          'grand_total',
          'posting_date',
        ]),
        filters: JSON.stringify([
          ['is_pos', '=', 1],
          ['posting_date', '>=', startDate],
          ['posting_date', '<=', endDate],
          ['status', '!=', 'Cancelled'],
        ]),
        limit_page_length: 500,
      };

      const response = await this.client.get('/resource/Sales Invoice', { params });
      const invoices = response.data.data || [];

      const salesByPerson = {};

      invoices.forEach(invoice => {
        const person = invoice.owner || 'Unknown';
        if (!salesByPerson[person]) {
          salesByPerson[person] = {
            user: person,
            totalSales: 0,
            invoiceCount: 0,
          };
        }
        salesByPerson[person].totalSales += invoice.grand_total || 0;
        salesByPerson[person].invoiceCount++;
      });

      // Trier par total des ventes
      const sorted = Object.values(salesByPerson)
        .sort((a, b) => b.totalSales - a.totalSales);

      return sorted;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== REPORTS ====================

  /**
   * Obtenir un rapport personnalisé
   */
  async getReport(reportName, filters = {}) {
    try {
      const response = await this.client.get(`/method/frappe.desk.query_report.run`, {
        params: {
          report_name: reportName,
          filters: JSON.stringify(filters),
        },
      });
      return response.data.message;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Rapport des ventes
   */
  async getSalesReport(fromDate, toDate) {
    try {
      return await this.getReport('Sales Analytics', {
        from_date: fromDate,
        to_date: toDate,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Dashboard financier
   */
  async getFinancialDashboard() {
    try {
      const response = await this.client.get('/method/erpnext.accounts.dashboard.get_dashboard_data');
      return response.data.message;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== HELPERS ====================

  /**
   * Gérer les erreurs
   */
  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.exc || error.message;
      return new Error(`ERPNext Error: ${message}`);
    }
    return error;
  }

  /**
   * Tester la connexion
   */
  async testConnection() {
    try {
      await this.client.get('/method/frappe.auth.get_logged_user');
      logger.info('✅ ERPNext connection successful');
      return true;
    } catch (error) {
      logger.error('❌ ERPNext connection failed:', error.message);
      return false;
    }
  }
}

module.exports = new ERPNextClient();
