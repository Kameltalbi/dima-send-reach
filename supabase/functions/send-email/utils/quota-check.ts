import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
  remaining?: number;
}

/**
 * Vérifie si l'utilisateur peut envoyer un nombre donné d'emails selon son plan
 */
export async function checkEmailQuota(
  supabaseClient: SupabaseClient,
  userId: string,
  emailCount: number
): Promise<QuotaCheckResult> {
  try {
    // Récupérer le profil utilisateur pour obtenir l'organization_id
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.organization_id) {
      return {
        allowed: false,
        reason: "Aucune organisation associée à votre compte",
      };
    }

    // Récupérer la subscription active
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("statut", "active")
      .order("date_debut", { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      return {
        allowed: false,
        reason: "Aucun abonnement actif trouvé",
      };
    }

    // Limite totale = limite du plan + emails supplémentaires
    const limit = (subscription.email_limit || 0) + (subscription.extra_emails || 0);

    // Calculer les emails envoyés ce mois-ci
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from("campaigns")
      .select(`
        id,
        campaign_stats (
          total_envoyes
        )
      `)
      .eq("user_id", userId)
      .eq("statut", "envoye")
      .gte("date_envoi", startOfMonth.toISOString())
      .lte("date_envoi", endOfMonth.toISOString());

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError);
      return {
        allowed: false,
        reason: "Erreur lors de la vérification du quota",
      };
    }

    const used = campaigns?.reduce((acc, campaign) => {
      const stats = campaign.campaign_stats?.[0];
      return acc + (stats?.total_envoyes || 0);
    }, 0) || 0;

    const remaining = Math.max(0, limit - used);

    // Vérifier si le quota est suffisant
    if (remaining < emailCount) {
      return {
        allowed: false,
        reason: `Quota insuffisant. Limite: ${limit.toLocaleString()}, Utilisé: ${used.toLocaleString()}, Restant: ${remaining.toLocaleString()}, Demandé: ${emailCount.toLocaleString()}`,
        limit,
        used,
        remaining,
      };
    }

    // Vérifier si le quota est dépassé
    if (used >= limit) {
      return {
        allowed: false,
        reason: `Quota mensuel dépassé. Limite: ${limit.toLocaleString()}, Utilisé: ${used.toLocaleString()}`,
        limit,
        used,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      limit,
      used,
      remaining,
    };
  } catch (error) {
    console.error("Error in checkEmailQuota:", error);
    return {
      allowed: false,
      reason: "Erreur lors de la vérification du quota",
    };
  }
}

