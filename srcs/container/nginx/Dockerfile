# Utiliser l'image officielle de Nginx
FROM nginx:alpine

# Mettre à jour les paquets et installer les dépendances nécessaires
RUN apk update && apk add --no-cache \
    bash \
    curl \
    zsh \
    && rm -rf /var/cache/apk/*

# Variables d'environnement
ARG NODE_PROJET
ARG FRONTEND_PATH

# Copier le fichier de configuration principal nginx dans le conteneur
COPY conf/nginx.conf.template /etc/nginx/nginx.conf.template

# Copier tous les fichiers de configuration .conf dans /etc/nginx/conf.d/ sauf default.conf
COPY conf/*.conf /etc/nginx/conf.d/

# Substituer la variable d'environnement dans nginx.conf.template et créer nginx.conf
RUN envsubst '$NODE_PROJET' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Assurer les bonnes permissions et exécuter nginx
RUN chown -R nginx:nginx /etc/nginx && \
    chmod -R 755 /etc/nginx

# Lancer Nginx en mode non-démon pour garder le conteneur en vie
CMD ["nginx", "-g", "daemon off;"]
