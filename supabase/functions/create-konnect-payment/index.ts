// Edge Function pour créer un paiement Konnect
// Documentation: https://developers.konnect.network/

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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { orderId, amount, currency, description, returnUrl, cancelUrl } = await req.json();

    if (!orderId || !amount || !returnUrl) {
      throw new Error("Paramètres manquants");
    }

    // Récupérer les credentials Konnect depuis les variables d'environnement
    const KONNECT_API_KEY = Deno.env.get("KONNECT_API_KEY");
    const KONNECT_SECRET_KEY = Deno.env.get("KONNECT_SECRET_KEY");
    const KONNECT_BASE_URL = Deno.env.get("KONNECT_BASE_URL") || "https://api.konnect.network/api/v2";

    if (!KONNECT_API_KEY || !KONNECT_SECRET_KEY) {
      throw new Error("Configuration Konnect manquante");
    }

    // Créer le paiement via l'API Konnect
    // Documentation: https://developers.konnect.network/api-reference/payments/create-payment
    const konnectResponse = await fetch(`${KONNECT_BASE_URL}/payments/init-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KONNECT_SECRET_KEY}`,
      },
      body: JSON.stringify({
        receiverWalletId: KONNECT_API_KEY, // Votre wallet ID Konnect
        amount: amount,
        token: currency === "TND" ? "TND" : "USD",
        description: description,
        type: "immediate",
        successUrl: returnUrl,
        failUrl: cancelUrl,
        orderId: orderId,
      }),
    });

    if (!konnectResponse.ok) {
      const error = await konnectResponse.json();
      throw new Error(error.message || "Erreur lors de la création du paiement Konnect");
    }

    const konnectData = await konnectResponse.json();

    // Mettre à jour la commande avec l'ID de paiement Konnect
    await supabaseClient
      .from("orders")
      .update({
        konnect_payment_id: konnectData.payToken || konnectData.id,
        payment_status: "pending",
      })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: konnectData.payUrl || konnectData.paymentUrl,
        paymentId: konnectData.payToken || konnectData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

