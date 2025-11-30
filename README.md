# 📘 UBO Relay Chat --- README

## 📌 Introduction

**UBO Relay Chat** est une application de messagerie instantanée
développée dans le cadre d'un TP.\
Elle permet la communication entre utilisateurs, la gestion de comptes,
l'envoi de messages et l'utilisation d'APIs déployées sur **Vercel**.

Ce projet a été réalisé avec les technologies suivantes :

-   **React** (frontend)
-   **Vercel Functions** (backend serverless)
-   **Neon PostgreSQL** (base de données des utilisateurs)
-   **Redis Upstash KV** (sessions et messages)
-   **Pusher** (notifications push)
-   **Vercel Blob** (upload d'images, optionnel)

------------------------------------------------------------------------

## 🚀 Fonctionnalités principales

-   🔐 Authentification (login / logout)
-   ➕ Inscription utilisateur
-   💬 Envoi et réception de messages
-   📜 Liste dynamique des utilisateurs
-   🔔 Notifications push en temps réel
-   🧪 Gestion de sessions (tokens)
-   📤 Upload et affichage d'images (optionnel)
-   🗂️ Salons de discussion (groupes) --- optionnel

------------------------------------------------------------------------

## 📁 Structure du projet

    /api              → API serverless (login, register, messages, users, etc.)
    /public           → Service Worker et assets
    /src              → Application React
        /component    → NavBar, UI
        /user         → Login, Register, Messages
    scripts/db.sql    → Script d’installation de la base PostgreSQL
    lib/session.js    → Validation des sessions utilisateurs

------------------------------------------------------------------------

## 🛠️ Installation & Lancement

### 1. Installer les dépendances

``` bash
npm install
```

### 2. Lancer le projet en local avec Vercel

``` bash
vercel link
vercel env pull .env.development.local
export $(cat .env.development.local | xargs)
vercel dev
```

------------------------------------------------------------------------

# 🗄️ Base de données (Neon PostgreSQL)

### 📌 Initialisation

Dans le dashboard Neon :

1.  `Open in Neon`
2.  `SQL Editor`
3.  Exécuter `scripts/db.sql`

Cela crée la table `users` et un compte de test :

-   username : **test**
-   password : **testubo**

------------------------------------------------------------------------

# 🔐 Authentification

## ▶ Login (`/api/login`)

Processus :

1.  Récupérer username + password\
2.  Vérifier l'existence en base\
3.  Hasher le mot de passe (SHA-256)\
4.  Comparer avec celui stocké\
5.  Stocker une session dans Redis\
6.  Retourner un token au frontend

Le frontend doit envoyer ce token dans les headers :

    Authorization: Bearer <token>

------------------------------------------------------------------------

# ➕ Inscription (`/api/register`)

-   Vérification des champs\
-   Vérification de l'unicité email + utilisateur\
-   Hash du mot de passe\
-   Insertion en base\
-   Connexion automatique (optionnel)

------------------------------------------------------------------------

# 💬 Envoi des messages

## ▶ API : `/api/messages`

Chaque message est stocké dans Redis ou PostgreSQL.\
Format type :

``` json
{
  "from": 1,
  "to": 2,
  "content": "hello",
  "timestamp": "2025-01-01T10:12:54Z"
}
```

------------------------------------------------------------------------

# 🔔 Notifications Push (Pusher)

Les notifications sont envoyées via Pusher Beams :

``` js
beamsClient.publishToUsers([receiverId], {
  web: {
    notification: {
      title: senderUsername,
      body: messageContent,
      icon: "/icon.png"
    }
  }
});
```

------------------------------------------------------------------------

# 🖼️ Upload d'images (Optionnel)

-   Drag & Drop\
-   Upload sur Vercel Blob\
-   Affichage dans le chat

------------------------------------------------------------------------

# 👥 Salons (Optionnel)

-   Salons de discussion\
-   Messages de groupe\
-   Notifications élargies

------------------------------------------------------------------------

# 📌 Sécurité

-   Hash SHA-256 (bcrypt recommandé en production)\
-   Sessions expirables\
-   Pas de stockage des mots de passe côté frontend

------------------------------------------------------------------------

# 📚 Technologies utilisées

Technologie        Rôle
  ------------------ ---------------------
React              Frontend
Vercel Functions   Backend serverless
Neon PostgreSQL    BDD utilisateurs
Upstash Redis KV   Sessions / Messages
Pusher Beams       Notifications
Vercel Blob        Upload d'images

------------------------------------------------------------------------

# 🧪 Améliorations futures

-   Émojis / réactions\
-   Messages vocaux\
-   Historique illimité\
-   Système "vu / non vu"\
-   Profil utilisateur\
-   Déconnexion automatique

