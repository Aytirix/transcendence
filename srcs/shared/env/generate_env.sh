#!/bin/bash

# Chemins vers les fichiers à vérifier
DB1="srcs/container/backend/srcs/sqlite/sessions.sqlite"
DB2="srcs/container/backend/srcs/sqlite/transcendence.sqlite"
ENV1="srcs/container/backend/srcs/.env"
ENV2="srcs/.env"

# Si "first" est passé
if [[ "$1" == "first" ]]; then
	if [[ -f "$DB1" || -f "$DB2" || -f "$ENV1" || -f "$ENV2" ]]; then
		exit 0
	fi
else
	# Demander confirmation
	echo "⚠️  Attention, cette commande va réinitialiser la base de données et supprimer les données existantes."
	read -p "Voulez-vous continuer ? (o/n) " confirmation

	if [[ ! "$confirmation" =~ ^[oO]$ ]]; then
		echo "❌ Abandon de la réinitialisation de la base de données."
		exit 1
	fi
fi

echo "🚧 Réinitialisation en cours..."

# Supprimer les bases de données si elles existent
rm -f "$DB1"
rm -f "$DB2"

# Copier les fichiers .env
cp -f ./srcs/shared/env/frontend.env "$ENV2"
cp -f ./srcs/shared/env/backend.env "$ENV1"

# Régénérer les secrets
sed -i 's/^SESSION_SECRET=.*/SESSION_SECRET='"$(openssl rand -hex 32)"'/' "$ENV1"
sed -i 's/^SESSION_SALT=.*/SESSION_SALT='"$(openssl rand -hex 16)"'/' "$ENV1"
sed -i 's/^ENCRYPT_KEY=.*/ENCRYPT_KEY='"$(openssl rand -hex 32)"'/' "$ENV1"
sed -i 's/^ENCRYPT_IV=.*/ENCRYPT_IV='"$(openssl rand -hex 16)"'/' "$ENV1"

echo "✅ Réinitialisation terminée."
