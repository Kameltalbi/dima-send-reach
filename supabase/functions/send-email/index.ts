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
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = await response.text();
          }
          
          const errorMessage = typeof errorData === 'string' 
            ? errorData 
            : (errorData?.message || JSON.stringify(errorData));
          
          throw new Error(`Resend API error (${response.status}): ${errorMessage}`);
        }

        return await response.json();
      } catch (error: any) {
        // Si c'est déjà une erreur formatée, la relancer
        if (error.message && error.message.includes("Resend API error")) {
          throw error;
        }
        // Sinon, wrapper l'erreur
        throw new Error(`Erreur lors de l'appel à Resend API: ${error.message || error.toString()}`);
      }
    }

    // Si c'est un email de test
    if (testEmail) {
      try {
        const { to, subject, html, fromName, fromEmail } = testEmail;
        
        // Vérifier que tous les champs requis sont présents
        if (!to || !subject || !html || !fromName || !fromEmail) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Champs manquants: tous les champs (to, subject, html, fromName, fromEmail) sont requis",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200, // Toujours 200 pour que le client puisse lire le message
            }
          );
        }
        
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
              status: 200, // Toujours 200 pour que le client puisse lire le message
            }
          );
        }
        
        // Valider l'email de l'expéditeur
        const fromEmailValidation = validateEmailList([fromEmail]);
        if (fromEmailValidation.invalid.length > 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Email expéditeur invalide: ${fromEmailValidation.invalid[0].reason}`,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200, // Toujours 200 pour que le client puisse lire le message
            }
          );
        }
        
        console.log("Envoi d'un email de test à:", to);
        console.log("Depuis:", fromEmail, "Nom:", fromName);
        
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
      } catch (testError: any) {
        console.error("Erreur lors de l'envoi de l'email de test:", testError);
        const errorMessage = testError.message || testError.toString() || "Erreur lors de l'envoi de l'email de test";
        return new Response(
          JSON.stringify({
            success: false,
            message: errorMessage,
            error: errorMessage,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Toujours 200 pour que le client puisse lire le message
          }
        );
      }
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

    // Compter d'abord le total de destinataires pour vérifier le quota
    const { count: totalRecipientsCount, error: countError } = await supabaseClient
      .from("campaign_recipients")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("statut_envoi", "en_attente");

    if (countError) {
      throw new Error("Erreur lors du comptage des destinataires");
    }

    if (!totalRecipientsCount || totalRecipientsCount === 0) {
      throw new Error("Aucun destinataire en attente");
    }

    // Vérifier le quota côté serveur AVANT l'envoi
    const quotaCheck = await checkEmailQuota(
      supabaseClient,
      user.id,
      totalRecipientsCount
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
          warming: quotaCheck.warming ? {
            isWarming: quotaCheck.warming.isWarming,
            currentDay: quotaCheck.warming.currentDay,
            limit: quotaCheck.warming.limit,
            used: quotaCheck.warming.used,
            remaining: quotaCheck.warming.remaining,
            warmingCompleted: quotaCheck.warming.warmingCompleted,
          } : undefined,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    console.log(`Processing ${totalRecipientsCount} recipients in batches`);

    // Traitement par batch pour éviter timeout et dépassement mémoire
    const PROCESSING_BATCH_SIZE = 1000;
    const INSERT_BATCH_SIZE = 1000;
    let offset = 0;
    let queuedCount = 0;
    let errorCount = 0;
    let totalInvalidEmails = 0;
    const queueErrors: Array<{ email: string; reason: string }> = [];
    const bounceWarnings: Array<{ email: string; reason: string }> = [];

    // Traiter les destinataires par batch
    while (offset < totalRecipientsCount) {
      console.log(`Processing batch: ${offset} to ${offset + PROCESSING_BATCH_SIZE - 1}`);

      // Récupérer un batch de destinataires
      const { data: recipients, error: recipientsError } = await supabaseClient
        .from("campaign_recipients")
        .select("*, contacts(*)")
        .eq("campaign_id", campaignId)
        .eq("statut_envoi", "en_attente")
        .range(offset, offset + PROCESSING_BATCH_SIZE - 1);

      if (recipientsError) {
        console.error(`Error fetching recipients batch at offset ${offset}:`, recipientsError);
        errorCount += PROCESSING_BATCH_SIZE;
        offset += PROCESSING_BATCH_SIZE;
        continue;
      }

      if (!recipients || recipients.length === 0) {
        break; // Plus de destinataires à traiter
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

      // Créer une map email pour ce batch
      const emailMap = new Map(
        (contacts || []).map((c: any) => [c.id, c.email])
      );
      const emailsToValidate = recipients
        .map((r: any) => emailMap.get(r.contact_id))
        .filter(Boolean) as string[];

      const { valid: validEmails, invalid: invalidEmails } =
        validateEmailList(emailsToValidate);

      totalInvalidEmails += invalidEmails.length;

      // Filtrer les destinataires avec emails invalides
      const validRecipients = recipients.filter((r: any) => {
        const email = emailMap.get(r.contact_id);
        return email && validEmails.includes(email.toLowerCase().trim());
      });

      // Préparer les emails pour ce batch
      const emailsToQueue: any[] = [];

      for (const recipient of validRecipients) {
        try {
          const email = emailMap.get(recipient.contact_id);
          if (!email) {
            console.warn(`Email missing for contact ${recipient.contact_id}`);
            errorCount++;
            continue;
          }

          // Check if email is likely to bounce before queueing
          const bounceCheck = detectPotentialBounces(email);
          if (bounceCheck.likelyToBounce) {
            // Mark as error if high bounce risk
            await supabaseClient
              .from("campaign_recipients")
              .update({
                statut_envoi: "erreur",
                date_envoi: new Date().toISOString(),
              })
              .eq("id", recipient.id);

            queueErrors.push({
              email,
              reason: bounceCheck.reason || "High bounce risk email",
            });
            bounceWarnings.push({
              email,
              reason: bounceCheck.reason || "Risque de rebond",
            });
            errorCount++;
            continue;
          }

          // Prepare HTML with tracking
          let trackedHtml = campaign.html_contenu || "";
          
          // 1. Add open tracking pixel
          const trackOpenUrl = `${SUPABASE_URL}/functions/v1/track-open?r=${recipient.id}`;
          const trackingPixel = `<img src="${trackOpenUrl}" width="1" height="1" style="display:none;" alt="" />`;
          
          if (trackedHtml.includes("</body>")) {
            trackedHtml = trackedHtml.replace("</body>", `${trackingPixel}</body>`);
          } else {
            trackedHtml += trackingPixel;
          }
          
          // 2. Replace all links with tracked links
          trackedHtml = trackedHtml.replace(
            /href="([^"]+)"/gi,
            (match: string, url: string) => {
              if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#")) {
                return match;
              }
              const trackClickUrl = `${SUPABASE_URL}/functions/v1/track-click?r=${recipient.id}&url=${encodeURIComponent(url)}`;
              return `href="${trackClickUrl}"`;
            }
          );
          
          // 3. Add unsubscribe link
          const unsubscribeUrl = `${SUPABASE_URL.replace('/functions/v1', '')}/unsubscribe?r=${recipient.id}`;
          const unsubscribeLink = `
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
              <p>Don't want to receive these emails anymore?</p>
              <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
            </div>
          `;
          
          if (trackedHtml.includes("</body>")) {
            trackedHtml = trackedHtml.replace("</body>", `${unsubscribeLink}</body>`);
          } else {
            trackedHtml += unsubscribeLink;
          }

          // Add to queue batch
          emailsToQueue.push({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            to_email: email,
            from_name: campaign.expediteur_nom,
            from_email: campaign.expediteur_email,
            subject: campaign.sujet_email,
            html: trackedHtml,
            status: 'pending',
            attempts: 0,
          });

          queuedCount++;
        } catch (err) {
          const email = emailMap.get(recipient.contact_id);
          console.error(`Error queueing email for ${email}:`, err);
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

      // Insérer les emails dans la queue par batch pour éviter les erreurs de taille
      if (emailsToQueue.length > 0) {
        for (let i = 0; i < emailsToQueue.length; i += INSERT_BATCH_SIZE) {
          const insertBatch = emailsToQueue.slice(i, i + INSERT_BATCH_SIZE);
          const { error: queueError } = await supabaseClient
            .from("email_queue")
            .insert(insertBatch);

          if (queueError) {
            console.error(`Error inserting email batch at index ${i}:`, queueError);
            // Marquer ces emails comme erreur dans campaign_recipients
            for (const emailData of insertBatch) {
              await supabaseClient
                .from("campaign_recipients")
                .update({
                  statut_envoi: "erreur",
                  date_envoi: new Date().toISOString(),
                })
                .eq("id", emailData.recipient_id);
            }
            errorCount += insertBatch.length;
            queuedCount -= insertBatch.length;
          } else {
            console.log(`Successfully queued batch of ${insertBatch.length} emails`);
          }
        }
      }

      offset += PROCESSING_BATCH_SIZE;
    }

    console.log(`Finished processing: ${queuedCount} queued, ${errorCount} errors`);

    // Update campaign status to "en_cours" (in progress) since emails are queued
    const newStatus = errorCount === 0 && queuedCount > 0 ? "en_cours" : (queuedCount > 0 ? "en_cours" : "erreur");
    await supabaseClient
      .from("campaigns")
      .update({
        statut: newStatus,
        date_envoi: new Date().toISOString(),
      })
      .eq("id", campaignId);

    console.log(`Campaign queued: ${queuedCount} emails queued, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Campaign queued: ${queuedCount} emails queued for sending, ${errorCount} errors`,
        stats: {
          queued: queuedCount,
          failed: errorCount,
          total: totalRecipientsCount,
          invalidEmails: totalInvalidEmails,
          bounceWarnings: bounceWarnings.length,
        },
        warnings: bounceWarnings.length > 0 ? bounceWarnings : undefined,
        queueErrors: queueErrors.length > 0 ? queueErrors : undefined,
        quota: {
          limit: quotaCheck.limit,
          used: quotaCheck.used,
          remaining: quotaCheck.remaining,
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
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Logger plus de détails pour le débogage
    console.error("Détails de l'erreur:", {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        message: errorMessage,
        details: errorStack,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Toujours 200 pour que le client puisse lire le message d'erreur
      }
    );
  }
});
