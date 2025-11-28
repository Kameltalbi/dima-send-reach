import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const recipientId = url.searchParams.get("r");

    if (!recipientId) {
      return new Response(
        JSON.stringify({ error: "Paramètre manquant" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Processing unsubscribe for recipient:", recipientId);

    // Récupérer les informations du destinataire
    const { data: recipient, error: recipientError } = await supabaseClient
      .from("campaign_recipients")
      .select("contact_id, desabonne, contacts(email, user_id)")
      .eq("id", recipientId)
      .single();

    if (recipientError || !recipient) {
      console.error("Recipient not found:", recipientError);
      return new Response(
        JSON.stringify({ error: "Destinataire non trouvé" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Extraire les données du contact (c'est un objet, pas un tableau)
    const contact = recipient.contacts as any;

    // Si déjà désabonné, retourner succès
    if (recipient.desabonne) {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyUnsubscribed: true,
          message: "Vous êtes déjà désabonné",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mettre à jour le statut de désabonnement pour ce destinataire
    const { error: updateRecipientError } = await supabaseClient
      .from("campaign_recipients")
      .update({ desabonne: true })
      .eq("id", recipientId);

    if (updateRecipientError) {
      console.error("Error updating recipient:", updateRecipientError);
      throw updateRecipientError;
    }

    // Mettre à jour le statut du contact en "inactif"
    if (contact && recipient.contact_id) {
      const { error: updateContactError } = await supabaseClient
        .from("contacts")
        .update({ statut: "inactif" })
        .eq("id", recipient.contact_id);

      if (updateContactError) {
        console.error("Error updating contact status:", updateContactError);
        // Ne pas faire échouer la requête si la mise à jour du contact échoue
      }
    }

    console.log("Unsubscribe successful for:", contact?.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Désabonnement effectué avec succès",
        email: contact?.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in unsubscribe function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
