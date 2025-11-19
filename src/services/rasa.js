const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class RasaService {
  constructor() {
    this.baseURL = config.rasa.url;
    this.token = config.rasa.token;
    this.enabled = config.features.rasa;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      timeout: 10000,
    });
  }

  /**
   * Analyser un message avec Rasa NLU
   */
  async parseMessage(text, sender = 'default') {
    if (!this.enabled) {
      logger.debug('Rasa is disabled, skipping NLU');
      return this.createFallbackIntent(text);
    }

    try {
      const response = await this.client.post('/model/parse', {
        text,
        message_id: `${sender}_${Date.now()}`,
      });

      logger.debug('Rasa NLU Response:', {
        intent: response.data.intent?.name,
        confidence: response.data.intent?.confidence,
        entities: response.data.entities?.length,
      });

      return this.formatRasaResponse(response.data);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      logger.error('Rasa parse error:', errorMsg);
      // Fallback to regex-based intent detection
      return {
        text,
        intent: {
          name: this.determineIntentFromText(text),
          confidence: 0.5,
        },
        entities: this.extractEntitiesFromText(text),
        intents: [],
      };
    }
  }

  /**
   * Formater la réponse Rasa
   */
  formatRasaResponse(data) {
    return {
      text: data.text,
      intent: {
        name: data.intent?.name || 'unknown',
        confidence: data.intent?.confidence || 0,
      },
      entities: this.extractEntities(data.entities || []),
      intents: data.intent_ranking || [],
    };
  }

  /**
   * Extraire les entités
   */
  extractEntities(entities) {
    const extracted = {};
    
    entities.forEach(entity => {
      const key = entity.entity;
      const value = entity.value;
      
      if (!extracted[key]) {
        extracted[key] = [];
      }
      
      extracted[key].push({
        value,
        confidence: entity.confidence_entity || entity.confidence || 1,
        start: entity.start,
        end: entity.end,
      });
    });

    return extracted;
  }

  /**
   * Créer une intention de secours
   */
  createFallbackIntent(text) {
    return {
      text,
      intent: {
        name: 'unknown',
        confidence: 0,
      },
      entities: {},
      intents: [],
    };
  }

  /**
   * Déterminer l'intention à partir du texte (sans Rasa)
   */
  determineIntentFromText(text) {
    const lowerText = text.toLowerCase();

    // Commandes simples
    if (lowerText.match(/^\/(start|help|menu)/)) {
      return lowerText.slice(1);
    }

    // Salutations
    if (lowerText.match(/bonjour|salut|hello|aslema|marhba|labess|salam|ahla/)) {
      return 'greet';
    }

    // Au revoir
    if (lowerText.match(/bye|revoir|bslema|beslama/)) {
      return 'goodbye';
    }

    // Intentions de navigation
    if (lowerText.match(/menu|accueil|retour|rja3|arja3/)) {
      return 'menu';
    }

    // Aide
    if (lowerText.match(/aide|help|3awenni|kifech/)) {
      return 'help';
    }

    // POS - Recette du jour
    if (lowerText.match(/recette.*jour|ventes.*jour|chiffre.*jour|qadech.*lyoum|ch7al.*lyoum|b3na.*lyoum|jbedna/)) {
      return 'pos_daily';
    }

    // POS - Meilleur vendeur
    if (lowerText.match(/meilleur.*vendeur|top.*vendeur|classement.*vendeur|chkoun.*ba3|performance.*vendeur/)) {
      return 'pos_bestseller';
    }

    // POS - Meilleurs articles
    if (lowerText.match(/meilleur.*article|best.*seller|top.*vente|top.*produit|yemchi.*behi|temchew/)) {
      return 'pos_bestsellers';
    }

    // POS - Caisse
    if (lowerText.match(/caisse|7alat.*caisse|caisse.*ouvert|caisse.*ferm|fta7.*caisse/)) {
      return 'pos_cashier';
    }

    // POS Menu
    if (lowerText.match(/\bpos\b|point.*vente/)) {
      return 'pos_menu';
    }

    // Clients
    if (lowerText.match(/client|customer|zaboun|zabyen/)) {
      if (lowerText.match(/créer|ajouter|nouveau|zid|jdid/)) return 'create_customer';
      if (lowerText.match(/liste|voir|afficher|warini|chkoun/)) return 'list_customers';
      if (lowerText.match(/chercher|recherch|trouver|lawej|9aleb/)) return 'search_customer';
      return 'list_customers';
    }

    // Devis
    if (lowerText.match(/devis|quotation|offre.*prix|proforma/)) {
      if (lowerText.match(/créer|nouveau|zid|jdid|na3mel|5ali/)) return 'create_quotation';
      if (lowerText.match(/liste|voir|warini/)) return 'list_quotations';
      if (lowerText.match(/envoyer|email|mail|transmettre|ab3ath/)) return 'send_quotation';
      return 'list_quotations';
    }

    // Factures
    if (lowerText.match(/facture|invoice/)) {
      if (lowerText.match(/créer|nouveau|zid|jdid/)) return 'create_invoice';
      if (lowerText.match(/liste|voir|warini/)) return 'list_invoices';
      return 'list_invoices';
    }

    // Stock
    if (lowerText.match(/stock|article|produit|item|makhzen|mar9a/)) {
      if (lowerText.match(/niveau|état|check|qadech|ch7al|baki/)) return 'check_stock';
      return 'list_items';
    }

    // Rapports
    if (lowerText.match(/rapport|report|statistique|dashboard|stats/)) {
      if (lowerText.match(/vente|sales/)) return 'sales_report';
      if (lowerText.match(/financier|finance|flous/)) return 'financial_report';
      if (lowerText.match(/stock/)) return 'stock_report';
      return 'reports_menu';
    }

    // Dashboard
    if (lowerText.match(/dashboard|tableau.*bord|résumé|kolchi/)) {
      return 'dashboard';
    }

    return 'unknown';
  }

  /**
   * Extraire les entités du texte (sans Rasa)
   */
  extractEntitiesFromText(text) {
    const entities = {};

    // Email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      entities.email = [{ value: emailMatch[0], confidence: 1.0 }];
    }

    // Téléphone
    const phoneMatch = text.match(/\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
    if (phoneMatch) {
      entities.phone = [{ value: phoneMatch[0], confidence: 1.0 }];
    }

    // Nom (simple heuristique)
    const nameMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
    if (nameMatch && !emailMatch) {
      entities.name = [{ value: nameMatch[0], confidence: 0.8 }];
    }

    // Montant
    const amountMatch = text.match(/\b(\d+(?:[.,]\d{2})?)\s*(TND|EUR|USD|DT)?\b/i);
    if (amountMatch) {
      entities.amount = [{ value: parseFloat(amountMatch[1].replace(',', '.')), confidence: 1.0 }];
      if (amountMatch[2]) {
        entities.currency = [{ value: amountMatch[2].toUpperCase(), confidence: 1.0 }];
      }
    }

    return entities;
  }

  /**
   * Analyser un message (avec fallback)
   */
  async analyze(text, sender = 'default') {
    if (this.enabled) {
      return await this.parseMessage(text, sender);
    } else {
      // Fallback sans Rasa
      return {
        text,
        intent: {
          name: this.determineIntentFromText(text),
          confidence: 0.6,
        },
        entities: this.extractEntitiesFromText(text),
        intents: [],
      };
    }
  }

  /**
   * Tester la connexion Rasa
   */
  async testConnection() {
    if (!this.enabled) {
      logger.info('⚠️  Rasa is disabled');
      return false;
    }

    try {
      const response = await this.client.get('/status');
      logger.info('✅ Rasa connection successful:', response.data);
      return true;
    } catch (error) {
      logger.error('❌ Rasa connection failed:', error.message);
      return false;
    }
  }
}

module.exports = new RasaService();
