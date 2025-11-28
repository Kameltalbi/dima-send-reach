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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Recherche des campagnes programmées à envoyer...");

    // Trouver toutes les campagnes en attente dont la date d'envoi est passée
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from("campaigns")
      .select("*")
      .eq("statut", "en_attente")
      .lte("date_envoi", new Date().toISOString())
      .not("date_envoi", "is", null);

    if (campaignsError) {
      console.error("Erreur lors de la récupération des campagnes:", campaignsError);
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log("Aucune campagne programmée à envoyer");
      return new Response(
        JSON.stringify({ success: true, message: "Aucune campagne à envoyer", processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`${campaigns.length} campagne(s) programmée(s) trouvée(s)`);

    const results = [];

    // Traiter chaque campagne
    for (const campaign of campaigns) {
      try {
        console.log(`Traitement de la campagne: ${campaign.nom_campagne} (${campaign.id})`);

        // Mettre à jour le statut en "en_cours"
        await supabaseClient
          .from("campaigns")
          .update({ statut: "en_cours" })
          .eq("id", campaign.id);

        // Appeler l'Edge Function send-email
        const { data: sendResult, error: sendError } = await supabaseClient.functions.invoke(
          "send-email",
          {
            body: {
              campaignId: campaign.id,
            },
          }
        );

        if (sendError) {
          console.error(`Erreur lors de l'envoi de la campagne ${campaign.id}:`, sendError);
          results.push({
            campaignId: campaign.id,
            campaignName: campaign.nom_campagne,
            success: false,
            error: sendError.message,
          });
          
          // Remettre en erreur
          await supabaseClient
            .from("campaigns")
            .update({ statut: "erreur" })
            .eq("id", campaign.id);
        } else {
          console.log(`Campagne ${campaign.id} envoyée avec succès`);
          results.push({
            campaignId: campaign.id,
            campaignName: campaign.nom_campagne,
            success: true,
            result: sendResult,
          });
        }
      } catch (error) {
        console.error(`Erreur lors du traitement de la campagne ${campaign.id}:`, error);
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.nom_campagne,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    console.log(`Traitement terminé: ${successCount} succès, ${errorCount} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} campagne(s) envoyée(s), ${errorCount} erreur(s)`,
        processed: campaigns.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur dans process-scheduled-campaigns:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue s'est produite";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
