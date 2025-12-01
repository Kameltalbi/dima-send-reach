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
import { Plus, MoreVertical, Edit, Trash2, Play, Pause, Mail, Clock, Tag, Users, Settings } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AutomationStep {
  step_type: string;
  step_config: Record<string, unknown>;
}

interface Automation {
  id: string;
  nom: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  total_sent?: number;
  total_opened?: number;
  total_clicked?: number;
  created_at: string;
}

interface AutomationStepDB {
  id: string;
  automation_id: string;
  step_order: number;
  step_type: string;
  step_config: Record<string, unknown>;
  created_at: string;
}

const Automatisations = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    trigger_type: "contact_added",
    trigger_config: {} as Record<string, unknown>,
    steps: [] as AutomationStep[],
  });

  // Récupérer les automatisations
  const { data: automations, isLoading } = useQuery({
    queryKey: ["automations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("user_id", user?.id as string)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Automation[];
    },
    enabled: !!user,
  });

  // Récupérer les templates pour les étapes d'envoi d'email
  const { data: templates } = useQuery({
    queryKey: ["templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id, nom")
        .eq("user_id", user?.id as string)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Récupérer les listes pour les déclencheurs
  const { data: lists } = useQuery({
    queryKey: ["lists", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("id, nom")
        .eq("user_id", user?.id as string)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Créer une automatisation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Créer l'automatisation
      const { data: automation, error: automationError } = await supabase
        .from("automations")
        .insert({
          user_id: user?.id,
          nom: data.nom,
          description: data.description || null,
          trigger_type: data.trigger_type,
          trigger_config: data.trigger_config,
        } as Record<string, unknown>)
        .select()
        .single();

      if (automationError) throw automationError;

      const automationData = automation as unknown as Automation;

      // Créer les étapes
      if (data.steps.length > 0 && automationData) {
        const stepsToInsert = data.steps.map((step, index) => ({
          automation_id: automationData.id,
          step_order: index + 1,
          step_type: step.step_type,
          step_config: step.step_config,
        }));

        const { error: stepsError } = await supabase
          .from("automation_steps")
          .insert(stepsToInsert as unknown as Record<string, unknown>[]);

        if (stepsError) throw stepsError;
      }

      return automationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success(t("automations.createSuccess") || "Automatisation créée avec succès");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("automations.createError") || "Erreur lors de la création");
    },
  });

  // Mettre à jour une automatisation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      // Mettre à jour l'automatisation
      const { error: automationError } = await supabase
        .from("automations")
        .update({
          nom: data.nom,
          description: data.description || null,
          trigger_type: data.trigger_type,
          trigger_config: data.trigger_config,
        } as Record<string, unknown>)
        .eq("id", data.id);

      if (automationError) throw automationError;

      // Supprimer les anciennes étapes
      const { error: deleteError } = await supabase
        .from("automation_steps")
        .delete()
        .eq("automation_id", data.id);

      if (deleteError) throw deleteError;

      // Créer les nouvelles étapes
      if (data.steps.length > 0) {
        const stepsToInsert = data.steps.map((step, index) => ({
          automation_id: data.id,
          step_order: index + 1,
          step_type: step.step_type,
          step_config: step.step_config,
        }));

        const { error: stepsError } = await supabase
          .from("automation_steps")
          .insert(stepsToInsert as unknown as Record<string, unknown>[]);

        if (stepsError) throw stepsError;
      }

      return { id: data.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success(t("automations.updateSuccess") || "Automatisation mise à jour");
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("automations.updateError") || "Erreur lors de la mise à jour");
    },
  });

  // Activer/Désactiver une automatisation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("automations")
        .update({ is_active } as Record<string, unknown>)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success(
        t("automations.toggleSuccess") || "Statut de l'automatisation mis à jour"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || t("automations.toggleError") || "Erreur");
    },
  });

  // Supprimer une automatisation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast.success(t("automations.deleteSuccess") || "Automatisation supprimée");
      setIsDeleteOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("automations.deleteError") || "Erreur lors de la suppression");
    },
  });

  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
      trigger_type: "contact_added",
      trigger_config: {},
      steps: [],
    });
    setSelectedAutomation(null);
  };

  const handleAddStep = (stepType: string) => {
    const newStep: AutomationStep = {
      step_type: stepType,
      step_config: stepType === "send_email" ? { template_id: "" } : stepType === "wait" ? { days: 1 } : {},
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep],
    });
  };

  const handleRemoveStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const handleStepConfigChange = (index: number, config: Record<string, unknown>) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], step_config: { ...newSteps[index].step_config, ...config } };
    setFormData({ ...formData, steps: newSteps });
  };

  const handleEdit = async (automation: Automation) => {
    setSelectedAutomation(automation);
    setFormData({
      nom: automation.nom,
      description: automation.description || "",
      trigger_type: automation.trigger_type,
      trigger_config: automation.trigger_config || {},
      steps: [],
    });

    // Charger les étapes
    const { data: steps } = await supabase
      .from("automation_steps")
      .select("*")
      .eq("automation_id", automation.id)
      .order("step_order");

    if (steps) {
      const stepsData = steps as unknown as AutomationStepDB[];
      setFormData((prev) => ({
        ...prev,
        steps: stepsData.map((s) => ({
          step_type: s.step_type,
          step_config: s.step_config as Record<string, unknown>,
        })),
      }));
    }

    setIsEditOpen(true);
  };

  const handleDelete = (automation: Automation) => {
    setSelectedAutomation(automation);
    setIsDeleteOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nom.trim()) {
      toast.error(t("automations.nameRequired") || "Le nom est requis");
      return;
    }

    if (formData.steps.length === 0) {
      toast.error(t("automations.stepsRequired") || "Ajoutez au moins une étape");
      return;
    }

    if (selectedAutomation) {
      updateMutation.mutate({ ...formData, id: selectedAutomation.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      contact_added: t("automations.trigger.contactAdded") || "Contact ajouté",
      contact_subscribed: t("automations.trigger.contactSubscribed") || "Contact abonné",
      contact_unsubscribed: t("automations.trigger.contactUnsubscribed") || "Contact désabonné",
      campaign_opened: t("automations.trigger.campaignOpened") || "Email ouvert",
      campaign_clicked: t("automations.trigger.campaignClicked") || "Email cliqué",
      date_based: t("automations.trigger.dateBased") || "Basé sur la date",
      tag_added: t("automations.trigger.tagAdded") || "Tag ajouté",
      list_added: t("automations.trigger.listAdded") || "Ajouté à une liste",
      custom: t("automations.trigger.custom") || "Personnalisé",
    };
    return labels[triggerType] || triggerType;
  };

  const filteredAutomations = automations?.filter((automation) =>
    automation.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("automations.title") || "Automatisations"}
          </h1>
          <p className="text-muted-foreground">
            {t("automations.subtitle") ||
              "Créez des workflows d'emails automatiques pour engager vos contacts"}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("automations.createAutomation") || "Nouvelle automatisation"}
        </Button>
      </div>

      {/* Liste des automatisations */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("common.loading") || "Chargement..."}</p>
        </div>
      ) : filteredAutomations && filteredAutomations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAutomations.map((automation) => (
            <Card key={automation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{automation.nom}</CardTitle>
                    {automation.description && (
                      <CardDescription className="mt-2">{automation.description}</CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(automation)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t("common.edit") || "Modifier"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          toggleMutation.mutate({
                            id: automation.id,
                            is_active: !automation.is_active,
                          })
                        }
                      >
                        {automation.is_active ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            {t("automations.pause") || "Mettre en pause"}
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            {t("automations.activate") || "Activer"}
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(automation)}
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
                      {t("automations.trigger") || "Déclencheur"}
                    </span>
                    <Badge variant="outline">{getTriggerLabel(automation.trigger_type)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("automations.stats") || "Statistiques"}
                    </span>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="secondary">
                        <Mail className="h-3 w-3 mr-1" />
                        {automation.total_sent || 0}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={automation.is_active ? "default" : "secondary"}>
                      {automation.is_active
                        ? t("automations.active") || "Actif"
                        : t("automations.inactive") || "Inactif"}
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
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {t("automations.noAutomations") || "Aucune automatisation créée"}
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("automations.createFirst") || "Créer votre première automatisation"}
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
              {selectedAutomation
                ? t("automations.editAutomation") || "Modifier l'automatisation"
                : t("automations.createAutomation") || "Nouvelle automatisation"}
            </DialogTitle>
            <DialogDescription>
              {t("automations.dialogDescription") ||
                "Configurez les détails de votre automatisation"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">{t("automations.tabs.general") || "Général"}</TabsTrigger>
              <TabsTrigger value="trigger">{t("automations.tabs.trigger") || "Déclencheur"}</TabsTrigger>
              <TabsTrigger value="steps">{t("automations.tabs.steps") || "Étapes"}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nom">{t("automations.name") || "Nom"}</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder={t("automations.namePlaceholder") || "Ex: Email de bienvenue"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("automations.description") || "Description"}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("automations.descriptionPlaceholder") || "Description de l'automatisation..."}
                />
              </div>
            </TabsContent>

            <TabsContent value="trigger" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{t("automations.triggerType") || "Type de déclencheur"}</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) => setFormData({ ...formData, trigger_type: value, trigger_config: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact_added">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {t("automations.trigger.contactAdded") || "Contact ajouté"}
                      </div>
                    </SelectItem>
                    <SelectItem value="list_added">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        {t("automations.trigger.listAdded") || "Ajouté à une liste"}
                      </div>
                    </SelectItem>
                    <SelectItem value="campaign_opened">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {t("automations.trigger.campaignOpened") || "Email ouvert"}
                      </div>
                    </SelectItem>
                    <SelectItem value="campaign_clicked">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {t("automations.trigger.campaignClicked") || "Email cliqué"}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.trigger_type === "list_added" && (
                <div className="space-y-2">
                  <Label>{t("automations.selectList") || "Sélectionner une liste"}</Label>
                  <Select
                    value={formData.trigger_config.list_id as string || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        trigger_config: { ...formData.trigger_config, list_id: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("automations.selectListPlaceholder") || "Choisir une liste"} />
                    </SelectTrigger>
                    <SelectContent>
                      {lists?.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="steps" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAddStep("send_email")}>
                  <Mail className="h-4 w-4 mr-2" />
                  {t("automations.addEmailStep") || "Envoyer un email"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddStep("wait")}>
                  <Clock className="h-4 w-4 mr-2" />
                  {t("automations.addWaitStep") || "Attendre"}
                </Button>
              </div>

              {formData.steps.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    {t("automations.noSteps") || "Aucune étape ajoutée. Cliquez sur les boutons ci-dessus pour ajouter des étapes."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.steps.map((step, index) => (
                    <Card key={index}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            {step.step_type === "send_email" ? (
                              <Mail className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {step.step_type === "send_email"
                                ? t("automations.sendEmail") || "Envoyer un email"
                                : t("automations.wait") || "Attendre"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStep(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        {step.step_type === "send_email" && (
                          <div className="space-y-2">
                            <Label>{t("automations.selectTemplate") || "Template"}</Label>
                            <Select
                              value={step.step_config.template_id as string || ""}
                              onValueChange={(value) =>
                                handleStepConfigChange(index, { template_id: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t("automations.selectTemplatePlaceholder") || "Choisir un template"} />
                              </SelectTrigger>
                              <SelectContent>
                                {templates?.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.nom}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {step.step_type === "wait" && (
                          <div className="space-y-2">
                            <Label>{t("automations.waitDays") || "Jours d'attente"}</Label>
                            <Input
                              type="number"
                              min={1}
                              value={step.step_config.days as number || 1}
                              onChange={(e) =>
                                handleStepConfigChange(index, { days: parseInt(e.target.value) || 1 })
                              }
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

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
                ? t("common.saving") || "Enregistrement..."
                : selectedAutomation
                ? t("common.save") || "Enregistrer"
                : t("common.create") || "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("automations.deleteConfirmTitle") || "Supprimer l'automatisation ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("automations.deleteConfirmDescription") ||
                "Cette action est irréversible. Toutes les données associées seront supprimées."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Annuler"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAutomation && deleteMutation.mutate(selectedAutomation.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t("common.deleting") || "Suppression..."
                : t("common.delete") || "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Automatisations;
