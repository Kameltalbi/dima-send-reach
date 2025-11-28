import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const recipientId = url.searchParams.get("r");
    const targetUrl = url.searchParams.get("url");

    if (!recipientId || !targetUrl) {
      console.error("Missing parameters");
      return new Response("Missing parameters", { status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Tracking click for recipient:", recipientId);

    // Mettre à jour uniquement si pas encore cliqué (premier clic)
    const { data: recipient } = await supabaseClient
      .from("campaign_recipients")
      .select("clique")
      .eq("id", recipientId)
      .single();

    if (recipient && !recipient.clique) {
      const { error } = await supabaseClient
        .from("campaign_recipients")
        .update({
          clique: true,
          date_clic: new Date().toISOString(),
        })
        .eq("id", recipientId);

      if (error) {
        console.error("Error updating click status:", error);
      } else {
        console.log("Click tracked successfully");
      }
    }

    // Rediriger vers l'URL cible
    return new Response(null, {
      status: 302,
      headers: {
        Location: decodeURIComponent(targetUrl),
      },
    });
  } catch (error) {
    console.error("Error in track-click:", error);
    return new Response("Error processing click", { status: 500 });
  }
});
