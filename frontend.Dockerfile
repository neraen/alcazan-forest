# frontend.Dockerfile
FROM node:18

# Définir le répertoire de travail
WORKDIR /usr/src/app

COPY ./alcazan-front-prod/package*.json ./

# Copier le code source
COPY ./alcazan-front-prod .

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Construire l'application
RUN npm run build

# Exposer le port pour le serveur de développement
EXPOSE 3000

# Lancer l'application React
CMD ["npm", "start"]
