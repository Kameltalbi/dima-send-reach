import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, MoreVertical, Edit, Trash2, Filter, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SegmentCriteria {
  field: string;
  operator: string;
  value: string | string[];
  logic?: 'AND' | 'OR';
}

interface Segment {
  id: string;
  nom: string;
  description: string | null;
  criteria: SegmentCriteria[];
  contact_count: number;
  is_active: boolean;
  created_at: string;
}

const Segmentation = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    criteria: [] as SegmentCriteria[],
  });

  // Récupérer les segments
  const { data: segments, isLoading } = useQuery({
    queryKey: ["segments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("segments")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Segment[];
    },
    enabled: !!user,
  });

  // Calculer le nombre de contacts pour un segment
  const calculateSegmentCount = async (criteria: SegmentCriteria[]): Promise<number> => {
    if (!user || criteria.length === 0) return 0;

    try {
      let query = supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("statut", "actif");

      // Appliquer les critères
      for (const criterion of criteria) {
        if (criterion.field === "pays" && criterion.value) {
          query = query.eq("pays", criterion.value);
        } else if (criterion.field === "ville" && criterion.value) {
          query = query.ilike("ville", `%${criterion.value}%`);
        } else if (criterion.field === "societe" && criterion.value) {
          query = query.ilike("societe", `%${criterion.value}%`);
        } else if (criterion.field === "fonction" && criterion.value) {
          query = query.ilike("fonction", `%${criterion.value}%`);
        } else if (criterion.field === "created_at" && criterion.operator === "after") {
          const date = new Date(criterion.value as string);
          query = query.gte("created_at", date.toISOString());
        } else if (criterion.field === "created_at" && criterion.operator === "before") {
          const date = new Date(criterion.value as string);
          query = query.lte("created_at", date.toISOString());
        }
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error calculating segment count:", error);
      return 0;
    }
  };

  // Créer un segment
  const createMutation = useMutation({
    mutationFn: async (data: { nom: string; description: string; criteria: SegmentCriteria[] }) => {
      const count = await calculateSegmentCount(data.criteria);
      const { data: segment, error } = await supabase
        .from("segments")
        .insert({
          user_id: user?.id,
          nom: data.nom,
          description: data.description || null,
          criteria: data.criteria,
          contact_count: count,
        })
        .select()
        .single();

      if (error) throw error;
      return segment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success(t("segmentation.createSuccess") || "Segment créé avec succès");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || t("segmentation.createError") || "Erreur lors de la création");
    },
  });

  // Mettre à jour un segment
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; nom: string; description: string; criteria: SegmentCriteria[] }) => {
      const count = await calculateSegmentCount(data.criteria);
      const { data: segment, error } = await supabase
        .from("segments")
        .update({
          nom: data.nom,
          description: data.description || null,
          criteria: data.criteria,
          contact_count: count,
        })
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return segment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success(t("segmentation.updateSuccess") || "Segment mis à jour");
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || t("segmentation.updateError") || "Erreur lors de la mise à jour");
    },
  });

  // Supprimer un segment
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("segments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success(t("segmentation.deleteSuccess") || "Segment supprimé");
      setIsDeleteOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("segmentation.deleteError") || "Erreur lors de la suppression");
    },
  });

  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
      criteria: [],
    });
    setSelectedSegment(null);
  };

  const handleAddCriterion = () => {
    setFormData({
      ...formData,
      criteria: [
        ...formData.criteria,
        { field: "pays", operator: "equals", value: "" },
      ],
    });
  };

  const handleRemoveCriterion = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index),
    });
  };

  const handleCriterionChange = (index: number, field: keyof SegmentCriteria, value: any) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({ ...formData, criteria: newCriteria });
  };

  const handleEdit = (segment: Segment) => {
    setSelectedSegment(segment);
    setFormData({
      nom: segment.nom,
      description: segment.description || "",
      criteria: segment.criteria || [],
    });
    setIsEditOpen(true);
  };

  const handleDelete = (segment: Segment) => {
    setSelectedSegment(segment);
    setIsDeleteOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nom.trim()) {
      toast.error(t("segmentation.nameRequired") || "Le nom est requis");
      return;
    }

    if (formData.criteria.length === 0) {
      toast.error(t("segmentation.criteriaRequired") || "Ajoutez au moins un critère");
      return;
    }

    if (selectedSegment) {
      updateMutation.mutate({
        id: selectedSegment.id,
        nom: formData.nom,
        description: formData.description,
        criteria: formData.criteria,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredSegments = segments?.filter((segment) =>
    segment.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("segmentation.title") || "Segmentation"}
          </h1>
          <p className="text-muted-foreground">
            {t("segmentation.subtitle") || "Créez et gérez des segments de contacts pour des campagnes ciblées"}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("segmentation.createSegment") || "Nouveau segment"}
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("segmentation.searchPlaceholder") || "Rechercher un segment..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Liste des segments */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("common.loading") || "Chargement..."}</p>
        </div>
      ) : filteredSegments && filteredSegments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSegments.map((segment) => (
            <Card key={segment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{segment.nom}</CardTitle>
                    {segment.description && (
                      <CardDescription className="mt-2">{segment.description}</CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(segment)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t("common.edit") || "Modifier"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(segment)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("common.delete") || "Supprimer"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("segmentation.contacts") || "Contacts"}
                    </span>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {segment.contact_count.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("segmentation.criteria") || "Critères"}
                    </span>
                    <Badge>{segment.criteria?.length || 0}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={segment.is_active ? "default" : "secondary"}>
                      {segment.is_active
                        ? t("segmentation.active") || "Actif"
                        : t("segmentation.inactive") || "Inactif"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {t("segmentation.noSegments") || "Aucun segment créé"}
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("segmentation.createFirst") || "Créer votre premier segment"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de création/édition */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSegment
                ? t("segmentation.editSegment") || "Modifier le segment"
                : t("segmentation.createSegment") || "Nouveau segment"}
            </DialogTitle>
            <DialogDescription>
              {t("segmentation.dialogDescription") ||
                "Définissez les critères pour créer un segment de contacts"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="nom">{t("segmentation.name") || "Nom du segment"} *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder={t("segmentation.namePlaceholder") || "Ex: Clients VIP Tunisie"}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">
                {t("segmentation.description") || "Description"} (optionnel)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("segmentation.descriptionPlaceholder") || "Description du segment"}
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>{t("segmentation.criteria") || "Critères de segmentation"} *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCriterion}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("segmentation.addCriterion") || "Ajouter un critère"}
                </Button>
              </div>

              {formData.criteria.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Filter className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t("segmentation.noCriteria") || "Aucun critère défini"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formData.criteria.map((criterion, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                {t("segmentation.field") || "Champ"}
                              </Label>
                              <Select
                                value={criterion.field}
                                onValueChange={(value) =>
                                  handleCriterionChange(index, "field", value)
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pays">
                                    {t("segmentation.fieldCountry") || "Pays"}
                                  </SelectItem>
                                  <SelectItem value="ville">
                                    {t("segmentation.fieldCity") || "Ville"}
                                  </SelectItem>
                                  <SelectItem value="societe">
                                    {t("segmentation.fieldCompany") || "Société"}
                                  </SelectItem>
                                  <SelectItem value="fonction">
                                    {t("segmentation.fieldFunction") || "Fonction"}
                                  </SelectItem>
                                  <SelectItem value="created_at">
                                    {t("segmentation.fieldDate") || "Date d'inscription"}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                {t("segmentation.operator") || "Opérateur"}
                              </Label>
                              <Select
                                value={criterion.operator}
                                onValueChange={(value) =>
                                  handleCriterionChange(index, "operator", value)
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {criterion.field === "created_at" ? (
                                    <>
                                      <SelectItem value="after">
                                        {t("segmentation.after") || "Après"}
                                      </SelectItem>
                                      <SelectItem value="before">
                                        {t("segmentation.before") || "Avant"}
                                      </SelectItem>
                                    </>
                                  ) : (
                                    <>
                                      <SelectItem value="equals">
                                        {t("segmentation.equals") || "Égal à"}
                                      </SelectItem>
                                      <SelectItem value="contains">
                                        {t("segmentation.contains") || "Contient"}
                                      </SelectItem>
                                      <SelectItem value="starts_with">
                                        {t("segmentation.startsWith") || "Commence par"}
                                      </SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                {t("segmentation.value") || "Valeur"}
                              </Label>
                              {criterion.field === "created_at" ? (
                                <Input
                                  type="date"
                                  value={criterion.value as string}
                                  onChange={(e) =>
                                    handleCriterionChange(index, "value", e.target.value)
                                  }
                                  className="mt-1"
                                />
                              ) : (
                                <Input
                                  value={criterion.value as string}
                                  onChange={(e) =>
                                    handleCriterionChange(index, "value", e.target.value)
                                  }
                                  placeholder={t("segmentation.valuePlaceholder") || "Valeur"}
                                  className="mt-1"
                                />
                              )}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCriterion(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetForm();
              }}
            >
              {t("common.cancel") || "Annuler"}
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? t("common.loading") || "Chargement..."
                : selectedSegment
                ? t("common.save") || "Enregistrer"
                : t("segmentation.create") || "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("segmentation.confirmDelete") || "Supprimer le segment ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("segmentation.deleteWarning") ||
                "Cette action est irréversible. Le segment sera supprimé définitivement."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Annuler"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSegment && deleteMutation.mutate(selectedSegment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete") || "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Segmentation;

