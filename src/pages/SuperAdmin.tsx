import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Users,
  CreditCard,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Search,
  Filter,
  Shield,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrdersTable } from "@/components/superadmin/OrdersTable";

type View = "organizations" | "subscriptions" | "orders" | "users";

export default function SuperAdmin() {
  const [activeView, setActiveView] = useState<View>("organizations");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [orgFormData, setOrgFormData] = useState({
    nom: "",
    email_contact: "",
    statut: "active",
    notes: "",
  });
  const [subFormData, setSubFormData] = useState({
    organization_id: "",
    plan_type: "free",
    statut: "active",
    email_limit: 1000,
    date_fin: "",
    notes: "",
  });
  const [extendDays, setExtendDays] = useState(30);
  const queryClient = useQueryClient();

  // Charger les organisations
  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ["superadmin-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Charger les abonnements avec les organisations
  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ["superadmin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          organizations (
            id,
            nom,
            email_contact
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Charger les utilisateurs avec leurs organisations
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["superadmin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          organizations (
            id,
            nom
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Note: L'email principal est dans auth.users, mais pour simplifier,
      // on utilise email_envoi_defaut du profil. Pour récupérer l'email exact,
      // il faudrait utiliser une Edge Function avec admin privileges.
      return profiles?.map((profile) => ({
        ...profile,
        email: profile.email_envoi_defaut || "N/A",
      }));
    },
  });

  // Filtrer les données
  const filteredOrgs = organizations?.filter((org) =>
    org.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email_contact.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredSubs = subscriptions?.filter((sub) =>
    sub.organizations?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.plan_type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredUsers = users?.filter((user) =>
    user.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Mutation pour créer une organisation
  const createOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("organizations").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-organizations"] });
      toast.success("Organisation créée avec succès");
      setIsOrgDialogOpen(false);
      resetOrgForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  // Mutation pour modifier une organisation
  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("organizations")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-organizations"] });
      toast.success("Organisation modifiée avec succès");
      setIsOrgDialogOpen(false);
      setSelectedOrg(null);
      resetOrgForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modification");
    },
  });

  // Mutation pour supprimer une organisation
  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-subscriptions"] });
      toast.success("Organisation supprimée avec succès");
      setIsDeleteDialogOpen(false);
      setSelectedOrg(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  // Mutation pour créer un abonnement
  const createSubMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("subscriptions").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-subscriptions"] });
      toast.success("Abonnement créé avec succès");
      setIsSubDialogOpen(false);
      resetSubForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  // Mutation pour prolonger un abonnement
  const extendSubMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("date_fin")
        .eq("id", id)
        .single();

      const currentEndDate = sub?.date_fin
        ? new Date(sub.date_fin)
        : new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from("subscriptions")
        .update({ date_fin: newEndDate.toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-subscriptions"] });
      toast.success("Abonnement prolongé avec succès");
      setIsExtendDialogOpen(false);
      setSelectedSub(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la prolongation");
    },
  });

  const resetOrgForm = () => {
    setOrgFormData({
      nom: "",
      email_contact: "",
      statut: "active",
      notes: "",
    });
  };

  const resetSubForm = () => {
    setSubFormData({
      organization_id: "",
      plan_type: "free",
      statut: "active",
      email_limit: 1000,
      date_fin: "",
      notes: "",
    });
  };

  const handleEditOrg = (org: any) => {
    setSelectedOrg(org);
    setOrgFormData({
      nom: org.nom,
      email_contact: org.email_contact,
      statut: org.statut,
      notes: org.notes || "",
    });
    setIsOrgDialogOpen(true);
  };

  const handleDeleteOrg = (org: any) => {
    setSelectedOrg(org);
    setIsDeleteDialogOpen(true);
  };

  const handleExtendSub = (sub: any) => {
    setSelectedSub(sub);
    setIsExtendDialogOpen(true);
  };

  const handleSubmitOrg = () => {
    if (!orgFormData.nom || !orgFormData.email_contact) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedOrg) {
      updateOrgMutation.mutate({ id: selectedOrg.id, ...orgFormData });
    } else {
      createOrgMutation.mutate(orgFormData);
    }
  };

  const handleSubmitSub = () => {
    if (!subFormData.organization_id) {
      toast.error("Veuillez sélectionner une organisation");
      return;
    }

    createSubMutation.mutate(subFormData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      blocked: "destructive",
      suspended: "secondary",
      cancelled: "outline",
      expired: "outline",
      trial: "secondary",
      completed: "default",
      pending: "secondary",
      pending_manual: "secondary",
      failed: "destructive",
      refunded: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex-shrink-0">
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold">Super Admin</h2>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <nav className="p-4 space-y-1">
            <Button
              variant={activeView === "organizations" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveView("organizations")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Organisations</span>
              <span className="sm:hidden">Orgs</span>
            </Button>
            <Button
              variant={activeView === "subscriptions" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveView("subscriptions")}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Abonnements</span>
              <span className="sm:hidden">Abos</span>
            </Button>
            <Button
              variant={activeView === "orders" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveView("orders")}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Paiements</span>
              <span className="sm:hidden">Pays</span>
            </Button>
            <Button
              variant={activeView === "users" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveView("users")}
            >
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </Button>
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {activeView === "organizations" && "Organisations"}
                {activeView === "subscriptions" && "Abonnements"}
                {activeView === "orders" && "Paiements"}
                {activeView === "users" && "Utilisateurs"}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Gérez les {activeView === "organizations" && "organisations"}
                {activeView === "subscriptions" && "abonnements"}
                {activeView === "orders" && "paiements"}
                {activeView === "users" && "utilisateurs"} de la plateforme
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              {activeView === "organizations" && (
                <Button onClick={() => {
                  resetOrgForm();
                  setSelectedOrg(null);
                  setIsOrgDialogOpen(true);
                }} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nouvelle organisation</span>
                  <span className="sm:hidden">Nouvelle</span>
                </Button>
              )}
              {activeView === "subscriptions" && (
                <Button onClick={() => {
                  resetSubForm();
                  setIsSubDialogOpen(true);
                }} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nouvel abonnement</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              )}
            </div>
          </div>

          {/* Organizations Table */}
          {activeView === "organizations" && (
            <Card>
              <CardHeader>
                <CardTitle>Liste des organisations</CardTitle>
                <CardDescription>
                  {filteredOrgs.length} organisation{filteredOrgs.length > 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orgsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="hidden lg:table-cell">Date de création</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrgs.map((org) => (
                          <TableRow key={org.id}>
                            <TableCell>
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="font-medium">{org.nom}</TableCell>
                            <TableCell className="hidden md:table-cell">{org.email_contact}</TableCell>
                            <TableCell>{getStatusBadge(org.statut)}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {new Date(org.created_at).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditOrg(org)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteOrg(org)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscriptions Table */}
          {activeView === "subscriptions" && (
            <Card>
              <CardHeader>
                <CardTitle>Liste des abonnements</CardTitle>
                <CardDescription>
                  {filteredSubs.length} abonnement{filteredSubs.length > 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Organisation</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="hidden md:table-cell">Limite emails</TableHead>
                          <TableHead className="hidden lg:table-cell">Date fin</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubs.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="font-medium">
                              {sub.organizations?.nom || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{sub.plan_type}</Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(sub.statut)}</TableCell>
                            <TableCell className="hidden md:table-cell">{sub.email_limit.toLocaleString()}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {sub.date_fin
                                ? new Date(sub.date_fin).toLocaleDateString("fr-FR")
                                : "Illimité"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleExtendSub(sub)}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Prolonger
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Orders Table */}
          {activeView === "orders" && <OrdersTable />}

          {/* Users Table */}
          {activeView === "users" && (
            <Card>
              <CardHeader>
                <CardTitle>Liste des utilisateurs</CardTitle>
                <CardDescription>
                  {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead className="hidden lg:table-cell">Entreprise</TableHead>
                          <TableHead className="hidden md:table-cell">Organisation</TableHead>
                          <TableHead className="hidden lg:table-cell">Date d'inscription</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="font-medium">
                              {user.prenom} {user.nom}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                            <TableCell className="hidden lg:table-cell">{user.nom_entreprise}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {user.organizations?.nom || (
                                <Badge variant="outline">Aucune</Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {new Date(user.created_at).toLocaleDateString("fr-FR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Organization Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOrg ? "Modifier l'organisation" : "Nouvelle organisation"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrg
                ? "Modifiez les informations de l'organisation"
                : "Créez une nouvelle organisation"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={orgFormData.nom}
                onChange={(e) =>
                  setOrgFormData({ ...orgFormData, nom: e.target.value })
                }
                placeholder="Nom de l'organisation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email de contact *</Label>
              <Input
                id="email"
                type="email"
                value={orgFormData.email_contact}
                onChange={(e) =>
                  setOrgFormData({ ...orgFormData, email_contact: e.target.value })
                }
                placeholder="contact@organisation.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={orgFormData.statut}
                onValueChange={(value) =>
                  setOrgFormData({ ...orgFormData, statut: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="blocked">Bloqué</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={orgFormData.notes}
                onChange={(e) =>
                  setOrgFormData({ ...orgFormData, notes: e.target.value })
                }
                placeholder="Notes supplémentaires..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitOrg}>
              {selectedOrg ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel abonnement</DialogTitle>
            <DialogDescription>
              Créez un nouvel abonnement pour une organisation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org_id">Organisation *</Label>
              <Select
                value={subFormData.organization_id}
                onValueChange={(value) =>
                  setSubFormData({ ...subFormData, organization_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une organisation" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={subFormData.plan_type}
                onValueChange={(value) =>
                  setSubFormData({ ...subFormData, plan_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="essential">Essential</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={subFormData.statut}
                onValueChange={(value) =>
                  setSubFormData({ ...subFormData, statut: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="trial">Essai</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_limit">Limite d'emails</Label>
              <Input
                id="email_limit"
                type="number"
                value={subFormData.email_limit}
                onChange={(e) =>
                  setSubFormData({
                    ...subFormData,
                    email_limit: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_fin">Date de fin (optionnel)</Label>
              <Input
                id="date_fin"
                type="date"
                value={subFormData.date_fin}
                onChange={(e) =>
                  setSubFormData({ ...subFormData, date_fin: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={subFormData.notes}
                onChange={(e) =>
                  setSubFormData({ ...subFormData, notes: e.target.value })
                }
                placeholder="Notes supplémentaires..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitSub}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prolonger l'abonnement</DialogTitle>
            <DialogDescription>
              Prolongez l'abonnement de {selectedSub?.organizations?.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="days">Nombre de jours</Label>
              <Input
                id="days"
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                extendSubMutation.mutate({ id: selectedSub?.id, days: extendDays })
              }
            >
              Prolonger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'organisation "{selectedOrg?.nom}" et toutes
              ses données associées seront supprimées définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrgMutation.mutate(selectedOrg?.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
