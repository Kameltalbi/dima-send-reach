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
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Save, Eye, Loader2, Calendar, Clock, Mail, FlaskConical, Shield } from "lucide-react";
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
import { ABTestConfig, ABTestSettings } from "@/components/campaigns/ABTestConfig";
import { SpamScoreCard } from "@/components/campaigns/SpamScoreCard";

const NouvelleCampagne = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const isEditMode = !!campaignId;
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

  // État pour A/B Testing
  const [abTestSettings, setAbTestSettings] = useState<ABTestSettings>({
    enabled: false,
    testType: 'subject',
    variantASubject: '',
    variantBSubject: '',
    variantAContent: '',
    variantBContent: '',
    testPercentage: 20,
    winningCriteria: 'open_rate',
    testDurationHours: 4,
  });

  // Charger la campagne existante pour le mode édition
  const { data: existingCampaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ["campaign-edit", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode && !!user,
  });

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (existingCampaign) {
      setFormData({
        nom_campagne: existingCampaign.nom_campagne || "",
        sujet_email: existingCampaign.sujet_email || "",
        expediteur_nom: existingCampaign.expediteur_nom || "",
        expediteur_email: existingCampaign.expediteur_email || "",
        list_id: existingCampaign.list_id || "",
        whenToSend: "now",
        scheduledDate: "",
        scheduledTime: "",
        testEmail: "",
      });
      if (existingCampaign.html_contenu) {
        setHtmlContent(existingCampaign.html_contenu);
      }
    }
  }, [existingCampaign]);

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
      // Pour un brouillon, seul le nom de la campagne est requis
      if (isDraft) {
        if (!formData.nom_campagne.trim()) {
          throw new Error("Veuillez saisir un nom pour la campagne");
        }
      } else {
        // Pour l'envoi, tous les champs sont obligatoires
        if (!formData.nom_campagne || !formData.sujet_email || !formData.expediteur_nom || !formData.expediteur_email) {
          throw new Error("Veuillez remplir tous les champs obligatoires");
        }

        if (!htmlContent.trim()) {
          throw new Error("Veuillez créer ou sélectionner un contenu pour votre email");
        }

        if (!formData.list_id) {
          throw new Error("Veuillez sélectionner une liste de contacts");
        }

        // Validation A/B Test uniquement pour l'envoi
        if (abTestSettings.enabled) {
          if (abTestSettings.testType === 'subject' || abTestSettings.testType === 'both') {
            if (!abTestSettings.variantASubject || !abTestSettings.variantBSubject) {
              throw new Error("Veuillez remplir les sujets des deux variantes A/B");
            }
          }
          if (abTestSettings.testType === 'content' || abTestSettings.testType === 'both') {
            if (!abTestSettings.variantAContent || !abTestSettings.variantBContent) {
              throw new Error("Veuillez remplir le contenu des deux variantes A/B");
            }
          }
        }
      }

      let dateEnvoi = null;
      if (formData.whenToSend === "schedule" && formData.scheduledDate && formData.scheduledTime) {
        dateEnvoi = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      } else if (!isDraft && formData.whenToSend === "now") {
        dateEnvoi = new Date().toISOString();
      }

      const campaignData = {
        user_id: user?.id,
        nom_campagne: formData.nom_campagne || "Campagne sans nom",
        sujet_email: abTestSettings.enabled && abTestSettings.testType !== 'content' 
          ? (abTestSettings.variantASubject || formData.sujet_email || "")
          : (formData.sujet_email || ""),
        expediteur_nom: formData.expediteur_nom || "",
        expediteur_email: formData.expediteur_email || user?.email || "",
        list_id: formData.list_id === "all" ? null : (formData.list_id || null),
        html_contenu: abTestSettings.enabled && abTestSettings.testType !== 'subject'
          ? (abTestSettings.variantAContent || htmlContent || null)
          : (htmlContent || null),
        statut: isDraft ? "brouillon" : formData.whenToSend === "now" ? "en_cours" : "en_attente",
        date_envoi: dateEnvoi,
      };

      let data;
      let error;

      // Mode édition : update, sinon insert
      if (isEditMode && campaignId) {
        const result = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", campaignId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("campaigns")
          .insert(campaignData)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Créer le test A/B si activé
      if (abTestSettings.enabled && !isDraft && data) {
        const abTestData = {
          campaign_id: data.id,
          user_id: user?.id,
          test_type: abTestSettings.testType,
          variant_a_subject: abTestSettings.testType !== 'content' ? abTestSettings.variantASubject : null,
          variant_b_subject: abTestSettings.testType !== 'content' ? abTestSettings.variantBSubject : null,
          variant_a_content: abTestSettings.testType !== 'subject' ? abTestSettings.variantAContent : null,
          variant_b_content: abTestSettings.testType !== 'subject' ? abTestSettings.variantBContent : null,
          test_percentage: abTestSettings.testPercentage,
          winning_criteria: abTestSettings.winningCriteria,
          test_duration_hours: abTestSettings.testDurationHours,
          status: 'pending',
        };

        const { error: abError } = await supabase
          .from("ab_tests")
          .insert(abTestData);

        if (abError) {
          console.error("Erreur lors de la création du test A/B:", abError);
          toast.warning("La campagne a été créée mais le test A/B n'a pas pu être configuré");
        }
      }

      // Si ce n'est pas un brouillon, créer les destinataires
      if (!isDraft && data) {
        await createRecipients(data.id, abTestSettings.enabled ? abTestSettings.testPercentage : null);
        
        // Si envoi immédiat, lancer l'Edge Function
        if (formData.whenToSend === "now") {
          toast.info("Envoi de la campagne en cours...");
          const { data: sendResult, error: sendError } = await supabase.functions.invoke("send-email", {
            body: {
              campaignId: data.id,
              abTestEnabled: abTestSettings.enabled,
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
      }

      return data;
    },
    onSuccess: (data, isDraft) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      if (isDraft) {
        toast.success(isEditMode ? "Campagne modifiée et enregistrée en brouillon" : "Campagne enregistrée en brouillon");
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
  const createRecipients = async (campaignId: string, abTestPercentage: number | null = null) => {
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
      // Mélanger les contacts de manière aléatoire pour le test A/B
      const shuffledContacts = [...contacts].sort(() => Math.random() - 0.5);
      
      const recipients = shuffledContacts.map((contact, index) => {
        let abVariant = null;
        
        if (abTestPercentage !== null) {
          const testGroupSize = Math.floor(contacts.length * abTestPercentage / 100);
          const halfTestSize = Math.floor(testGroupSize / 2);
          
          if (index < halfTestSize) {
            abVariant = 'A';
          } else if (index < testGroupSize) {
            abVariant = 'B';
          }
          // Les autres restent null (recevront le gagnant)
        }
        
        return {
          campaign_id: campaignId,
          contact_id: contact.id,
          statut_envoi: "en_attente",
          ab_variant: abVariant,
        };
      });

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
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {isEditMode ? "Éditer la campagne" : "Nouvelle campagne"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Modifiez votre campagne" : "Créez et configurez votre campagne d'e-mailing"}
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
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="abtest" className="gap-1">
            <FlaskConical className="h-3.5 w-3.5" />
            A/B Test
          </TabsTrigger>
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

        {/* Onglet A/B Testing */}
        <TabsContent value="abtest" className="space-y-6">
          <ABTestConfig
            settings={abTestSettings}
            onSettingsChange={setAbTestSettings}
            defaultSubject={formData.sujet_email}
            defaultContent={htmlContent}
          />

          {abTestSettings.enabled && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Vérification avant test
                </CardTitle>
                <CardDescription>
                  Score de spam pour les deux variantes
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Variante A
                  </Badge>
                  <SpamScoreCard
                    subject={abTestSettings.testType !== 'content' ? abTestSettings.variantASubject : formData.sujet_email}
                    htmlContent={abTestSettings.testType !== 'subject' ? abTestSettings.variantAContent : htmlContent}
                    senderName={formData.expediteur_nom}
                    senderEmail={formData.expediteur_email}
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Variante B
                  </Badge>
                  <SpamScoreCard
                    subject={abTestSettings.testType !== 'content' ? abTestSettings.variantBSubject : formData.sujet_email}
                    htmlContent={abTestSettings.testType !== 'subject' ? abTestSettings.variantBContent : htmlContent}
                    senderName={formData.expediteur_nom}
                    senderEmail={formData.expediteur_email}
                    className="border-purple-200"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="envoi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'envoi</CardTitle>
              <CardDescription>
                Choisissez le moment d'envoi de votre campagne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Quand envoyer la campagne ?</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, whenToSend: "now" })}
                    className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                      formData.whenToSend === "now"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Send className="h-8 w-8 mb-2" />
                    <span className="font-medium">Envoyer maintenant</span>
                    <span className="text-sm text-muted-foreground mt-1">Envoi immédiat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, whenToSend: "schedule" })}
                    className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                      formData.whenToSend === "schedule"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Calendar className="h-8 w-8 mb-2" />
                    <span className="font-medium">Programmer l'envoi</span>
                    <span className="text-sm text-muted-foreground mt-1">Choisir date et heure</span>
                  </button>
                </div>
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

              {/* Score de spam */}
              <SpamScoreCard
                subject={formData.sujet_email}
                htmlContent={htmlContent}
                senderName={formData.expediteur_nom}
                senderEmail={formData.expediteur_email}
              />

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
                  {abTestSettings.enabled && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Test A/B :</dt>
                      <dd className="font-medium">
                        <Badge variant="secondary" className="gap-1">
                          <FlaskConical className="h-3 w-3" />
                          Activé ({abTestSettings.testPercentage}%)
                        </Badge>
                      </dd>
                    </div>
                  )}
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
                ) : formData.whenToSend === "schedule" ? (
                  <Calendar className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {formData.whenToSend === "schedule" ? "Programmer l'envoi" : "Envoyer maintenant"}
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
