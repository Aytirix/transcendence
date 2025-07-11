# Transcendence - Projet Ecole 42

Ce projet, réalisé dans le cadre du cursus de l'École 42, a pour objectif de développer une application de jeu en ligne. Le projet est conçu pour être une plateforme de jeu où les utilisateurs peuvent s'affronter dans des jeux variés, tout en offrant une interface utilisateur intuitive et agréable.

## 🌐 Accès en ligne

Le projet est disponible en ligne à l'adresse suivante : [https://game.theomouty.fr/](https://game.theomouty.fr/)


## Table des matières

- [Docs](#Docs)
- [Installation](#installation)
- [Lancement de l'application](#lancement-de-lapplication)
- [Fonctionnalités](#fonctionnalités)
- [Structure de la base de données](#structure-de-la-base-de-données)

## Docs
L'api est documentée avec Swagger. Vous pouvez y accéder à l'adresse suivante : [https://localhost:3000/api/docs](https://localhost:3000/api/docs)

## Installation
Clonez le dépôt :
```bash
git clone git@github.com:Aytirix/transcendence.git
cd transcendence
```

Si vous n'avez pas encore installé Docker :
```bash
sudo apt-get install docker.io docker-compose
```

Si vous n'avez pas encore installé NVM (gestionnaire de version de Node.js), vous pouvez le faire en exécutant la commande suivante :
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.zshrc
source ~/.nvm/nvm.sh
source ~/.zshrc
```

Ensuite, installez la version de Node.js requise par le projet :
```bash
nvm install 22.9.0
nvm use 22.9.0
```



## Lancement de l'application
Cela va lancer les conteneurs Docker nécessaires à l'application. Vous pouvez ensuite accéder à l'application via votre navigateur à l'adresse suivante : [https://localhost:3000](https://localhost:3000) :
```bash
make prod
```

Arrêter l'application et les conteneurs Docker :
```bash
make stop
```

Supprimer les conteneurs Docker sans perdre les données :
```bash
make down
```

Remise a zéro de la base de données, avatars, minecraft_data, Certificats, SSL, .env:
```bash
make clear
```

## Fonctionnalités
- Inscription et connexion des utilisateurs
- Connexion avec son compte Google
- Connexion avec l'API de 42
- Gestion des amis, invitations et blocages
- Chat amis et possibilité de créer des groupes
- Jeu pong et système de matchmaking
- Minecraft intégré
- Jeu queen

## Contributeurs

Ce projet a été réalisé par une équipe de 4 développeurs :

<table>
  <tr>
    <td align="center">
      <img src="https://cdn.intra.42.fr/users/a08c0df0f3154c3567ef9974e3cdceea/thmouty.jpg" width="100px;" height="100px;" style="border-radius: 50%; object-fit: cover;" alt="Theo"/>
      <br />
      <sub><b>Theo</b></sub>
    </td>
    <td align="center">
      <img src="https://cdn.intra.42.fr/users/9c72703c120e32659983449b85b025b1/gacavali.jpg" width="100px;" height="100px;" style="border-radius: 50%; object-fit: cover;" alt="Gabriel"/>
      <br />
      <sub><b>Gabriel</b></sub>
    </td>
    <td align="center">
      <img src="https://cdn.intra.42.fr/users/ee730a412005a752267949978eacef43/cgorin.jpg" width="100px;" height="100px;" style="border-radius: 50%; object-fit: cover;" alt="Camille"/>
      <br />
      <sub><b>Camille</b></sub>
    </td>
    <td align="center">
      <img src="https://cdn.intra.42.fr/users/d75d575fb7b82c1d6eb10d69670b892c/yenaiji.jpg" width="100px;" height="100px;" style="border-radius: 50%; object-fit: cover;" alt="Yassine"/>
      <br />
      <sub><b>Yassine</b></sub>
    </td>
  </tr>
</table>