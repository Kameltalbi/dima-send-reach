import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Save, Eye, Loader2, Calendar, Clock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { useEmailQuota } from "@/hooks/useEmailQuota";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TestEmailDialog } from "@/components/campaigns/TestEmailDialog";

const NouvelleCampagne = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { quota, canSendEmails } = useEmailQuota();
  const [activeTab, setActiveTab] = useState("info");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  
  const [formData, setFormData] = useState({
    nom_campagne: "",
    sujet_email: "",
    expediteur_nom: "",
    expediteur_email: "",
    list_id: "",
    whenToSend: "now",
    scheduledDate: "",
    scheduledTime: "",
    testEmail: "",
  });

  // Charger les listes
  const { data: lists } = useQuery({
    queryKey: ["lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("user_id", user?.id)
        .order("nom", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Charger les templates
  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", user?.id)
        .order("nom", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Charger le profil utilisateur pour les valeurs par défaut
  const { data: profile } = useQuery({
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

  // Initialiser les valeurs par défaut
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        expediteur_nom: profile.nom_entreprise || "",
        expediteur_email: profile.email_envoi_defaut || user?.email || "",
      }));
    }
  }, [profile, user]);

  // Calculer le nombre de destinataires
  const { data: recipientCount } = useQuery({
    queryKey: ["recipientCount", formData.list_id],
    queryFn: async () => {
      if (!formData.list_id || formData.list_id === "all") {
        // Compter tous les contacts de l'utilisateur
        const { count, error } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id)
          .eq("statut", "actif");
        if (error) throw error;
        return count || 0;
      } else {
        // Compter les contacts de la liste
        const { count, error } = await supabase
          .from("list_contacts")
          .select("*", { count: "exact", head: true })
          .eq("list_id", formData.list_id);
        if (error) throw error;
        return count || 0;
      }
    },
    enabled: !!user,
  });

  // Charger le template sélectionné
  const { data: selectedTemplate } = useQuery({
    queryKey: ["template", selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return null;
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", selectedTemplateId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTemplateId,
  });

  // Mettre à jour le HTML quand un template est sélectionné
  useEffect(() => {
    if (selectedTemplate?.content_html) {
      setHtmlContent(selectedTemplate.content_html);
    }
  }, [selectedTemplate]);

  // Mutation pour sauvegarder la campagne
  const saveMutation = useMutation({
    mutationFn: async (isDraft: boolean) => {
      if (!formData.nom_campagne || !formData.sujet_email || !formData.expediteur_nom || !formData.expediteur_email) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      if (!htmlContent.trim()) {
        throw new Error("Veuillez créer ou sélectionner un contenu pour votre email");
      }

      if (!formData.list_id) {
        throw new Error("Veuillez sélectionner une liste de contacts");
      }

      let dateEnvoi = null;
      if (formData.whenToSend === "schedule" && formData.scheduledDate && formData.scheduledTime) {
        dateEnvoi = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      } else if (!isDraft && formData.whenToSend === "now") {
        dateEnvoi = new Date().toISOString();
      }

      const campaignData = {
        user_id: user?.id,
        nom_campagne: formData.nom_campagne,
        sujet_email: formData.sujet_email,
        expediteur_nom: formData.expediteur_nom,
        expediteur_email: formData.expediteur_email,
        list_id: formData.list_id === "all" ? null : formData.list_id,
        html_contenu: htmlContent,
        statut: isDraft ? "brouillon" : formData.whenToSend === "now" ? "en_cours" : "en_attente",
        date_envoi: dateEnvoi,
      };

      const { data, error } = await supabase
        .from("campaigns")
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;

      // Si ce n'est pas un brouillon et qu'on envoie maintenant, créer les destinataires et lancer l'envoi
      if (!isDraft && formData.whenToSend === "now" && data) {
        await createRecipients(data.id);
        
        // Lancer l'envoi via l'Edge Function
        toast.info("Envoi de la campagne en cours...");
        const { data: sendResult, error: sendError } = await supabase.functions.invoke("send-email", {
          body: {
            campaignId: data.id,
          },
        });

        if (sendError) {
          console.error("Erreur lors de l'envoi:", sendError);
          throw new Error("La campagne a été créée mais l'envoi a échoué. Veuillez réessayer depuis la liste des campagnes.");
        }

        if (!sendResult?.success) {
          throw new Error(sendResult?.message || "Erreur lors de l'envoi de la campagne");
        }
      }

      return data;
    },
    onSuccess: (data, isDraft) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      if (isDraft) {
        toast.success("Campagne enregistrée en brouillon");
      } else if (formData.whenToSend === "now") {
        toast.success("Campagne envoyée avec succès ! Consultez les statistiques pour suivre les résultats.");
      } else {
        toast.success("Campagne programmée avec succès");
      }
      navigate("/campagnes");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la sauvegarde de la campagne");
    },
  });

  // Créer les destinataires pour une campagne
  const createRecipients = async (campaignId: string) => {
    let contacts: any[] = [];

    if (formData.list_id === "all") {
      // Tous les contacts actifs
      const { data, error } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user?.id)
        .eq("statut", "actif");
      if (error) throw error;
      contacts = data || [];
    } else {
      // Contacts de la liste
      const { data, error } = await supabase
        .from("list_contacts")
        .select("contact_id")
        .eq("list_id", formData.list_id);
      if (error) throw error;
      contacts = (data || []).map((lc: any) => ({ id: lc.contact_id }));
    }

    // Créer les enregistrements de destinataires
    if (contacts.length > 0) {
      const recipients = contacts.map((contact) => ({
        campaign_id: campaignId,
        contact_id: contact.id,
        statut_envoi: "en_attente",
      }));

      const { error } = await supabase.from("campaign_recipients").insert(recipients);
      if (error) throw error;
    }
  };

  // Mutation pour envoyer des emails de test
  const testEmailMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      if (!htmlContent.trim()) {
        throw new Error("Veuillez créer ou sélectionner un contenu pour votre email");
      }

      if (!formData.sujet_email || !formData.expediteur_nom || !formData.expediteur_email) {
        throw new Error("Veuillez remplir les informations de l'expéditeur et le sujet");
      }

      // Envoyer à chaque email de test
      const promises = emails.map((email) =>
        supabase.functions.invoke("send-email", {
          body: {
            testEmail: {
              to: email,
              subject: `[TEST] ${formData.sujet_email}`,
              html: htmlContent,
              fromName: formData.expediteur_nom,
              fromEmail: formData.expediteur_email,
            },
          },
        })
      );

      const results = await Promise.allSettled(promises);
      
      const successes = results.filter((r) => r.status === "fulfilled" && r.value.data?.success).length;
      const failures = results.length - successes;

      if (failures > 0) {
        throw new Error(`${successes} emails envoyés, ${failures} échecs`);
      }

      return { successes, total: results.length };
    },
    onSuccess: (data) => {
      toast.success(`${data.successes} email${data.successes > 1 ? "s" : ""} de test envoyé${data.successes > 1 ? "s" : ""} avec succès`);
      setIsTestDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'envoi des emails de test");
    },
  });

  const handleSendTest = (emails: string[]) => {
    testEmailMutation.mutate(emails);
  };

  const handleOpenEditor = () => {
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedTemplateId(null);
  };

  const handleTemplateSelected = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsEditorOpen(true);
  };

  const handleEditorSave = (html: string) => {
    setHtmlContent(html);
    toast.success("Contenu sauvegardé");
  };

  const handlePreview = () => {
    if (!htmlContent.trim()) {
      toast.error("Veuillez créer ou sélectionner un contenu pour votre email");
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleSaveDraft = () => {
    saveMutation.mutate(true);
  };

  const handleSend = async () => {
    if (!formData.list_id) {
      toast.error("Veuillez sélectionner une liste de contacts");
      setActiveTab("info");
      return;
    }

    if (!htmlContent.trim()) {
      toast.error("Veuillez créer ou sélectionner un contenu pour votre email");
      setActiveTab("design");
      return;
    }

    // Vérifier le quota avant d'envoyer
    if (quota?.isBlocked) {
      toast.error(
        `Quota dépassé ! Vous avez utilisé ${quota.used.toLocaleString()} / ${quota.limit.toLocaleString()} emails ce mois-ci. L'envoi est bloqué jusqu'au ${quota.resetDate?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`,
        { duration: 6000 }
      );
      navigate("/dashboard");
      return;
    }

    // Compter le nombre de destinataires
    let recipientCount = 0;
    try {
      if (formData.list_id === "all") {
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id", { count: "exact" })
          .eq("user_id", user?.id)
          .eq("statut", "actif");
        recipientCount = contacts?.length || 0;
      } else {
        const { data: listContacts } = await supabase
          .from("list_contacts")
          .select("contact_id", { count: "exact" })
          .eq("list_id", formData.list_id);
        recipientCount = listContacts?.length || 0;
      }

      // Vérifier si on peut envoyer à ce nombre de destinataires
      if (!canSendEmails(recipientCount)) {
        if (quota) {
          toast.error(
            `Quota insuffisant ! Vous avez ${quota.remaining.toLocaleString()} emails restants mais vous essayez d'envoyer à ${recipientCount.toLocaleString()} destinataires.`,
            { duration: 6000 }
          );
        } else {
          toast.error("Impossible de vérifier votre quota. Veuillez réessayer.");
        }
        navigate("/dashboard");
        return;
      }

      // Avertir si proche de la limite
      if (quota?.isNearLimit && !quota.isBlocked) {
        toast.warning(
          `Attention : Vous avez utilisé ${quota.percentage.toFixed(0)}% de votre quota mensuel. Il reste ${quota.remaining.toLocaleString()} emails disponibles.`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du quota:", error);
      toast.error("Erreur lors de la vérification du quota. Veuillez réessayer.");
      return;
    }

    saveMutation.mutate(false);
  };

  if (isEditorOpen) {
    return (
      <TemplateEditor
        templateId={selectedTemplateId}
        onClose={handleCloseEditor}
        onSave={handleEditorSave}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/campagnes")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold text-foreground">Nouvelle campagne</h1>
          <p className="text-muted-foreground mt-1">
            Créez et configurez votre campagne d'e-mailing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePreview}>
            <Eye className="h-4 w-4" />
            Aperçu
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleSaveDraft}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
          <Button 
            className="gap-2"
            onClick={handleSend}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="envoi">Envoi</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Configurez les détails de votre campagne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom-campagne">Nom de la campagne *</Label>
                <Input 
                  id="nom-campagne"
                  value={formData.nom_campagne}
                  onChange={(e) => setFormData({ ...formData, nom_campagne: e.target.value })}
                  placeholder="Ex: Newsletter Janvier 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sujet">Sujet de l'e-mail *</Label>
                <Input 
                  id="sujet"
                  value={formData.sujet_email}
                  onChange={(e) => setFormData({ ...formData, sujet_email: e.target.value })}
                  placeholder="Le sujet qui apparaîtra dans la boîte mail"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expediteur-nom">Nom de l'expéditeur *</Label>
                  <Input 
                    id="expediteur-nom"
                    value={formData.expediteur_nom}
                    onChange={(e) => setFormData({ ...formData, expediteur_nom: e.target.value })}
                    placeholder="Votre entreprise"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expediteur-email">Email de l'expéditeur *</Label>
                  <Input 
                    id="expediteur-email"
                    type="email"
                    value={formData.expediteur_email}
                    onChange={(e) => setFormData({ ...formData, expediteur_email: e.target.value })}
                    placeholder="contact@entreprise.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="liste-cible">Liste de contacts *</Label>
                <Select 
                  value={formData.list_id} 
                  onValueChange={(value) => setFormData({ ...formData, list_id: value })}
                >
                  <SelectTrigger id="liste-cible">
                    <SelectValue placeholder="Sélectionnez une liste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les contacts actifs</SelectItem>
                    {lists?.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.list_id && (
                  <p className="text-sm text-muted-foreground">
                    {recipientCount || 0} destinataire{(recipientCount || 0) > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Éditeur d'e-mail</CardTitle>
              <CardDescription>
                Créez le contenu de votre e-mail avec un template ou l'éditeur visuel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Utiliser un template</Label>
                <Select 
                  value={selectedTemplateId || ""} 
                  onValueChange={(value) => {
                    if (value === "blank") {
                      setSelectedTemplateId(null);
                      setHtmlContent("");
                      handleOpenEditor();
                    } else {
                      handleTemplateSelected(value);
                    }
                  }}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Choisir un template ou partir de zéro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">Créer depuis zéro</SelectItem>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {htmlContent ? (
                <div className="space-y-2">
                  <Label>Contenu HTML</Label>
                  <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-auto">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleOpenEditor} className="flex-1">
                      Modifier avec l'éditeur
                    </Button>
                    <Button variant="outline" onClick={() => setHtmlContent("")}>
                      Effacer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Aucun contenu sélectionné
                  </p>
                  <Button onClick={handleOpenEditor}>
                    Ouvrir l'éditeur visuel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="envoi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'envoi</CardTitle>
              <CardDescription>
                Configurez quand et comment envoyer votre campagne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quand envoyer ?</Label>
                <Select 
                  value={formData.whenToSend} 
                  onValueChange={(value) => setFormData({ ...formData, whenToSend: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Maintenant</SelectItem>
                    <SelectItem value="schedule">Programmer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.whenToSend === "schedule" && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-date">Date</Label>
                    <Input
                      id="scheduled-date"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-time">Heure</Label>
                    <Input
                      id="scheduled-time"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Envoyer un test à vos contacts de test</Label>
                <Button 
                  variant="outline"
                  onClick={() => setIsTestDialogOpen(true)}
                  disabled={!htmlContent || !formData.sujet_email || !formData.expediteur_nom || !formData.expediteur_email}
                  className="w-full gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Envoyer un test
                </Button>
                <p className="text-xs text-muted-foreground">
                  Vérifiez le rendu avant d'envoyer à tous vos contacts. Configurez vos contacts de test dans la page Contacts.
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Récapitulatif</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Destinataires :</dt>
                    <dd className="font-medium">
                      {recipientCount?.toLocaleString() || 0} contact{(recipientCount || 0) > 1 ? "s" : ""}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Envoi :</dt>
                    <dd className="font-medium">
                      {formData.whenToSend === "now" 
                        ? "Immédiat" 
                        : formData.scheduledDate && formData.scheduledTime
                        ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString("fr-FR")
                        : "Non programmé"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Contenu :</dt>
                    <dd className="font-medium">
                      {htmlContent ? (
                        <Badge variant="default">Prêt</Badge>
                      ) : (
                        <Badge variant="secondary">Non défini</Badge>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("design")}>
              Retour
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleSaveDraft}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer en brouillon
              </Button>
              <Button 
                className="gap-2"
                onClick={handleSend}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Envoyer maintenant
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Aperçu */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Aperçu de l'email</DialogTitle>
            <DialogDescription>
              Voici comment votre email apparaîtra pour vos destinataires
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            <div className="border rounded-lg p-4 bg-white">
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-muted-foreground">De: {formData.expediteur_nom} &lt;{formData.expediteur_email}&gt;</p>
                <p className="text-sm text-muted-foreground">À: destinataire@example.com</p>
                <p className="font-semibold mt-2">Sujet: {formData.sujet_email || "(Sujet non défini)"}</p>
              </div>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent || "<p>Aucun contenu</p>" }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TestEmailDialog
        open={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        onSendTest={handleSendTest}
        isSending={testEmailMutation.isPending}
      />
    </div>
  );
};

export default NouvelleCampagne;
