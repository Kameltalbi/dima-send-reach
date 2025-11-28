# Configuration de l'image Open Graph

## Image créée

Une image Open Graph a été créée dans `public/og-image.svg` qui affiche :
- Une enveloppe avec des flèches vers le haut (symbolisant l'envoi d'emails)
- Le logo DimaMail
- Un fond dégradé violet

## Mise à jour du domaine

**IMPORTANT** : Vous devez remplacer `https://dimamail.com` par votre vrai domaine dans `index.html` :

1. Ouvrez `index.html`
2. Remplacez toutes les occurrences de `https://dimamail.com` par votre domaine réel
3. Par exemple : `https://votre-domaine.com`

## Conversion en PNG (optionnel)

Certains réseaux sociaux préfèrent les images PNG. Pour convertir le SVG en PNG :

1. Installez sharp : `npm install sharp`
2. Exécutez : `node scripts/generate-og-image.js`
3. Mettez à jour les meta tags pour pointer vers `/og-image.png` au lieu de `/og-image.svg`

## Test de l'image

Pour tester si l'image s'affiche correctement :

1. **Facebook Debugger** : https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator** : https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector** : https://www.linkedin.com/post-inspector/

Entrez votre URL et vérifiez que l'image s'affiche correctement.

## Note

Les réseaux sociaux mettent en cache les images. Si vous modifiez l'image, vous devrez peut-être :
- Utiliser les outils de débogage ci-dessus pour forcer le rafraîchissement du cache
- Attendre quelques heures pour que le cache expire

