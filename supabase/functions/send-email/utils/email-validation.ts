/**
 * Validation d'email côté serveur
 */

// Regex pour validation d'email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Liste de domaines de test/throwaway à bloquer
const BLOCKED_DOMAINS = [
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
];

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
  isDisposable?: boolean;
  normalizedEmail?: string;
}

/**
 * Valide un email selon plusieurs critères
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== "string") {
    return {
      valid: false,
      reason: "Email vide ou invalide",
    };
  }

  // Normaliser l'email (minuscules, trim)
  const normalizedEmail = email.toLowerCase().trim();

  // Vérifier le format de base
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return {
      valid: false,
      reason: "Format d'email invalide",
    };
  }

  // Vérifier la longueur
  if (normalizedEmail.length > 254) {
    return {
      valid: false,
      reason: "Email trop long (max 254 caractères)",
    };
  }

  // Extraire le domaine
  const domain = normalizedEmail.split("@")[1];

  if (!domain) {
    return {
      valid: false,
      reason: "Domaine manquant",
    };
  }

  // Vérifier les domaines jetables
  const isDisposable = BLOCKED_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`)
  );

  if (isDisposable) {
    return {
      valid: false,
      reason: "Les emails jetables ne sont pas autorisés",
      isDisposable: true,
    };
  }

  // Vérifier les caractères interdits
  if (/[<>]/.test(normalizedEmail)) {
    return {
      valid: false,
      reason: "Caractères interdits dans l'email",
    };
  }

  return {
    valid: true,
    normalizedEmail,
    isDisposable: false,
  };
}

/**
 * Valide une liste d'emails et retourne les résultats
 */
export function validateEmailList(emails: string[]): {
  valid: string[];
  invalid: Array<{ email: string; reason: string }>;
} {
  const valid: string[] = [];
  const invalid: Array<{ email: string; reason: string }> = [];

  for (const email of emails) {
    const result = validateEmail(email);
    if (result.valid && result.normalizedEmail) {
      valid.push(result.normalizedEmail);
    } else {
      invalid.push({
        email,
        reason: result.reason || "Email invalide",
      });
    }
  }

  return { valid, invalid };
}

/**
 * Détecte les emails qui risquent de rebondir (hard bounce)
 * Basé sur des patterns communs
 */
export function detectPotentialBounces(email: string): {
  likelyToBounce: boolean;
  reason?: string;
} {
  const normalizedEmail = email.toLowerCase().trim();

  // Emails avec des patterns suspects
  const suspiciousPatterns = [
    /^test/i,
    /^noreply/i,
    /^no-reply/i,
    /^donotreply/i,
    /^postmaster/i,
    /^abuse/i,
    /^mailer-daemon/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(normalizedEmail.split("@")[0])) {
      return {
        likelyToBounce: true,
        reason: "Email système détecté",
      };
    }
  }

  // Domaines invalides courants
  const invalidDomains = ["example.com", "test.com", "invalid.com"];
  const domain = normalizedEmail.split("@")[1];
  if (domain && invalidDomains.includes(domain)) {
    return {
      likelyToBounce: true,
      reason: "Domaine de test détecté",
    };
  }

  return {
    likelyToBounce: false,
  };
}

