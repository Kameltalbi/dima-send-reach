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

      if (error) {
        console.error("Erreur lors de la récupération du quota:", error);
        // Pour les plans pro, retourner un quota illimité par défaut en cas d'erreur
        return { limit: null, used: 0, remaining: null };
      }
      
      // Si data est null ou undefined, retourner un quota illimité par défaut
      if (!data) {
        return { limit: null, used: 0, remaining: null };
      }
      
      return data as { limit: number | null; used: number; remaining: number | null };
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    retry: 1, // Réessayer une fois en cas d'erreur
  });

  // Calculer le quota avec les métriques
  const quota: ContactQuota | null = useMemo(() => {
    // Si les données sont en cours de chargement, retourner null
    if (isLoading) return null;
    
    // Si pas de données après chargement, retourner un quota illimité par défaut (pour les plans pro)
    if (!quotaData) {
      return {
        limit: null, // null = illimité
        used: 0,
        remaining: null,
        percentage: 0,
        isNearLimit: false,
        isAtLimit: false,
        isBlocked: false,
      };
    }

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
    // Si le quota est en cours de chargement, permettre l'ajout (sera vérifié côté serveur)
    if (isLoading || !quota) return true;
    
    // Si limit est null, c'est illimité (plans pro et autres)
    if (quota.limit === null) return true;
    
    // Vérifier le quota pour les plans avec limite
    return (quota.remaining ?? 0) >= count && !quota.isBlocked;
  };

  return {
    quota,
    isLoading,
    canAddContacts,
  };
};

