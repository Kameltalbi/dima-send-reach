import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, MoreVertical, Eye, Trash2, Mail, Calendar, Users, Filter, BarChart3, Send, Edit } from "lucide-react";
import { BatchSendDialog } from "@/components/campaigns/BatchSendDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Campagnes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isBatchSendOpen, setIsBatchSendOpen] = useState(false);
  const [selectedCampaignForBatch, setSelectedCampaignForBatch] = useState<any>(null);

  // Charger les campagnes avec leurs stats
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select(`
          *,
          campaign_stats (*),
          lists (nom)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("statut", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Filtrer par recherche
  const filteredCampaigns = campaigns?.filter((campaign) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      campaign.nom_campagne?.toLowerCase().includes(query) ||
      campaign.sujet_email?.toLowerCase().includes(query) ||
      campaign.expediteur_email?.toLowerCase().includes(query)
    );
  }) || [];

  // Mutation pour supprimer une campagne
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campagne supprimée avec succès");
      setIsDeleteOpen(false);
      setSelectedCampaign(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la campagne");
    },
  });

  const handleDelete = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsDeleteOpen(true);
  };

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      brouillon: "outline",
      en_attente: "secondary",
      en_cours: "default",
      envoye: "default",
      annule: "destructive",
    };
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      en_attente: "En attente",
      en_cours: "En cours",
      envoye: "Envoyée",
      annule: "Annulée",
    };
    return (
      <Badge variant={variants[statut] || "outline"}>
        {labels[statut] || statut}
      </Badge>
    );
  };

  const getStats = (campaign: any) => {
    const stats = campaign.campaign_stats?.[0];
    return {
      total_envoyes: stats?.total_envoyes || 0,
      total_ouverts: stats?.total_ouverts || 0,
      total_cliques: stats?.total_cliques || 0,
      tauxOuverture: stats?.total_envoyes > 0 
        ? ((stats.total_ouverts / stats.total_envoyes) * 100).toFixed(1)
        : "0",
      tauxClic: stats?.total_envoyes > 0
        ? ((stats.total_cliques / stats.total_envoyes) * 100).toFixed(1)
        : "0",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Campagnes</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Créez et gérez vos campagnes d'emailing
          </p>
        </div>
        <Button onClick={() => navigate("/campagnes/nouvelle")} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une campagne..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="envoye">Envoyée</SelectItem>
                <SelectItem value="annule">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des campagnes */}
      <Card>
        <CardHeader>
          <CardTitle>Vos campagnes</CardTitle>
          <CardDescription>
            {filteredCampaigns.length} campagne{filteredCampaigns.length > 1 ? "s" : ""} trouvée{filteredCampaigns.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucune campagne
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Aucune campagne ne correspond à vos critères"
                  : "Créez votre première campagne pour commencer"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => navigate("/campagnes/nouvelle")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une campagne
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campagne</TableHead>
                    <TableHead className="hidden md:table-cell">Sujet</TableHead>
                    <TableHead className="hidden lg:table-cell">Liste</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Envoyés</TableHead>
                    <TableHead className="hidden lg:table-cell">Ouvertures</TableHead>
                    <TableHead className="hidden lg:table-cell">Clics</TableHead>
                    <TableHead className="hidden xl:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => {
                    const stats = getStats(campaign);
                    return (
                      <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/campagnes/${campaign.id}`)}>
                        <TableCell className="font-medium">
                          {campaign.nom_campagne}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {campaign.sujet_email}
                        </TableCell>
                        <TableCell>
                          {campaign.lists ? (
                            <Badge variant="outline">{campaign.lists.nom}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Tous les contacts</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.statut)}</TableCell>
                        <TableCell>
                          {stats.total_envoyes > 0 ? stats.total_envoyes.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                          {stats.total_envoyes > 0 ? (
                            <span className="text-primary font-medium">{stats.tauxOuverture}%</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {stats.total_envoyes > 0 ? (
                            <span className="text-accent font-medium">{stats.tauxClic}%</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(campaign.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/campagnes/${campaign.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir les détails
                              </DropdownMenuItem>
                              {campaign.statut === "brouillon" && (
                                <DropdownMenuItem onClick={() => navigate(`/campagnes/${campaign.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Éditer
                                </DropdownMenuItem>
                              )}
                              {campaign.statut === "envoye" && (
                                <DropdownMenuItem onClick={() => navigate(`/campagnes/${campaign.id}/analytics`)}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Voir les analytics
                                </DropdownMenuItem>
                              )}
                              {campaign.list_id && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCampaignForBatch(campaign);
                                    setIsBatchSendOpen(true);
                                  }}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Envoi par lots
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(campaign)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Send Dialog */}
      {selectedCampaignForBatch && (
        <BatchSendDialog
          open={isBatchSendOpen}
          onOpenChange={setIsBatchSendOpen}
          campaignId={selectedCampaignForBatch.id}
          listId={selectedCampaignForBatch.list_id}
        />
      )}

      {/* Dialog suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la campagne "{selectedCampaign?.nom_campagne}" ?
              Cette action est irréversible et supprimera également toutes les statistiques associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCampaign && deleteMutation.mutate(selectedCampaign.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Campagnes;
