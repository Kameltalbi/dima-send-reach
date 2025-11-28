import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { data: campaign, error: campaignError } = await supabaseClient
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campagne non trouvée");
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

    console.log(`Envoi à ${recipients.length} destinataires`);

    let successCount = 0;
    let errorCount = 0;

    // Envoyer les emails un par un
    for (const recipient of recipients) {
      try {
        const data = await sendWithResend({
          from: `${campaign.expediteur_nom} <${campaign.expediteur_email}>`,
          to: recipient.contacts.email,
          subject: campaign.sujet_email,
          html: campaign.html_contenu || "",
        });

        console.log(`Envoyé à ${recipient.contacts.email}:`, data);
        successCount++;
        
        // Mettre à jour le statut en envoyé
        await supabaseClient
          .from("campaign_recipients")
          .update({ 
            statut_envoi: "envoye", 
            date_envoi: new Date().toISOString() 
          })
          .eq("id", recipient.id);
      } catch (err) {
        console.error(`Erreur pour ${recipient.contacts.email}:`, err);
        errorCount++;
        
        await supabaseClient
          .from("campaign_recipients")
          .update({ 
            statut_envoi: "erreur",
            date_envoi: new Date().toISOString() 
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
        date_envoi: new Date().toISOString()
      })
      .eq("id", campaignId);

    console.log(`Campagne terminée: ${successCount} succès, ${errorCount} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} email(s) envoyé(s), ${errorCount} erreur(s)`,
        successCount,
        errorCount,
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
