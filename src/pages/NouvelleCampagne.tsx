import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Save, 
  Eye, 
  Loader2, 
  Monitor,
  Smartphone,
  Grid3x3,
  Palette,
  Sparkles,
  Type,
  FileText,
  Image as ImageIcon,
  Play,
  MousePointerClick,
  Link2,
  Code,
  CreditCard,
  Minus,
  Shirt,
  Menu,
  Square,
  Settings,
  X,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Facebook,
  Instagram
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEmailQuota } from "@/hooks/useEmailQuota";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TestEmailDialog } from "@/components/campaigns/TestEmailDialog";
import { TemplateEditorBrevo } from "@/components/templates/TemplateEditorBrevo";

const NouvelleCampagne = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const isEditMode = !!campaignId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { quota, canSendEmails } = useEmailQuota();
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"blocs" | "sections" | "enregistres">("blocs");
  const [sidebarIcon, setSidebarIcon] = useState<"contenu" | "style" | "aura">("contenu");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nom_campagne: "",
    sujet_email: "",
    expediteur_nom: "",
    expediteur_email: "",
    list_id: "",
    whenToSend: "now",
    scheduledDate: "",
    scheduledTime: "",
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
    if (profile && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        expediteur_nom: prev.expediteur_nom || profile.nom_entreprise || "",
        expediteur_email: prev.expediteur_email || profile.email_envoi_defaut || user?.email || "",
      }));
    }
  }, [profile, user, isEditMode]);

  // Mutation pour sauvegarder la campagne
  const saveMutation = useMutation({
    mutationFn: async (isDraft: boolean) => {
      if (!formData.nom_campagne.trim()) {
        throw new Error("Veuillez saisir un nom pour la campagne");
      }

      if (!isDraft) {
        if (!formData.sujet_email || !formData.expediteur_nom || !formData.expediteur_email) {
          throw new Error("Veuillez remplir tous les champs obligatoires");
        }

        if (!htmlContent.trim()) {
          throw new Error("Veuillez créer ou sélectionner un contenu pour votre email");
        }

        if (!formData.list_id) {
          throw new Error("Veuillez sélectionner une liste de contacts");
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
        sujet_email: formData.sujet_email || "",
        expediteur_nom: formData.expediteur_nom || "",
        expediteur_email: formData.expediteur_email || user?.email || "",
        list_id: formData.list_id === "all" ? null : (formData.list_id || null),
        html_contenu: htmlContent || null,
        statut: isDraft ? "brouillon" : formData.whenToSend === "now" ? "en_cours" : "en_attente",
        date_envoi: dateEnvoi,
      };

      let data;
      let error;

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

      if (!isDraft && data) {
        await createRecipients(data.id);
        
        if (formData.whenToSend === "now") {
          toast.info("Envoi de la campagne en cours...");
          const { data: sendResult, error: sendError } = await supabase.functions.invoke("send-email", {
            body: {
              campaignId: data.id,
            },
          });

          if (sendError) {
            console.error("Erreur lors de l'envoi:", sendError);
            throw new Error("La campagne a été créée mais l'envoi a échoué.");
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
      setHasUnsavedChanges(false);
      if (isDraft) {
        toast.success(isEditMode ? "Campagne modifiée et enregistrée" : "Campagne enregistrée");
      } else if (formData.whenToSend === "now") {
        toast.success("Campagne envoyée avec succès !");
      } else {
        toast.success("Campagne programmée avec succès");
      }
      if (!isDraft && formData.whenToSend === "now") {
        navigate("/campagnes");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la sauvegarde de la campagne");
    },
  });

  // Créer les destinataires pour une campagne
  const createRecipients = async (campaignId: string) => {
    let contacts: any[] = [];

    if (formData.list_id === "all") {
      const { data, error } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user?.id)
        .eq("statut", "actif");
      if (error) throw error;
      contacts = data || [];
    } else {
      const { data, error } = await supabase
        .from("list_contacts")
        .select("contact_id")
        .eq("list_id", formData.list_id);
      if (error) throw error;
      contacts = (data || []).map((lc: any) => ({ id: lc.contact_id }));
    }

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

  const handleEditorSave = useCallback((html: string) => {
    setHtmlContent(html);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = () => {
    saveMutation.mutate(true);
  };

  const handlePreviewAndTest = () => {
    setIsTestDialogOpen(true);
  };

  if (isLoadingCampaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Blocs disponibles dans la sidebar
  const contentBlocks = [
    { id: "titre", label: "Titre", icon: Type, category: "contenu" },
    { id: "texte", label: "Texte", icon: FileText, category: "contenu" },
    { id: "image", label: "Image", icon: ImageIcon, category: "contenu" },
    { id: "video", label: "Video", icon: Play, category: "contenu" },
    { id: "bouton", label: "Bouton", icon: MousePointerClick, category: "contenu" },
    { id: "logo", label: "Logo", icon: ImageIcon, category: "contenu" },
    { id: "social", label: "Social", icon: Link2, category: "contenu" },
    { id: "html", label: "HTML", icon: Code, category: "contenu" },
    { id: "paiement", label: "Lien de paiement", icon: CreditCard, category: "contenu" },
    { id: "diviseur", label: "Diviseur", icon: Minus, category: "contenu" },
    { id: "produit", label: "Produit", icon: Shirt, category: "contenu" },
    { id: "navigation", label: "Navigation", icon: Menu, category: "contenu" },
    { id: "bloc-vide", label: "", icon: Square, category: "contenu" },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar gauche - Style Brevo */}
        <div className="w-80 border-r bg-[#f5f5f5] flex flex-col">
          {/* Onglets horizontaux */}
          <div className="border-b bg-white px-4 py-2 flex gap-1">
            <button
              onClick={() => setSidebarTab("blocs")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                sidebarTab === "blocs"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Blocs
            </button>
            <button
              onClick={() => setSidebarTab("sections")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                sidebarTab === "sections"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setSidebarTab("enregistres")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                sidebarTab === "enregistres"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Enregistrés
            </button>
          </div>

          {/* Contenu de la sidebar */}
          <div className="flex-1 flex overflow-hidden">
            {/* Icônes verticales */}
            <div className="w-16 border-r bg-white flex flex-col py-2">
              <button
                onClick={() => setSidebarIcon("contenu")}
                className={`flex flex-col items-center gap-1 p-3 transition-colors ${
                  sidebarIcon === "contenu"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="Contenu"
              >
                <Grid3x3 className="h-5 w-5" />
                <span className="text-[10px] font-medium">Contenu</span>
              </button>
              <button
                onClick={() => setSidebarIcon("style")}
                className={`flex flex-col items-center gap-1 p-3 transition-colors ${
                  sidebarIcon === "style"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="Style"
              >
                <Palette className="h-5 w-5" />
                <span className="text-[10px] font-medium">Style</span>
              </button>
              <button
                onClick={() => setSidebarIcon("aura")}
                className={`flex flex-col items-center gap-1 p-3 transition-colors ${
                  sidebarIcon === "aura"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="Aura AI"
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-[10px] font-medium">Aura AI</span>
              </button>
            </div>

            {/* Zone de contenu */}
            <div className="flex-1 overflow-y-auto bg-white">
              {sidebarIcon === "contenu" && sidebarTab === "blocs" && (
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {contentBlocks.map((block) => {
                      const Icon = block.icon;
                      return (
                        <div
                          key={block.id}
                          className="group relative bg-white border rounded-lg p-4 cursor-move hover:border-primary hover:shadow-md transition-all"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("block-type", block.id);
                          }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                <div className="w-1 h-1 bg-muted-foreground rounded-full mx-0.5"></div>
                                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                              </div>
                            </div>
                            <Icon className="h-8 w-8 text-muted-foreground" />
                            {block.label && (
                              <span className="text-xs text-center text-muted-foreground font-medium">
                                {block.label}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {sidebarIcon === "style" && (
                <div className="p-4 space-y-4">
                  {/* Bibliothèque de marques */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Bibliothèque de marques</h3>
                      <Badge className="bg-green-500 text-white text-xs">Nouveau</Badge>
                    </div>
                    
                    {/* Éléments de marque */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border rounded p-2 bg-white flex items-center justify-center h-16">
                        <span className="text-xs font-semibold">iddéco</span>
                      </div>
                      <div className="border rounded p-2 bg-green-500 flex items-center justify-center h-16">
                        <div className="w-8 h-6 bg-yellow-400 rounded"></div>
                      </div>
                      <div className="border rounded p-2 bg-white flex items-center justify-center gap-1 h-16">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        <Instagram className="h-4 w-4 text-pink-600" />
                      </div>
                    </div>
                    
                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-900">
                        Nouveaux éléments de marque disponibles
                      </p>
                    </div>
                    
                    {/* Boutons */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        Modifier
                      </Button>
                      <Button size="sm" className="flex-1 text-xs bg-primary">
                        Appliquer les éléments
                      </Button>
                    </div>
                  </div>
                  
                  {/* Template */}
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors">
                      <span>Template</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Apparence du texte */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Apparence du texte</h3>
                    </div>
                    
                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-900">
                        Enregistrez les polices de votre marque pour créer des emails adaptés à votre image de marque encore plus rapidement.
                      </p>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Enregistrer les polices
                    </Button>
                    
                    {/* Paragraphe */}
                    <div className="space-y-2 border-t pt-3">
                      <h4 className="text-xs font-semibold text-foreground">Paragraphe</h4>
                      <div className="space-y-2">
                        <Select defaultValue="verdana">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verdana">Verdana</SelectItem>
                            <SelectItem value="arial">Arial</SelectItem>
                            <SelectItem value="helvetica">Helvetica</SelectItem>
                            <SelectItem value="times">Times New Roman</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">-</Button>
                          <Input 
                            value="15" 
                            className="h-8 text-xs text-center"
                            readOnly
                          />
                          <span className="text-xs text-muted-foreground">px</span>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">+</Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded border-2 border-gray-300" style={{ backgroundColor: '#2d5016' }}></div>
                          <Input 
                            value="#2d5016" 
                            className="h-8 text-xs flex-1"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Titre 1 */}
                    <div className="space-y-2 border-t pt-3">
                      <h4 className="text-xs font-semibold text-foreground">Titre 1</h4>
                      <div className="space-y-2">
                        <Select defaultValue="courier">
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="courier">Courier New</SelectItem>
                            <SelectItem value="verdana">Verdana</SelectItem>
                            <SelectItem value="arial">Arial</SelectItem>
                            <SelectItem value="helvetica">Helvetica</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">-</Button>
                          <Input 
                            value="24" 
                            className="h-8 text-xs text-center"
                            readOnly
                          />
                          <span className="text-xs text-muted-foreground">px</span>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">+</Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded border-2 border-gray-300" style={{ backgroundColor: '#f5f0e8' }}></div>
                          <Input 
                            value="#f5f0e8" 
                            className="h-8 text-xs flex-1"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {sidebarTab === "sections" && (
                <div className="p-4">
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Sections disponibles bientôt
                  </div>
                </div>
              )}
              
              {sidebarTab === "enregistres" && (
                <div className="p-4">
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Blocs enregistrés bientôt
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone principale - Fond beige avec grille pointillée */}
        <div className="flex-1 overflow-hidden bg-[#f5f0e8] relative">
          {/* Grille pointillée en arrière-plan */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(circle, #d4c5b0 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
          
          {/* Zone d'édition centrée */}
          <div className="h-full overflow-auto p-8">
            <div className={`mx-auto bg-white shadow-2xl transition-all ${
              deviceView === "mobile" ? "max-w-sm" : "max-w-4xl"
            }`}>
              <TemplateEditorBrevo
                initialContent={htmlContent}
                onSave={handleEditorSave}
                deviceView={deviceView}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Paramètres */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paramètres de la campagne</DialogTitle>
            <DialogDescription>
              Configurez les informations de votre campagne
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom-campagne">Nom de la campagne *</Label>
              <Input 
                id="nom-campagne"
                value={formData.nom_campagne}
                onChange={(e) => {
                  setFormData({ ...formData, nom_campagne: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                placeholder="Ex: Newsletter Janvier 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sujet">Sujet de l'e-mail *</Label>
              <Input 
                id="sujet"
                value={formData.sujet_email}
                onChange={(e) => {
                  setFormData({ ...formData, sujet_email: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                placeholder="Le sujet qui apparaîtra dans la boîte mail"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expediteur-nom">Nom de l'expéditeur *</Label>
                <Input 
                  id="expediteur-nom"
                  value={formData.expediteur_nom}
                  onChange={(e) => {
                    setFormData({ ...formData, expediteur_nom: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Votre entreprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expediteur-email">Email de l'expéditeur *</Label>
                <Input 
                  id="expediteur-email"
                  type="email"
                  value={formData.expediteur_email}
                  onChange={(e) => {
                    setFormData({ ...formData, expediteur_email: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="contact@entreprise.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="liste-cible">Liste de contacts *</Label>
              <Select 
                value={formData.list_id} 
                onValueChange={(value) => {
                  setFormData({ ...formData, list_id: value });
                  setHasUnsavedChanges(true);
                }}
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
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              saveMutation.mutate(true);
              setIsSettingsOpen(false);
            }}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Test Email */}
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
