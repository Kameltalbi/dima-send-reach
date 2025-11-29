import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnqueueEmailRequest {
  campaignId: string;
  recipientId?: string;
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const {
      campaignId,
      recipientId,
      to,
      fromName,
      fromEmail,
      subject,
      html
    }: EnqueueEmailRequest = await req.json();

    // Validate required fields
    if (!campaignId || !to || !fromName || !fromEmail || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into email_queue
    const { data, error } = await supabaseClient
      .from('email_queue')
      .insert({
        campaign_id: campaignId,
        recipient_id: recipientId,
        to_email: to,
        from_name: fromName,
        from_email: fromEmail,
        subject,
        html,
        status: 'pending',
        attempts: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting into email_queue:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Email queued successfully: ${data.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        queueId: data.id,
        message: 'Email queued successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in enqueue-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});