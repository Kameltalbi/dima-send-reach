# 🚀 Automatisations et Segmentation - Guide Complet

## 📋 Vue d'ensemble

DymaMail inclut maintenant deux fonctionnalités puissantes pour améliorer votre marketing par email :

1. **Segmentation** : Créez des segments de contacts basés sur des critères personnalisés
2. **Automatisations** : Configurez des workflows d'emails automatiques pour engager vos contacts

---

## 🎯 Segmentation

### Qu'est-ce que la segmentation ?

La segmentation vous permet de créer des groupes de contacts basés sur des critères spécifiques (pays, ville, société, fonction, date d'inscription, etc.). Ces segments peuvent ensuite être utilisés pour cibler vos campagnes.

### Comment créer un segment ?

1. Allez dans **Segmentation** dans le menu latéral
2. Cliquez sur **"Nouveau segment"**
3. Donnez un nom et une description à votre segment
4. Ajoutez des critères de filtrage :
   - **Champ** : Pays, Ville, Société, Fonction, Date d'inscription
   - **Opérateur** : Égal à, Contient, Commence par, Après, Avant
   - **Valeur** : La valeur à rechercher
5. Cliquez sur **"Créer"**

### Exemples de segments

- **Clients VIP Tunisie** : Pays = "Tunisie" ET Société contient "VIP"
- **Nouveaux contacts** : Date d'inscription après "2024-01-01"
- **Clients de Tunis** : Ville contient "Tunis"

### Utiliser un segment dans une campagne

Les segments peuvent être utilisés lors de la création d'une campagne pour cibler un groupe spécifique de contacts.

---

## ⚡ Automatisations

### Qu'est-ce qu'une automatisation ?

Une automatisation est un workflow d'emails automatiques qui s'exécute lorsque certains événements se produisent (déclencheurs). Par exemple, envoyer automatiquement un email de bienvenue lorsqu'un nouveau contact s'inscrit.

### Types de déclencheurs disponibles

1. **Contact ajouté** : Se déclenche lorsqu'un nouveau contact est ajouté
2. **Contact abonné** : Se déclenche lorsqu'un contact s'abonne
3. **Ajouté à une liste** : Se déclenche lorsqu'un contact est ajouté à une liste spécifique
4. **Email ouvert** : Se déclenche lorsqu'un contact ouvre un email (à venir)
5. **Email cliqué** : Se déclenche lorsqu'un contact clique sur un lien (à venir)

### Types d'étapes disponibles

1. **Envoyer un email** : Envoie un email en utilisant un template
2. **Attendre** : Attend un certain nombre de jours avant de passer à l'étape suivante

### Comment créer une automatisation ?

1. Allez dans **Automatisations** dans le menu latéral
2. Cliquez sur **"Nouvelle automatisation"**
3. Configurez les informations générales :
   - **Nom** : Nom de votre automatisation
   - **Description** : Description optionnelle
4. Configurez le déclencheur :
   - Sélectionnez le type de déclencheur
   - Si nécessaire, configurez les options (ex: sélectionner une liste)
5. Ajoutez les étapes :
   - Cliquez sur **"Email"** pour ajouter une étape d'envoi d'email
   - Sélectionnez le template à utiliser
   - Cliquez sur **"Attendre"** pour ajouter un délai entre les étapes
   - Configurez le nombre de jours d'attente
6. Cliquez sur **"Créer"**

### Exemple d'automatisation : Email de bienvenue

**Déclencheur** : Contact ajouté

**Étapes** :
1. Envoyer un email (Template: "Email de bienvenue")
2. Attendre 3 jours
3. Envoyer un email (Template: "Rappel - Découvrez nos fonctionnalités")
4. Attendre 7 jours
5. Envoyer un email (Template: "Offre spéciale pour nouveaux clients")

### Activer/Désactiver une automatisation

- Cliquez sur le menu (⋮) à côté d'une automatisation
- Sélectionnez **"Mettre en pause"** ou **"Activer"**

---

## 🔧 Architecture Technique

### Base de données

#### Table `segments`
- Stocke les segments avec leurs critères de filtrage
- Les critères sont stockés en JSONB pour flexibilité

#### Table `automations`
- Stocke les automatisations avec leur déclencheur et configuration
- Suit les statistiques (emails envoyés, ouverts, cliqués)

#### Table `automation_steps`
- Stocke les étapes de chaque automatisation
- Chaque étape a un ordre et une configuration

#### Table `automation_executions`
- Suit l'exécution des automatisations pour chaque contact
- Gère l'état (pending, running, completed, paused)
- Calcule la prochaine date d'exécution

### Edge Function : `process-automations`

Cette fonction traite les automatisations actives :

1. Récupère toutes les automatisations actives
2. Pour chaque automatisation :
   - Trouve les contacts qui correspondent au déclencheur
   - Crée ou met à jour les exécutions
   - Exécute les étapes en attente
3. Met à jour les statistiques

### Exécution

L'Edge Function `process-automations` doit être appelée périodiquement pour exécuter les automatisations. Vous pouvez :

1. **Appeler manuellement** via l'API Supabase
2. **Configurer un cron job** (recommandé toutes les heures)
3. **Déclencher via webhook** après certains événements (ex: ajout de contact)

---

## 📝 Exemple d'utilisation de l'API

### Appeler manuellement l'Edge Function

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/process-automations' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Configurer un cron job (Supabase)

Dans le dashboard Supabase, allez dans **Database > Cron Jobs** et créez :

```sql
-- Exécuter toutes les heures
SELECT cron.schedule(
  'process-automations-hourly',
  '0 * * * *', -- Toutes les heures
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-automations',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 🎨 Interface Utilisateur

### Page Segmentation

- Liste de tous les segments créés
- Recherche de segments
- Création/édition/suppression de segments
- Affichage du nombre de contacts dans chaque segment
- Statut actif/inactif

### Page Automatisations

- Liste de toutes les automatisations
- Recherche d'automatisations
- Création/édition/suppression d'automatisations
- Activation/désactivation
- Statistiques (emails envoyés, ouverts, cliqués)
- Visualisation des étapes

---

## 🚀 Prochaines Étapes

### Améliorations futures possibles

1. **Plus de déclencheurs** :
   - Anniversaire
   - Abandon de panier
   - Événements personnalisés

2. **Plus d'étapes** :
   - Conditions (si/alors)
   - Ajouter/retirer des tags
   - Ajouter/retirer des listes
   - Mettre à jour des champs

3. **Segmentation avancée** :
   - Segmentation comportementale (basée sur les ouvertures/clics)
   - Segmentation par tags
   - Combinaison de segments (ET/OU)

4. **Analytics** :
   - Performance des automatisations
   - Comparaison des segments
   - Recommandations

---

## 📚 Ressources

- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)

---

## ❓ FAQ

**Q : Les automatisations s'exécutent-elles automatiquement ?**  
R : Non, vous devez configurer un cron job ou appeler manuellement l'Edge Function `process-automations`.

**Q : Puis-je utiliser un segment dans plusieurs campagnes ?**  
R : Oui, les segments sont réutilisables.

**Q : Combien d'étapes puis-je avoir dans une automatisation ?**  
R : Il n'y a pas de limite technique, mais nous recommandons de garder les workflows simples et efficaces.

**Q : Les automatisations respectent-elles les quotas d'emails ?**  
R : Oui, les automatisations utilisent le même système d'envoi que les campagnes et respectent les quotas.

---

## 🐛 Dépannage

### Les automatisations ne s'exécutent pas

1. Vérifiez que l'automatisation est **active**
2. Vérifiez que l'Edge Function `process-automations` est appelée régulièrement
3. Vérifiez les logs dans Supabase pour voir les erreurs

### Les segments ne trouvent pas de contacts

1. Vérifiez que les critères correspondent aux données de vos contacts
2. Vérifiez que les contacts ont le statut "actif"
3. Testez avec des critères plus simples d'abord

---

**Dernière mise à jour** : Décembre 2024

