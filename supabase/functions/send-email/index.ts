import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkEmailQuota } from "./utils/quota-check.ts";
import { validateEmailList, detectPotentialBounces } from "./utils/email-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY non configuré");
    }
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const { campaignId, testEmail } = await req.json();

    if (!campaignId && !testEmail) {
      throw new Error("campaignId ou testEmail requis");
    }

    // Fonction helper pour envoyer via Resend API
    async function sendWithResend(emailData: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Resend API error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    }

    // Si c'est un email de test
    if (testEmail) {
      const { to, subject, html, fromName, fromEmail } = testEmail;
      
      // Valider l'email de test
      const emailValidation = validateEmailList([to]);
      if (emailValidation.invalid.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Email invalide: ${emailValidation.invalid[0].reason}`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      
      console.log("Envoi d'un email de test à:", to);
      
      const data = await sendWithResend({
        from: `${fromName} <${fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
      });

      console.log("Email de test envoyé avec succès:", data);

      return new Response(
        JSON.stringify({ success: true, message: "Email de test envoyé", data }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Envoi de campagne
    console.log("Démarrage de l'envoi de campagne:", campaignId);

    // Récupérer l'utilisateur depuis le token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Utilisateur non authentifié");
    }

    const { data: campaign, error: campaignError } = await supabaseClient
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campagne non trouvée");
    }

    // Vérifier que la campagne appartient à l'utilisateur
    if (campaign.user_id !== user.id) {
      throw new Error("Vous n'avez pas l'autorisation d'envoyer cette campagne");
    }

    // Récupérer les destinataires
    const { data: recipients, error: recipientsError } = await supabaseClient
      .from("campaign_recipients")
      .select("*, contacts(*)")
      .eq("campaign_id", campaignId)
      .eq("statut_envoi", "en_attente");

    if (recipientsError) {
      throw new Error("Erreur lors de la récupération des destinataires");
    }

    if (!recipients || recipients.length === 0) {
      throw new Error("Aucun destinataire en attente");
    }

    // Vérifier le quota côté serveur AVANT l'envoi
    const quotaCheck = await checkEmailQuota(
      supabaseClient,
      user.id,
      recipients.length
    );

    if (!quotaCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: quotaCheck.reason || "Quota insuffisant",
          quota: {
            limit: quotaCheck.limit,
            used: quotaCheck.used,
            remaining: quotaCheck.remaining,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Récupérer les emails des contacts pour validation
    const contactIds = recipients.map((r: any) => r.contact_id);
    const { data: contacts, error: contactsError } = await supabaseClient
      .from("contacts")
      .select("id, email, statut")
      .in("id", contactIds);

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError);
    }

    // Valider les emails et filtrer les invalides
    const emailMap = new Map(
      (contacts || []).map((c: any) => [c.id, c.email])
    );
    const emailsToValidate = recipients
      .map((r: any) => emailMap.get(r.contact_id))
      .filter(Boolean) as string[];

    const { valid: validEmails, invalid: invalidEmails } =
      validateEmailList(emailsToValidate);

    // Filtrer les destinataires avec emails invalides
    const validRecipients = recipients.filter((r: any) => {
      const email = emailMap.get(r.contact_id);
      return email && validEmails.includes(email.toLowerCase().trim());
    });

    if (invalidEmails.length > 0) {
      console.warn(
        `${invalidEmails.length} emails invalides détectés:`,
        invalidEmails
      );
    }

    if (validRecipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Aucun email valide trouvé dans les destinataires",
          invalidEmails,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Détecter les emails à risque de rebond
    const bounceWarnings: Array<{ email: string; reason: string }> = [];
    for (const recipient of validRecipients) {
      const email = emailMap.get(recipient.contact_id);
      if (email) {
        const bounceCheck = detectPotentialBounces(email);
        if (bounceCheck.likelyToBounce) {
          bounceWarnings.push({
            email,
            reason: bounceCheck.reason || "Risque de rebond",
          });
        }
      }
    }

    if (bounceWarnings.length > 0) {
      console.warn("Emails à risque de rebond:", bounceWarnings);
    }

    console.log(`Envoi à ${validRecipients.length} destinataires valides`);

    let successCount = 0;
    let errorCount = 0;
    const bounceErrors: Array<{ email: string; reason: string }> = [];

    // Envoyer les emails un par un (seulement les valides)
    for (const recipient of validRecipients) {
      try {
        const email = emailMap.get(recipient.contact_id);
        if (!email) {
          console.warn(`Email manquant pour le contact ${recipient.contact_id}`);
          errorCount++;
          continue;
        }

        // Vérifier si l'email risque de rebondir avant l'envoi
        const bounceCheck = detectPotentialBounces(email);
        if (bounceCheck.likelyToBounce) {
          // Marquer comme erreur si risque élevé de rebond
          await supabaseClient
            .from("campaign_recipients")
            .update({
              statut_envoi: "erreur",
              date_envoi: new Date().toISOString(),
            })
            .eq("id", recipient.id);

          bounceErrors.push({
            email,
            reason: bounceCheck.reason || "Email à risque de rebond",
          });
          errorCount++;
          continue;
        }

        // Préparer le HTML avec tracking
        let trackedHtml = campaign.html_contenu || "";
        
        // 1. Ajouter le pixel de tracking des ouvertures
        const trackOpenUrl = `${SUPABASE_URL}/functions/v1/track-open?r=${recipient.id}`;
        const trackingPixel = `<img src="${trackOpenUrl}" width="1" height="1" style="display:none;" alt="" />`;
        
        // Insérer le pixel juste avant la balise </body> ou à la fin
        if (trackedHtml.includes("</body>")) {
          trackedHtml = trackedHtml.replace("</body>", `${trackingPixel}</body>`);
        } else {
          trackedHtml += trackingPixel;
        }
        
        // 2. Remplacer tous les liens par des liens trackés
        trackedHtml = trackedHtml.replace(
          /href="([^"]+)"/gi,
          (match: string, url: string) => {
            // Ne pas tracker les liens mailto: et tel:
            if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#")) {
              return match;
            }
            const trackClickUrl = `${SUPABASE_URL}/functions/v1/track-click?r=${recipient.id}&url=${encodeURIComponent(url)}`;
            return `href="${trackClickUrl}"`;
          }
        );
        
        // 3. Ajouter le lien de désinscription
        const unsubscribeUrl = `${SUPABASE_URL.replace('/functions/v1', '')}/unsubscribe?r=${recipient.id}`;
        const unsubscribeLink = `
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>Vous ne souhaitez plus recevoir ces emails ?</p>
            <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Se désabonner</a>
          </div>
        `;
        
        // Insérer le lien de désinscription juste avant la balise </body> ou à la fin
        if (trackedHtml.includes("</body>")) {
          trackedHtml = trackedHtml.replace("</body>", `${unsubscribeLink}</body>`);
        } else {
          trackedHtml += unsubscribeLink;
        }

        const data = await sendWithResend({
          from: `${campaign.expediteur_nom} <${campaign.expediteur_email}>`,
          to: email,
          subject: campaign.sujet_email,
          html: trackedHtml,
        });

        console.log(`Envoyé à ${email}:`, data);
        
        // Mettre à jour le statut du destinataire
        await supabaseClient
          .from("campaign_recipients")
          .update({
            statut_envoi: "envoye",
            date_envoi: new Date().toISOString(),
          })
          .eq("id", recipient.id);

        successCount++;
      } catch (err) {
        const email = emailMap.get(recipient.contact_id);
        console.error(`Erreur pour ${email}:`, err);
        errorCount++;
        
        await supabaseClient
          .from("campaign_recipients")
          .update({
            statut_envoi: "erreur",
            date_envoi: new Date().toISOString(),
          })
          .eq("id", recipient.id);
      }
    }

    // Mettre à jour le statut de la campagne
    const newStatus = errorCount === 0 ? "envoye" : (successCount > 0 ? "partiellement_envoye" : "erreur");
    await supabaseClient
      .from("campaigns")
      .update({
        statut: newStatus,
        date_envoi: new Date().toISOString(),
      })
      .eq("id", campaignId);

    console.log(`Campagne terminée: ${successCount} succès, ${errorCount} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Campagne envoyée: ${successCount} succès, ${errorCount} erreurs`,
        stats: {
          sent: successCount,
          failed: errorCount,
          total: validRecipients.length,
          invalidEmails: invalidEmails.length,
          bounceWarnings: bounceWarnings.length,
        },
        warnings: bounceWarnings.length > 0 ? bounceWarnings : undefined,
        invalidEmails: invalidEmails.length > 0 ? invalidEmails : undefined,
        quota: {
          limit: quotaCheck.limit,
          used: quotaCheck.used,
          remaining: quotaCheck.remaining ? quotaCheck.remaining - successCount : undefined,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur dans send-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue s'est produite";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
