import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Send, BarChart3, Trash2, Calendar, Mail, Users, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { BatchSendDialog } from "@/components/campaigns/BatchSendDialog";

const CampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBatchSendOpen, setIsBatchSendOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Charger la campagne
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      if (!id) throw new Error("ID de campagne manquant");
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          campaign_stats (*),
          lists (nom)
        `)
        .eq("id", id)
        .eq("user_id", user?.id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Campagne non trouvée");
      return data;
    },
    enabled: !!id && !!user,
  });

  // Mutation pour supprimer
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campagne supprimée avec succès");
      navigate("/campagnes");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

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
      <Badge variant={variants[statut] || "outline"} className="text-sm">
        {labels[statut] || statut}
      </Badge>
    );
  };

  const stats = campaign?.campaign_stats?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/campagnes")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux campagnes
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Campagne non trouvée</h3>
            <p className="text-muted-foreground mb-4">
              Cette campagne n'existe pas ou vous n'y avez pas accès.
            </p>
            <Button onClick={() => navigate("/campagnes")}>
              Voir toutes les campagnes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" onClick={() => navigate("/campagnes")} className="gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" />
          Retour aux campagnes
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                {campaign.nom_campagne}
              </h1>
              {getStatusBadge(campaign.statut)}
            </div>
            <p className="text-muted-foreground">{campaign.sujet_email}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {campaign.statut === "brouillon" && (
              <Button onClick={() => navigate(`/campagnes/${id}/edit`)} className="gap-2">
                <Edit className="h-4 w-4" />
                Éditer
              </Button>
            )}
            {campaign.statut === "envoye" && (
              <Button onClick={() => navigate(`/campagnes/${id}/analytics`)} variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            )}
            {campaign.list_id && campaign.statut !== "envoye" && (
              <Button variant="outline" onClick={() => setIsBatchSendOpen(true)} className="gap-2">
                <Send className="h-4 w-4" />
                Envoyer
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="gap-2">
              <Eye className="h-4 w-4" />
              Aperçu
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Infos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expéditeur</span>
              <span className="font-medium">{campaign.expediteur_nom}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email expéditeur</span>
              <span className="font-medium">{campaign.expediteur_email}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Liste</span>
              <span className="font-medium">
                {campaign.lists?.nom || "Tous les contacts"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Créée le</span>
              <span className="font-medium">
                {new Date(campaign.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {campaign.date_envoi && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envoyée le</span>
                  <span className="font-medium">
                    {new Date(campaign.date_envoi).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.total_envoyes > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {stats.total_envoyes.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Envoyés</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {((stats.total_ouverts / stats.total_envoyes) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taux d'ouverture</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-accent">
                    {((stats.total_cliques / stats.total_envoyes) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taux de clic</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {stats.total_desabonnements}
                  </div>
                  <div className="text-sm text-muted-foreground">Désabonnements</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune statistique disponible</p>
                <p className="text-sm mt-1">Les stats apparaîtront après l'envoi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aperçu du contenu */}
      {isPreviewOpen && campaign.html_contenu && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aperçu du contenu</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg p-4 bg-white max-h-[500px] overflow-auto"
              dangerouslySetInnerHTML={{ __html: campaign.html_contenu }}
            />
          </CardContent>
        </Card>
      )}

      {/* Batch Send Dialog */}
      {campaign.list_id && (
        <BatchSendDialog
          open={isBatchSendOpen}
          onOpenChange={setIsBatchSendOpen}
          campaignId={campaign.id}
          listId={campaign.list_id}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la campagne "{campaign.nom_campagne}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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

export default CampaignDetails;
