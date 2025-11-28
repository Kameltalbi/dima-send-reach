import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Mail, Info } from "lucide-react";

const Parametres = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState({
    prenom: "",
    nom: "",
    nom_entreprise: "",
    email_envoi_defaut: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferences, setPreferences] = useState({
    timezone: "Europe/Paris",
    default_send_hour: 10,
    enable_tracking: true,
    enable_unsubscribe_link: true,
    notify_on_campaign_sent: true,
    notify_on_high_engagement: false,
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Charger le profil
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Charger les préférences
  const { data: userPreferences } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Charger les membres de l'équipe
  const { data: teamMembers } = useQuery({
    queryKey: ["team-members", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, prenom, nom, created_at, user_roles(role)")
        .eq("organization_id", profile.organization_id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  // Charger les invitations en attente
  const { data: invitations } = useQuery({
    queryKey: ["invitations", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("status", "pending");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  // Initialiser les données
  useEffect(() => {
    if (profile) {
      setProfileData({
        prenom: profile.prenom || "",
        nom: profile.nom || "",
        nom_entreprise: profile.nom_entreprise || "",
        email_envoi_defaut: profile.email_envoi_defaut || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (userPreferences) {
      setPreferences({
        timezone: userPreferences.timezone || "Europe/Paris",
        default_send_hour: userPreferences.default_send_hour || 10,
        enable_tracking: userPreferences.enable_tracking ?? true,
        enable_unsubscribe_link: userPreferences.enable_unsubscribe_link ?? true,
        notify_on_campaign_sent: userPreferences.notify_on_campaign_sent ?? true,
        notify_on_high_engagement: userPreferences.notify_on_high_engagement ?? false,
      });
    }
  }, [userPreferences]);

  // Mutation pour sauvegarder le profil
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!profileData.prenom || !profileData.nom || !profileData.nom_entreprise) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          prenom: profileData.prenom,
          nom: profileData.nom,
          nom_entreprise: profileData.nom_entreprise,
          email_envoi_defaut: profileData.email_envoi_defaut || null,
        })
        .eq("id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profil mis à jour avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    },
  });

  // Mutation pour changer le mot de passe
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error("Veuillez remplir tous les champs");
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas");
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: passwordData.currentPassword,
      });

      if (signInError) {
        throw new Error("Mot de passe actuel incorrect");
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mot de passe modifié avec succès");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    },
  });

  // Mutation pour sauvegarder les préférences
  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (userPreferences) {
        const { error } = await supabase
          .from("user_preferences")
          .update(preferences)
          .eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_preferences")
          .insert({ ...preferences, user_id: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
      toast.success("Préférences enregistrées");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'enregistrement des préférences");
    },
  });

  // Mutation pour inviter un utilisateur
  const inviteUserMutation = useMutation({
    mutationFn: async () => {
      if (!inviteEmail || !profile?.organization_id) {
        throw new Error("Email requis");
      }

      const { error } = await supabase.from("user_invitations").insert({
        email: inviteEmail,
        role: inviteRole,
        organization_id: profile.organization_id,
        invited_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation envoyée");
      setInviteEmail("");
      setInviteRole("user");
      setShowInviteDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
    },
  });

  // Mutation pour supprimer une invitation
  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("user_invitations")
        .delete()
        .eq("id", invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation supprimée");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre profil, votre équipe et vos préférences
        </p>
      </div>

      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="equipe">Équipe</TabsTrigger>
          <TabsTrigger value="preferences">Préférences d'envoi</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos coordonnées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={profileData.prenom}
                    onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={profileData.nom}
                    onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié ici
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entreprise">Nom de l'entreprise *</Label>
                <Input
                  id="entreprise"
                  value={profileData.nom_entreprise}
                  onChange={(e) => setProfileData({ ...profileData, nom_entreprise: e.target.value })}
                  placeholder="Votre entreprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-envoi">Email d'envoi par défaut</Label>
                <Input
                  id="email-envoi"
                  type="email"
                  value={profileData.email_envoi_defaut}
                  onChange={(e) => setProfileData({ ...profileData, email_envoi_defaut: e.target.value })}
                  placeholder="newsletter@entreprise.com"
                />
                <p className="text-sm text-muted-foreground">
                  Cette adresse sera utilisée comme expéditeur par défaut
                </p>
              </div>
              <Button
                onClick={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending}
              >
                {saveProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>
                Modifier votre mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              <Button
                onClick={() => changePasswordMutation.mutate()}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Changer le mot de passe"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Membres de l'équipe</CardTitle>
                  <CardDescription>
                    Gérez les utilisateurs de votre organisation
                  </CardDescription>
                </div>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Inviter un utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Inviter un nouvel utilisateur</DialogTitle>
                      <DialogDescription>
                        Envoyez une invitation à un nouveau membre de votre équipe
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="utilisateur@exemple.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Rôle</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Utilisateur</SelectItem>
                            <SelectItem value="admin">Administrateur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => inviteUserMutation.mutate()}
                        disabled={inviteUserMutation.isPending}
                      >
                        {inviteUserMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          "Envoyer l'invitation"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Membre depuis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.prenom} {member.nom}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.user_roles?.[0]?.role === "superadmin" ? "default" : "secondary"}>
                            {member.user_roles?.[0]?.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Aucun membre trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {invitations && invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Invitations en attente</CardTitle>
                <CardDescription>
                  Invitations qui n'ont pas encore été acceptées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Envoyée le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation: any) => (
                      <TableRow key={invitation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {invitation.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{invitation.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invitation.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ces préférences s'appliquent à toutes vos campagnes par défaut
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'envoi</CardTitle>
              <CardDescription>
                Configurez vos préférences d'envoi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select value={preferences.timezone} onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                    <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="send-hour">Heure d'envoi par défaut</Label>
                <Select 
                  value={preferences.default_send_hour.toString()} 
                  onValueChange={(value) => setPreferences({ ...preferences, default_send_hour: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Heure par défaut pour les envois programmés
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Activer le tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Suivre les ouvertures et clics d'emails
                  </p>
                </div>
                <Switch
                  checked={preferences.enable_tracking}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, enable_tracking: checked })}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Lien de désinscription</Label>
                  <p className="text-sm text-muted-foreground">
                    Inclure un lien de désabonnement dans les emails
                  </p>
                </div>
                <Switch
                  checked={preferences.enable_unsubscribe_link}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, enable_unsubscribe_link: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Gérez vos notifications par email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Campagne envoyée</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification quand une campagne est envoyée
                  </p>
                </div>
                <Switch
                  checked={preferences.notify_on_campaign_sent}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, notify_on_campaign_sent: checked })}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Engagement élevé</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une alerte en cas de fort engagement
                  </p>
                </div>
                <Switch
                  checked={preferences.notify_on_high_engagement}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, notify_on_high_engagement: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => savePreferencesMutation.mutate()}
            disabled={savePreferencesMutation.isPending}
          >
            {savePreferencesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les préférences"
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Parametres;
