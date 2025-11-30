# 🔥 Installation du Système de Warming

## 📋 Vue d'ensemble

Le système de warming a été installé pour limiter progressivement les volumes d'envoi d'emails et établir une bonne réputation auprès des fournisseurs d'email.

## ✅ Ce qui a été créé

### 1. **Migration SQL** (`20251202000000_add_email_warming.sql`)
- Table `email_warming` pour tracker le warming par organisation
- Fonctions SQL pour calculer les limites automatiquement
- Système de progression sur 6 semaines (42 jours)

### 2. **Utilitaire TypeScript** (`warming-check.ts`)
- Fonction `checkWarmingLimit()` pour vérifier les limites
- Fonction `getWarmingInfo()` pour obtenir les infos de warming

### 3. **Intégration dans le système de quota**
- Le warming est vérifié AVANT le quota mensuel
- Messages d'erreur incluent les infos de warming

## 🚀 Installation

### Étape 1 : Appliquer la migration

```bash
# Via Supabase CLI
supabase db push

# Ou via le dashboard Supabase
# Aller dans SQL Editor et exécuter le fichier de migration
```

### Étape 2 : Vérifier l'installation

```sql
-- Vérifier que la table existe
SELECT * FROM email_warming LIMIT 1;

-- Tester la fonction de calcul de limite
SELECT get_warming_limit(1);  -- Devrait retourner 50
SELECT get_warming_limit(7);   -- Devrait retourner 300
SELECT get_warming_limit(42);  -- Devrait retourner 20000
```

### Étape 3 : Déployer les Edge Functions

```bash
# Déployer la fonction send-email avec les nouvelles vérifications
supabase functions deploy send-email
```

## 📊 Plan de warming automatique

Le système suit cette progression automatique :

| Jour | Limite/jour | Total cumulé |
|------|-------------|--------------|
| 1 | 50 | 50 |
| 2 | 75 | 125 |
| 3 | 100 | 225 |
| 4 | 150 | 375 |
| 5 | 200 | 575 |
| 7 | 300 | 1,175 |
| 10 | 500 | 2,675 |
| 14 | 1,000 | 6,675 |
| 21 | 2,000 | 20,675 |
| 28 | 5,000 | 55,675 |
| 35 | 10,000 | 125,675 |
| 42 | 20,000 | 245,675 |
| Après 42 jours | Illimité* | - |

*Illimité selon le quota mensuel du plan

## 🔧 Fonctionnement

### Création automatique
- Le warming est créé automatiquement lors de la première tentative d'envoi
- Un enregistrement par organisation (et optionnellement par domaine)

### Mise à jour automatique
- Le système calcule automatiquement le jour actuel
- Met à jour la limite quotidienne selon la progression
- Après 42 jours, le warming est automatiquement désactivé

### Vérification avant envoi
1. Vérification du warming (limite quotidienne)
2. Si OK, vérification du quota mensuel
3. Si les deux sont OK, l'envoi est autorisé

## 🎛️ Configuration

### Désactiver le warming pour une organisation

```sql
UPDATE email_warming
SET is_active = false
WHERE organization_id = 'UUID_DE_L_ORGANISATION';
```

### Réinitialiser le warming

```sql
UPDATE email_warming
SET 
  started_at = now(),
  current_day = 1,
  max_emails_today = 50,
  total_emails_sent = 0,
  warming_completed_at = NULL,
  is_active = true
WHERE organization_id = 'UUID_DE_L_ORGANISATION';
```

### Voir le statut du warming

```sql
SELECT 
  o.nom as organisation,
  ew.current_day,
  ew.max_emails_today,
  ew.total_emails_sent,
  ew.is_active,
  ew.warming_completed_at
FROM email_warming ew
JOIN organizations o ON o.id = ew.organization_id
WHERE ew.organization_id = 'UUID_DE_L_ORGANISATION';
```

## 📈 Monitoring

### Voir les emails envoyés aujourd'hui

```sql
SELECT 
  o.nom as organisation,
  COUNT(c.id) as campagnes_aujourd_hui,
  COALESCE(SUM(cs.total_envoyes), 0) as emails_envoyes
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id
LEFT JOIN campaigns c ON c.user_id = p.id
LEFT JOIN campaign_stats cs ON cs.campaign_id = c.id
WHERE DATE(c.date_envoi) = CURRENT_DATE
  AND c.statut = 'envoye'
GROUP BY o.id, o.nom;
```

## ⚠️ Notes importantes

1. **Resend gère déjà le warming** : Si vous utilisez Resend avec IPs partagées, le warming est déjà géré. Ce système ajoute une couche supplémentaire de sécurité.

2. **Pour les nouveaux comptes** : Le warming s'applique automatiquement aux nouvelles organisations.

3. **Pour les comptes existants** : Les organisations existantes n'ont pas de warming actif par défaut. Vous pouvez l'activer manuellement si nécessaire.

4. **Désactivation** : Si vous voulez désactiver le warming pour toutes les organisations :
   ```sql
   UPDATE email_warming SET is_active = false;
   ```

## 🐛 Dépannage

### Le warming bloque tous les envois

```sql
-- Vérifier le statut
SELECT * FROM email_warming WHERE is_active = true;

-- Désactiver temporairement
UPDATE email_warming SET is_active = false;
```

### Les limites ne se mettent pas à jour

```sql
-- Forcer la mise à jour
SELECT get_or_create_warming('UUID_DE_L_ORGANISATION', NULL);
```

### Erreur "function does not exist"

Vérifiez que la migration a été appliquée :
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%warming%';
```

## 📚 Documentation

- [Explication du warming](./EXPLICATION_EMAIL_WARMING.md)
- [Fonctions SQL créées](./supabase/migrations/20251202000000_add_email_warming.sql)

## ✅ Vérification finale

Après l'installation, testez avec :

```typescript
// Dans votre code
const { data, error } = await supabase.rpc('check_warming_limit', {
  p_organization_id: 'VOTRE_ORG_ID',
  p_domain: null,
  p_email_count: 100
});

console.log(data); // Devrait retourner les infos de warming
```

