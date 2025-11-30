# Analyse : Capacité d'envoi de 100 000 emails

## 🔴 Problèmes identifiés

### 1. **Limite de timeout de l'Edge Function**
- **Problème** : La fonction `send-email` charge TOUS les 100k destinataires en mémoire et les traite dans une seule boucle
- **Impact** : 
  - Supabase Edge Functions ont un timeout de **60 secondes** (gratuit) ou **300 secondes** (Pro)
  - Pour 100k emails, le traitement prendrait bien plus de 60s
  - **Résultat** : Timeout avant la fin du traitement

### 2. **Limite de mémoire**
- **Problème** : Chargement de 100k destinataires + leurs contacts en mémoire
- **Impact** :
  - Chaque destinataire = ~500 bytes de données
  - 100k × 500 bytes = ~50 MB minimum
  - Ajout du HTML personnalisé pour chaque email = plusieurs centaines de MB
  - **Résultat** : Risque de dépassement de mémoire

### 3. **Insertion en batch unique**
- **Problème** : Insertion de 100k emails dans `email_queue` en une seule requête
- **Impact** :
  - Supabase a des limites sur la taille des requêtes
  - Risque d'échec si la requête est trop volumineuse
  - **Résultat** : Échec silencieux ou erreur

### 4. **Rate limiting actuel**
- **Configuration actuelle** : 3 emails/seconde (330ms entre chaque email)
- **Temps d'envoi pour 100k emails** : ~9.3 heures
- **Impact** : Acceptable mais lent

### 5. **Limites Resend API**
- **Free tier** : 100 emails/jour
- **Paid plans** : Jusqu'à 50k/mois selon le plan
- **Impact** : Pour 100k emails, il faut un plan Resend adapté

## ✅ Solutions proposées

### Solution 1 : Traitement par batch dans `send-email`

**Modification** : Traiter les destinataires par batch de 1000 au lieu de tous en une fois

```typescript
// Au lieu de charger tous les destinataires :
const { data: recipients } = await supabaseClient
  .from("campaign_recipients")
  .select("*, contacts(*)")
  .eq("campaign_id", campaignId)
  .eq("statut_envoi", "en_attente");

// Traiter par batch de 1000 :
const BATCH_SIZE = 1000;
let offset = 0;
let hasMore = true;

while (hasMore) {
  const { data: recipients } = await supabaseClient
    .from("campaign_recipients")
    .select("*, contacts(*)")
    .eq("campaign_id", campaignId)
    .eq("statut_envoi", "en_attente")
    .range(offset, offset + BATCH_SIZE - 1);
  
  if (!recipients || recipients.length === 0) {
    hasMore = false;
    break;
  }
  
  // Traiter ce batch
  // Insérer dans email_queue par batch de 1000
  
  offset += BATCH_SIZE;
  hasMore = recipients.length === BATCH_SIZE;
}
```

### Solution 2 : Insertion par batch dans `email_queue`

**Modification** : Insérer les emails par batch de 1000 au lieu d'un seul insert

```typescript
// Insérer par batch de 1000
const INSERT_BATCH_SIZE = 1000;
for (let i = 0; i < emailsToQueue.length; i += INSERT_BATCH_SIZE) {
  const batch = emailsToQueue.slice(i, i + INSERT_BATCH_SIZE);
  await supabaseClient
    .from("email_queue")
    .insert(batch);
}
```

### Solution 3 : Augmenter le rate limit (optionnel)

**Modification** : Augmenter de 3 à 10 emails/seconde si Resend le permet

```typescript
const RATE_LIMIT_DELAY_MS = 100; // 10 emails/second au lieu de 3
```

**Temps d'envoi** : ~2.8 heures au lieu de 9.3 heures

### Solution 4 : Vérifier le plan Resend

**Action requise** : Vérifier que le plan Resend permet d'envoyer 100k emails/mois

## 📊 Comparaison avant/après

| Aspect | Avant | Après (avec solutions) |
|--------|-------|------------------------|
| **Timeout** | ❌ Échec après 60s | ✅ Traitement par batch < 60s |
| **Mémoire** | ❌ Risque de dépassement | ✅ Traitement par batch < limite |
| **Insertion DB** | ❌ Risque d'échec | ✅ Insertion par batch de 1000 |
| **Temps total** | ~9.3 heures | ~9.3 heures (ou ~2.8h si rate limit augmenté) |

## 🚀 Plan d'action recommandé

1. **Immédiat** : Implémenter le traitement par batch dans `send-email`
2. **Immédiat** : Implémenter l'insertion par batch dans `email_queue`
3. **Optionnel** : Augmenter le rate limit si Resend le permet
4. **Vérification** : Confirmer le plan Resend pour 100k emails/mois

## ⚠️ Notes importantes

- Le système de queue existant (`process-email-queue`) fonctionne correctement
- Le problème est uniquement dans la fonction `send-email` qui prépare les emails
- Une fois les emails dans la queue, ils seront traités correctement par le cron job

