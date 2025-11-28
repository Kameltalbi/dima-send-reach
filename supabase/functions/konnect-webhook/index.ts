// Webhook Konnect pour recevoir les notifications de paiement
// À configurer dans le dashboard Konnect

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Récupérer les données du webhook Konnect
    const webhookData = await req.json();

    // Vérifier la signature du webhook (optionnel mais recommandé)
    // const signature = req.headers.get("X-Konnect-Signature");
    // TODO: Vérifier la signature

    const { orderId, paymentId, status, amount } = webhookData;

    if (!orderId || !status) {
      throw new Error("Données webhook incomplètes");
    }

    // Mettre à jour le statut de la commande
    let paymentStatus = "pending";
    if (status === "ACCEPTED" || status === "PAID") {
      paymentStatus = "completed";
    } else if (status === "REJECTED" || status === "FAILED") {
      paymentStatus = "failed";
    }

    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        payment_status: paymentStatus,
        konnect_payment_id: paymentId,
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // Si le paiement est complété, activer l'abonnement
    if (paymentStatus === "completed") {
      // Récupérer la commande pour obtenir le plan
      const { data: order } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (order) {
        // Créer ou mettre à jour l'abonnement
        // TODO: Implémenter la logique d'activation de l'abonnement
        // Cela dépend de votre structure de subscriptions
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

