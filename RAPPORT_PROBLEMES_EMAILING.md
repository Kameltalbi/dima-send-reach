# Rapport d'Investigation - Problèmes d'Envoi d'Emails

## 🔴 Problèmes Critiques Identifiés

### 1. **Aucune Fonctionnalité d'Envoi d'Emails Implémentée**
**Problème** : Les boutons "Envoyer" dans `NouvelleCampagne.tsx` ne sont pas connectés à aucune fonctionnalité réelle. Il n'existe aucun code backend pour envoyer les emails via Amazon SES.

**Impact** : 
- Les utilisateurs ne peuvent pas envoyer de campagnes
- Les boutons "Envoyer maintenant" et "Envoyer le test" ne font rien
- Aucune intégration avec Amazon SES n'est fonctionnelle

**Fichiers concernés** :
- `src/pages/NouvelleCampagne.tsx` (lignes 41-44, 190, 222-225)
- Aucune edge function Supabase pour l'envoi d'emails

---

### 2. **Formulaires Non Connectés à Supabase**
**Problème** : Les formulaires de création de campagne ne sauvegardent pas les données dans Supabase.

**Détails** :
- Les champs de formulaire ne sont pas liés à un état React (`useState`)
- Aucun appel à `supabase.from('campaigns').insert()` ou `.update()`
- Les boutons "Enregistrer" et "Enregistrer en brouillon" ne font rien

**Fichiers concernés** :
- `src/pages/NouvelleCampagne.tsx` (tous les inputs sont non contrôlés)

---

### 3. **Pas de Récupération des Listes de Contacts**
**Problème** : La sélection de liste dans le formulaire affiche des données statiques au lieu de récupérer les listes réelles depuis Supabase.

**Détails** :
- Le `<Select>` affiche des valeurs hardcodées ("Newsletter mensuelle", "Clients VIP", etc.)
- Aucun `useEffect` pour charger les listes depuis `supabase.from('lists')`
- Aucune récupération des contacts associés à une liste

**Fichiers concernés** :
- `src/pages/NouvelleCampagne.tsx` (lignes 100-110)

---

### 4. **Pas de Fonctionnalité d'Envoi de Test**
**Problème** : Le bouton "Envoyer le test" n'a pas de handler `onClick` et ne fait rien.

**Détails** :
- Aucune fonction pour envoyer un email de test
- Pas de validation de l'adresse email de test
- Pas de feedback à l'utilisateur après l'envoi

**Fichiers concernés** :
- `src/pages/NouvelleCampagne.tsx` (ligne 190)

---

### 5. **Pas d'Edge Function Supabase pour l'Envoi**
**Problème** : Il n'existe aucune edge function Supabase pour gérer l'envoi d'emails de manière sécurisée.

**Pourquoi c'est important** :
- Les clés AWS SES ne doivent pas être exposées côté client
- L'envoi d'emails doit être fait côté serveur pour des raisons de sécurité
- Les edge functions permettent d'exécuter du code Node.js de manière sécurisée

**Ce qui manque** :
- `supabase/functions/send-email/index.ts` (ou similaire)
- Configuration pour utiliser le SDK AWS SES dans une edge function

---

### 6. **Configuration SES Non Complète**
**Problème** : Bien que `ConfigurationSES.tsx` sauvegarde la config dans Supabase, il y a un problème dans la requête.

**Détails** :
- La requête utilise `.eq("is_active", true)` mais la table `ses_config` n'a pas de colonne `is_active` dans le schéma initial
- Une migration existe qui ajoute `is_active`, mais il faut vérifier qu'elle est appliquée

**Fichiers concernés** :
- `src/pages/ConfigurationSES.tsx` (lignes 32, 63)

---

### 7. **Pas de Gestion des Destinataires**
**Problème** : Quand une campagne est créée, aucun enregistrement n'est créé dans `campaign_recipients`.

**Détails** :
- La table `campaign_recipients` existe dans le schéma mais n'est jamais utilisée
- Aucune logique pour créer les destinataires à partir d'une liste de contacts
- Pas de suivi du statut d'envoi par destinataire

---

### 8. **Pas de Gestion des Erreurs**
**Problème** : Aucune gestion d'erreurs pour les cas d'échec d'envoi.

**Détails** :
- Pas de retry logic en cas d'échec
- Pas de gestion des limites de taux AWS SES
- Pas de logging des erreurs

---

## 📋 Résumé des Problèmes par Priorité

### 🔴 Critique (Bloquant)
1. Aucune fonctionnalité d'envoi d'emails implémentée
2. Pas d'edge function Supabase pour l'envoi sécurisé
3. Formulaires non connectés à Supabase

### 🟡 Important (Fonctionnalités manquantes)
4. Pas de récupération des listes de contacts
5. Pas de fonctionnalité d'envoi de test
6. Pas de gestion des destinataires (`campaign_recipients`)

### 🟢 Amélioration (Nice to have)
7. Gestion des erreurs et retry logic
8. Validation des données avant envoi

---

## 💡 Solutions Recommandées

### Solution 1 : Créer une Edge Function Supabase pour l'Envoi
Créer `supabase/functions/send-campaign-email/index.ts` qui :
- Récupère la config SES depuis la base de données
- Utilise le SDK AWS SES pour envoyer les emails
- Met à jour le statut dans `campaign_recipients`
- Gère les erreurs et les retries

### Solution 2 : Connecter les Formulaires à Supabase
- Ajouter des états React pour tous les champs du formulaire
- Implémenter les fonctions `handleSave` et `handleSend`
- Charger les listes depuis Supabase dans un `useEffect`

### Solution 3 : Implémenter l'Envoi de Test
- Créer une fonction qui envoie un seul email de test
- Valider l'adresse email avant l'envoi
- Afficher un feedback à l'utilisateur

### Solution 4 : Gérer les Destinataires
- Lors de la création d'une campagne, créer les enregistrements dans `campaign_recipients`
- Implémenter un système de queue pour l'envoi en masse
- Mettre à jour les statuts au fur et à mesure de l'envoi

---

## 🔧 Fichiers à Modifier/Créer

### À Créer
- `supabase/functions/send-campaign-email/index.ts` - Edge function pour l'envoi
- `supabase/functions/send-test-email/index.ts` - Edge function pour les tests
- `src/lib/emailService.ts` - Service client pour appeler les edge functions

### À Modifier
- `src/pages/NouvelleCampagne.tsx` - Connecter les formulaires et ajouter la logique
- `src/pages/ConfigurationSES.tsx` - Corriger la requête si nécessaire

---

## 📝 Prochaines Étapes

1. ✅ Analyser le code existant (FAIT)
2. ⏳ Créer les edge functions Supabase pour l'envoi
3. ⏳ Connecter les formulaires à Supabase
4. ⏳ Implémenter l'envoi de test
5. ⏳ Gérer les destinataires et le suivi d'envoi
6. ⏳ Ajouter la gestion d'erreurs

---

*Rapport généré le : $(date)*


