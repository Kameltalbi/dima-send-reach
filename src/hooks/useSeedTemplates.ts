import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const exampleTemplates = [
  {
    nom: "Newsletter Moderne",
    description: "Template professionnel pour vos newsletters mensuelles avec design épuré et responsive",
    type: "newsletter",
    content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Moderne</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333333;
      font-size: 24px;
      margin: 0 0 20px 0;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: #ffffff;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .feature {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .feature-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .feature h3 {
      color: #333333;
      font-size: 18px;
      margin: 0 0 10px 0;
    }
    .feature p {
      color: #666666;
      font-size: 14px;
      margin: 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #999999;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .features {
        grid-template-columns: 1fr;
      }
      .content {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Votre Newsletter</h1>
      <p>Janvier 2025</p>
    </div>
    <div class="content">
      <h2>Bienvenue dans notre newsletter</h2>
      <p>Nous sommes ravis de vous partager les dernières actualités et nouveautés de notre entreprise.</p>
      <p>Découvrez nos dernières fonctionnalités, nos conseils et nos offres spéciales dans cette édition.</p>
      <a href="#" class="button">Découvrir maintenant</a>
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🚀</div>
          <h3>Innovation</h3>
          <p>Découvrez nos dernières innovations</p>
        </div>
        <div class="feature">
          <div class="feature-icon">💡</div>
          <h3>Conseils</h3>
          <p>Des conseils pour vous aider</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🎁</div>
          <h3>Offres</h3>
          <p>Des offres exclusives pour vous</p>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 Votre Entreprise. Tous droits réservés.</p>
      <p><a href="#">Se désabonner</a> | <a href="#">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>`,
    content_json: {
      styles: [],
      pages: [{
        frames: [{
          component: {
            type: "wrapper",
            components: [
              {
                type: "section",
                style: {
                  "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "padding": "40px 20px",
                  "text-align": "center",
                  "color": "#ffffff"
                },
                components: [
                  {
                    type: "text",
                    content: "<h1 style='margin: 0; font-size: 32px; font-weight: 700;'>Votre Newsletter</h1>"
                  },
                  {
                    type: "text",
                    content: "<p style='margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;'>Janvier 2025</p>"
                  }
                ]
              },
              {
                type: "section",
                style: {
                  "padding": "40px 30px",
                  "background": "#ffffff"
                },
                components: [
                  {
                    type: "text",
                    content: "<h2 style='color: #333333; font-size: 24px; margin: 0 0 20px 0;'>Bienvenue dans notre newsletter</h2>"
                  },
                  {
                    type: "text",
                    content: "<p style='color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;'>Nous sommes ravis de vous partager les dernières actualités et nouveautés de notre entreprise.</p>"
                  }
                ]
              }
            ]
          }
        }]
      }]
    }
  },
  {
    nom: "Promotion Flash",
    description: "Template accrocheur pour vos promotions et offres spéciales avec design moderne",
    type: "promotion",
    content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promotion Flash</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .banner {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 50px 20px;
      text-align: center;
      color: #ffffff;
      position: relative;
      overflow: hidden;
    }
    .banner::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 3s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    .banner-content {
      position: relative;
      z-index: 1;
    }
    .banner h1 {
      margin: 0;
      font-size: 48px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .banner .discount {
      font-size: 72px;
      font-weight: 900;
      margin: 20px 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .banner p {
      margin: 10px 0 0 0;
      font-size: 20px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .content h2 {
      color: #333333;
      font-size: 28px;
      margin: 0 0 15px 0;
    }
    .content p {
      color: #666666;
      font-size: 18px;
      line-height: 1.6;
      margin: 0 0 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: #f5576c;
      color: #ffffff;
      padding: 18px 40px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .urgency {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .urgency p {
      color: #856404;
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    .features-list {
      text-align: left;
      margin: 30px 0;
    }
    .features-list ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .features-list li {
      color: #333333;
      font-size: 16px;
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .features-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #28a745;
      font-weight: bold;
      font-size: 20px;
    }
    .footer {
      background: #2c3e50;
      padding: 30px;
      text-align: center;
      color: #ffffff;
      font-size: 12px;
    }
    .footer a {
      color: #f5576c;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .banner h1 {
        font-size: 36px;
      }
      .banner .discount {
        font-size: 56px;
      }
      .content {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="banner">
      <div class="banner-content">
        <h1>Promotion</h1>
        <div class="discount">-50%</div>
        <p>OFFRE LIMITÉE</p>
      </div>
    </div>
    <div class="content">
      <h2>Ne manquez pas cette opportunité !</h2>
      <p>Profitez de notre offre exceptionnelle avec une réduction de 50% sur tous nos produits. Cette promotion est valable pour une durée limitée uniquement.</p>
      <div class="urgency">
        <p>⏰ Offre valable jusqu'au 31 janvier 2025 - Stock limité</p>
      </div>
      <div class="features-list">
        <ul>
          <li>Livraison gratuite</li>
          <li>Garantie satisfait ou remboursé</li>
          <li>Support client 24/7</li>
          <li>Paiement sécurisé</li>
        </ul>
      </div>
      <a href="#" class="cta-button">Profiter de l'offre</a>
    </div>
    <div class="footer">
      <p>© 2025 Votre Entreprise. Tous droits réservés.</p>
      <p><a href="#">Se désabonner</a> | <a href="#">Contactez-nous</a></p>
    </div>
              </div>
</body>
</html>`,
    content_json: {
      styles: [],
      pages: [{
        frames: [{
          component: {
            type: "wrapper",
            components: [
              {
                type: "section",
                style: {
                  "background": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  "padding": "50px 20px",
                  "text-align": "center",
                  "color": "#ffffff"
                },
                components: [
                  {
                    type: "text",
                    content: "<h1 style='margin: 0; font-size: 48px; font-weight: 900; text-transform: uppercase;'>Promotion</h1>"
                  },
                  {
                    type: "text",
                    content: "<div style='font-size: 72px; font-weight: 900; margin: 20px 0;'>-50%</div>"
                  }
                ]
              }
            ]
          }
        }]
      }]
    }
  },
  {
    nom: "Email de Bienvenue",
    description: "Template chaleureux pour accueillir vos nouveaux clients et utilisateurs",
    type: "annonce",
    content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email de Bienvenue</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 60px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 36px;
      font-weight: 700;
    }
    .header p {
      margin: 15px 0 0 0;
      font-size: 18px;
      opacity: 0.95;
    }
    .content {
      padding: 50px 40px;
    }
    .welcome-message {
      text-align: center;
      margin-bottom: 40px;
    }
    .welcome-message h2 {
      color: #333333;
      font-size: 28px;
      margin: 0 0 15px 0;
    }
    .welcome-message p {
      color: #666666;
      font-size: 18px;
      line-height: 1.8;
      margin: 0;
    }
    .steps {
      margin: 40px 0;
    }
    .step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }
    .step-number {
      background: #667eea;
      color: #ffffff;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
      flex-shrink: 0;
      margin-right: 20px;
    }
    .step-content h3 {
      color: #333333;
      font-size: 20px;
      margin: 0 0 8px 0;
    }
    .step-content p {
      color: #666666;
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
    }
    .cta-section {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 12px;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: #ffffff;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 10px;
    }
    .social-links {
      text-align: center;
      margin: 30px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
    }
    .footer {
      background: #2c3e50;
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
      font-size: 14px;
    }
    .footer p {
      margin: 10px 0;
      color: #ecf0f1;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .step {
        flex-direction: column;
        text-align: center;
      }
      .step-number {
        margin: 0 auto 15px auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-icon">👋</div>
      <h1>Bienvenue !</h1>
      <p>Nous sommes ravis de vous compter parmi nous</p>
    </div>
    <div class="content">
      <div class="welcome-message">
        <h2>Merci de nous rejoindre</h2>
        <p>Votre compte a été créé avec succès. Nous sommes là pour vous accompagner dans votre parcours et vous aider à atteindre vos objectifs.</p>
      </div>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Complétez votre profil</h3>
            <p>Ajoutez vos informations pour personnaliser votre expérience</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Explorez nos fonctionnalités</h3>
            <p>Découvrez tout ce que notre plateforme peut faire pour vous</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Commencez à utiliser</h3>
            <p>Lancez votre premier projet et voyez les résultats</p>
          </div>
        </div>
      </div>
      <div class="cta-section">
        <h3 style="color: #333333; margin: 0 0 15px 0;">Prêt à commencer ?</h3>
        <a href="#" class="cta-button">Accéder à mon compte</a>
      </div>
      <div class="social-links">
        <p style="color: #666666; margin-bottom: 15px;">Suivez-nous sur :</p>
        <a href="#">Facebook</a>
        <a href="#">Twitter</a>
        <a href="#">LinkedIn</a>
        <a href="#">Instagram</a>
      </div>
    </div>
    <div class="footer">
      <p><strong>Votre Entreprise</strong></p>
      <p>123 Rue Example, 75001 Paris, France</p>
      <p><a href="#">Support</a> | <a href="#">FAQ</a> | <a href="#">Se désabonner</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #95a5a6;">© 2025 Votre Entreprise. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`,
    content_json: {
      styles: [],
      pages: [{
        frames: [{
          component: {
            type: "wrapper",
            components: [
              {
                type: "section",
                style: {
                  "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "padding": "60px 20px",
                  "text-align": "center",
                  "color": "#ffffff"
                },
                components: [
                  {
                    type: "text",
                    content: "<div style='font-size: 64px; margin-bottom: 20px;'>👋</div>"
                  },
                  {
                    type: "text",
                    content: "<h1 style='margin: 0; font-size: 36px; font-weight: 700;'>Bienvenue !</h1>"
                  }
                ]
              }
            ]
          }
        }]
      }]
    }
  }
];

export const useSeedTemplates = () => {
  const { user } = useAuth();

  const seedTemplates = async () => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Check if user already has templates
      const { data: existing } = await supabase
        .from("templates")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: "Templates already exist" };
      }

      // Insert example templates
      const templatesWithUserId = exampleTemplates.map(template => ({
        nom: template.nom,
        description: template.description,
        type: template.type,
        content_html: template.content_html,
        content_json: template.content_json,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from("templates")
        .insert(templatesWithUserId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error seeding templates:", error);
      return { success: false, error };
    }
  };

  return { seedTemplates };
};
