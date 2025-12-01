// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AutomationExecution {
  id: string;
  automation_id: string;
  contact_id: string;
  current_step: number;
  status: string;
  next_execution_at: string | null;
}

interface AutomationRecord {
  id: string;
  user_id: string;
  nom: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  total_sent?: number;
}

interface StepRecord {
  id: string;
  automation_id: string;
  step_order: number;
  step_type: string;
  step_config: Record<string, unknown>;
}

interface ContactRecord {
  id: string;
  email: string;
  nom: string;
  prenom: string;
}

interface TemplateRecord {
  id: string;
  nom: string;
  content_html: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase
    const supabaseClient: any = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer toutes les automatisations actives
    const { data: automations, error: automationsError } = await supabaseClient
      .from("automations")
      .select("*")
      .eq("is_active", true);

    if (automationsError) {
      throw automationsError;
    }

    if (!automations || automations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active automations found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const results: Array<{ automation_id: string; automation_name?: string; contacts_processed?: number; error?: string }> = [];

    // Traiter chaque automatisation
    for (const rawAutomation of automations) {
      const automation = rawAutomation as AutomationRecord;
      try {
        // Récupérer les étapes de l'automatisation
        const { data: stepsData, error: stepsError } = await supabaseClient
          .from("automation_steps")
          .select("*")
          .eq("automation_id", automation.id)
          .order("step_order");

        if (stepsError) {
          console.error(`Error fetching steps for automation ${automation.id}:`, stepsError);
          continue;
        }

        const steps = (stepsData || []) as StepRecord[];

        if (steps.length === 0) {
          continue;
        }

        // Trouver les contacts qui correspondent au déclencheur
        const contacts = await findTriggeredContacts(
          supabaseClient,
          automation.trigger_type,
          automation.trigger_config,
          automation.user_id
        );

        // Pour chaque contact, créer ou mettre à jour l'exécution
        for (const contact of contacts) {
          // Vérifier si une exécution existe déjà
          const { data: existingExecution } = await supabaseClient
            .from("automation_executions")
            .select("*")
            .eq("automation_id", automation.id)
            .eq("contact_id", contact.id)
            .in("status", ["pending", "running"])
            .maybeSingle();

          if (existingExecution) {
            // Mettre à jour l'exécution existante
            await processAutomationStep(
              supabaseClient,
              automation,
              steps,
              existingExecution as AutomationExecution,
              contact
            );
          } else {
            // Créer une nouvelle exécution
            const { data: newExecution, error: execError } = await supabaseClient
              .from("automation_executions")
              .insert({
                automation_id: automation.id,
                contact_id: contact.id,
                current_step: 1,
                status: "pending",
                next_execution_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (execError) {
              console.error(`Error creating execution:`, execError);
              continue;
            }

            if (newExecution) {
              await processAutomationStep(
                supabaseClient,
                automation,
                steps,
                newExecution as AutomationExecution,
                contact
              );
            }
          }
        }

        results.push({
          automation_id: automation.id,
          automation_name: automation.nom,
          contacts_processed: contacts.length,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing automation ${automation.id}:`, err);
        results.push({
          automation_id: automation.id,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Processed ${automations.length} automations`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error processing automations:", err);
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

// Trouver les contacts qui correspondent au déclencheur
async function findTriggeredContacts(
  supabaseClient: any,
  triggerType: string,
  triggerConfig: Record<string, unknown>,
  userId: string
): Promise<ContactRecord[]> {
  let query = supabaseClient
    .from("contacts")
    .select("id, email, nom, prenom")
    .eq("user_id", userId)
    .eq("statut", "actif");

  switch (triggerType) {
    case "contact_added": {
      // Contacts ajoutés dans les dernières 24 heures
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      query = query.gte("created_at", yesterday.toISOString());
      break;
    }

    case "contact_subscribed":
      // Contacts avec statut actif (déjà filtré)
      break;

    case "list_added":
      if (triggerConfig.list_id) {
        // Contacts dans la liste spécifiée
        const { data: listContacts } = await supabaseClient
          .from("list_contacts")
          .select("contact_id")
          .eq("list_id", triggerConfig.list_id as string);

        if (listContacts && listContacts.length > 0) {
          const contactIds = listContacts.map((lc: { contact_id: string }) => lc.contact_id);
          query = query.in("id", contactIds);
        } else {
          return [];
        }
      }
      break;

    case "campaign_opened":
      // Contacts qui ont ouvert une campagne récemment
      return [];

    case "campaign_clicked":
      // Contacts qui ont cliqué sur une campagne récemment
      return [];

    default:
      return [];
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error finding triggered contacts:", error);
    return [];
  }

  return (data || []) as ContactRecord[];
}

// Traiter une étape d'automatisation
async function processAutomationStep(
  supabaseClient: any,
  automation: AutomationRecord,
  steps: StepRecord[],
  execution: AutomationExecution,
  contact: ContactRecord
) {
  const currentStepIndex = execution.current_step - 1;
  const currentStep = steps[currentStepIndex];

  if (!currentStep) {
    // Toutes les étapes sont terminées
    await supabaseClient
      .from("automation_executions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", execution.id);

    return;
  }

  // Vérifier si c'est le moment d'exécuter cette étape
  const now = new Date();
  if (execution.next_execution_at && new Date(execution.next_execution_at) > now) {
    // Pas encore le moment d'exécuter
    return;
  }

  // Exécuter l'étape
  try {
    if (currentStep.step_type === "send_email") {
      await executeSendEmailStep(
        supabaseClient,
        automation,
        currentStep,
        contact
      );

      // Mettre à jour les statistiques
      await supabaseClient
        .from("automations")
        .update({
          total_sent: (automation.total_sent || 0) + 1,
        })
        .eq("id", automation.id);
    } else if (currentStep.step_type === "wait") {
      // Calculer la prochaine date d'exécution
      const waitDays = (currentStep.step_config.days as number) || 1;
      const nextExecution = new Date();
      nextExecution.setDate(nextExecution.getDate() + waitDays);

      await supabaseClient
        .from("automation_executions")
        .update({
          current_step: execution.current_step + 1,
          next_execution_at: nextExecution.toISOString(),
          status: "pending",
        })
        .eq("id", execution.id);

      return;
    }

    // Passer à l'étape suivante
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      // Il y a une étape suivante
      const nextStep = steps[nextStepIndex];
      let nextExecutionAt = new Date().toISOString();

      // Si la prochaine étape est un "wait", calculer la date
      if (nextStep.step_type === "wait") {
        const waitDays = (nextStep.step_config.days as number) || 1;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + waitDays);
        nextExecutionAt = nextDate.toISOString();
      }

      await supabaseClient
        .from("automation_executions")
        .update({
          current_step: execution.current_step + 1,
          next_execution_at: nextExecutionAt,
          status: "pending",
        })
        .eq("id", execution.id);
    } else {
      // Toutes les étapes sont terminées
      await supabaseClient
        .from("automation_executions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", execution.id);
    }
  } catch (err) {
    console.error(`Error executing step ${currentStepIndex + 1}:`, err);
    await supabaseClient
      .from("automation_executions")
      .update({
        status: "paused",
      })
      .eq("id", execution.id);
  }
}

// Exécuter une étape d'envoi d'email
async function executeSendEmailStep(
  supabaseClient: any,
  automation: AutomationRecord,
  step: StepRecord,
  contact: ContactRecord
) {
  const templateId = step.step_config.template_id as string;
  if (!templateId) {
    throw new Error("Template ID is required for send_email step");
  }

  // Récupérer le template
  const { data: templateData, error: templateError } = await supabaseClient
    .from("templates")
    .select("id, nom, content_html")
    .eq("id", templateId)
    .single();

  if (templateError || !templateData) {
    throw new Error("Template not found");
  }

  const template = templateData as TemplateRecord;

  // Appeler l'Edge Function send-email pour envoyer l'email
  const sendEmailUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`;
  const sendEmailResponse = await fetch(sendEmailUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      campaign_id: null, // Pas de campagne associée
      recipients: [
        {
          email: contact.email,
          nom: contact.nom,
          prenom: contact.prenom,
        },
      ],
      subject: template.nom || "Email automatique",
      html_content: template.content_html,
      from_name: automation.nom,
      from_email: contact.email,
    }),
  });

  if (!sendEmailResponse.ok) {
    const errorText = await sendEmailResponse.text();
    throw new Error(`Failed to send email: ${errorText}`);
  }
}
