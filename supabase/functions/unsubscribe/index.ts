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
    const method = req.method;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Si POST, c'est une mise à jour de préférences
    if (method === "POST") {
      const body = await req.json();
      const { recipientId: bodyRecipientId, preferences, reason, unsubscribeAll } = body;

      const finalRecipientId = recipientId || bodyRecipientId;
      if (!finalRecipientId) {
        return new Response(
          JSON.stringify({ error: "Paramètre manquant" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Récupérer le contact
      const { data: recipient } = await supabaseClient
        .from("campaign_recipients")
        .select("contact_id, contacts(email, user_id, id)")
        .eq("id", finalRecipientId)
        .single();

      if (!recipient) {
        return new Response(
          JSON.stringify({ error: "Destinataire non trouvé" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const contact = recipient.contacts as any;

      // Mettre à jour ou créer les préférences
      const { data: existingPrefs } = await supabaseClient
        .from("unsubscribe_preferences")
        .select("*")
        .eq("contact_id", recipient.contact_id)
        .single();

      const prefsData = {
        contact_id: recipient.contact_id,
        user_id: contact.user_id,
        email: contact.email,
        unsubscribe_all: unsubscribeAll || false,
        preferences: preferences || {},
        reason: reason || null,
      };

      if (existingPrefs) {
        await supabaseClient
          .from("unsubscribe_preferences")
          .update(prefsData)
          .eq("id", existingPrefs.id);
      } else {
        await supabaseClient
          .from("unsubscribe_preferences")
          .insert(prefsData);
      }

      // Si désabonnement total, mettre à jour le contact
      if (unsubscribeAll) {
        await supabaseClient
          .from("campaign_recipients")
          .update({ desabonne: true })
          .eq("contact_id", recipient.contact_id);

        await supabaseClient
          .from("contacts")
          .update({ statut: "desabonne" })
          .eq("id", recipient.contact_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Préférences mises à jour",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GET : Désabonnement simple
    if (!recipientId) {
      return new Response(
        JSON.stringify({ error: "Paramètre manquant" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Processing unsubscribe for recipient:", recipientId);

    // Récupérer les informations du destinataire
    const { data: recipient, error: recipientError } = await supabaseClient
      .from("campaign_recipients")
      .select("contact_id, desabonne, contacts(email, user_id, id)")
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
          email: contact?.email,
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

    // Créer ou mettre à jour les préférences de désabonnement
    const { data: existingPrefs } = await supabaseClient
      .from("unsubscribe_preferences")
      .select("*")
      .eq("contact_id", recipient.contact_id)
      .single();

    const prefsData = {
      contact_id: recipient.contact_id,
      user_id: contact.user_id,
      email: contact.email,
      unsubscribe_all: true,
      preferences: {},
      reason: "Unsubscribed via link",
    };

    if (existingPrefs) {
      await supabaseClient
        .from("unsubscribe_preferences")
        .update(prefsData)
        .eq("id", existingPrefs.id);
    } else {
      await supabaseClient
        .from("unsubscribe_preferences")
        .insert(prefsData);
    }

    // Mettre à jour le statut du contact
    if (contact && recipient.contact_id) {
      const { error: updateContactError } = await supabaseClient
        .from("contacts")
        .update({ statut: "desabonne" })
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
