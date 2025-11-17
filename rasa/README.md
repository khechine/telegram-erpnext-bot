# 🤖 Configuration Rasa NLU

Ce dossier contient toute la configuration pour le modèle Rasa NLU qui permet au bot de comprendre le langage naturel.

## 📁 Structure

```
rasa/
├── domain.yml          # Domaine, intentions, entités, slots, réponses
├── nlu.yml            # Données d'entraînement NLU
├── config.yml         # Configuration du pipeline ML
├── rules.yml          # Règles de conversation
├── stories.yml        # Scénarios de conversation
└── models/            # Modèles entraînés (généré)
```

## 🎯 Intentions Disponibles

### Navigation
- `greet` : Salutations
- `goodbye` : Au revoir
- `menu` : Retour au menu
- `help` : Aide

### Gestion Clients
- `create_customer` : Créer un client
- `list_customers` : Lister les clients
- `search_customer` : Rechercher un client
- `update_customer` : Modifier un client
- `delete_customer` : Supprimer un client

### Gestion Devis
- `create_quotation` : Créer un devis
- `list_quotations` : Lister les devis
- `view_quotation` : Voir un devis

### Gestion Factures
- `create_invoice` : Créer une facture
- `list_invoices` : Lister les factures
- `view_invoice` : Voir une facture

### Stock
- `list_items` : Lister les articles
- `check_stock` : Vérifier le stock
- `low_stock_alert` : Alertes de stock faible

### Rapports
- `sales_report` : Rapport des ventes
- `customer_report` : Rapport clients
- `stock_report` : Rapport stock
- `financial_report` : Rapport financier
- `dashboard` : Dashboard global

## 🏷️ Entités Reconnues

- `name` : Nom de personne/entreprise
- `email` : Adresse email
- `phone` : Numéro de téléphone
- `customer_name` : Nom de client
- `item_name` : Nom d'article
- `item_code` : Code article
- `amount` : Montant
- `currency` : Devise
- `date` : Date
- `status` : Statut

## 🚀 Utilisation

### Entraîner le modèle

```bash
cd rasa
rasa train
```

Le modèle sera sauvegardé dans `models/`

### Lancer le serveur

```bash
rasa run --enable-api --cors "*" --port 5005
```

### Tester le modèle

```bash
# Shell interactif
rasa shell

# Tester un message spécifique
curl -X POST http://localhost:5005/model/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"créer un client Dupont"}'
```

## 📊 Pipeline ML

Le pipeline utilise :
- **WhitespaceTokenizer** : Tokenisation par espaces
- **RegexFeaturizer** : Features regex
- **LexicalSyntacticFeaturizer** : Features lexicales
- **CountVectorsFeaturizer** : Vectorisation (mots + char n-grams)
- **DIETClassifier** : Classification des intentions et extraction d'entités
- **EntitySynonymMapper** : Mapping des synonymes
- **ResponseSelector** : Sélection de réponses

## ✏️ Ajouter de nouvelles intentions

### 1. Ajouter l'intention dans `domain.yml`

```yaml
intents:
  - ma_nouvelle_intention
```

### 2. Ajouter des exemples dans `nlu.yml`

```yaml
- intent: ma_nouvelle_intention
  examples: |
    - exemple 1
    - exemple 2 avec [entité](entity_type)
    - exemple 3
```

### 3. Réentraîner le modèle

```bash
rasa train
```

### 4. Implémenter le handler dans le bot

Voir `src/bot/index.js` méthode `routeIntent()`

## 🎓 Améliorer la Précision

### Ajouter plus d'exemples

Plus vous ajoutez d'exemples variés, meilleure sera la reconnaissance :

```yaml
- intent: create_customer
  examples: |
    - créer un client
    - ajouter un client
    - nouveau client
    - enregistrer un client
    - je veux créer un client
    - peux-tu créer un client
    - crée-moi un client
    # Variantes avec entités
    - créer [Dupont](name)
    - ajouter [Jean Martin](name)
    - nouveau client [Sophie](name)
```

### Tester régulièrement

Utilisez la commande `rasa test` pour évaluer la performance :

```bash
rasa test nlu --nlu data/nlu.yml
```

### Analyser les erreurs

Vérifier les logs du bot pour voir les intentions mal détectées et ajouter des exemples.

## 🔧 Configuration Avancée

### Ajuster les paramètres

Dans `config.yml`, vous pouvez ajuster :

```yaml
- name: DIETClassifier
  epochs: 100              # Nombre d'itérations d'entraînement
  constrain_similarities: true
  model_confidence: softmax
```

### Utiliser des synonymes

Dans `domain.yml` :

```yaml
entities:
  - status:
      values:
        - paid:
            synonyms: ["payé", "payée", "réglé", "réglée"]
        - unpaid:
            synonyms: ["non payé", "impayé", "en attente"]
```

## 📚 Ressources

- [Documentation Rasa](https://rasa.com/docs/rasa/)
- [Best Practices NLU](https://rasa.com/docs/rasa/nlu-training-data)
- [Training Data Format](https://rasa.com/docs/rasa/training-data-format)

## 🐛 Dépannage

### Le modèle ne se charge pas

```bash
# Vérifier les logs
rasa run --enable-api --debug

# Réentraîner
rasa train --force
```

### Mauvaise reconnaissance

1. Ajouter plus d'exemples pour cette intention
2. Vérifier les similarités avec d'autres intentions
3. Utiliser `rasa test nlu` pour évaluer

### Erreur de mémoire

Réduire les epochs dans `config.yml` :

```yaml
- name: DIETClassifier
  epochs: 50  # Au lieu de 100
```

---

**Pour plus d'infos, voir la [documentation Rasa officielle](https://rasa.com/docs/)**
