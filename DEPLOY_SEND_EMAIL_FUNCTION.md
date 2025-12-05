# Guide de déploiement de la fonction send-email

## Problème actuel
L'Edge Function `send-email` retourne un status 400, ce qui empêche le client de lire le message d'erreur détaillé.

## Solution
La fonction a été modifiée pour toujours retourner un status 200 avec `success: false` en cas d'erreur, permettant au client de toujours lire le message d'erreur.

## Déploiement manuel via le Dashboard Supabase

1. **Connectez-vous au Dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accédez aux Edge Functions**
   - Dans le menu de gauche, cliquez sur "Edge Functions"
   - Trouvez la fonction `send-email` dans la liste

3. **Modifiez le code**
   - Cliquez sur `send-email` pour ouvrir l'éditeur
   - Remplacez tout le contenu par le code du fichier `supabase/functions/send-email/index.ts`
   - **Important** : Assurez-vous que toutes les modifications sont présentes, notamment :
     - Les status codes d'erreur changés en 200
     - La gestion améliorée des erreurs dans `sendWithResend`
     - La validation améliorée des champs

4. **Déployez**
   - Cliquez sur "Deploy" ou "Save"
   - Attendez la confirmation du déploiement

## Vérification

Après le déploiement, testez l'envoi d'un email de test. Vous devriez maintenant voir des messages d'erreur détaillés au lieu de "Edge Function returned a non-2xx status code".

## Causes possibles d'erreur après déploiement

1. **RESEND_API_KEY non configurée**
   - Allez dans Settings → Edge Functions → Secrets
   - Ajoutez la variable `RESEND_API_KEY` avec votre clé API Resend

2. **Email expéditeur non vérifié**
   - Dans votre compte Resend, vérifiez que l'email de l'expéditeur est vérifié
   - Les emails de test nécessitent un domaine ou email vérifié dans Resend

3. **Format d'email invalide**
   - Vérifiez que tous les champs (to, subject, html, fromName, fromEmail) sont remplis
   - Vérifiez que les emails sont au format valide

