import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BatchSendRequest {
  campaignId: string;
  listId: string;
  volume: number; // 10000, 15000, 20000, 25000, 30000, or 50000
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { campaignId, listId, volume }: BatchSendRequest = await req.json();

    if (!campaignId || !listId || !volume) {
      throw new Error("campaignId, listId, and volume are required");
    }

    // Validate volume
    const validVolumes = [10000, 15000, 20000, 25000, 30000, 50000];
    if (!validVolumes.includes(volume)) {
      throw new Error(`Invalid volume. Must be one of: ${validVolumes.join(", ")}`);
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`);
    }

    // Check remaining contacts count
    const { data: remainingCountData, error: countError } = await supabaseClient
      .rpc("get_remaining_contacts_count", {
        p_list_id: listId,
        p_campaign_id: campaignId,
      });

    if (countError) {
      throw new Error(`Error getting remaining count: ${countError.message}`);
    }

    const remainingCount = remainingCountData || 0;

    if (remainingCount < volume) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Not enough remaining contacts. Available: ${remainingCount}, Requested: ${volume}`,
          remaining: remainingCount,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get total contacts in list
    const { data: totalCountData } = await supabaseClient.rpc(
      "get_total_contacts_in_list",
      { p_list_id: listId }
    );
    const totalContacts = totalCountData || 0;

    // Get already sent count
    const { data: sentCountData } = await supabaseClient.rpc(
      "get_sent_contacts_count",
      {
        p_list_id: listId,
        p_campaign_id: campaignId,
      }
    );
    const alreadySent = sentCountData || 0;

    // Pick random subset of contacts
    const { data: selectedContacts, error: selectError } = await supabaseClient
      .rpc("pick_random_contacts", {
        p_list_id: listId,
        p_campaign_id: campaignId,
        p_limit: volume,
      });

    if (selectError || !selectedContacts || selectedContacts.length === 0) {
      throw new Error(
        `Error selecting contacts: ${selectError?.message || "No contacts selected"}`
      );
    }

    console.log(
      `Selected ${selectedContacts.length} contacts for batch send (campaign: ${campaignId})`
    );

    // Get next batch number
    const { data: maxBatchData } = await supabaseClient
      .from("campaign_sends")
      .select("batch_number")
      .eq("campaign_id", campaignId)
      .order("batch_number", { ascending: false })
      .limit(1)
      .single();

    const nextBatchNumber = maxBatchData?.batch_number
      ? maxBatchData.batch_number + 1
      : 1;

    // Insert campaign_sends records (mark as pending first)
    const campaignSendsData = selectedContacts.map((contact: any) => ({
      campaign_id: campaignId,
      contact_id: contact.contact_id,
      status: "pending",
      batch_number: nextBatchNumber,
    }));

    const { error: insertError } = await supabaseClient
      .from("campaign_sends")
      .insert(campaignSendsData);

    if (insertError) {
      throw new Error(`Error inserting campaign sends: ${insertError.message}`);
    }

    // Also create campaign_recipients records for tracking
    const recipientsData = selectedContacts.map((contact: any) => ({
      campaign_id: campaignId,
      contact_id: contact.contact_id,
      statut_envoi: "en_attente",
    }));

    const { error: recipientsError } = await supabaseClient
      .from("campaign_recipients")
      .upsert(recipientsData, {
        onConflict: "campaign_id,contact_id",
        ignoreDuplicates: false,
      });

    if (recipientsError) {
      console.warn(
        `Warning: Error upserting campaign recipients: ${recipientsError.message}`
      );
    }

    // Add emails to queue for processing
    const emailQueueData = selectedContacts.map((contact: any) => ({
      campaign_id: campaignId,
      to_email: contact.email,
      from_name: campaign.expediteur_nom,
      from_email: campaign.expediteur_email,
      subject: campaign.sujet_email,
      html: campaign.html_contenu || "",
      status: "pending",
    }));

    const { error: queueError } = await supabaseClient
      .from("email_queue")
      .insert(emailQueueData);

    if (queueError) {
      throw new Error(`Error adding to email queue: ${queueError.message}`);
    }

    // Update campaign_sends status to 'sent' after queueing
    // (The actual sending will be handled by process-email-queue)
    const contactIds = selectedContacts.map((c: any) => c.contact_id);
    const { error: updateError } = await supabaseClient
      .from("campaign_sends")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("campaign_id", campaignId)
      .in("contact_id", contactIds)
      .eq("status", "pending");

    if (updateError) {
      console.warn(
        `Warning: Error updating campaign_sends status: ${updateError.message}`
      );
    }

    // Calculate remaining after this batch
    const remainingAfter = remainingCount - selectedContacts.length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch send initiated successfully`,
        summary: {
          totalContacts: totalContacts,
          alreadySent: alreadySent,
          batchSent: selectedContacts.length,
          remaining: remainingAfter,
          batchNumber: nextBatchNumber,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in batch send:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

