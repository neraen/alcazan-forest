#!/bin/sh
sleep 30
minutes=0
while true; do
    php bin/console app:echanges:expirer
    php bin/console app:hdv:expirer
    if [ "$((minutes % 60))" = 0 ]; then
        php bin/console app:regen-points
        php bin/console app:journal:purger
    fi
    minutes=$((minutes + 1))
    sleep 60
done
