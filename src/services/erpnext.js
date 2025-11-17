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
