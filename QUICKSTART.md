# 🚀 Guide de Démarrage Rapide

Ce guide vous permet de démarrer le bot en 5 minutes !

## Étape 1 : Installation

```bash
# Installer les dépendances
npm install
```

## Étape 2 : Configuration

```bash
# Copier le fichier de configuration
cp .env.example .env
```

Éditer `.env` avec vos credentials :

```env
# 1. Obtenir le token depuis @BotFather sur Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# 2. Configurer ERPNext
ERPNEXT_URL=https://votre-erpnext.com
ERPNEXT_API_KEY=votre_api_key
ERPNEXT_API_SECRET=votre_api_secret

# 3. Désactiver Rasa pour commencer (optionnel)
ENABLE_RASA=false
```

### Comment obtenir les credentials ERPNext ?

1. Connectez-vous à ERPNext
2. Allez dans : **Paramètres > Utilisateur > Clés API**
3. Cliquez sur **Générer des clés**
4. Copiez l'API Key et API Secret

### Comment créer un bot Telegram ?

1. Ouvrez Telegram et cherchez **@BotFather**
2. Envoyez `/newbot`
3. Suivez les instructions
4. Copiez le token fourni

## Étape 3 : Démarrer le bot

```bash
# Mode développement
npm run dev

# OU mode production
npm start
```

## Étape 4 : Tester

Ouvrez Telegram, cherchez votre bot et envoyez :
```
/start
```

Vous devriez voir le menu principal apparaître ! 🎉

## Mode Avancé : Avec Rasa NLU

Si vous voulez utiliser l'IA pour comprendre le langage naturel :

### 1. Installer Rasa

```bash
# Installer Python 3.8+ et pip
pip install rasa
```

### 2. Entraîner le modèle

```bash
cd rasa
rasa train
```

### 3. Lancer Rasa

```bash
rasa run --enable-api --cors "*" --port 5005
```

### 4. Activer Rasa dans le bot

Dans `.env` :
```env
ENABLE_RASA=true
RASA_URL=http://localhost:5005
```

### 5. Redémarrer le bot

```bash
npm restart
```

Maintenant vous pouvez utiliser le langage naturel :
```
"Créer un client Dupont avec email dupont@example.com"
"Liste des clients"
"Rapport des ventes"
```

## Résolution des problèmes

### Le bot ne démarre pas

1. Vérifier que le token Telegram est correct
2. Vérifier les logs : `logs/combined.log`

### Erreur ERPNext

1. Vérifier l'URL ERPNext (avec https://)
2. Vérifier que l'API est activée dans ERPNext
3. Tester l'API manuellement :

```bash
curl -H "Authorization: token API_KEY:API_SECRET" \
     https://votre-erpnext.com/api/resource/Customer
```

### Rasa ne fonctionne pas

1. Vérifier que Rasa est installé : `rasa --version`
2. Vérifier que le serveur Rasa est en ligne :

```bash
curl http://localhost:5005/status
```

3. Si ça ne marche pas, désactivez Rasa :
```env
ENABLE_RASA=false
```

Le bot fonctionnera quand même, sans l'IA !

## Commandes utiles

```bash
# Voir les logs en temps réel
tail -f logs/combined.log

# Redémarrer le bot (si PM2)
pm2 restart telegram-bot

# Voir le statut (si PM2)
pm2 status

# Arrêter le bot (si PM2)
pm2 stop telegram-bot
```

## Support

- 📖 Voir la documentation complète : `README.md`
- 🐛 Problèmes ? Vérifier les logs : `logs/combined.log`
- 💬 Questions ? Créer une issue sur GitHub

---

**Bon développement ! 🚀**
