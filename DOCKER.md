# 🐳 Guide Docker

Ce guide explique comment déployer le bot avec Docker.

## 🚀 Démarrage Rapide

### 1. Configuration

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer avec vos credentials
nano .env
```

### 2. Lancer avec Docker Compose

```bash
# Build et démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f telegram-bot

# Arrêter
docker-compose down
```

C'est tout ! Le bot est en ligne avec Rasa 🎉

## 📋 Services Disponibles

Le `docker-compose.yml` configure 3 services :

1. **telegram-bot** : Le bot principal (port 3000 si webhook)
2. **rasa** : Serveur Rasa NLU (port 5005)
3. **redis** : Cache pour sessions (optionnel, port 6379)

## 🛠️ Commandes Docker

### Gestion des Services

```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d telegram-bot

# Arrêter tous les services
docker-compose down

# Redémarrer un service
docker-compose restart telegram-bot

# Voir le statut
docker-compose ps

# Voir les logs
docker-compose logs -f telegram-bot
docker-compose logs -f rasa
```

### Build & Rebuild

```bash
# Build l'image
docker-compose build

# Rebuild forcé
docker-compose build --no-cache

# Pull les dernières images
docker-compose pull
```

### Maintenance

```bash
# Accéder au shell du container
docker-compose exec telegram-bot sh

# Voir les logs en temps réel
docker-compose logs -f

# Nettoyer les volumes
docker-compose down -v
```

## 🔧 Configuration Avancée

### Build Custom

Si vous voulez builder manuellement :

```bash
# Build l'image
docker build -t telegram-erpnext-bot .

# Run
docker run -d \
  --name telegram-bot \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  telegram-erpnext-bot
```

### Sans Rasa

Si vous n'avez pas besoin de Rasa :

```yaml
# docker-compose.yml
version: '3.8'

services:
  telegram-bot:
    build: .
    container_name: telegram-erpnext-bot
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - ENABLE_RASA=false
    volumes:
      - ./logs:/app/logs
```

### Mode Webhook

Pour activer le mode webhook :

```yaml
# docker-compose.yml
services:
  telegram-bot:
    # ...
    ports:
      - "3000:3000"
    environment:
      - ENABLE_WEBHOOK=true
      - TELEGRAM_WEBHOOK_DOMAIN=https://your-domain.com
```

### Avec Nginx Reverse Proxy

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    container_name: bot-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - telegram-bot
    networks:
      - bot-network
```

## 📊 Monitoring

### Logs

```bash
# Tous les logs
docker-compose logs

# Logs spécifiques
docker-compose logs telegram-bot
docker-compose logs rasa

# Follow logs
docker-compose logs -f telegram-bot

# Dernières 100 lignes
docker-compose logs --tail=100 telegram-bot
```

### Stats

```bash
# Utilisation des ressources
docker stats

# Infos détaillées
docker-compose exec telegram-bot sh -c "top"
```

### Health Check

Le Dockerfile inclut un healthcheck :

```bash
# Voir le status de santé
docker inspect --format='{{.State.Health.Status}}' telegram-bot
```

## 🔄 Mise à Jour

### Mettre à jour le code

```bash
# Pull les dernières modifications
git pull

# Rebuild et redémarrer
docker-compose down
docker-compose build
docker-compose up -d
```

### Mettre à jour les dépendances

```bash
# Dans le Dockerfile, modifier la version Node si nécessaire
# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## 🐛 Dépannage

### Le bot ne démarre pas

```bash
# Voir les logs d'erreur
docker-compose logs telegram-bot

# Vérifier la configuration
docker-compose exec telegram-bot sh -c "node check-config.js"

# Redémarrer
docker-compose restart telegram-bot
```

### Rasa ne répond pas

```bash
# Vérifier les logs Rasa
docker-compose logs rasa

# Tester la connexion
curl http://localhost:5005/status

# Réentraîner le modèle
docker-compose exec rasa rasa train
docker-compose restart rasa
```

### Erreurs de permissions

```bash
# Fix permissions sur logs
sudo chown -R $(id -u):$(id -g) logs/

# Rebuild avec les bonnes permissions
docker-compose build
docker-compose up -d
```

### Nettoyer tout

```bash
# Arrêter et supprimer tout
docker-compose down -v --remove-orphans

# Supprimer les images
docker rmi telegram-erpnext-bot
docker rmi rasa/rasa:3.6.0

# Restart from scratch
docker-compose up -d --build
```

## 📦 Production

### Recommandations

1. **Utiliser des secrets** :
   ```bash
   docker secret create telegram_token ./telegram_token.txt
   ```

2. **Limiter les ressources** :
   ```yaml
   services:
     telegram-bot:
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
   ```

3. **Backup régulier** :
   ```bash
   # Backup logs
   docker run --rm \
     -v $(pwd)/logs:/backup \
     alpine tar czf /backup/logs-$(date +%Y%m%d).tar.gz /backup
   ```

4. **Utiliser un registry** :
   ```bash
   docker tag telegram-erpnext-bot registry.example.com/telegram-bot:latest
   docker push registry.example.com/telegram-bot:latest
   ```

## 🔐 Sécurité

- Ne jamais commiter le `.env`
- Utiliser des secrets Docker en production
- Limiter les ressources
- Mettre à jour régulièrement les images de base
- Scanner les vulnérabilités : `docker scan telegram-erpnext-bot`

## 📚 Ressources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Happy Dockerizing! 🐳**
