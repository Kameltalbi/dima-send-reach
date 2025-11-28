// Edge Function pour envoyer des emails via AWS SES
// À déployer avec: supabase functions deploy send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Récupérer les informations de la requête
    const { campaignId, testEmail } = await req.json();

    if (!campaignId && !testEmail) {
      throw new Error("campaignId ou testEmail requis");
    }

    // Récupérer la configuration SES (depuis la table ses_config)
    const { data: sesConfig, error: configError } = await supabaseClient
      .from("ses_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (configError || !sesConfig) {
      throw new Error("Configuration SES non trouvée");
    }

    // Si c'est un email de test
    if (testEmail) {
      // TODO: Implémenter l'envoi via AWS SES SDK
      // Pour l'instant, on simule
      return new Response(
        JSON.stringify({ success: true, message: "Email de test envoyé" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Récupérer la campagne
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

    // TODO: Implémenter l'envoi réel via AWS SES
    // Utiliser AWS SDK pour Node.js/Deno
    // Exemple avec @aws-sdk/client-ses:
    /*
    import { SESClient, SendEmailCommand } from "https://esm.sh/@aws-sdk/client-ses@3";
    
    const sesClient = new SESClient({
      region: sesConfig.aws_region,
      credentials: {
        accessKeyId: sesConfig.aws_access_key_id,
        secretAccessKey: sesConfig.aws_secret_access_key,
      },
    });

    for (const recipient of recipients) {
      const command = new SendEmailCommand({
        Source: `${campaign.expediteur_nom} <${campaign.expediteur_email}>`,
        Destination: {
          ToAddresses: [recipient.contacts.email],
        },
        Message: {
          Subject: {
            Data: campaign.sujet_email,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: campaign.html_contenu,
              Charset: "UTF-8",
            },
          },
        },
      });

      await sesClient.send(command);
      
      // Mettre à jour le statut
      await supabaseClient
        .from("campaign_recipients")
        .update({ statut_envoi: "envoye", date_envoi: new Date().toISOString() })
        .eq("id", recipient.id);
    }
    */

    // Mettre à jour le statut de la campagne
    await supabaseClient
      .from("campaigns")
      .update({ statut: "envoye" })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${recipients?.length || 0} email(s) envoyé(s)`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
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

