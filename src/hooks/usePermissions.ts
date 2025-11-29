import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Permission = 
  | 'delete_contacts' 
  | 'export_contacts' 
  | 'manage_lists' 
  | 'manage_campaigns';

export const usePermissions = () => {
  const { user } = useAuth();

  // Récupérer le profil avec le rôle
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("organization_role, organization_id")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Récupérer les permissions spécifiques
  const { data: permissions } = useQuery({
    queryKey: ["user_permissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", user?.id);
      
      if (error) throw error;
      return data?.map(p => p.permission) || [];
    },
    enabled: !!user,
  });

  const isOrgAdmin = profile?.organization_role === 'admin';
  
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    // Les admins ont toutes les permissions
    if (isOrgAdmin) return true;
    // Sinon vérifier les permissions spécifiques
    return permissions?.includes(permission) || false;
  };

  const canDeleteContacts = hasPermission('delete_contacts');
  const canExportContacts = hasPermission('export_contacts');
  const canManageLists = hasPermission('manage_lists');
  const canManageCampaigns = hasPermission('manage_campaigns');

  return {
    isOrgAdmin,
    hasPermission,
    canDeleteContacts,
    canExportContacts,
    canManageLists,
    canManageCampaigns,
  };
};
