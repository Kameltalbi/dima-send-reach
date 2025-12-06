import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const BATCH_SIZE = 200;
const RATE_LIMIT_DELAY_MS = 330; // ~3 emails per second
const MAX_ATTEMPTS = 3;
const LOCK_TIMEOUT_MINUTES = 5;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const workerId = crypto.randomUUID();
  
  console.log(`[${workerId}] Starting email queue processing...`);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Clean up stale locks (older than 5 minutes)
    const lockTimeout = new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000);
    await supabaseClient
      .from('email_queue')
      .update({ 
        status: 'pending',
        locked_at: null,
        locked_by: null
      })
      .eq('status', 'sending')
      .lt('locked_at', lockTimeout.toISOString());

    // Also update scheduled emails that are now due to become pending
    const now = new Date().toISOString();
    const { data: scheduledUpdated, error: scheduleUpdateError } = await supabaseClient
      .from('email_queue')
      .update({ status: 'pending' })
      .eq('status', 'scheduled')
      .lte('created_at', now)
      .select('id');
    
    if (scheduledUpdated && scheduledUpdated.length > 0) {
      console.log(`[${workerId}] Activated ${scheduledUpdated.length} scheduled emails`);
    }

    // Fetch pending emails with row-level locking to prevent duplicates
    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error(`[${workerId}] Error fetching pending emails:`, fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log(`[${workerId}] No pending emails in queue`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending emails',
          processed: 0,
          scheduledActivated: scheduledUpdated?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${workerId}] Found ${pendingEmails.length} pending emails`);

    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Process emails with rate limiting
    for (const email of pendingEmails) {
      try {
        // Lock the email (atomic update to prevent double-processing)
        const { data: lockedEmail, error: lockError } = await supabaseClient
          .from('email_queue')
          .update({ 
            status: 'sending',
            locked_at: new Date().toISOString(),
            locked_by: workerId
          })
          .eq('id', email.id)
          .eq('status', 'pending') // Only lock if still pending
          .select()
          .single();

        // If lock failed, another worker got it first - skip
        if (lockError || !lockedEmail) {
          console.log(`[${workerId}] Email ${email.id} already locked by another worker`);
          continue;
        }

        // Send email via Resend API
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `${email.from_name} <${email.from_email}>`,
            to: [email.to_email],
            subject: email.subject,
            html: email.html,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(errorData.message || `Resend API error: ${emailResponse.status}`);
        }

        // Mark as sent
        await supabaseClient
          .from('email_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
            locked_at: null,
            locked_by: null
          })
          .eq('id', email.id);

        // Update campaign_recipients if linked
        if (email.recipient_id) {
          await supabaseClient
            .from('campaign_recipients')
            .update({ 
              statut_envoi: 'envoye',
              date_envoi: new Date().toISOString()
            })
            .eq('id', email.recipient_id);
        }

        successCount++;
        console.log(`[${workerId}] ✓ Sent email ${email.id} to ${email.to_email}`);

      } catch (error: any) {
        console.error(`[${workerId}] ✗ Error sending email ${email.id}:`, error.message);
        
        const newAttempts = email.attempts + 1;
        const newStatus = newAttempts >= MAX_ATTEMPTS ? 'error' : 'pending';

        // Update with error info
        await supabaseClient
          .from('email_queue')
          .update({ 
            status: newStatus,
            attempts: newAttempts,
            error_message: error.message,
            locked_at: null,
            locked_by: null
          })
          .eq('id', email.id);

        // Update campaign_recipients if linked
        if (email.recipient_id) {
          await supabaseClient
            .from('campaign_recipients')
            .update({ 
              statut_envoi: 'erreur'
            })
            .eq('id', email.recipient_id);
        }

        errorCount++;
        errors.push({
          email: email.to_email,
          error: error.message,
          attempts: newAttempts
        });
      }

      // Rate limiting: wait 330ms between emails (~3 emails/second)
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }

    const duration = Date.now() - startTime;
    console.log(`[${workerId}] Finished processing: ${successCount} sent, ${errorCount} errors in ${duration}ms`);

    return new Response(
      JSON.stringify({ 
        success: true,
        workerId,
        processed: successCount + errorCount,
        sent: successCount,
        errors: errorCount,
        duration: `${duration}ms`,
        errorDetails: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[${workerId}] Critical error in process-email-queue:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});