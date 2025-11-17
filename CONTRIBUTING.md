# 🤝 Contributing to Telegram ERPNext Bot

Merci de votre intérêt pour contribuer à ce projet ! Voici quelques guidelines pour commencer.

## 📋 Table des Matières

- [Code of Conduct](#code-of-conduct)
- [Comment Contribuer](#comment-contribuer)
- [Setup de Développement](#setup-de-développement)
- [Guidelines de Code](#guidelines-de-code)
- [Process de Pull Request](#process-de-pull-request)

## Code of Conduct

Soyez respectueux et constructif dans toutes vos interactions.

## Comment Contribuer

### 🐛 Reporter un Bug

1. Vérifier que le bug n'a pas déjà été reporté
2. Créer une issue avec :
   - Description claire du problème
   - Steps pour reproduire
   - Comportement attendu vs actuel
   - Logs pertinents
   - Environnement (OS, Node version, etc.)

### ✨ Proposer une Fonctionnalité

1. Créer une issue "Feature Request"
2. Décrire la fonctionnalité et son utilité
3. Proposer une implémentation si possible
4. Attendre validation avant de commencer

### 📝 Améliorer la Documentation

Les améliorations de documentation sont toujours bienvenues !

- README.md
- QUICKSTART.md
- docs/API.md
- Commentaires dans le code

## Setup de Développement

### 1. Fork & Clone

```bash
git clone https://github.com/khechine/telegram-erpnext-bot.git
cd telegram-erpnext-bot
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration

```bash
cp .env.example .env
# Éditer .env avec vos credentials
```

### 4. Vérifier que tout fonctionne

```bash
npm run check
npm test
```

### 5. Créer une branche

```bash
git checkout -b feature/ma-fonctionnalite
# ou
git checkout -b fix/mon-bug
```

## Guidelines de Code

### Style de Code

Nous utilisons ESLint pour la cohérence du code.

```bash
# Vérifier le code
npm run lint

# Auto-fix (si possible)
npm run lint -- --fix
```

### Structure des Commits

Utiliser des messages de commit clairs :

```
type(scope): description courte

Description détaillée si nécessaire

Fixes #123
```

Types :

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, points-virgules, etc.
- `refactor`: Refactoring de code
- `test`: Ajout de tests
- `chore`: Maintenance, dépendances, etc.

Exemples :

```
feat(customers): add customer deletion feature
fix(rasa): handle connection timeout gracefully
docs(readme): update installation instructions
```

### Architecture

Respecter la structure existante :

```
src/
├── bot/            # Logique Telegram
├── controllers/    # Business logic
├── services/       # API externes
├── config/         # Configuration
└── utils/          # Utilitaires
```

### Bonnes Pratiques

#### 1. Gestion d'erreurs

```javascript
try {
  const result = await erpnext.someMethod();
  await ctx.reply(`✅ ${result}`);
} catch (error) {
  logger.error("Error in someMethod:", error);
  await ctx.reply("❌ Une erreur est survenue.");
}
```

#### 2. Logging

```javascript
const logger = require("../utils/logger");

logger.info("User action", { userId, action });
logger.debug("Detailed info", { data });
logger.error("Error occurred", { error: error.message });
```

#### 3. Validation

```javascript
const Joi = require("joi");

const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email(),
});

const { error, value } = schema.validate(data);
if (error) {
  return ctx.reply(`❌ ${error.message}`);
}
```

#### 4. Messages utilisateur

- Toujours inclure un emoji approprié
- Messages en français
- Être clair et concis
- Proposer des actions suivantes

```javascript
await ctx.reply(
  "✅ Client créé avec succès !\n\n" + "Que souhaitez-vous faire maintenant ?",
  Markup.inlineKeyboard([
    [Markup.button.callback("➕ Créer un autre", "customer_create")],
    [Markup.button.callback("📋 Voir tous", "customer_list")],
  ])
);
```

### Tests

Ajouter des tests pour toute nouvelle fonctionnalité :

```javascript
// tests/myFeature.test.js
describe("My Feature", () => {
  test("should do something", async () => {
    const result = await myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

Lancer les tests :

```bash
npm test
```

## Process de Pull Request

### 1. Créer la PR

- Titre clair décrivant le changement
- Description détaillée
- Référencer les issues concernées
- Screenshots si changement UI

### 2. Checklist

Avant de soumettre, vérifier :

- [ ] Le code suit les guidelines
- [ ] Les tests passent : `npm test`
- [ ] Le linter passe : `npm run lint`
- [ ] La configuration fonctionne : `npm run check`
- [ ] Documentation à jour si nécessaire
- [ ] Commits bien formatés

### 3. Review

- Répondre aux commentaires constructivement
- Faire les modifications demandées
- Re-request review quand prêt

### 4. Merge

Une fois approuvée, la PR sera mergée par un mainteneur.

## 🎯 Domaines Prioritaires

Contributions particulièrement bienvenues sur :

- 🌍 **i18n** : Traductions (anglais, arabe)
- 🎨 **UI/UX** : Amélioration des menus et messages
- 📊 **Rapports** : Nouveaux rapports ou métriques
- 🧪 **Tests** : Augmenter la couverture de code
- 📚 **Documentation** : Exemples, tutoriels, guides
- 🔌 **Intégrations** : Nouveaux services, APIs

## 🏷️ Labels

- `good first issue` : Bon pour débuter
- `help wanted` : Aide recherchée
- `bug` : Bug à corriger
- `enhancement` : Amélioration
- `documentation` : Documentation
- `question` : Question

## 📞 Questions ?

- Créer une issue "Question"
- Consulter la documentation
- Voir les exemples existants

## 💡 Idées de Contributions

Quelques idées si vous ne savez pas par où commencer :

1. Ajouter plus d'exemples d'entraînement Rasa
2. Améliorer les messages d'erreur
3. Ajouter des tests unitaires
4. Créer des nouveaux rapports
5. Optimiser les requêtes ERPNext
6. Améliorer la documentation
7. Ajouter des emojis pertinents
8. Créer des templates de messages

## 🙏 Merci !

Chaque contribution, petite ou grande, est appréciée !

---

**Happy Coding! 🚀**
