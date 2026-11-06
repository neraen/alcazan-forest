FROM php:8.3-apache
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN apt-get update && apt-get install -y --no-install-recommends libicu-dev libzip-dev unzip git && docker-php-ext-install intl pdo_mysql opcache zip && rm -rf /var/lib/apt/lists/*
WORKDIR /var/www/html
COPY alcazan-back-prod/ ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader && mkdir -p var/cache var/log && chown -R www-data:www-data var && printf 'APP_ENV=prod\n' > .env
RUN a2enmod rewrite && sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' /etc/apache2/sites-available/000-default.conf && printf '<Directory /var/www/html/public>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-enabled/alcazan.conf && printf 'upload_max_filesize=8M\npost_max_size=10M\n' > /usr/local/etc/php/conf.d/uploads.ini
COPY deploy/coolify/scheduler.sh /opt/alcazan-scheduler
