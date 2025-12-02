// Spam Score Utility - Analyse le contenu email pour détecter les triggers de spam

interface SpamCheckResult {
  score: number; // 0-100 (0 = excellent, 100 = spam certain)
  level: 'excellent' | 'good' | 'warning' | 'danger';
  issues: SpamIssue[];
  suggestions: string[];
}

interface SpamIssue {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  count?: number;
}

// Mots-clés spam courants
const SPAM_KEYWORDS = {
  high: [
    'gratuit', 'free', 'gagnez', 'winner', 'congratulations', 'félicitations',
    'urgent', 'act now', 'agissez maintenant', 'limited time', 'temps limité',
    'click here', 'cliquez ici', 'buy now', 'achetez maintenant',
    '100%', 'garantie', 'guarantee', 'no obligation', 'sans engagement',
    'casino', 'lottery', 'loterie', 'jackpot', 'prize', 'prix',
    'viagra', 'cialis', 'pharmacy', 'pharmacie', 'medication', 'médicament',
  ],
  medium: [
    'offre exclusive', 'exclusive offer', 'special promotion', 'promotion spéciale',
    'deal', 'discount', 'réduction', 'soldes', 'promo', 'save', 'économisez',
    'money back', 'remboursement', 'risk free', 'sans risque',
    'subscribe', 'unsubscribe', 'désabonner', 'opt-out',
    'credit card', 'carte de crédit', 'payment', 'paiement',
    'income', 'revenu', 'earnings', 'gains', 'investment', 'investissement',
  ],
  low: [
    'newsletter', 'bulletin', 'news', 'actualités', 'update', 'mise à jour',
    'information', 'announcement', 'annonce', 'reminder', 'rappel',
  ],
};

// Patterns suspects
const SUSPICIOUS_PATTERNS = {
  allCaps: /\b[A-Z]{4,}\b/g,
  excessiveExclamation: /!{2,}/g,
  dollarSigns: /\${2,}|\$\d+/g,
  percentages: /\d+%/g,
  multipleQuestionMarks: /\?{2,}/g,
  consecutiveNumbers: /\d{10,}/g,
  hiddenText: /color:\s*#?(?:fff|ffffff|white)/gi,
  suspiciousLinks: /https?:\/\/[^\s<]+\.(xyz|top|click|link|tk|ga|ml|cf)/gi,
};

export function analyzeSpamScore(
  subject: string,
  htmlContent: string,
  senderName: string,
  senderEmail: string
): SpamCheckResult {
  const issues: SpamIssue[] = [];
  const suggestions: string[] = [];
  let totalScore = 0;

  // Extraire le texte brut du HTML
  const textContent = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const subjectLower = subject.toLowerCase();
  const fullText = `${subject} ${textContent}`;

  // 1. Vérifier les mots-clés spam
  let spamKeywordCount = 0;
  
  SPAM_KEYWORDS.high.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = fullText.match(regex);
    if (matches) {
      spamKeywordCount += matches.length * 3;
      totalScore += matches.length * 5;
    }
  });

  SPAM_KEYWORDS.medium.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = fullText.match(regex);
    if (matches) {
      spamKeywordCount += matches.length * 2;
      totalScore += matches.length * 3;
    }
  });

  if (spamKeywordCount > 0) {
    issues.push({
      type: 'spam_keywords',
      description: `${spamKeywordCount} mot(s) considéré(s) comme spam détecté(s)`,
      severity: spamKeywordCount > 5 ? 'high' : spamKeywordCount > 2 ? 'medium' : 'low',
      count: spamKeywordCount,
    });
    suggestions.push('Évitez les mots comme "gratuit", "urgent", "gagnez" dans le sujet et le contenu');
  }

  // 2. Vérifier le sujet
  if (subject.length === 0) {
    issues.push({
      type: 'empty_subject',
      description: 'Le sujet est vide',
      severity: 'high',
    });
    totalScore += 20;
    suggestions.push('Ajoutez un sujet clair et descriptif');
  } else if (subject.length < 10) {
    issues.push({
      type: 'short_subject',
      description: 'Le sujet est trop court (moins de 10 caractères)',
      severity: 'medium',
    });
    totalScore += 10;
    suggestions.push('Utilisez un sujet plus descriptif (20-60 caractères recommandé)');
  } else if (subject.length > 70) {
    issues.push({
      type: 'long_subject',
      description: 'Le sujet est trop long (plus de 70 caractères)',
      severity: 'low',
    });
    totalScore += 5;
    suggestions.push('Raccourcissez votre sujet pour éviter la troncature');
  }

  // 3. Vérifier les majuscules excessives
  const capsMatches = subject.match(SUSPICIOUS_PATTERNS.allCaps) || [];
  const contentCapsMatches = textContent.match(SUSPICIOUS_PATTERNS.allCaps) || [];
  const totalCaps = capsMatches.length + contentCapsMatches.length;
  
  if (totalCaps > 3) {
    issues.push({
      type: 'excessive_caps',
      description: `${totalCaps} mot(s) en MAJUSCULES détecté(s)`,
      severity: totalCaps > 10 ? 'high' : 'medium',
      count: totalCaps,
    });
    totalScore += totalCaps * 2;
    suggestions.push('Évitez les MAJUSCULES excessives qui sont considérées comme agressives');
  }

  // 4. Vérifier les points d'exclamation
  const exclamationMatches = fullText.match(SUSPICIOUS_PATTERNS.excessiveExclamation) || [];
  const singleExclamations = (fullText.match(/!/g) || []).length;
  
  if (exclamationMatches.length > 0 || singleExclamations > 5) {
    issues.push({
      type: 'excessive_exclamation',
      description: `Trop de points d'exclamation (${singleExclamations})`,
      severity: singleExclamations > 10 ? 'high' : 'medium',
      count: singleExclamations,
    });
    totalScore += singleExclamations * 2;
    suggestions.push("Réduisez le nombre de points d'exclamation");
  }

  // 5. Vérifier le ratio texte/images
  const imgTags = (htmlContent.match(/<img/gi) || []).length;
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
  
  if (imgTags > 5 && wordCount < 100) {
    issues.push({
      type: 'low_text_ratio',
      description: 'Trop d\'images par rapport au texte',
      severity: 'medium',
    });
    totalScore += 15;
    suggestions.push('Ajoutez plus de texte pour équilibrer le ratio images/texte');
  }

  if (wordCount < 50) {
    issues.push({
      type: 'low_content',
      description: 'Contenu textuel insuffisant',
      severity: 'medium',
    });
    totalScore += 10;
    suggestions.push('Ajoutez plus de contenu textuel (minimum 50 mots recommandé)');
  }

  // 6. Vérifier les liens
  const links = htmlContent.match(/href=["'][^"']+["']/gi) || [];
  const suspiciousLinks = htmlContent.match(SUSPICIOUS_PATTERNS.suspiciousLinks) || [];
  
  if (suspiciousLinks.length > 0) {
    issues.push({
      type: 'suspicious_links',
      description: `${suspiciousLinks.length} lien(s) suspect(s) détecté(s)`,
      severity: 'high',
      count: suspiciousLinks.length,
    });
    totalScore += suspiciousLinks.length * 10;
    suggestions.push('Évitez les domaines suspects (.xyz, .tk, etc.)');
  }

  if (links.length > 10) {
    issues.push({
      type: 'too_many_links',
      description: `Trop de liens (${links.length})`,
      severity: 'medium',
      count: links.length,
    });
    totalScore += 10;
    suggestions.push('Réduisez le nombre de liens (maximum 10 recommandé)');
  }

  // 7. Vérifier l'email expéditeur
  if (senderEmail.includes('noreply') || senderEmail.includes('no-reply')) {
    issues.push({
      type: 'noreply_sender',
      description: "L'email expéditeur contient 'noreply'",
      severity: 'low',
    });
    totalScore += 5;
    suggestions.push("Utilisez une adresse email répondable pour améliorer la confiance");
  }

  const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const senderDomain = senderEmail.split('@')[1]?.toLowerCase();
  if (genericDomains.includes(senderDomain)) {
    issues.push({
      type: 'generic_domain',
      description: "L'email utilise un domaine générique (Gmail, Yahoo, etc.)",
      severity: 'medium',
    });
    totalScore += 10;
    suggestions.push("Utilisez un domaine professionnel pour vos envois");
  }

  // 8. Vérifier le texte alternatif des images
  const imagesWithoutAlt = (htmlContent.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
  if (imagesWithoutAlt > 0) {
    issues.push({
      type: 'missing_alt',
      description: `${imagesWithoutAlt} image(s) sans texte alternatif`,
      severity: 'low',
      count: imagesWithoutAlt,
    });
    totalScore += imagesWithoutAlt * 2;
    suggestions.push("Ajoutez un attribut 'alt' à toutes vos images");
  }

  // 9. Vérifier le lien de désabonnement
  const hasUnsubscribe = /unsubscribe|désabonner|désabonnement|se désinscrire/gi.test(htmlContent);
  if (!hasUnsubscribe) {
    issues.push({
      type: 'no_unsubscribe',
      description: 'Lien de désabonnement non détecté',
      severity: 'medium',
    });
    totalScore += 10;
    suggestions.push("Ajoutez un lien de désabonnement visible (sera ajouté automatiquement)");
  }

  // Calculer le niveau final
  totalScore = Math.min(100, Math.max(0, totalScore));
  
  let level: SpamCheckResult['level'];
  if (totalScore <= 20) {
    level = 'excellent';
  } else if (totalScore <= 40) {
    level = 'good';
  } else if (totalScore <= 60) {
    level = 'warning';
  } else {
    level = 'danger';
  }

  // Ajouter des suggestions générales si score élevé
  if (totalScore > 40 && suggestions.length < 3) {
    suggestions.push('Personnalisez votre contenu avec le nom du destinataire');
    suggestions.push("Testez votre email avec différents clients de messagerie");
  }

  return {
    score: totalScore,
    level,
    issues,
    suggestions: [...new Set(suggestions)].slice(0, 5),
  };
}

export function getScoreColor(level: SpamCheckResult['level']): string {
  switch (level) {
    case 'excellent': return 'text-green-600';
    case 'good': return 'text-blue-600';
    case 'warning': return 'text-yellow-600';
    case 'danger': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
}

export function getScoreLabel(level: SpamCheckResult['level']): string {
  switch (level) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Bon';
    case 'warning': return 'Attention';
    case 'danger': return 'Risqué';
    default: return 'Inconnu';
  }
}
