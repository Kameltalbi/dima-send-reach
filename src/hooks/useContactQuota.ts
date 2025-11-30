import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export interface ContactQuota {
  limit: number | null; // null = illimité
  used: number;
  remaining: number | null; // null = illimité
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  isBlocked: boolean;
}

export const useContactQuota = () => {
  const { user } = useAuth();

  // Récupérer le quota de contacts depuis la fonction SQL
  const { data: quotaData, isLoading } = useQuery({
    queryKey: ["contact-quota", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.rpc("get_contact_quota", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as { limit: number | null; used: number; remaining: number | null };
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  // Calculer le quota avec les métriques
  const quota: ContactQuota | null = useMemo(() => {
    if (!quotaData) return null;

    const limit = quotaData.limit;
    const used = quotaData.used || 0;
    const remaining = quotaData.remaining;

    // Si limit est null, c'est illimité
    if (limit === null) {
      return {
        limit: null,
        used,
        remaining: null,
        percentage: 0,
        isNearLimit: false,
        isAtLimit: false,
        isBlocked: false,
      };
    }

    const percentage = limit > 0 ? (used / limit) * 100 : 0;
    const isNearLimit = percentage >= 80 && percentage < 100;
    const isAtLimit = percentage >= 100;
    const isBlocked = percentage >= 100;

    return {
      limit,
      used,
      remaining: remaining ?? 0,
      percentage,
      isNearLimit,
      isAtLimit,
      isBlocked,
    };
  }, [quotaData]);

  // Vérifier si l'utilisateur peut ajouter un nombre donné de contacts
  const canAddContacts = (count: number): boolean => {
    if (!quota) return false;
    // Si limit est null, c'est illimité
    if (quota.limit === null) return true;
    return (quota.remaining ?? 0) >= count && !quota.isBlocked;
  };

  return {
    quota,
    isLoading,
    canAddContacts,
  };
};

