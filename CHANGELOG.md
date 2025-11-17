# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.1.0] - 2024-11-17

### ✨ Ajouté

#### 📄 Création de Devis Complète
- Création interactive de devis via conversation
- Ajout multi-articles avec quantités
- Date de validité configurable
- Conditions personnalisables
- Validation client et articles en temps réel
- Soumission automatique du devis
- Calcul automatique des totaux

#### 📧 Envoi de Devis par Email
- Service email complet avec nodemailer
- Template HTML professionnel pour les devis
- Template texte brut (fallback)
- Support Gmail et autres SMTP
- Envoi avec logo et branding
- Vérification automatique de l'email client
- Logs détaillés des envois

#### 🎨 Interface Améliorée
- Bouton d'envoi rapide sur chaque devis
- Vue détaillée des devis
- Workflows guidés pour création
- Gestion d'erreurs contextuelle
- Messages de confirmation enrichis

#### 🔧 Configuration
- Variables d'environnement email (7 nouvelles)
- Validation configuration email
- Test connexion SMTP au démarrage

#### 📚 Documentation
- Guide complet création/envoi devis (QUOTATIONS-GUIDE.md)
- Exemples d'utilisation
- Troubleshooting
- Configuration Gmail détaillée

### 🔄 Modifié

#### Services
- Service ERPNext : méthodes devis étendues
- Service Rasa : détection intention send_quotation
- Bot : nouveaux callbacks et états

#### Contrôleurs
- QuotationController complètement réécrit
- Gestion d'état pour conversations multi-étapes
- Validation en temps réel

#### Rasa
- Nouvelle intention : send_quotation
- Nouvelle entité : quotation_name
- 12+ exemples d'entraînement ajoutés

## [1.0.0] - 2024-11-17

### ✨ Ajouté

#### 🤖 Intelligence Artificielle
- Intégration complète Rasa NLU
- 15+ intentions reconnues (clients, factures, devis, stock, rapports)
- Extraction automatique d'entités (nom, email, téléphone, montants)
- Mode fallback intelligent sans Rasa
- Pipeline ML optimisé pour le français

#### 🏢 Intégration ERPNext
- Client ERPNext complet avec toutes les méthodes API
- Gestion clients : CRUD complet
- Gestion devis : Consultation et suivi
- Gestion factures : Liste, filtres, détails
- Gestion stock : Consultation catalogue et niveaux
- Gestion d'erreurs robuste
- Intercepteurs pour logging

#### 📊 Rapports
- Rapport des ventes (statistiques, montants, statuts)
- Rapport clients (répartition par groupe, territoire, type)
- Rapport stock (articles par catégorie)
- Rapport financier (trésorerie, croissance)
- Dashboard global (vue d'ensemble temps réel)

#### 💬 Interface Telegram
- Menu principal interactif
- Menus contextuels (clients, factures, devis, rapports)
- Boutons inline pour navigation
- Messages formatés en Markdown avec emojis
- Gestion d'état pour conversations multi-étapes
- Validation automatique (emails, formats)
- Pagination pour listes longues
- Gestion d'erreurs contextuelles

#### 🛠️ Architecture
- Structure modulaire professionnelle
- Séparation services/contrôleurs/bot
- Configuration centralisée avec validation
- Système de logging avec Winston
- Support polling et webhook
- Gestion de sessions utilisateur
- Middleware personnalisables

#### 📚 Documentation
- README complet avec architecture
- Guide de démarrage rapide (QUICKSTART.md)
- Documentation Rasa détaillée
- Exemples d'utilisation
- Guide de déploiement
- Configuration PM2

#### 🧪 Tests & Qualité
- Tests unitaires Jest
- Script de vérification de configuration
- ESLint configuration
- Gestion des erreurs
- Logs structurés

#### 🚀 Déploiement
- Configuration PM2
- Support Docker (à venir)
- Guide déploiement VPS
- Configuration Nginx
- Variables d'environnement sécurisées

### 🔒 Sécurité
- Validation des entrées utilisateur
- Gestion sécurisée des credentials
- Rate limiting (préparé)
- Error handling robuste

### 📝 Configuration
- 20+ variables d'environnement
- Mode développement/production
- Feature flags
- Configuration Rasa complète
- Pipeline ML optimisé

---

## Roadmap Future

### v1.1.0 (À venir)
- [ ] Création de devis via le bot
- [ ] Création de factures via le bot
- [ ] Support multilingue (EN, AR)
- [ ] Webhooks pour notifications
- [ ] Support Redis pour sessions
- [ ] Rate limiting actif

### v1.2.0 (Planifié)
- [ ] Support Docker
- [ ] API REST pour extensions
- [ ] Dashboard web admin
- [ ] Statistiques d'utilisation
- [ ] Support des pièces jointes
- [ ] Rapports personnalisés

### v2.0.0 (Vision)
- [ ] Support multi-tenant
- [ ] Intégration autres ERP
- [ ] Notifications proactives
- [ ] Analytics avancés
- [ ] Mobile app
- [ ] Chatbot vocal

---

## Contributeurs

- **Mehdi** - Développement initial

## Licence

MIT License - Voir LICENSE pour plus de détails
