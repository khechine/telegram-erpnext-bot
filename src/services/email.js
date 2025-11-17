const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.enabled = !!(config.email.user && config.email.password);
    
    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });

      logger.info('Email service initialized');
    } else {
      logger.warn('Email service disabled - EMAIL_USER or EMAIL_PASSWORD not configured');
    }
  }

  /**
   * Vérifier la configuration email
   */
  async verify() {
    if (!this.enabled) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('✅ Email service verified');
      return true;
    } catch (error) {
      logger.error('❌ Email service verification failed:', error.message);
      return false;
    }
  }

  /**
   * Envoyer un email simple
   */
  async sendEmail({ to, subject, text, html, attachments = [] }) {
    if (!this.enabled) {
      throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD.');
    }

    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to,
        subject,
        text,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully:', {
        to,
        subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Envoyer un devis par email
   */
  async sendQuotation(quotation, customerEmail, pdfUrl = null) {
    if (!customerEmail) {
      throw new Error('Customer email is required');
    }

    const subject = `Devis ${quotation.name} - ${config.email.fromName}`;
    
    // Construire le contenu HTML
    const html = this.buildQuotationEmailHtml(quotation);
    
    // Construire le texte brut
    const text = this.buildQuotationEmailText(quotation);

    // Attachements (PDF si disponible)
    const attachments = [];
    if (pdfUrl) {
      attachments.push({
        filename: `${quotation.name}.pdf`,
        path: pdfUrl,
      });
    }

    return await this.sendEmail({
      to: customerEmail,
      subject,
      text,
      html,
      attachments,
    });
  }

  /**
   * Construire le HTML de l'email de devis
   */
  buildQuotationEmailHtml(quotation) {
    const items = quotation.items || [];
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.item_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.rate?.toFixed(2)} TND</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.amount?.toFixed(2)} TND</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${quotation.name}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin: 0 0 10px 0;">📄 Devis ${quotation.name}</h1>
    <p style="color: #7f8c8d; margin: 0;">De la part de ${config.email.fromName}</p>
  </div>

  <div style="background-color: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px;">Informations du devis</h2>
    
    <table style="width: 100%; margin-bottom: 10px;">
      <tr>
        <td style="padding: 5px 0;"><strong>Client:</strong></td>
        <td style="padding: 5px 0;">${quotation.party_name}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Date:</strong></td>
        <td style="padding: 5px 0;">${this.formatDate(quotation.transaction_date)}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Valide jusqu'au:</strong></td>
        <td style="padding: 5px 0;">${this.formatDate(quotation.valid_till)}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Statut:</strong></td>
        <td style="padding: 5px 0;"><span style="background-color: #e8f5e9; color: #2e7d32; padding: 3px 10px; border-radius: 3px; font-size: 12px;">${quotation.status}</span></td>
      </tr>
    </table>
  </div>

  <div style="background-color: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px;">Articles</h2>
    
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Article</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qté</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Prix Unit.</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  </div>

  <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2 style="color: #1565c0; font-size: 20px; margin: 0;">Total</h2>
      <p style="color: #1565c0; font-size: 24px; font-weight: bold; margin: 0;">${quotation.grand_total?.toFixed(2)} TND</p>
    </div>
  </div>

  ${quotation.terms ? `
  <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
    <h3 style="color: #856404; font-size: 14px; margin: 0 0 10px 0;">📋 Conditions</h3>
    <p style="color: #856404; font-size: 13px; margin: 0; white-space: pre-wrap;">${quotation.terms}</p>
  </div>
  ` : ''}

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
    <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
      Ce devis a été généré automatiquement par ${config.email.fromName}<br>
      Pour toute question, veuillez nous contacter.
    </p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Construire le texte brut de l'email de devis
   */
  buildQuotationEmailText(quotation) {
    const items = quotation.items || [];
    const itemsText = items.map(item => 
      `  - ${item.item_name} x${item.qty} à ${item.rate?.toFixed(2)} TND = ${item.amount?.toFixed(2)} TND`
    ).join('\n');

    return `
DEVIS ${quotation.name}
${config.email.fromName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMATIONS
Client: ${quotation.party_name}
Date: ${this.formatDate(quotation.transaction_date)}
Valide jusqu'au: ${this.formatDate(quotation.valid_till)}
Statut: ${quotation.status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLES
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL: ${quotation.grand_total?.toFixed(2)} TND

${quotation.terms ? `\nCONDITIONS:\n${quotation.terms}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ce devis a été généré automatiquement.
Pour toute question, veuillez nous contacter.
    `.trim();
  }

  /**
   * Formater une date
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}

module.exports = new EmailService();
