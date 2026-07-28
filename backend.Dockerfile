# backend.Dockerfile
FROM php:8.3-apache

# Installation des extensions nécessaires à Symfony
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libicu-dev \
    libpq-dev \
    libzip-dev \
    zip \
    && docker-php-ext-install intl pdo pdo_mysql opcache zip

# Installation de Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Activation du module Apache rewrite
RUN a2enmod rewrite

# Upload des icônes d'équipement depuis l'admin : les 2 Mo par défaut de PHP sont trop justes
RUN printf "upload_max_filesize = 8M\npost_max_size = 10M\n" > /usr/local/etc/php/conf.d/uploads.ini

# Modifier le DocumentRoot d'Apache pour qu'il pointe vers "public/"
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' /etc/apache2/sites-available/000-default.conf


# Définir le répertoire de travail
WORKDIR /var/www/html

# Copier le code source
COPY ./alcazan-back-prod .

# Installation des dépendances via Composer
# --no-scripts : ne pas booter le kernel Symfony pendant le build (pas de .env dispo ici ;
# le .env réel arrive via le bind-mount au runtime). vendor/ de l'hôte prime de toute façon.
RUN composer install --no-interaction --no-scripts --no-progress

# Droits pour le cache de Symfony
RUN mkdir -p var/cache var/log && chown -R www-data:www-data var

RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

RUN echo "<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>" >> /etc/apache2/apache2.conf

# Exposer le port 80
EXPOSE 80
