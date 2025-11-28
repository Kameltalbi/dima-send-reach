# Edge Function pour l'envoi d'emails

## Installation

Pour activer l'envoi réel d'emails via AWS SES, vous devez :

1. **Installer AWS SDK dans l'Edge Function** :
   ```bash
   cd supabase/functions/send-email
   ```

2. **Modifier `index.ts`** pour utiliser le SDK AWS SES réel :
   - Décommenter le code dans la section TODO
   - Installer les dépendances nécessaires

3. **Déployer l'Edge Function** :
   ```bash
   supabase functions deploy send-email
   ```

4. **Configurer les variables d'environnement** dans Supabase Dashboard :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

5. **Appeler l'Edge Function depuis le frontend** :
   ```typescript
   const { data, error } = await supabase.functions.invoke('send-email', {
     body: { campaignId: 'xxx' }
   });
   ```

## Note

L'Edge Function actuelle est un squelette. Pour l'envoi réel, vous devrez :
- Installer `@aws-sdk/client-ses`
- Configurer les credentials AWS
- Gérer les erreurs et retries
- Implémenter le tracking (ouvertures, clics)

