import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface WarmingCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
  remaining?: number;
  isWarming?: boolean;
  currentDay?: number;
  warmingCompleted?: boolean;
}

/**
 * Vérifie si l'organisation peut envoyer un nombre donné d'emails selon le warming
 */
export async function checkWarmingLimit(
  supabaseClient: SupabaseClient,
  organizationId: string,
  emailCount: number,
  domain?: string
): Promise<WarmingCheckResult> {
  try {
    // Appeler la fonction SQL pour vérifier le warming
    const { data, error } = await supabaseClient.rpc("check_warming_limit", {
      p_organization_id: organizationId,
      p_domain: domain || null,
      p_email_count: emailCount,
    });

    if (error) {
      console.error("Error checking warming limit:", error);
      // En cas d'erreur, autoriser (fail-safe)
      return {
        allowed: true,
        isWarming: false,
      };
    }

    const result = data as any;

    if (!result.allowed) {
      return {
        allowed: false,
        reason: `Limite de warming atteinte. Jour ${result.current_day || 'N/A'}: ${result.used || 0} / ${result.limit || 'N/A'} emails envoyés aujourd'hui. Restant: ${result.remaining || 0}. Le warming augmente progressivement sur 6 semaines.`,
        limit: result.limit,
        used: result.used,
        remaining: result.remaining,
        isWarming: result.is_warming,
        currentDay: result.current_day,
        warmingCompleted: result.warming_completed,
      };
    }

    return {
      allowed: true,
      limit: result.limit,
      used: result.used,
      remaining: result.remaining,
      isWarming: result.is_warming,
      currentDay: result.current_day,
      warmingCompleted: result.warming_completed,
    };
  } catch (error) {
    console.error("Error in checkWarmingLimit:", error);
    // En cas d'erreur, autoriser (fail-safe)
    return {
      allowed: true,
      isWarming: false,
    };
  }
}

/**
 * Obtient les informations de warming pour une organisation
 */
export async function getWarmingInfo(
  supabaseClient: SupabaseClient,
  organizationId: string,
  domain?: string
): Promise<{
  isActive: boolean;
  currentDay: number;
  limit: number;
  used: number;
  remaining: number;
  startedAt: string;
  completedAt?: string;
} | null> {
  try {
    const { data, error } = await supabaseClient
      .from("email_warming")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("domain", domain || null)
      .single();

    if (error || !data) {
      return null;
    }

    // Compter les emails envoyés aujourd'hui via la fonction SQL
    const { data: warmingCheck } = await supabaseClient.rpc("check_warming_limit", {
      p_organization_id: organizationId,
      p_domain: domain || null,
      p_email_count: 0, // Juste pour obtenir les stats
    });

    const used = warmingCheck?.used || 0;

    return {
      isActive: data.is_active,
      currentDay: data.current_day,
      limit: data.max_emails_today,
      used,
      remaining: Math.max(0, data.max_emails_today - used),
      startedAt: data.started_at,
      completedAt: data.warming_completed_at || undefined,
    };
  } catch (error) {
    console.error("Error getting warming info:", error);
    return null;
  }
}

