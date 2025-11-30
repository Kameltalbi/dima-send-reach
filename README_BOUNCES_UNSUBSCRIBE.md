# 🚫 Gestion des Bounces et Désabonnements - Guide Complet

## 📋 Vue d'ensemble

DymaMail inclut maintenant un système complet de gestion des bounces et désabonnements pour maintenir une bonne réputation d'envoi et respecter les préférences des contacts.

---

## 🔴 Gestion des Bounces

### Qu'est-ce qu'un bounce ?

Un **bounce** est un email qui ne peut pas être livré au destinataire. Il existe deux types principaux :

1. **Hard bounce** : Erreur permanente (adresse email invalide, domaine inexistant)
2. **Soft bounce** : Erreur temporaire (boîte mail pleine, serveur indisponible)
3. **Complaint** : Plainte spam (l'utilisateur a marqué l'email comme spam)

### Fonctionnalités implémentées

#### 1. **Détection automatique via webhook Resend**

- Edge Function `resend-webhook` qui reçoit les notifications de bounces depuis Resend
- Traitement automatique des bounces (hard, soft, complaints)
- Mise à jour automatique du statut des contacts

#### 2. **Page de gestion des bounces**

- Liste de tous les bounces avec filtres (type, statut)
- Statistiques en temps réel (total, hard, soft, complaints)
- Actions : marquer comme traité, supprimer
- Recherche par email ou raison

#### 3. **Traitement automatique**

- **Hard bounce** : Après 3 hard bounces, le contact est marqué comme "erreur" et supprimé
- **Complaint** : Suppression immédiate du contact et désabonnement
- **Soft bounce** : Enregistré mais pas de suppression automatique

### Configuration du webhook Resend

1. Allez dans votre dashboard Resend
2. Créez un nouveau webhook pointant vers :
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/resend-webhook
   ```
3. Sélectionnez les événements :
   - `email.bounced` (hard et soft bounces)
   - `email.complained` (plaintes spam)
4. Sauvegardez le webhook

### Utilisation

1. Accédez à **Bounces** dans le menu latéral
2. Consultez les statistiques en haut de la page
3. Filtrez par type ou statut
4. Marquez les bounces comme traités ou supprimez-les

---

## 📧 Gestion des Désabonnements

### Fonctionnalités implémentées

#### 1. **Page de désabonnement améliorée**

- Désabonnement simple (un clic)
- **Préférences granulaires** : choisir les types d'emails à recevoir
- Raison du désabonnement (optionnel)
- Confirmation visuelle

#### 2. **Types de désabonnement**

- **Désabonnement total** : Ne plus recevoir aucun email
- **Désabonnement sélectif** : Choisir les types d'emails :
  - Newsletters
  - Promotions et offres
  - Emails transactionnels
  - Mises à jour importantes

#### 3. **Stockage des préférences**

- Table `unsubscribe_preferences` pour stocker les choix
- Historique des raisons de désabonnement
- Possibilité de réabonnement futur

### Utilisation

1. Les liens de désabonnement sont automatiquement ajoutés dans chaque email
2. L'utilisateur clique sur le lien
3. Il choisit ses préférences :
   - Désabonnement total OU
   - Désabonnement sélectif (choisir les types)
4. Optionnellement, il peut indiquer une raison
5. Confirmation du désabonnement

---

## 🗄️ Structure de la Base de Données

### Table `bounces`

```sql
- id: UUID
- user_id: UUID (référence à l'utilisateur)
- contact_id: UUID (référence au contact)
- campaign_id: UUID (référence à la campagne)
- email: TEXT (adresse email)
- bounce_type: TEXT ('hard', 'soft', 'complaint', 'unknown')
- bounce_reason: TEXT (raison du bounce)
- bounce_code: TEXT (code d'erreur)
- bounce_message: TEXT (message d'erreur)
- source: TEXT ('resend', 'manual', 'system')
- is_processed: BOOLEAN
- action_taken: TEXT ('none', 'removed', 'marked_inactive', 'suppressed')
- created_at: TIMESTAMP
```

### Table `unsubscribe_preferences`

```sql
- id: UUID
- contact_id: UUID (référence au contact)
- user_id: UUID (référence à l'utilisateur)
- email: TEXT
- unsubscribe_all: BOOLEAN
- preferences: JSONB (préférences par type d'email)
- reason: TEXT (raison du désabonnement)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Colonnes ajoutées à `contacts`

```sql
- bounce_count: INTEGER (nombre de bounces)
- last_bounce_at: TIMESTAMP (dernier bounce)
- is_suppressed: BOOLEAN (contact supprimé)
```

---

## 🔧 Fonctions SQL

### `process_bounce(contact_id, bounce_type, user_id)`

Traite automatiquement un bounce :
- Met à jour le compteur de bounces
- Supprime le contact après 3 hard bounces
- Supprime immédiatement en cas de complaint

### `get_bounce_stats(user_id)`

Retourne les statistiques de bounces pour un utilisateur :
- Total bounces
- Hard bounces
- Soft bounces
- Complaints
- Bounces non traités
- Contacts supprimés

---

## 🚀 Edge Functions

### `resend-webhook`

**Endpoint** : `POST /functions/v1/resend-webhook`

**Description** : Reçoit les webhooks de Resend pour les bounces et complaints.

**Événements traités** :
- `email.bounced` : Hard et soft bounces
- `email.complained` : Plaintes spam

**Actions** :
1. Crée un enregistrement dans `bounces`
2. Appelle `process_bounce()` pour traitement automatique
3. Met à jour le statut du contact si nécessaire

### `unsubscribe` (amélioré)

**Endpoint** : 
- `GET /functions/v1/unsubscribe?r={recipientId}` : Désabonnement simple
- `POST /functions/v1/unsubscribe?r={recipientId}` : Désabonnement avec préférences

**Body (POST)** :
```json
{
  "recipientId": "uuid",
  "unsubscribeAll": true,
  "preferences": {
    "newsletters": false,
    "promotions": true,
    "transactional": true,
    "updates": false
  },
  "reason": "Trop d'emails"
}
```

---

## 📊 Statistiques et Rapports

### Page Bounces

- **Total bounces** : Nombre total de bounces
- **Hard bounces** : Bounces permanents
- **Soft bounces** : Bounces temporaires
- **Plaintes spam** : Nombre de complaints
- **Contacts supprimés** : Contacts marqués comme supprimés

### Filtres disponibles

- **Type** : Tous, Hard, Soft, Complaint
- **Statut** : Tous, Traités, Non traités
- **Recherche** : Par email ou raison

---

## 🔒 Conformité RGPD/GDPR

### Respect des préférences

- Les préférences de désabonnement sont stockées et respectées
- Les contacts désabonnés ne reçoivent plus d'emails
- Possibilité de réabonnement

### Suppression des données

- Les contacts avec trop de bounces sont automatiquement supprimés
- Les contacts qui se plaignent sont immédiatement supprimés
- Conformité avec les réglementations anti-spam

---

## 🎯 Bonnes Pratiques

### Pour les bounces

1. **Surveillez régulièrement** la page Bounces
2. **Traitement rapide** des hard bounces (suppression après 3)
3. **Analysez les raisons** pour améliorer votre liste
4. **Nettoyez régulièrement** votre liste de contacts

### Pour les désabonnements

1. **Respectez les préférences** des utilisateurs
2. **Offrez des options** de désabonnement sélectif
3. **Collectez les raisons** pour améliorer votre communication
4. **Rendez le processus simple** et transparent

---

## 🐛 Dépannage

### Les bounces ne sont pas détectés

1. Vérifiez que le webhook Resend est configuré correctement
2. Vérifiez les logs de l'Edge Function `resend-webhook`
3. Testez manuellement en envoyant un email à une adresse invalide

### Les désabonnements ne fonctionnent pas

1. Vérifiez que le lien de désabonnement est présent dans les emails
2. Vérifiez les logs de l'Edge Function `unsubscribe`
3. Testez le lien de désabonnement manuellement

### Contacts supprimés par erreur

1. Consultez l'historique des bounces
2. Vérifiez le nombre de bounces du contact
3. Restaurez manuellement le contact si nécessaire

---

## 📚 Ressources

- [Documentation Resend Webhooks](https://resend.com/docs/dashboard/webhooks)
- [Guide anti-spam](https://www.campaignmonitor.com/resources/guides/email-deliverability/)
- [RGPD - Droit à l'oubli](https://www.cnil.fr/fr/le-droit-a-loubli)

---

**Dernière mise à jour** : Décembre 2024

