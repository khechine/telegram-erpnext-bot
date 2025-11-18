# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telegram bot integrated with Rasa NLU and ERPNext for customer management, quotations, invoices, stock management, and reporting through a conversational Telegram interface. Primary language is French.

## Commands

```bash
# Development
npm run dev           # Start with nodemon auto-reload
npm start             # Production mode

# Testing
npm test              # Run Jest tests with coverage
npm test -- --watch   # Watch mode

# Code Quality
npm run lint          # ESLint check
npm run lint -- --fix # Auto-fix linting issues

# Configuration
npm run check         # Validate config setup

# Rasa NLU
npm run rasa:train    # Train Rasa model (cd rasa && rasa train)
npm run rasa:run      # Start Rasa server on port 5005
```

## Architecture

```
User (Telegram)
    ↓
Bot Layer (src/bot/index.js - Telegraf)
    ↓
Controllers Layer (src/controllers/)
    ├── customerController.js
    ├── quotationController.js
    ├── invoiceController.js
    └── reportController.js
    ↓
Services Layer (src/services/)
    ├── erpnext.js   (ERPNext REST API client)
    ├── rasa.js      (NLU processing)
    └── email.js     (SMTP via nodemailer)
    ↓
Config & Utils
    ├── src/config/index.js (Joi-validated env)
    └── src/utils/logger.js (Winston)
```

### Key Patterns

**State Management**: Multi-step conversations use `ctx.session.state.waitingFor` with state handlers in controllers.

**Callback Routing**: Button actions use `this.bot.action('action_id', handler)` and regex patterns like `this.bot.action(/regex_(.+)$/, handler)`.

**Intent Routing**: Messages analyzed by Rasa flow through `routeIntent()` in bot/index.js to dispatch to appropriate controllers.

**Service Pattern**: Each service (ERPNext, Rasa, Email) has constructor with config injection, `testConnection()` method, and consistent error handling.

**Controller Pattern**: Each controller provides:
- `showXyzMenu()` for interactive menus
- `startXyz()` to initiate workflows
- `handleXyzState()` for form input handling
- `Markup.inlineKeyboard()` for button layouts

### Message Formatting

Use Markdown with emojis for visual clarity:
- `*Bold*` for emphasis
- Emojis for status indicators
- Line breaks for readability

## Adding New Features

1. **New Controller**: Create in `src/controllers/`, follow existing patterns with menu/start/handle methods
2. **Wire in Bot**: Add callbacks and command routing in `src/bot/index.js`
3. **New Service**: Add to `src/services/` with constructor, testConnection, and error handling
4. **New Rasa Intent**: Add to `rasa/domain.yml` (intents) and `rasa/nlu.yml` (training examples), then run `npm run rasa:train`

## Configuration

Environment variables defined in `.env` (see `.env.example`). Configuration validated by Joi schema in `src/config/index.js`.

Key feature flags:
- `ENABLE_RASA` - Enable Rasa NLU (falls back to regex patterns if disabled)
- `ENABLE_WEBHOOK` - Use webhook mode vs polling
- `ENABLE_REDIS` - Use Redis for session persistence

## Entry Point

`src/index.js` - Initializes TelegramBot class and handles graceful shutdown.

## Testing

Tests in `tests/bot.test.js` cover:
- ERPNext service methods
- Rasa service analysis
- Intent detection
- Entity extraction (email, phone)
