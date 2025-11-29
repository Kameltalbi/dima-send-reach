import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export interface EmailQuota {
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
  isNearLimit: boolean; // 80% ou plus
  isAtLimit: boolean; // 100% ou plus
  isBlocked: boolean; // Dépassement
  resetDate: Date | null; // Date de réinitialisation du quota
}

export const useEmailQuota = () => {
  const { user } = useAuth();

  // Récupérer la subscription de l'utilisateur
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Récupérer l'organization_id de l'utilisateur
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return null;

      // Récupérer la subscription active
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("statut", "active")
        .order("date_debut", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
      return data;
    },
    enabled: !!user,
  });

  // Calculer les emails envoyés ce mois-ci
  const { data: emailsSentThisMonth, isLoading: emailsLoading } = useQuery({
    queryKey: ["emails-sent-month", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Compter les emails envoyés via les campagnes ce mois-ci
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select(`
          id,
          campaign_stats (
            total_envoyes
          )
        `)
        .eq("user_id", user.id)
        .eq("statut", "envoye")
        .gte("date_envoi", startOfMonth.toISOString())
        .lte("date_envoi", endOfMonth.toISOString());

      if (error) throw error;

      const totalSent = campaigns?.reduce((acc, campaign) => {
        const stats = campaign.campaign_stats?.[0];
        return acc + (stats?.total_envoyes || 0);
      }, 0) || 0;

      return totalSent;
    },
    enabled: !!user,
  });

  // Calculer la date de réinitialisation (début du mois prochain)
  const resetDate = useMemo(() => {
    if (!subscription) return null;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }, [subscription]);

  // Calculer le quota
  const quota: EmailQuota | null = useMemo(() => {
    if (!subscription || emailsSentThisMonth === undefined) return null;

    const limit = (subscription.email_limit || 0) + (subscription.extra_emails || 0);
    const used = emailsSentThisMonth || 0;
    const remaining = Math.max(0, limit - used);
    const percentage = limit > 0 ? (used / limit) * 100 : 0;
    const isNearLimit = percentage >= 80 && percentage < 100;
    const isAtLimit = percentage >= 100;
    const isBlocked = percentage >= 100;

    return {
      limit,
      used,
      remaining,
      percentage,
      isNearLimit,
      isAtLimit,
      isBlocked,
      resetDate,
    };
  }, [subscription, emailsSentThisMonth, resetDate]);

  // Vérifier si l'utilisateur peut envoyer un nombre d'emails donné
  const canSendEmails = (count: number): boolean => {
    if (!quota) return false;
    return quota.remaining >= count && !quota.isBlocked;
  };

  return {
    quota,
    isLoading: subscriptionLoading || emailsLoading,
    canSendEmails,
  };
};

