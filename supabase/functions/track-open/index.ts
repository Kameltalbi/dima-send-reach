import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const recipientId = url.searchParams.get("r");

    if (!recipientId) {
      console.error("Missing recipient ID");
      return new Response(null, { status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Tracking email open for recipient:", recipientId);

    // Mettre à jour uniquement si pas encore ouvert (première ouverture)
    const { data: recipient } = await supabaseClient
      .from("campaign_recipients")
      .select("ouvert")
      .eq("id", recipientId)
      .single();

    if (recipient && !recipient.ouvert) {
      const { error } = await supabaseClient
        .from("campaign_recipients")
        .update({
          ouvert: true,
          date_ouverture: new Date().toISOString(),
        })
        .eq("id", recipientId);

      if (error) {
        console.error("Error updating open status:", error);
      } else {
        console.log("Email open tracked successfully");
      }
    }

    // Retourner un pixel transparent 1x1
    const pixel = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);

    return new Response(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error in track-open:", error);
    // Toujours retourner un pixel même en cas d'erreur pour ne pas casser l'affichage de l'email
    const pixel = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ]);
    return new Response(pixel, {
      status: 200,
      headers: { "Content-Type": "image/gif" },
    });
  }
});
