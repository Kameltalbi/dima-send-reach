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
  Instagram,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowRight,
  ArrowLeft,
  ImagePlus,
  Link as LinkIcon,
  Mail,
  HelpCircle,
  GripVertical,
  X as XIcon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
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
import { Logo } from "@/components/Logo";
import { Clock } from "lucide-react";

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
  const [sidebarIcon, setSidebarIcon] = useState<"contenu" | "style" | "sonia">("contenu");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ name: string; url: string; type: 'image' | 'video'; path: string }>>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  // États pour les sections Style (repliables)
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [textAppearanceExpanded, setTextAppearanceExpanded] = useState(true);
  const [buttonsExpanded, setButtonsExpanded] = useState(false);
  
  // États pour les styles
  const [templateStyles, setTemplateStyles] = useState({
    backgroundColor: "#f5f0e8",
    backgroundImage: "",
    backgroundImageUrl: "",
    bodyColor: "",
    bodyWidth: 600,
    showInBrowser: false,
  });
  
  const [textStyles, setTextStyles] = useState({
    paragraph: { font: "verdana", size: 15, color: "#2d5016" },
    title1: { font: "courier", size: 24, color: "#f5f0e8" },
    title2: { font: "courier", size: 24, color: "#2d5016" },
    title3: { font: "courier", size: 16, color: "#2d5016" },
    title4: { font: "courier", size: 12, color: "#2d5016" },
    link: { bold: false, italic: false, underline: false, color: "#2d5016" },
    lineSpacing: "left",
    writingDirection: "ltr",
  });
  
  const [buttonStyles, setButtonStyles] = useState({
    font: "courier",
    size: 16,
    color: "#f5f0e8",
    bold: false,
    italic: false,
    underline: false,
    width: 209,
    borderRadius: 30,
    backgroundColor: "#2d5016",
    borderWidth: 1,
    borderColor: "#f5f0e8",
  });
  
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
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
      // Initialiser la dernière sauvegarde si la campagne existe déjà
      if (existingCampaign.updated_at) {
        setLastSaved(new Date(existingCampaign.updated_at));
      }
    }
  }, [existingCampaign]);

  // Ouvrir automatiquement le dialog de sélection de template en mode création
  useEffect(() => {
    if (!isEditMode && !existingCampaign && templates !== undefined && !isLoadingCampaign) {
      // Ouvrir le dialog seulement si on n'a pas encore de contenu
      if (!htmlContent) {
        setIsTemplateDialogOpen(true);
      }
    }
  }, [isEditMode, existingCampaign, templates, isLoadingCampaign, htmlContent]);

  // Fonction pour charger un template dans l'éditeur
  const handleLoadTemplate = async (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      if (template.content_html) {
        console.log("Chargement du template:", template.nom);
        console.log("Contenu HTML:", template.content_html.substring(0, 200) + "...");
        setHtmlContent(template.content_html);
        setHasUnsavedChanges(true);
        toast.success(`Template "${template.nom}" chargé avec succès`);
        setIsTemplateDialogOpen(false);
      } else {
        toast.error("Ce template ne contient pas de contenu HTML");
      }
    }
  };

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
      setLastSaved(new Date());
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

  // Charger les médias de l'utilisateur
  const loadUserMedia = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingMedia(true);
    try {
      const { data: files, error } = await supabase.storage
        .from('template-images')
        .list(`${user.id}`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Erreur lors du chargement des médias:', error);
        return;
      }

      const mediaList = await Promise.all(
        (files || []).map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('template-images')
            .getPublicUrl(`${user.id}/${file.name}`);

          const isVideo = file.name.match(/\.(mp4|webm|mov|avi)$/i);
          return {
            name: file.name,
            url: publicUrl,
            type: isVideo ? 'video' as const : 'image' as const,
            path: `${user.id}/${file.name}`
          };
        })
      );

      setUploadedMedia(mediaList);
    } catch (error) {
      console.error('Erreur lors du chargement des médias:', error);
      toast.error('Erreur lors du chargement des médias');
    } finally {
      setIsLoadingMedia(false);
    }
  }, [user?.id]);

  // Charger les médias au montage et quand l'onglet est sélectionné
  useEffect(() => {
    if (sidebarTab === "enregistres" && user?.id) {
      loadUserMedia();
    }
  }, [sidebarTab, user?.id, loadUserMedia]);

  // Télécharger des médias
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    toast.info('Téléchargement en cours...');

    try {
      if (!user?.id) {
        toast.error('Vous devez être connecté pour télécharger des médias');
        setIsUploadingMedia(false);
        return;
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Vérifier le type de fichier
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          toast.error(`${file.name}: Format non supporté`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('template-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          toast.error(`Erreur: ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('template-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length} média${uploadedUrls.length > 1 ? 'x' : ''} téléchargé${uploadedUrls.length > 1 ? 's' : ''} avec succès`);
        // Recharger la liste des médias
        await loadUserMedia();
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsUploadingMedia(false);
      // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
      if (mediaInputRef.current) {
        mediaInputRef.current.value = '';
      }
    }
  };

  // Insérer un média dans l'éditeur
  const handleInsertMedia = (media: { name: string; url: string; type: 'image' | 'video'; path: string }) => {
    // Cette fonction sera appelée depuis TemplateEditorBrevo pour insérer le média
    // Pour l'instant, on affiche juste un toast
    toast.info(`Média "${media.name}" sélectionné. Utilisez le bloc Image ou Vidéo pour l'insérer.`);
    // TODO: Implémenter l'insertion directe dans l'éditeur GrapesJS
  };

  // Supprimer un média
  const handleDeleteMedia = async (path: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
      return;
    }

    try {
      const { error } = await supabase.storage
        .from('template-images')
        .remove([path]);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
        return;
      }

      toast.success('Média supprimé avec succès');
      // Recharger la liste des médias
      await loadUserMedia();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };
  
  const handleSaveAndQuit = () => {
    saveMutation.mutate(true);
    setLastSaved(new Date());
    setTimeout(() => {
      navigate("/campagnes");
    }, 500);
  };
  
  // Formater l'heure de dernière sauvegarde
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const hours = lastSaved.getHours().toString().padStart(2, "0");
    const minutes = lastSaved.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
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
      {/* Header style Brevo */}
      <div className="h-12 bg-[#f5f5f5] border-b border-gray-200 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Logo className="h-6 w-6" />
          <h1 className="text-sm font-medium text-foreground truncate">
            {formData.nom_campagne || "Nouvelle campagne"}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sélecteur de vue Desktop/Mobile */}
          <div className="flex items-center gap-1 border rounded-md p-1 bg-white">
            <Button
              variant={deviceView === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDeviceView("desktop")}
              className={`h-7 w-7 p-0 ${
                deviceView === "desktop" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-muted"
              }`}
              title="Vue desktop"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDeviceView("mobile")}
              className={`h-7 w-7 p-0 ${
                deviceView === "mobile" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-muted"
              }`}
              title="Vue mobile"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Dernière sauvegarde */}
          {lastSaved ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Dernière sauvegarde {formatLastSaved()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Non sauvegardé</span>
            </div>
          )}
          
          <Button 
            variant="ghost"
            onClick={handlePreviewAndTest}
            className="gap-2 h-8 text-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            Aperçu et test
          </Button>
          
          <Button 
            onClick={handleSaveAndQuit}
            disabled={saveMutation.isPending}
            className="gap-2 h-8 text-xs bg-foreground text-background hover:bg-foreground/90"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Enregistrer et quitter
          </Button>
        </div>
      </div>

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
                onClick={() => setSidebarIcon("sonia")}
                className={`flex flex-col items-center gap-1 p-3 transition-colors ${
                  sidebarIcon === "sonia"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title="Sonia"
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-[10px] font-medium">Sonia</span>
              </button>
            </div>

            {/* Zone de contenu */}
            <div className="flex-1 overflow-y-auto bg-white">
              {/* Panneau de propriétés GrapesJS - toujours présent dans le DOM */}
              <div 
                id="grapesjs-style-panel" 
                className={`${sidebarIcon === "style" ? "block" : "hidden"}`}
                style={{ position: sidebarIcon === "style" ? "relative" : "absolute", left: "-9999px" }}
              ></div>
              
              {sidebarIcon === "contenu" && sidebarTab === "blocs" && (
                <div className="p-4 space-y-4">
                  {/* Bouton pour choisir un template */}
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs h-9 gap-2 border-dashed"
                      onClick={() => setIsTemplateDialogOpen(true)}
                    >
                      <FileText className="h-4 w-4" />
                      Choisir un template
                    </Button>
                  </div>
                  
                  {/* Blocs disponibles */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-foreground">Blocs disponibles</h3>
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
                </div>
              )}
              
              {sidebarIcon === "style" && (
                <div className="p-4 space-y-4 overflow-y-auto">
                  {/* Bibliothèque de marques */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Bibliothèque de marques</h3>
                      <Badge className="bg-green-500 text-white text-xs">Nouveau</Badge>
                    </div>
                    
                    {/* Éléments de marque - 4 éléments */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="border rounded-lg p-2 bg-white flex items-center justify-center h-16 cursor-pointer hover:border-primary transition-colors">
                        <span className="text-xs font-semibold">Iddéco</span>
                      </div>
                      <div className="border rounded-lg p-2 bg-[#2d5016] flex items-center justify-center h-16 cursor-pointer hover:border-primary transition-colors"></div>
                      <div className="border rounded-lg p-2 bg-[#f5f0e8] flex items-center justify-center h-16 cursor-pointer hover:border-primary transition-colors"></div>
                      <div className="border rounded-lg p-2 bg-white flex items-center justify-center gap-1 h-16 cursor-pointer hover:border-primary transition-colors">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        <Instagram className="h-4 w-4 text-pink-600" />
                      </div>
                    </div>
                    
                    {/* Info box */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-purple-900">
                        Nouveaux éléments de marque disponibles
                      </p>
                    </div>
                    
                    {/* Boutons */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
                        Modifier
                      </Button>
                      <Button size="sm" className="flex-1 text-xs bg-foreground text-background h-8">
                        Appliquer les éléments
                      </Button>
                    </div>
                  </div>
                  
                  {/* Template - Section repliable */}
                  <div className="space-y-3 border-t pt-3">
                    <button 
                      onClick={() => setTemplateExpanded(!templateExpanded)}
                      className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span>Template</span>
                      {templateExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    
                    {templateExpanded && (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Couleur d'arrière-plan</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={templateStyles.backgroundColor}
                              onChange={(e) => setTemplateStyles({ ...templateStyles, backgroundColor: e.target.value })}
                              className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
                            />
                            <Input 
                              value={templateStyles.backgroundColor}
                              onChange={(e) => setTemplateStyles({ ...templateStyles, backgroundColor: e.target.value })}
                              className="h-8 text-xs flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Image d'arrière-plan</Label>
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-2">
                            <ImagePlus className="h-3.5 w-3.5" />
                            Ajouter une image
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Insérer image à partir d'une URL</Label>
                          <Input 
                            value={templateStyles.backgroundImageUrl}
                            onChange={(e) => setTemplateStyles({ ...templateStyles, backgroundImageUrl: e.target.value })}
                            placeholder="https://mydomain.com/myimage.png"
                            className="h-8 text-xs"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Couleur du corps</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded border-2 border-gray-300 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-[length:10px_10px] cursor-pointer"></div>
                            <Input 
                              value={templateStyles.bodyColor || ""}
                              onChange={(e) => setTemplateStyles({ ...templateStyles, bodyColor: e.target.value })}
                              placeholder="Transparent"
                              className="h-8 text-xs flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Largeur du corps</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-300"></div>
                            <div className="flex items-center gap-1 flex-1">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTemplateStyles({ ...templateStyles, bodyWidth: Math.max(300, templateStyles.bodyWidth - 10) })}>-</Button>
                              <Input 
                                type="number"
                                value={templateStyles.bodyWidth}
                                onChange={(e) => setTemplateStyles({ ...templateStyles, bodyWidth: parseInt(e.target.value) || 600 })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTemplateStyles({ ...templateStyles, bodyWidth: templateStyles.bodyWidth + 10 })}>+</Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Afficher dans le navigateur</Label>
                          <Switch 
                            checked={templateStyles.showInBrowser}
                            onCheckedChange={(checked) => setTemplateStyles({ ...templateStyles, showInBrowser: checked })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Apparence du texte - Section repliable */}
                  <div className="space-y-3 border-t pt-3">
                    <button 
                      onClick={() => setTextAppearanceExpanded(!textAppearanceExpanded)}
                      className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span>Apparence du texte</span>
                      {textAppearanceExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    
                    {textAppearanceExpanded && (
                      <div className="space-y-3 pt-2">
                        {/* Info box */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                          <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-purple-900">
                            Enregistrez les polices de votre marque pour créer des emails adaptés à votre image de marque encore plus rapidement.
                          </p>
                        </div>
                        
                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                          Enregistrer les polices
                        </Button>
                        
                        {/* Paragraphe */}
                        <div className="space-y-2 border-t pt-3">
                          <h4 className="text-xs font-semibold text-foreground">Paragraphe</h4>
                          <div className="space-y-2">
                            <Select value={textStyles.paragraph.font} onValueChange={(value) => setTextStyles({ ...textStyles, paragraph: { ...textStyles.paragraph, font: value } })}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="verdana">Verdana</SelectItem>
                                <SelectItem value="arial">Arial</SelectItem>
                                <SelectItem value="helvetica">Helvetica</SelectItem>
                                <SelectItem value="times">Times New Roman</SelectItem>
                                <SelectItem value="courier">Courier New</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, paragraph: { ...textStyles.paragraph, size: Math.max(8, textStyles.paragraph.size - 1) } })}>-</Button>
                              <Input 
                                type="number"
                                value={textStyles.paragraph.size}
                                onChange={(e) => setTextStyles({ ...textStyles, paragraph: { ...textStyles.paragraph, size: parseInt(e.target.value) || 15 } })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, paragraph: { ...textStyles.paragraph, size: textStyles.paragraph.size + 1 } })}>+</Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={textStyles.paragraph.color}
                                onChange={(e) => setTextStyles({ ...textStyles, paragraph: { ...textStyles.paragraph, color: e.target.value } })}
                                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                              />
                              <Input 
                                value={textStyles.paragraph.color}
                                onChange={(e) => setTextStyles({ ...textStyles, paragraph: { ...textStyles.paragraph, color: e.target.value } })}
                                className="h-8 text-xs flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Titre 1 */}
                        <div className="space-y-2 border-t pt-3">
                          <h4 className="text-xs font-semibold text-foreground">Titre 1</h4>
                          <div className="space-y-2">
                            <Select value={textStyles.title1.font} onValueChange={(value) => setTextStyles({ ...textStyles, title1: { ...textStyles.title1, font: value } })}>
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
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, title1: { ...textStyles.title1, size: Math.max(8, textStyles.title1.size - 1) } })}>-</Button>
                              <Input 
                                type="number"
                                value={textStyles.title1.size}
                                onChange={(e) => setTextStyles({ ...textStyles, title1: { ...textStyles.title1, size: parseInt(e.target.value) || 24 } })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, title1: { ...textStyles.title1, size: textStyles.title1.size + 1 } })}>+</Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={textStyles.title1.color}
                                onChange={(e) => setTextStyles({ ...textStyles, title1: { ...textStyles.title1, color: e.target.value } })}
                                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                              />
                              <Input 
                                value={textStyles.title1.color}
                                onChange={(e) => setTextStyles({ ...textStyles, title1: { ...textStyles.title1, color: e.target.value } })}
                                className="h-8 text-xs flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Titre 2 */}
                        <div className="space-y-2 border-t pt-3">
                          <h4 className="text-xs font-semibold text-foreground">Titre 2</h4>
                          <div className="space-y-2">
                            <Select value={textStyles.title2.font} onValueChange={(value) => setTextStyles({ ...textStyles, title2: { ...textStyles.title2, font: value } })}>
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
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, title2: { ...textStyles.title2, size: Math.max(8, textStyles.title2.size - 1) } })}>-</Button>
                              <Input 
                                type="number"
                                value={textStyles.title2.size}
                                onChange={(e) => setTextStyles({ ...textStyles, title2: { ...textStyles.title2, size: parseInt(e.target.value) || 24 } })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, title2: { ...textStyles.title2, size: textStyles.title2.size + 1 } })}>+</Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={textStyles.title2.color}
                                onChange={(e) => setTextStyles({ ...textStyles, title2: { ...textStyles.title2, color: e.target.value } })}
                                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                              />
                              <Input 
                                value={textStyles.title2.color}
                                onChange={(e) => setTextStyles({ ...textStyles, title2: { ...textStyles.title2, color: e.target.value } })}
                                className="h-8 text-xs flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Titre 3 */}
                        <div className="space-y-2 border-t pt-3">
                          <h4 className="text-xs font-semibold text-foreground">Titre 3</h4>
                          <div className="space-y-2">
                            <Select value={textStyles.title3.font} onValueChange={(value) => setTextStyles({ ...textStyles, title3: { ...textStyles.title3, font: value } })}>
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
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, title3: { ...textStyles.title3, size: Math.max(8, textStyles.title3.size - 1) } })}>-</Button>
                              <Input 
                                type="number"
                                value={textStyles.title3.size}
                                onChange={(e) => setTextStyles({ ...textStyles, title3: { ...textStyles.title3, size: parseInt(e.target.value) || 16 } })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, title3: { ...textStyles.title3, size: textStyles.title3.size + 1 } })}>+</Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={textStyles.title3.color}
                                onChange={(e) => setTextStyles({ ...textStyles, title3: { ...textStyles.title3, color: e.target.value } })}
                                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                              />
                              <Input 
                                value={textStyles.title3.color}
                                onChange={(e) => setTextStyles({ ...textStyles, title3: { ...textStyles.title3, color: e.target.value } })}
                                className="h-8 text-xs flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Titre 4 */}
                        <div className="space-y-2 border-t pt-3">
                          <h4 className="text-xs font-semibold text-foreground">Titre 4</h4>
                          <div className="space-y-2">
                            <Select value={textStyles.title4.font} onValueChange={(value) => setTextStyles({ ...textStyles, title4: { ...textStyles.title4, font: value } })}>
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
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, title4: { ...textStyles.title4, size: Math.max(8, textStyles.title4.size - 1) } })}>-</Button>
                              <Input 
                                type="number"
                                value={textStyles.title4.size}
                                onChange={(e) => setTextStyles({ ...textStyles, title4: { ...textStyles.title4, size: parseInt(e.target.value) || 12 } })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setTextStyles({ ...textStyles, title4: { ...textStyles.title4, size: textStyles.title4.size + 1 } })}>+</Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={textStyles.title4.color}
                                onChange={(e) => setTextStyles({ ...textStyles, title4: { ...textStyles.title4, color: e.target.value } })}
                                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                              />
                              <Input 
                                value={textStyles.title4.color}
                                onChange={(e) => setTextStyles({ ...textStyles, title4: { ...textStyles.title4, color: e.target.value } })}
                                className="h-8 text-xs flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Polices Web */}
                        <div className="border-t pt-3">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-2">
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter des polices
                          </Button>
                        </div>
                        
                        {/* Apparence du lien */}
                        <div className="space-y-2 border-t pt-3">
                          <h4 className="text-xs font-semibold text-foreground">Apparence du lien</h4>
                          <div className="flex items-center gap-2">
                            <Toggle
                              pressed={textStyles.link.bold}
                              onPressedChange={(pressed) => setTextStyles({ ...textStyles, link: { ...textStyles.link, bold: pressed } })}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Bold className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                              pressed={textStyles.link.italic}
                              onPressedChange={(pressed) => setTextStyles({ ...textStyles, link: { ...textStyles.link, italic: pressed } })}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Italic className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                              pressed={textStyles.link.underline}
                              onPressedChange={(pressed) => setTextStyles({ ...textStyles, link: { ...textStyles.link, underline: pressed } })}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Underline className="h-4 w-4" />
                            </Toggle>
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="color"
                                value={textStyles.link.color}
                                onChange={(e) => setTextStyles({ ...textStyles, link: { ...textStyles.link, color: e.target.value } })}
                                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                              />
                              <Input 
                                value={textStyles.link.color}
                                onChange={(e) => setTextStyles({ ...textStyles, link: { ...textStyles.link, color: e.target.value } })}
                                className="h-8 text-xs flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Interlignage */}
                        <div className="space-y-2 border-t pt-3">
                          <h4 className="text-xs font-semibold text-foreground">Interlignage</h4>
                          <div className="flex items-center gap-2">
                            <Toggle
                              pressed={textStyles.lineSpacing === "left"}
                              onPressedChange={() => setTextStyles({ ...textStyles, lineSpacing: "left" })}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <AlignLeft className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                              pressed={textStyles.lineSpacing === "center"}
                              onPressedChange={() => setTextStyles({ ...textStyles, lineSpacing: "center" })}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <AlignCenter className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                              pressed={textStyles.lineSpacing === "right"}
                              onPressedChange={() => setTextStyles({ ...textStyles, lineSpacing: "right" })}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <AlignRight className="h-4 w-4" />
                            </Toggle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Sens d'écriture */}
                        <div className="space-y-2 border-t pt-3">
                          <h4 className="text-xs font-semibold text-foreground">Sens d'écriture</h4>
                          <div className="flex items-center gap-2">
                            <Toggle
                              pressed={textStyles.writingDirection === "ltr"}
                              onPressedChange={() => setTextStyles({ ...textStyles, writingDirection: "ltr" })}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Toggle>
                            <Toggle
                              pressed={textStyles.writingDirection === "rtl"}
                              onPressedChange={() => setTextStyles({ ...textStyles, writingDirection: "rtl" })}
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Toggle>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Boutons - Section repliable */}
                  <div className="space-y-3 border-t pt-3">
                    <button 
                      onClick={() => setButtonsExpanded(!buttonsExpanded)}
                      className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span>Boutons</span>
                      {buttonsExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    
                    {buttonsExpanded && (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Police</Label>
                          <Select value={buttonStyles.font} onValueChange={(value) => setButtonStyles({ ...buttonStyles, font: value })}>
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
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setButtonStyles({ ...buttonStyles, size: Math.max(8, buttonStyles.size - 1) })}>-</Button>
                            <Input 
                              type="number"
                              value={buttonStyles.size}
                              onChange={(e) => setButtonStyles({ ...buttonStyles, size: parseInt(e.target.value) || 16 })}
                              className="h-8 text-xs text-center flex-1"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setButtonStyles({ ...buttonStyles, size: buttonStyles.size + 1 })}>+</Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={buttonStyles.color}
                              onChange={(e) => setButtonStyles({ ...buttonStyles, color: e.target.value })}
                              className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                            />
                            <Input 
                              value={buttonStyles.color}
                              onChange={(e) => setButtonStyles({ ...buttonStyles, color: e.target.value })}
                              className="h-8 text-xs flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Toggle
                            pressed={buttonStyles.bold}
                            onPressedChange={(pressed) => setButtonStyles({ ...buttonStyles, bold: pressed })}
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Bold className="h-4 w-4" />
                          </Toggle>
                          <Toggle
                            pressed={buttonStyles.italic}
                            onPressedChange={(pressed) => setButtonStyles({ ...buttonStyles, italic: pressed })}
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Italic className="h-4 w-4" />
                          </Toggle>
                          <Toggle
                            pressed={buttonStyles.underline}
                            onPressedChange={(pressed) => setButtonStyles({ ...buttonStyles, underline: pressed })}
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Underline className="h-4 w-4" />
                          </Toggle>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Largeur</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-300"></div>
                            <div className="flex items-center gap-1 flex-1">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setButtonStyles({ ...buttonStyles, width: Math.max(50, buttonStyles.width - 10) })}>-</Button>
                              <Input 
                                type="number"
                                value={buttonStyles.width}
                                onChange={(e) => setButtonStyles({ ...buttonStyles, width: parseInt(e.target.value) || 209 })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setButtonStyles({ ...buttonStyles, width: buttonStyles.width + 10 })}>+</Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Arrondi du bouton</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-300 rounded"></div>
                            <div className="flex items-center gap-1 flex-1">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setButtonStyles({ ...buttonStyles, borderRadius: Math.max(0, buttonStyles.borderRadius - 5) })}>-</Button>
                              <Input 
                                type="number"
                                value={buttonStyles.borderRadius}
                                onChange={(e) => setButtonStyles({ ...buttonStyles, borderRadius: parseInt(e.target.value) || 30 })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setButtonStyles({ ...buttonStyles, borderRadius: buttonStyles.borderRadius + 5 })}>+</Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Couleur de fond</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={buttonStyles.backgroundColor}
                              onChange={(e) => setButtonStyles({ ...buttonStyles, backgroundColor: e.target.value })}
                              className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                            />
                            <Input 
                              value={buttonStyles.backgroundColor}
                              onChange={(e) => setButtonStyles({ ...buttonStyles, backgroundColor: e.target.value })}
                              className="h-8 text-xs flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Bordures</Label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 flex-1">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setButtonStyles({ ...buttonStyles, borderWidth: Math.max(0, buttonStyles.borderWidth - 1) })}>-</Button>
                              <Input 
                                type="number"
                                value={buttonStyles.borderWidth}
                                onChange={(e) => setButtonStyles({ ...buttonStyles, borderWidth: parseInt(e.target.value) || 1 })}
                                className="h-8 text-xs text-center flex-1"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setButtonStyles({ ...buttonStyles, borderWidth: buttonStyles.borderWidth + 1 })}>+</Button>
                            </div>
                            <input
                              type="color"
                              value={buttonStyles.borderColor}
                              onChange={(e) => setButtonStyles({ ...buttonStyles, borderColor: e.target.value })}
                              className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                            />
                            <Input 
                              value={buttonStyles.borderColor}
                              onChange={(e) => setButtonStyles({ ...buttonStyles, borderColor: e.target.value })}
                              className="h-8 text-xs flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {sidebarIcon === "sonia" && (
                <div className="p-4">
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Assistant Sonia - Bientôt disponible
                  </div>
                </div>
              )}
              
              {sidebarTab === "sections" && (
                <div className="p-4 space-y-4 overflow-y-auto">
                  {/* Carte d'instructions */}
                  <div className="bg-muted/50 rounded-lg p-4 border border-border relative">
                    <button
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {}}
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                    <div className="flex items-start gap-3 pr-6">
                      <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <p>
                          Glissez et déposez des sections prédéfinies sur votre canevas en tant que nouvelle ligne.{" "}
                          <span className="font-semibold underline">Personnalisez en ajoutant de nouveaux blocs.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section Textes et images */}
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors">
                      <span>Textes et images</span>
                      <ChevronUp className="h-4 w-4" />
                    </button>

                    <div className="space-y-3">
                      {/* Section 1: Image pleine largeur avec texte */}
                      <div
                        className="bg-white border rounded-lg overflow-hidden cursor-move hover:border-primary hover:shadow-md transition-all group"
                        draggable
                        onDragStart={(e) => {
                          const sectionHtml = `
                            <div data-gjs-type="section" style="padding: 0; background: #ffffff;">
                              <div data-gjs-type="column" style="width: 100%; padding: 0;">
                                <div style="position: relative; width: 100%;">
                                  <img src="https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=800" alt="Image" style="width: 100%; height: 400px; object-fit: cover; display: block;" />
                                  <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); padding: 40px; text-align: center;">
                                    <h2 data-gjs-type="text" style="color: white; font-size: 32px; font-weight: 700; margin: 0 0 16px 0;">Some title here</h2>
                                    <p data-gjs-type="text" style="color: white; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.</p>
                                    <a href="#" data-gjs-type="link" style="display: inline-block; background: #333333; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Call to action</a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `;
                          e.dataTransfer.setData("text/html", sectionHtml);
                          e.dataTransfer.setData("section-type", "full-image-text");
                        }}
                      >
                        <div className="relative">
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="aspect-[4/3] bg-gradient-to-br from-green-50 to-green-100 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center p-4">
                              <div className="text-center space-y-2 w-full">
                                <div className="w-full h-32 bg-green-200 rounded mb-2"></div>
                                <h3 className="font-bold text-sm">Some title here</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2">Lorem ipsum dolor sit amet...</p>
                                <div className="mt-2">
                                  <div className="inline-block bg-gray-800 text-white text-xs px-3 py-1.5 rounded">Call to action</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Deux colonnes - Image gauche, texte droite */}
                      <div
                        className="bg-white border rounded-lg overflow-hidden cursor-move hover:border-primary hover:shadow-md transition-all group"
                        draggable
                        onDragStart={(e) => {
                          const sectionHtml = `
                            <div data-gjs-type="section" style="padding: 20px; background: #ffffff;">
                              <div data-gjs-type="row" style="display: flex; gap: 20px;">
                                <div data-gjs-type="column" style="flex: 1; padding: 0;">
                                  <img src="https://images.unsplash.com/photo-1597848212624-e593b4b65c5a?w=400" alt="Image" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;" />
                                </div>
                                <div data-gjs-type="column" style="flex: 1; padding: 0;">
                                  <div style="padding: 20px;">
                                    <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">New!</span>
                                    <h2 data-gjs-type="text" style="font-size: 24px; font-weight: 700; margin: 12px 0 8px 0;">Some title here</h2>
                                    <p data-gjs-type="text" style="font-size: 18px; font-weight: 600; color: #333; margin: 0 0 12px 0;">From 20€</p>
                                    <p data-gjs-type="text" style="font-size: 14px; line-height: 1.6; color: #666; margin: 0 0 20px 0;">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna erat.</p>
                                    <a href="#" data-gjs-type="link" style="display: inline-block; background: #333333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Call to action</a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `;
                          e.dataTransfer.setData("text/html", sectionHtml);
                          e.dataTransfer.setData("section-type", "two-column-image-text");
                        }}
                      >
                        <div className="relative">
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="p-3">
                            <div className="flex gap-3">
                              <div className="w-24 h-24 bg-orange-200 rounded flex-shrink-0"></div>
                              <div className="flex-1 space-y-1">
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-semibold">New!</span>
                                <h3 className="font-bold text-sm">Some title here</h3>
                                <p className="text-xs font-semibold text-foreground">From 20€</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">Lorem ipsum dolor sit amet...</p>
                                <div className="mt-1">
                                  <div className="inline-block bg-gray-800 text-white text-xs px-2 py-1 rounded">Call to action</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Deux colonnes avec prix barré */}
                      <div
                        className="bg-white border rounded-lg overflow-hidden cursor-move hover:border-primary hover:shadow-md transition-all group"
                        draggable
                        onDragStart={(e) => {
                          const sectionHtml = `
                            <div data-gjs-type="section" style="padding: 20px; background: #ffffff;">
                              <div data-gjs-type="row" style="display: flex; gap: 20px;">
                                <div data-gjs-type="column" style="flex: 1; padding: 0;">
                                  <img src="https://images.unsplash.com/photo-1597848212624-e593b4b65c5a?w=400" alt="Image" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;" />
                                </div>
                                <div data-gjs-type="column" style="flex: 1; padding: 0;">
                                  <div style="padding: 20px;">
                                    <h2 data-gjs-type="text" style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">Some title here</h2>
                                    <div style="margin: 0 0 12px 0;">
                                      <span style="text-decoration: line-through; color: #999; font-size: 18px; margin-right: 8px;">49,90€</span>
                                      <span style="font-size: 24px; font-weight: 700; color: #333;">39,99€</span>
                                    </div>
                                    <p data-gjs-type="text" style="font-size: 14px; line-height: 1.6; color: #666; margin: 0 0 20px 0;">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore.</p>
                                    <a href="#" data-gjs-type="link" style="display: inline-block; background: #333333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Call to action</a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `;
                          e.dataTransfer.setData("text/html", sectionHtml);
                          e.dataTransfer.setData("section-type", "two-column-discount");
                        }}
                      >
                        <div className="relative">
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="p-3">
                            <div className="flex gap-3">
                              <div className="w-24 h-24 bg-pink-200 rounded flex-shrink-0"></div>
                              <div className="flex-1 space-y-1">
                                <h3 className="font-bold text-sm">Some title here</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs line-through text-muted-foreground">49,90€</span>
                                  <span className="text-sm font-bold text-foreground">39,99€</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">Lorem ipsum dolor sit amet...</p>
                                <div className="mt-1">
                                  <div className="inline-block bg-gray-800 text-white text-xs px-2 py-1 rounded">Call to action</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Trois colonnes */}
                      <div
                        className="bg-white border rounded-lg overflow-hidden cursor-move hover:border-primary hover:shadow-md transition-all group"
                        draggable
                        onDragStart={(e) => {
                          const sectionHtml = `
                            <div data-gjs-type="section" style="padding: 20px; background: #ffffff;">
                              <div data-gjs-type="row" style="display: flex; gap: 15px;">
                                <div data-gjs-type="column" style="flex: 1; padding: 0;">
                                  <img src="https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=300" alt="Image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" />
                                  <h3 data-gjs-type="text" style="font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Some title here</h3>
                                  <p data-gjs-type="text" style="font-size: 14px; line-height: 1.6; color: #666; margin: 0 0 12px 0;">Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</p>
                                  <a href="#" data-gjs-type="link" style="display: inline-block; background: #333333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Call to action</a>
                                </div>
                                <div data-gjs-type="column" style="flex: 1; padding: 0;">
                                  <img src="https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=300" alt="Image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" />
                                  <h3 data-gjs-type="text" style="font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Some title here</h3>
                                  <p data-gjs-type="text" style="font-size: 14px; line-height: 1.6; color: #666; margin: 0 0 12px 0;">Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</p>
                                  <a href="#" data-gjs-type="link" style="display: inline-block; background: #333333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Call to action</a>
                                </div>
                                <div data-gjs-type="column" style="flex: 1; padding: 0;">
                                  <img src="https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=300" alt="Image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" />
                                  <h3 data-gjs-type="text" style="font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Some title here</h3>
                                  <p data-gjs-type="text" style="font-size: 14px; line-height: 1.6; color: #666; margin: 0 0 12px 0;">Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</p>
                                  <a href="#" data-gjs-type="link" style="display: inline-block; background: #333333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Call to action</a>
                                </div>
                              </div>
                            </div>
                          `;
                          e.dataTransfer.setData("text/html", sectionHtml);
                          e.dataTransfer.setData("section-type", "three-column");
                        }}
                      >
                        <div className="relative">
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="p-3">
                            <div className="flex gap-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex-1 space-y-1">
                                  <div className="w-full h-16 bg-green-200 rounded mb-1"></div>
                                  <h3 className="font-bold text-xs">Some title here</h3>
                                  <p className="text-xs text-muted-foreground line-clamp-2">Lorem ipsum dolor...</p>
                                  <div className="mt-1">
                                    <div className="inline-block bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded">Call to action</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Image pleine largeur avec overlay */}
                      <div
                        className="bg-white border rounded-lg overflow-hidden cursor-move hover:border-primary hover:shadow-md transition-all group"
                        draggable
                        onDragStart={(e) => {
                          const sectionHtml = `
                            <div data-gjs-type="section" style="padding: 0; background: #ffffff;">
                              <div data-gjs-type="column" style="width: 100%; padding: 0;">
                                <div style="position: relative; width: 100%;">
                                  <img src="https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=800" alt="Image" style="width: 100%; height: 400px; object-fit: cover; display: block;" />
                                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 80%;">
                                    <h2 data-gjs-type="text" style="color: white; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Some title here</h2>
                                    <p data-gjs-type="text" style="color: white; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.</p>
                                    <a href="#" data-gjs-type="link" style="display: inline-block; background: white; color: #333333; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Call to action</a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `;
                          e.dataTransfer.setData("text/html", sectionHtml);
                          e.dataTransfer.setData("section-type", "full-image-overlay");
                        }}
                      >
                        <div className="relative">
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="aspect-[4/3] bg-gradient-to-br from-green-600 to-green-800 overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <div className="text-center space-y-2">
                                <h3 className="font-bold text-sm text-white">Some title here</h3>
                                <p className="text-xs text-white/90 line-clamp-2">Lorem ipsum dolor sit amet...</p>
                                <div className="mt-2">
                                  <div className="inline-block bg-white text-gray-800 text-xs px-3 py-1.5 rounded">Call to action</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {sidebarTab === "enregistres" && (
                <div className="p-4 space-y-4 overflow-y-auto">
                  {/* Bouton de téléchargement */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => mediaInputRef.current?.click()}
                      disabled={isUploadingMedia}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      {isUploadingMedia ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4" />
                          Télécharger des médias
                        </>
                      )}
                    </Button>
                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleMediaUpload}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Formats supportés : Images (JPG, PNG, GIF, WebP) et Vidéos (MP4, WebM)
                    </p>
                  </div>

                  {/* Liste des médias */}
                  {isLoadingMedia ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : uploadedMedia.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Médias téléchargés ({uploadedMedia.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {uploadedMedia.map((media, index) => (
                          <div
                            key={`${media.path}-${index}`}
                            className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors bg-muted/30"
                          >
                            {media.type === 'image' ? (
                              <img
                                src={media.url}
                                alt={media.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => handleInsertMedia(media)}
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center bg-muted cursor-pointer"
                                onClick={() => handleInsertMedia(media)}
                              >
                                <Play className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            {/* Overlay au survol */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <div className="text-center text-white">
                                <p className="text-xs font-medium mb-1 truncate px-2">{media.name}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {media.type === 'image' ? 'Image' : 'Vidéo'}
                                </Badge>
                              </div>
                            </div>
                            {/* Bouton supprimer - toujours visible */}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 bg-destructive/90 hover:bg-destructive shadow-md z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMedia(media.path);
                              }}
                              title="Supprimer"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {/* Nom du fichier en bas */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <p className="text-xs text-white truncate font-medium">{media.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-4 rounded-lg bg-muted/50 inline-block mb-3">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Aucun média téléchargé
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Téléchargez vos images et vidéos pour les utiliser dans vos emails
                      </p>
                    </div>
                  )}
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
                key={htmlContent ? `editor-${htmlContent.substring(0, 50)}` : 'editor-empty'}
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

      {/* Dialog Sélection Template - Style Brevo */}
      <Dialog 
        open={isTemplateDialogOpen} 
        onOpenChange={(open) => {
          // Empêcher la fermeture si on n'a pas encore de contenu en mode création
          if (!open && !isEditMode && !htmlContent) {
            // Rediriger vers la liste des campagnes si l'utilisateur veut fermer
            if (confirm("Voulez-vous vraiment quitter sans sélectionner de template ?")) {
              navigate("/campagnes");
            }
          } else {
            setIsTemplateDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
          {/* Header */}
          <div className="px-8 py-6 border-b bg-gradient-to-r from-card to-card/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Créer un email</DialogTitle>
                <DialogDescription className="mt-1.5">
                  Choisissez un template ou créez-en un nouveau
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTemplateDialogOpen(false)}
                className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar gauche - Catégories */}
            <div className="w-72 border-r bg-muted/30 p-6 space-y-6 overflow-y-auto">
              {/* Bouton créer depuis zéro */}
              <div>
                <Button 
                  onClick={() => {
                    setIsTemplateDialogOpen(false);
                  }}
                  className="w-full justify-between bg-foreground text-background hover:bg-foreground/90 h-12 font-semibold shadow-lg"
                  size="lg"
                >
                  <span>Créer à partir de zéro</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  Commencez avec un template vide
                </p>
              </div>

              <div className="space-y-5">
                {/* Vos emails */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider px-2">
                    Vos emails
                  </h3>
                  <div className="space-y-1">
                    <button
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all bg-primary text-primary-foreground shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4" />
                        Templates enregistrés
                      </div>
                      {templates && (
                        <span className="text-xs opacity-90 ml-7 block mt-1">
                          {templates.length} template{templates.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone principale - Liste des templates */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              <div className="px-8 py-6 border-b bg-card/50">
                <div className="mb-5">
                  <h3 className="text-xl font-bold mb-2">
                    Tous les templates enregistrés
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Commencez à créer votre email à l'aide d'un template précédemment enregistré.
                  </p>
                </div>
              </div>

              {/* Grille de templates */}
              <div className="flex-1 overflow-y-auto p-8">
                {templates && templates.length > 0 ? (
                  <div className="grid grid-cols-3 gap-6">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleLoadTemplate(template.id)}
                        className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden bg-card rounded-lg"
                      >
                        {/* Preview */}
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
                          {template.thumbnail_url ? (
                            <img
                              src={template.thumbnail_url}
                              alt={template.nom}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                                  <Mail className="h-10 w-10 text-primary" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
                                  Aperçu non disponible
                                </p>
                              </div>
                            </div>
                          )}
                          {/* Overlay au survol */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-2 shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadTemplate(template.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Utiliser
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Badge ID */}
                          <div className="absolute top-4 left-4">
                            <Badge variant="secondary" className="text-xs font-mono bg-black/50 text-white border-0">
                              #{template.id.slice(0, 8)}
                            </Badge>
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-6 space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                              {template.nom}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.description || "Pas de description"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <Badge variant="outline" className="text-xs">
                              {template.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(template.updated_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="p-5 rounded-2xl bg-primary/10 mb-6">
                      <FileText className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">
                      Aucun template enregistré
                    </p>
                    <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                      Créez votre premier template pour commencer à envoyer des emails professionnels
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          setIsTemplateDialogOpen(false);
                        }} 
                        size="lg" 
                        className="gap-2"
                      >
                        Créer depuis zéro
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsTemplateDialogOpen(false);
                          navigate("/templates");
                        }} 
                        variant="outline" 
                        size="lg" 
                        className="gap-2"
                      >
                        Aller aux templates
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NouvelleCampagne;
