import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendWebhookData {
  email?: string;
  from?: string;
  to?: string;
  subject?: string;
  created_at?: string;
  hard_bounce?: boolean;
  soft_bounce?: boolean;
  bounce_type?: string;
  bounce_code?: string;
  bounce_message?: string;
  complaint?: boolean;
  complaint_feedback?: string;
}

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: ResendWebhookData & {
    event?: string;
    type?: string;
    data?: ResendWebhookData;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const webhookData: ResendWebhookEvent | ResendWebhookEvent[] = await req.json();

    // Resend peut envoyer un seul événement ou un tableau
    const events = Array.isArray(webhookData) ? webhookData : [webhookData];

    const results: Array<{ email?: string; status?: string; bounce_type?: string; error?: string }> = [];

    for (const event of events) {
      try {
        const eventType = event.type || event.data?.event || event.data?.type;

        // Traiter les bounces
        if (eventType === "email.bounced" || eventType === "bounce") {
          const email = event.data?.email || event.data?.data?.email || event.data?.to;
          if (!email) {
            console.warn("No email found in bounce event:", event);
            continue;
          }

          const bounceData = event.data?.data || event.data;
          const bounceType = bounceData?.hard_bounce
            ? "hard"
            : bounceData?.soft_bounce
            ? "soft"
            : bounceData?.bounce_type || "unknown";

          // Trouver le contact correspondant
          const { data: contact } = await supabaseClient
            .from("contacts")
            .select("id, user_id, email")
            .eq("email", email.toLowerCase())
            .maybeSingle();

          if (!contact) {
            console.warn(`Contact not found for email: ${email}`);
            results.push({ email, status: "contact_not_found" });
            continue;
          }

          // Créer l'enregistrement de bounce
          const { data: bounce, error: bounceError } = await supabaseClient
            .from("bounces")
            .insert({
              user_id: contact.user_id,
              contact_id: contact.id,
              email: email.toLowerCase(),
              bounce_type: bounceType,
              bounce_reason: bounceData?.bounce_message || bounceData?.bounce_code || "Unknown",
              bounce_code: bounceData?.bounce_code,
              bounce_message: bounceData?.bounce_message,
              source: "resend",
              is_processed: false,
            })
            .select()
            .single();

          if (bounceError) {
            console.error("Error creating bounce:", bounceError);
            results.push({ email, status: "error", error: bounceError.message });
            continue;
          }

          // Traiter automatiquement le bounce
          const { error: processError } = await supabaseClient.rpc("process_bounce", {
            p_contact_id: contact.id,
            p_bounce_type: bounceType,
            p_user_id: contact.user_id,
          });

          if (processError) {
            console.error("Error processing bounce:", processError);
          }

          // Marquer le bounce comme traité
          await supabaseClient
            .from("bounces")
            .update({
              is_processed: true,
              processed_at: new Date().toISOString(),
              action_taken: bounceType === "hard" ? "marked_inactive" : "none",
            })
            .eq("id", bounce.id);

          results.push({ email, status: "processed", bounce_type: bounceType });
        }

        // Traiter les plaintes (spam complaints)
        if (eventType === "email.complained" || eventType === "complaint" || event.data?.data?.complaint) {
          const email = event.data?.email || event.data?.data?.email || event.data?.to;
          if (!email) {
            console.warn("No email found in complaint event:", event);
            continue;
          }

          // Trouver le contact
          const { data: contact } = await supabaseClient
            .from("contacts")
            .select("id, user_id, email")
            .eq("email", email.toLowerCase())
            .maybeSingle();

          if (!contact) {
            console.warn(`Contact not found for email: ${email}`);
            results.push({ email, status: "contact_not_found" });
            continue;
          }

          // Créer l'enregistrement de bounce (type complaint)
          const { data: bounce, error: bounceError } = await supabaseClient
            .from("bounces")
            .insert({
              user_id: contact.user_id,
              contact_id: contact.id,
              email: email.toLowerCase(),
              bounce_type: "complaint",
              bounce_reason: "Spam complaint",
              bounce_message: event.data?.data?.complaint_feedback || "User marked email as spam",
              source: "resend",
              is_processed: false,
            })
            .select()
            .single();

          if (bounceError) {
            console.error("Error creating complaint:", bounceError);
            results.push({ email, status: "error", error: bounceError.message });
            continue;
          }

          // Traiter automatiquement (suppression immédiate)
          const { error: processError } = await supabaseClient.rpc("process_bounce", {
            p_contact_id: contact.id,
            p_bounce_type: "complaint",
            p_user_id: contact.user_id,
          });

          if (processError) {
            console.error("Error processing complaint:", processError);
          }

          // Mettre à jour le contact pour désabonnement immédiat
          await supabaseClient
            .from("contacts")
            .update({
              statut: "desabonne",
            })
            .eq("id", contact.id);

          // Marquer le bounce comme traité
          await supabaseClient
            .from("bounces")
            .update({
              is_processed: true,
              processed_at: new Date().toISOString(),
              action_taken: "removed",
            })
            .eq("id", bounce.id);

          results.push({ email, status: "processed", bounce_type: "complaint" });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error processing event:", err);
        results.push({ error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in webhook:", err);
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
