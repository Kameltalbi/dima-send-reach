# 💳 Intégration Konnect - Guide de Configuration

## 📋 Vue d'ensemble

Konnect est la passerelle de paiement tunisienne intégrée dans DimaMail pour les paiements par carte bancaire.

## 🔧 Configuration

### 1. Créer un compte Konnect

1. Inscrivez-vous sur [konnect.network](https://konnect.network)
2. Complétez votre profil marchand
3. Obtenez vos clés API :
   - **API Key** (Wallet ID)
   - **Secret Key**

### 2. Configurer les variables d'environnement Supabase

Dans le dashboard Supabase, allez dans **Settings > Edge Functions > Secrets** et ajoutez :

```
KONNECT_API_KEY=votre_wallet_id
KONNECT_SECRET_KEY=votre_secret_key
KONNECT_BASE_URL=https://api.konnect.network/api/v2
```

### 3. Déployer l'Edge Function

```bash
supabase functions deploy create-konnect-payment
supabase functions deploy konnect-webhook
```

### 4. Configurer le Webhook Konnect

Dans votre dashboard Konnect :
1. Allez dans **Settings > Webhooks**
2. Ajoutez l'URL : `https://votre-projet.supabase.co/functions/v1/konnect-webhook`
3. Sélectionnez les événements : `payment.accepted`, `payment.rejected`, `payment.failed`

## 💰 Frais Konnect

- **Cartes tunisiennes** : 1.3% par transaction
- **Cartes internationales** : 2.9% par transaction
- **Pas de frais** d'installation ou d'abonnement

## 🔄 Flux de Paiement

1. L'utilisateur sélectionne "Carte bancaire" sur `/checkout`
2. Remplit les informations de carte
3. Clique sur "Payer maintenant"
4. Redirection vers la page de paiement Konnect
5. L'utilisateur complète le paiement sur Konnect
6. Redirection vers `/checkout/success?orderId=xxx`
7. Le webhook Konnect met à jour le statut
8. L'abonnement est activé automatiquement

## 📝 Structure de la Commande

La table `orders` stocke :
- `konnect_payment_id` : ID du paiement Konnect
- `payment_status` : Statut (pending, completed, failed)
- `payment_method` : "card" pour les paiements Konnect

## 🧪 Mode Test

Konnect fournit un environnement de test :
- Utilisez les clés de test depuis le dashboard
- Les paiements de test sont marqués comme "TEST"
- Aucun vrai argent n'est débité

## 🔐 Sécurité

- ✅ Les credentials sont stockés dans les secrets Supabase
- ✅ Les webhooks peuvent être signés (à implémenter)
- ✅ Aucune donnée bancaire n'est stockée localement
- ✅ Konnect est PCI DSS compliant

## 📚 Documentation Konnect

- [Documentation API](https://developers.konnect.network/)
- [Guide d'intégration](https://developers.konnect.network/docs)
- [Support](https://konnect.network/support)

## ⚠️ Notes Importantes

1. **Environnement de production** : Utilisez les vraies clés API
2. **Webhooks** : Configurez-les correctement pour la confirmation automatique
3. **Gestion des erreurs** : Implémentez la gestion des échecs de paiement
4. **Tests** : Testez avec des montants réels avant la mise en production

## 🐛 Dépannage

### Le paiement ne fonctionne pas
- Vérifiez que les clés API sont correctes
- Vérifiez que l'Edge Function est déployée
- Consultez les logs Supabase

### Le webhook ne reçoit pas les notifications
- Vérifiez l'URL du webhook dans Konnect
- Vérifiez que l'Edge Function est accessible publiquement
- Consultez les logs de l'Edge Function

