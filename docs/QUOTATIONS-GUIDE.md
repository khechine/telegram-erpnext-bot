# 📄 Guide : Création et Envoi de Devis

## 🎯 Nouvelles Fonctionnalités

Ce guide explique comment utiliser les fonctionnalités de **création de devis** et **envoi par email**.

## ⚙️ Configuration Préalable

### 1. Configuration Email (Obligatoire pour l'envoi)

Ajouter dans votre fichier `.env` :

```env
# Gmail (recommandé)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_app_password
EMAIL_FROM=votre_email@gmail.com
EMAIL_FROM_NAME=Votre Entreprise

# OU Autre fournisseur SMTP
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=contact@example.com
EMAIL_PASSWORD=your_password
```

#### Comment obtenir un App Password Gmail ?

1. Aller sur https://myaccount.google.com/security
2. Activer la **vérification en 2 étapes**
3. Dans "Mots de passe des applications", créer un nouveau mot de passe
4. Copier le mot de passe généré dans `EMAIL_PASSWORD`

### 2. Configurer ERPNext

Assurez-vous que :
- Les clients ont des **emails renseignés**
- Les articles ont des **prix standards** (standard_rate)
- Vous avez les **permissions** pour créer des devis

## 📄 Création de Devis

### Méthode 1 : Via le Menu

```
1. /start ou "menu"
2. Cliquer sur "📄 Devis"
3. Cliquer sur "➕ Créer un devis"
4. Suivre les étapes
```

### Méthode 2 : Commande Directe

```
"Créer un devis"
"Nouveau devis"
"Je veux faire un devis"
```

### Étapes de Création

#### Étape 1 : Client
```
Bot: 👤 Entrez le nom du client :
Vous: Dupont

Bot vérifie que le client existe dans ERPNext
```

#### Étape 2 : Articles
```
Bot: 📦 Entrez le code de l'article (ou "fini" pour terminer) :
Vous: PAIN-001

Bot: ✅ Article: Pain Complet
     💰 Prix: 2.50 TND
     🔢 Entrez la quantité :
Vous: 10

Bot: ✅ Article ajouté: Pain Complet × 10 = 25.00 TND
     📦 Entrez le code d'un autre article, ou "fini" pour terminer :
```

**Ajouter plusieurs articles :**
```
Vous: CROIS-001
Bot: (demande quantité)
Vous: 5
Bot: (demande article suivant)
Vous: fini  ← Pour terminer
```

#### Étape 3 : Date de Validité
```
Bot: ⏰ Entrez la date de validité (jours) (ex: 30) :
Vous: 30

Le devis sera valide 30 jours à partir d'aujourd'hui
```

#### Étape 4 : Conditions (Optionnel)
```
Bot: 📋 Entrez les conditions (ou "skip" pour passer) :
Vous: Paiement à 30 jours. Livraison sous 48h.

OU

Vous: skip  ← Pour passer cette étape
```

#### Résultat
```
Bot: ✅ Devis créé avec succès !
     📄 Numéro: QUO-2024-0001
     👤 Client: Dupont
     📦 Articles: 2
     💰 Total: 37.50 TND
     ⏰ Valide jusqu'au: 17/12/2024

     [📧 Envoyer par email]
     [👁️ Voir le devis]
     [➕ Créer un autre]
```

## 📧 Envoi de Devis par Email

### Méthode 1 : Après Création

Juste après avoir créé un devis :
```
Cliquer sur [📧 Envoyer par email]
```

### Méthode 2 : Depuis la Liste

```
1. "Liste des devis"
2. Cliquer sur [📧] à côté du devis souhaité
```

### Méthode 3 : Commande Directe

```
"Envoyer le devis"
"Envoyer devis par email"
Bot: 📄 Entrez le numéro du devis :
Vous: QUO-2024-0001
```

### Ce qui est Envoyé

L'email contient :
- ✅ **HTML formaté** professionnel
- ✅ **Informations du devis** (client, date, validité)
- ✅ **Liste des articles** avec quantités et prix
- ✅ **Total** bien visible
- ✅ **Conditions** si renseignées
- ✅ **Logo** de votre entreprise (via EMAIL_FROM_NAME)

**Note :** Le PDF n'est pas inclus par défaut (fonctionnalité à venir)

### Résultat de l'Envoi

```
Bot: ✅ Devis envoyé avec succès !
     📄 Devis: QUO-2024-0001
     👤 Client: Dupont
     📧 Email: dupont@example.com
     💰 Montant: 37.50 TND
     
     Message ID: <abc123@gmail.com>
```

## 📋 Consulter les Devis

### Liste Complète

```
"Liste des devis"
"Voir les devis"
```

Affiche :
- Numéro du devis
- Client
- Date
- Validité
- Montant
- Statut (Draft, Submitted, Ordered, etc.)

### Voir un Devis Spécifique

Cliquer sur [👁️ NOM-DEVIS] dans la liste

Affiche tous les détails :
- Informations générales
- Liste complète des articles
- Conditions
- Actions possibles (Envoyer, etc.)

## 🎨 Format de l'Email

### HTML (dans les clients email modernes)

Un email professionnel avec :
- En-tête avec logo
- Carte d'informations
- Tableau des articles
- Total en surbrillance
- Conditions en note
- Footer professionnel

### Texte Brut (fallback)

Version texte structurée pour les clients email qui ne supportent pas HTML.

## ❌ Gestion des Erreurs

### "Client introuvable"
```
❌ Client "XYZ" introuvable.
→ Vérifier l'orthographe
→ Créer le client d'abord
```

### "Article introuvable"
```
❌ Article "ABC" introuvable.
→ Vérifier le code article
→ L'article doit exister dans ERPNext
```

### "Email service is not configured"
```
❌ Le service email n'est pas configuré.
→ Configurer EMAIL_USER et EMAIL_PASSWORD dans .env
→ Redémarrer le bot
```

### "Client n'a pas d'email"
```
❌ Le client Dupont n'a pas d'email renseigné.
→ Ajouter l'email du client dans ERPNext
```

## 🔧 Astuces

### 1. Annuler une Création

À tout moment pendant la création :
```
Taper: "annuler"
Ou cliquer sur [❌ Annuler]
```

### 2. Articles Rapides

Si vous créez souvent les mêmes devis :
- Notez les codes articles courants
- Créez des templates dans ERPNext

### 3. Conditions Standards

Préparez des conditions types :
```
"Paiement à 30 jours. Livraison sous 48h."
"Remise 10% si commande > 500 TND"
```

Copiez-collez les dans le bot !

### 4. Vérifier avant d'Envoyer

Toujours :
1. Cliquer sur [👁️ Voir le devis]
2. Vérifier les détails
3. Puis cliquer sur [📧 Envoyer]

## 🚀 Workflow Complet Recommandé

```
1. Créer le client (si nouveau)
   "Créer un client Dupont avec email dupont@example.com"

2. Créer le devis
   "Créer un devis"
   → Suivre les étapes

3. Vérifier le devis
   [👁️ Voir le devis]

4. Envoyer au client
   [📧 Envoyer par email]

5. Suivre dans ERPNext
   Le devis est maintenant dans ERPNext avec statut "Submitted"
```

## 📊 Statuts des Devis

- **📝 Draft** : Brouillon (non envoyable)
- **📤 Submitted** : Soumis (prêt à être envoyé)
- **📬 Open** : Ouvert
- **✅ Ordered** : Converti en commande
- **❌ Lost** : Perdu
- **🚫 Cancelled** : Annulé

Le bot soumet automatiquement les devis après création.

## 🔍 Dépannage

### L'email n'arrive pas

1. **Vérifier les logs** : `logs/combined.log`
2. **Tester la configuration** :
   ```bash
   npm run check
   ```
3. **Vérifier les paramètres SMTP** dans `.env`
4. **Vérifier que le client a un email**

### Le devis ne se crée pas

1. **Vérifier les permissions ERPNext**
2. **Vérifier que les articles existent**
3. **Vérifier les logs** du bot

### Le bot ne répond plus

1. **État bloqué** : Taper "annuler" ou `/start`
2. **Redémarrer** : `npm restart`

## 📞 Support

Pour toute question :
- Consulter les logs : `logs/combined.log`
- Voir la documentation ERPNext
- Créer une issue GitHub

---

**Bon usage ! 📄✨**
