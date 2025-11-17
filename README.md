# 🤖 Bot Telegram ERPNext avec Rasa NLU

Bot Telegram intelligent intégré avec Rasa et ERPNext pour la gestion complète des clients, devis, factures et rapports.

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Utilisation](#-utilisation)
- [Développement](#-développement)
- [Tests](#-tests)
- [Déploiement](#-déploiement)

## ✨ Fonctionnalités

### 🤖 Intelligence Artificielle
- **Rasa NLU** : Traitement du langage naturel en français
- **15+ intentions** : Reconnaissance automatique des demandes
- **Extraction d'entités** : Nom, email, téléphone, montants, dates
- **Fallback intelligent** : Mode dégradé sans Rasa

### 🏢 Intégration ERPNext Complète
- **Gestion clients** : Création, consultation, recherche, mise à jour
- **Devis** : Création complète interactive + envoi par email
- **Factures** : Gestion complète des sales invoices
- **Stock** : Consultation du catalogue et des niveaux de stock
- **Articles** : Recherche et consultation

### 📊 Rapports Avancés
- **Rapport des ventes** : Statistiques et métriques de vente
- **Rapport clients** : Répartition par groupe, territoire, type
- **Rapport stock** : État des stocks par catégorie
- **Rapport financier** : Trésorerie, revenus, croissance
- **Dashboard global** : Vue d'ensemble en temps réel

### 💬 Interface Telegram
- **Menus interactifs** : Navigation par boutons inline
- **Messages formatés** : Markdown avec emojis
- **Gestion d'état** : Conversations contextuelles
- **Validation automatique** : Emails, numéros, formats
- **Pagination** : Gestion des listes longues

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Utilisateur Telegram            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Bot Telegram (Telegraf.js)           │
│  • Gestion des commandes                │
│  • Callbacks & Boutons                  │
│  • Sessions utilisateur                 │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│  Rasa NLU    │  │  Controllers │
│  • Intents   │  │  • Customers │
│  • Entities  │  │  • Invoices  │
│  • Fallback  │  │  • Reports   │
└──────────────┘  └──────┬───────┘
                         │
                         ▼
                 ┌──────────────┐
                 │  ERPNext API │
                 │  • Customers │
                 │  • Invoices  │
                 │  • Stock     │
                 └──────────────┘
```

## 📦 Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Rasa** >= 3.0 (optionnel, le bot fonctionne sans)
- **ERPNext** v14 ou v15
- **Token Telegram Bot** (obtenu via @BotFather)

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/telegram-erpnext-bot.git
cd telegram-erpnext-bot
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration

Copier le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Éditer `.env` et configurer vos paramètres :

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# ERPNext
ERPNEXT_URL=https://your-erpnext.com
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret

# Rasa (optionnel)
RASA_URL=http://localhost:5005
ENABLE_RASA=false
```

### 4. Installation de Rasa (optionnel)

Si vous voulez utiliser l'IA Rasa :

```bash
# Installer Rasa
pip install rasa

# Se placer dans le dossier rasa
cd rasa

# Entraîner le modèle
rasa train

# Lancer le serveur Rasa
rasa run --enable-api --cors "*" --port 5005
```

Dans `.env`, activer Rasa :
```env
ENABLE_RASA=true
```

## ▶️ Utilisation

### Démarrer le bot

Mode développement (avec rechargement auto) :
```bash
npm run dev
```

Mode production :
```bash
npm start
```

### Commandes Telegram disponibles

- `/start` : Initialiser le bot et afficher le menu principal
- `/help` : Afficher l'aide et les exemples
- `/menu` : Retour au menu principal
- `/customers` : Accès rapide à la gestion clients
- `/reports` : Accès rapide aux rapports

### Exemples de requêtes en langage naturel

**Clients :**
```
"Créer un client Dupont avec email dupont@example.com"
"Liste des clients"
"Chercher Martin"
```

**Devis :**
```
"Créer un devis"
"Liste des devis"
"Envoyer le devis QUO-2024-001"
```

**Factures :**
```
"Rapport des ventes"
"Liste des factures payées"
"Factures en attente"
```

**Rapports :**
```
"Dashboard"
"Rapport financier"
"Niveau de stock"
```

## 🛠️ Développement

### Structure du projet

```
telegram-erpnext-bot/
├── src/
│   ├── bot/                 # Bot Telegram principal
│   │   └── index.js
│   ├── controllers/         # Contrôleurs par fonctionnalité
│   │   ├── customerController.js
│   │   ├── quotationController.js
│   │   ├── invoiceController.js
│   │   └── reportController.js
│   ├── services/            # Services externes
│   │   ├── erpnext.js
│   │   └── rasa.js
│   ├── config/              # Configuration
│   │   └── index.js
│   ├── utils/               # Utilitaires
│   │   └── logger.js
│   └── index.js             # Point d'entrée
├── rasa/                    # Configuration Rasa
│   ├── domain.yml
│   ├── nlu.yml
│   ├── config.yml
│   ├── rules.yml
│   └── stories.yml
├── tests/                   # Tests
├── logs/                    # Logs de l'application
├── package.json
├── .env.example
└── README.md
```

### Ajouter une nouvelle fonctionnalité

1. **Ajouter l'intention dans Rasa** (`rasa/nlu.yml`)
2. **Créer/modifier le contrôleur** (`src/controllers/`)
3. **Ajouter la route dans le bot** (`src/bot/index.js`)
4. **Réentraîner Rasa** : `cd rasa && rasa train`

### Logger

Le système de logging utilise Winston avec 3 niveaux :
- `error` : Erreurs critiques
- `warn` : Avertissements
- `info` : Informations générales
- `debug` : Debug détaillé

Logs disponibles dans :
- `logs/error.log` : Erreurs uniquement
- `logs/combined.log` : Tous les logs

### Variables d'environnement

Voir `.env.example` pour la liste complète des variables configurables.

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Avec couverture de code
npm test -- --coverage

# Tests en mode watch
npm test -- --watch
```

## 🚀 Déploiement

### Déploiement sur VPS (Ubuntu/Debian)

1. **Installer Node.js et PM2**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

2. **Cloner et configurer**

```bash
git clone <your-repo>
cd telegram-erpnext-bot
npm install --production
cp .env.example .env
nano .env  # Configurer les variables
```

3. **Démarrer avec PM2**

```bash
pm2 start src/index.js --name telegram-bot
pm2 save
pm2 startup
```

4. **Optionnel : Installer Rasa**

```bash
pip install rasa
cd rasa
rasa train
pm2 start "rasa run --enable-api --cors '*' --port 5005" --name rasa-server
```

### Mode Webhook (pour la production)

Dans `.env` :
```env
ENABLE_WEBHOOK=true
TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com
TELEGRAM_WEBHOOK_PORT=3000
```

Configurez votre reverse proxy (Nginx) :

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 Licence

MIT License

## 🤝 Support

Pour toute question ou problème :
- Vérifier les logs : `logs/combined.log`
- Tester la connexion ERPNext
- Vérifier que Rasa est en ligne (si activé)
- Consulter la documentation ERPNext

## 👨‍💻 Auteur

**Mehdi**

---

**Développé avec ❤️ pour simplifier la gestion ERPNext via Telegram**
