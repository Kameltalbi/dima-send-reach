import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Shield, Users } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

type PermissionType = {
  id: string;
  label: string;
  description: string;
};

const availablePermissions: PermissionType[] = [
  {
    id: 'delete_contacts',
    label: 'Supprimer des contacts',
    description: 'Autoriser la suppression de contacts individuels ou en masse'
  },
  {
    id: 'export_contacts',
    label: 'Exporter des contacts',
    description: 'Autoriser l\'export CSV de la liste de contacts'
  },
  {
    id: 'manage_lists',
    label: 'Gérer les listes',
    description: 'Créer, modifier et supprimer des listes de contacts'
  },
  {
    id: 'manage_campaigns',
    label: 'Gérer les campagnes',
    description: 'Créer, modifier, supprimer et envoyer des campagnes'
  },
];

const Team = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isOrgAdmin } = usePermissions();

  // Récupérer le profil avec l'organization_id
  const { data: currentProfile } = useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("organization_id, organization_role")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Récupérer tous les membres de l'organisation
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members", currentProfile?.organization_id],
    queryFn: async () => {
      if (!currentProfile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, prenom, email_envoi_defaut, organization_role")
        .eq("organization_id", currentProfile.organization_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentProfile?.organization_id,
  });

  // Récupérer les permissions de tous les membres
  const { data: allPermissions } = useQuery({
    queryKey: ["all-permissions", currentProfile?.organization_id],
    queryFn: async () => {
      if (!currentProfile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("user_permissions")
        .select("user_id, permission")
        .eq("organization_id", currentProfile.organization_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentProfile?.organization_id && isOrgAdmin,
  });

  // Mutation pour mettre à jour les permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      if (!currentProfile?.organization_id) return;

      // Supprimer toutes les permissions existantes de cet utilisateur
      await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("organization_id", currentProfile.organization_id);

      // Ajouter les nouvelles permissions
      if (permissions.length > 0) {
        const permissionsToInsert = permissions.map(permission => ({
          user_id: userId,
          organization_id: currentProfile.organization_id,
          permission,
          granted_by: user?.id,
        }));

        const { error } = await supabase
          .from("user_permissions")
          .insert(permissionsToInsert);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-permissions"] });
      toast.success("Permissions mises à jour");
    },
    onError: (error) => {
      console.error("Erreur mise à jour permissions:", error);
      toast.error("Erreur lors de la mise à jour des permissions");
    },
  });

  const getUserPermissions = (userId: string): string[] => {
    return allPermissions?.filter(p => p.user_id === userId).map(p => p.permission) || [];
  };

  const handleTogglePermission = (userId: string, permission: string, checked: boolean) => {
    const currentPermissions = getUserPermissions(userId);
    const newPermissions = checked
      ? [...currentPermissions, permission]
      : currentPermissions.filter(p => p !== permission);
    
    updatePermissionsMutation.mutate({ userId, permissions: newPermissions });
  };

  if (!isOrgAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Équipe</h1>
          <p className="text-muted-foreground mt-1">
            Seuls les administrateurs peuvent gérer les permissions de l'équipe
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12 text-center">
              <div>
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Accès restreint
                </h3>
                <p className="text-muted-foreground">
                  Contactez un administrateur pour gérer les permissions de l'équipe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Équipe et permissions</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les permissions de votre équipe
        </p>
      </div>

      {/* Info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Les administrateurs ont automatiquement toutes les permissions
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Vous pouvez donner des permissions spécifiques aux autres membres de votre organisation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des membres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres de l'équipe
          </CardTitle>
          <CardDescription>
            {teamMembers?.length || 0} membre(s) dans votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !teamMembers || teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun membre dans votre équipe</p>
            </div>
          ) : (
            <div className="space-y-6">
              {teamMembers.map((member) => (
                <div key={member.id} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">
                          {member.prenom} {member.nom}
                        </h3>
                        {member.organization_role === 'admin' && (
                          <Badge variant="default">Admin</Badge>
                        )}
                        {member.id === user?.id && (
                          <Badge variant="outline">Vous</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {member.email_envoi_defaut || 'Pas d\'email'}
                      </p>
                    </div>
                  </div>

                  {member.organization_role !== 'admin' && (
                    <div className="space-y-3 pt-3 border-t">
                      <Label className="text-sm font-medium">Permissions</Label>
                      <div className="grid gap-3">
                        {availablePermissions.map((permission) => (
                          <div key={permission.id} className="flex items-start gap-3">
                            <Checkbox
                              id={`${member.id}-${permission.id}`}
                              checked={getUserPermissions(member.id).includes(permission.id)}
                              onCheckedChange={(checked) =>
                                handleTogglePermission(member.id, permission.id, checked as boolean)
                              }
                              disabled={updatePermissionsMutation.isPending}
                            />
                            <div className="grid gap-0.5 leading-none">
                              <Label
                                htmlFor={`${member.id}-${permission.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permission.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;
