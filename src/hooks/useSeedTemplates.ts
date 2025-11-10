import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const exampleTemplates = [
  {
    nom: "Newsletter Classique",
    description: "Template parfait pour vos newsletters hebdomadaires ou mensuelles avec sections articles",
    type: "newsletter",
    is_public: true,
    content_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Votre Newsletter</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <img src="https://via.placeholder.com/600x300/3b82f6/ffffff?text=Image+Principale" alt="Hero" style="width: 100%; height: auto; display: block;">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin-top: 0;">Titre de l'article principal</h2>
              <p style="color: #475569; line-height: 1.6; font-size: 16px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <a href="#" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 15px;">Lire la suite</a>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 30px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">Suivez-nous sur les réseaux sociaux</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;"><a href="#" style="color: #94a3b8;">Se désabonner</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    nom: "Email Promotionnel",
    description: "Template pour vos offres spéciales et promotions avec code promo mis en avant",
    type: "promotion",
    is_public: true,
    content_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promotion</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fef3c7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); padding: 50px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 42px;">OFFRE SPÉCIALE</h1>
              <p style="color: #ffffff; font-size: 24px; margin: 10px 0 0 0;">-50% sur tout le site</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 50px 40px; text-align: center;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0;">Ne manquez pas cette opportunité !</h2>
              <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0;">CODE PROMO</p>
                <p style="color: #b45309; font-size: 32px; font-weight: bold; margin: 0;">PROMO50</p>
              </div>
              <a href="#" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold;">J'en profite</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    nom: "Annonce Actualité",
    description: "Template minimaliste pour vos annonces et actualités importantes",
    type: "annonce",
    is_public: true,
    content_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Annonce</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 40px;">
              <p style="color: #2563eb; font-size: 14px; font-weight: bold; margin: 0 0 20px 0;">ACTUALITÉ</p>
              <h1 style="color: #1e293b; font-size: 36px; margin: 0 0 20px 0;">Une annonce importante</h1>
              <img src="https://via.placeholder.com/520x300/3b82f6/ffffff?text=Image" alt="Annonce" style="width: 100%; border-radius: 8px; margin: 20px 0;">
              <p style="color: #475569; font-size: 18px; line-height: 1.8; margin: 20px 0;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <a href="#" style="color: #2563eb; font-size: 16px; font-weight: bold; text-decoration: none;">En savoir plus →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    nom: "Email Transactionnel",
    description: "Template épuré pour vos emails de confirmation et communications transactionnelles",
    type: "autre",
    is_public: true,
    content_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 40px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin: 0;">Dima Mail</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 40px;">✓</span>
              </div>
              <h1 style="color: #1e293b; font-size: 28px; margin: 0 0 10px 0;">Action confirmée !</h1>
              <p style="color: #64748b; font-size: 16px; margin: 0;">Votre action a été réalisée avec succès.</p>
              <a href="#" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; margin-top: 30px;">Voir les détails</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
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
        ...template,
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
