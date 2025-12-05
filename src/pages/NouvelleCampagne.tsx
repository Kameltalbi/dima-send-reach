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
  X as XIcon,
  RectangleHorizontal,
  Folder
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  
  // Récupérer le paramètre template de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const templateIdFromUrl = urlParams.get('template');
  const { quota, canSendEmails } = useEmailQuota();
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const getCurrentHtmlRef = useRef<(() => string) | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"blocs" | "sections" | "enregistres">("blocs");
  const [sidebarIcon, setSidebarIcon] = useState<"contenu" | "bibliotheque" | "sonia">("contenu");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isInitialConfigDone, setIsInitialConfigDone] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ name: string; url: string; type: 'image' | 'video'; path: string }>>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [savedSections, setSavedSections] = useState<Array<{ id: string; nom: string; description: string | null; html_content: string; category: string; created_at: string }>>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isSaveSectionDialogOpen, setIsSaveSectionDialogOpen] = useState(false);
  const [sectionToSave, setSectionToSave] = useState<{ html: string; name: string; description: string; category: string } | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const mediaLibraryInputRef = useRef<HTMLInputElement>(null);
  const [selectedTextComponent, setSelectedTextComponent] = useState<boolean>(false);
  const selectedComponentRef = useRef<any>(null);
  const [textStyles, setTextStyles] = useState({
    fontFamily: 'Arial',
    fontSize: '14px',
    color: '#000000',
    textAlign: 'left',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    lineHeight: '1.5',
  });
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const mediaSelectCallbackRef = useRef<((url: string) => void) | null>(null);
  const [mediaLibraryTab, setMediaLibraryTab] = useState<'mes-fichiers' | 'images-libres' | 'images-gif'>('mes-fichiers');
  const [freeImages, setFreeImages] = useState<Array<{ id: string; url: string; thumbnail: string; author: string }>>([]);
  const [gifImages, setGifImages] = useState<Array<{ id: string; url: string; thumbnail: string; title: string }>>([]);
  const [isLoadingFreeImages, setIsLoadingFreeImages] = useState(false);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [freeImagesSearch, setFreeImagesSearch] = useState('');
  const [gifSearch, setGifSearch] = useState('');
  const [selectedMediaPaths, setSelectedMediaPaths] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  
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

  // États pour le test A/B
  const [isAbTestEnabled, setIsAbTestEnabled] = useState(false);
  const [abTestType, setAbTestType] = useState<"subject" | "content" | "both">("subject");
  const [abTestPercentage, setAbTestPercentage] = useState(20);
  const [abTestDuration, setAbTestDuration] = useState(24);
  const [abVariants, setAbVariants] = useState([
    { name: "A", sujet: "", html: "" },
    { name: "B", sujet: "", html: "" },
  ]);

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
      if (existingCampaign.created_at) {
        setLastSaved(new Date(existingCampaign.created_at));
      }
      // Marquer la configuration comme faite pour les campagnes existantes
      setIsInitialConfigDone(true);
    }
  }, [existingCampaign]);

  // Charger le template depuis l'URL si présent
  useEffect(() => {
    if (templateIdFromUrl && templates && templates.length > 0 && !htmlContent) {
      const template = templates.find((t) => t.id === templateIdFromUrl);
      if (template && template.content_html) {
        setHtmlContent(template.content_html);
        setHasUnsavedChanges(true);
        toast.success(`Template "${template.nom}" chargé avec succès`);
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
        // Attendre que le state soit mis à jour avant de forcer le remontage
        setTimeout(() => {
          setEditorVersion(v => v + 1);
        }, 100);
      }
    }
  }, [templateIdFromUrl, templates, htmlContent]);


  // Ouvrir automatiquement le dialog de configuration en mode création
  useEffect(() => {
    if (!isEditMode && !existingCampaign && templates !== undefined && !isLoadingCampaign && !isInitialConfigDone) {
      // Ouvrir le dialog de configuration au lieu du template
      if (!htmlContent && !templateIdFromUrl) {
        setIsSettingsOpen(true);
      }
    }
  }, [isEditMode, existingCampaign, templates, isLoadingCampaign, htmlContent, isInitialConfigDone, templateIdFromUrl]);

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
        // Attendre que le state soit mis à jour avant de forcer le remontage
        setTimeout(() => {
          setEditorVersion(v => v + 1);
        }, 100);
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
      // Forcer la sauvegarde du contenu de l'éditeur avant de sauvegarder la campagne
      let currentHtml = htmlContent;
      
      if (getCurrentHtmlRef.current) {
        try {
          const editorHtml = getCurrentHtmlRef.current();
          if (editorHtml && editorHtml.trim()) {
            currentHtml = editorHtml;
            setHtmlContent(editorHtml);
            console.log("Contenu HTML récupéré depuis l'éditeur avant sauvegarde, longueur:", editorHtml.length);
          } else {
            console.warn("getCurrentHtmlRef retourne un contenu vide");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du HTML:", error);
        }
      } else {
        console.warn("getCurrentHtmlRef.current est null, utilisation de htmlContent");
      }

      // Attendre un peu pour s'assurer que le state est mis à jour
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!formData.nom_campagne.trim()) {
        throw new Error("Veuillez saisir un nom pour la campagne");
      }

      if (!isDraft) {
        if (!formData.sujet_email || !formData.expediteur_nom || !formData.expediteur_email) {
          throw new Error("Veuillez remplir tous les champs obligatoires");
        }

        // Utiliser le contenu récupéré directement depuis l'éditeur si disponible
        const contentToSave = currentHtml || htmlContent;
        if (!contentToSave || !contentToSave.trim()) {
          throw new Error("Veuillez créer ou sélectionner un contenu pour votre email");
        }
        console.log("Contenu à sauvegarder, longueur:", contentToSave.length);

        if (!formData.list_id) {
          throw new Error("Veuillez sélectionner une liste de contacts");
        }

        // Validation pour le test A/B
        if (isAbTestEnabled) {
          if (abVariants.some(v => !v.sujet.trim() && (abTestType === "subject" || abTestType === "both"))) {
            throw new Error("Veuillez remplir les sujets de toutes les variantes");
          }
          if (abVariants.some(v => !v.html.trim() && (abTestType === "content" || abTestType === "both"))) {
            throw new Error("Veuillez créer le contenu de toutes les variantes");
          }
        }
      }

      let dateEnvoi = null;
      if (formData.whenToSend === "schedule" && formData.scheduledDate && formData.scheduledTime) {
        dateEnvoi = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      } else if (!isDraft && formData.whenToSend === "now") {
        dateEnvoi = new Date().toISOString();
      }

      const campaignData: any = {
        user_id: user?.id,
        nom_campagne: formData.nom_campagne || "Campagne sans nom",
        sujet_email: formData.sujet_email || "",
        expediteur_nom: formData.expediteur_nom || "",
        expediteur_email: formData.expediteur_email || user?.email || "",
        list_id: formData.list_id === "all" ? null : (formData.list_id || null),
        html_contenu: currentHtml || htmlContent || null,
        statut: isDraft ? "brouillon" : formData.whenToSend === "now" ? "en_cours" : "en_attente",
        date_envoi: dateEnvoi,
      };
      
      console.log("Données de campagne à sauvegarder:", {
        nom: campaignData.nom_campagne,
        htmlLength: campaignData.html_contenu ? campaignData.html_contenu.length : 0,
        statut: campaignData.statut
      });

      // Ajouter les champs A/B si activé
      if (isAbTestEnabled) {
        campaignData.is_ab_test = true;
        campaignData.ab_test_type = abTestType;
        campaignData.ab_test_percentage = abTestPercentage;
        campaignData.ab_test_duration_hours = abTestDuration;
        campaignData.ab_test_status = isDraft ? null : "testing";
        if (!isDraft && formData.whenToSend === "now") {
          campaignData.ab_test_started_at = new Date().toISOString();
        }
      }

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

      // Note: A/B test functionality uses ab_tests table directly, not campaign_variants

      if (!isDraft && data) {
        await createRecipients(data.id, isAbTestEnabled);
        
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
      console.log("Campagne sauvegardée avec succès:", {
        id: data?.id,
        nom: data?.nom_campagne,
        htmlLength: data?.html_contenu ? data.html_contenu.length : 0
      });
      
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      
      // Mettre à jour htmlContent avec le contenu sauvegardé
      if (data?.html_contenu) {
        setHtmlContent(data.html_contenu);
      }
      
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
  const createRecipients = async (campaignId: string, isAbTest: boolean = false) => {
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
      let recipients: any[] = [];

      // Assign all contacts to campaign (A/B test variants stored in ab_tests table)
      recipients = contacts.map((contact) => ({
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

      const promises = emails.map(async (email) => {
        try {
          const result = await supabase.functions.invoke("send-email", {
            body: {
              testEmail: {
                to: email,
                subject: `[TEST] ${formData.sujet_email}`,
                html: htmlContent,
                fromName: formData.expediteur_nom,
                fromEmail: formData.expediteur_email,
              },
            },
          });

          // Vérifier les erreurs de l'invocation Supabase
          if (result.error) {
            console.error(`Erreur Supabase pour ${email}:`, result.error);
            
            // Essayer d'extraire le message d'erreur de différentes sources
            let errorMessage = "Erreur inconnue";
            
            // 1. Vérifier si result.data contient l'erreur (edge function renvoie 200 avec success: false)
            if (result.data && typeof result.data === 'object') {
              if (result.data.error) {
                errorMessage = result.data.error;
              } else if (result.data.message) {
                errorMessage = result.data.message;
              }
            }
            
            // 2. Si toujours pas d'erreur, essayer context (pour les erreurs HTTP)
            if (errorMessage === "Erreur inconnue" && result.error.context) {
              try {
                const errorContext = typeof result.error.context === 'string' 
                  ? JSON.parse(result.error.context) 
                  : result.error.context;
                if (errorContext?.error) {
                  errorMessage = errorContext.error;
                } else if (errorContext?.message) {
                  errorMessage = errorContext.message;
                }
              } catch (e) {
                // Ignorer si on ne peut pas parser
              }
            }
            
            // 3. Si toujours pas, utiliser le message d'erreur brut mais le reformuler
            if (errorMessage === "Erreur inconnue") {
              const rawMessage = result.error.message || "";
              if (rawMessage.includes("non-2xx")) {
                // Erreur générique Supabase - essayer de lire le body directement
                errorMessage = "Le domaine de l'expéditeur n'est pas vérifié. Veuillez utiliser un domaine configuré dans Resend.";
              } else {
                errorMessage = rawMessage || "Erreur lors de l'envoi";
              }
            }
            
            // Simplifier les messages d'erreur Resend pour l'utilisateur
            if (errorMessage.includes("domain is not verified")) {
              const domainMatch = errorMessage.match(/The ([^\s]+) domain is not verified/);
              const domain = domainMatch ? domainMatch[1] : "de l'expéditeur";
              errorMessage = `Le domaine "${domain}" n'est pas vérifié dans Resend. Utilisez un domaine que vous avez configuré.`;
            }
            
            return {
              success: false,
              email,
              error: errorMessage,
            };
          }

          // Vérifier la réponse de la fonction Edge
          if (result.data) {
            // Si la fonction retourne success: false, c'est une erreur métier
            if (result.data.success === false) {
              console.error(`Échec pour ${email}:`, result.data);
              return {
                success: false,
                email,
                error: result.data.message || result.data.error || "Erreur inconnue",
              };
            }
            
            // Si success est true, c'est bon
            if (result.data.success === true) {
              return { success: true, email };
            }
            
            // Si la réponse contient un champ "error", c'est une erreur
            if (result.data.error) {
              return {
                success: false,
                email,
                error: result.data.error,
              };
            }
          }

          // Si on arrive ici, la réponse n'est pas dans le format attendu
          console.error(`Réponse inattendue pour ${email}:`, result);
          return {
            success: false,
            email,
            error: "Format de réponse inattendu de l'Edge Function",
          };
        } catch (error: any) {
          console.error(`Exception pour ${email}:`, error);
          return {
            success: false,
            email,
            error: error.message || error.toString() || "Erreur inattendue",
          };
        }
      });

      const results = await Promise.all(promises);
      
      const successes = results.filter((r) => r.success).length;
      const failures = results.filter((r) => !r.success);

      if (failures.length > 0) {
        const errorMessages = failures.map((f) => `${f.email}: ${f.error}`).join("; ");
        throw new Error(`${successes} email${successes > 1 ? "s" : ""} envoyé${successes > 1 ? "s" : ""}, ${failures.length} échec${failures.length > 1 ? "s" : ""}. Détails: ${errorMessages}`);
      }

      return { successes, total: results.length };
    },
    onSuccess: (data) => {
      toast.success(`${data.successes} email${data.successes > 1 ? "s" : ""} de test envoyé${data.successes > 1 ? "s" : ""} avec succès`);
      setIsTestDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Erreur lors de l'envoi des emails de test:", error);
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

  // Supprimer plusieurs médias
  const handleDeleteSelectedMedia = async () => {
    if (selectedMediaPaths.size === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedMediaPaths.size} média(s) ?`)) {
      return;
    }

    try {
      const pathsToDelete = Array.from(selectedMediaPaths);
      const { error } = await supabase.storage
        .from('template-images')
        .remove(pathsToDelete);

      if (error) {
        throw error;
      }

      toast.success(`${pathsToDelete.length} média(s) supprimé(s) avec succès`);
      setSelectedMediaPaths(new Set());
      setIsSelectionMode(false);
      await loadUserMedia();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression des médias');
    }
  };

  // Toggle sélection d'un média
  const toggleMediaSelection = (path: string) => {
    const newSelection = new Set(selectedMediaPaths);
    if (newSelection.has(path)) {
      newSelection.delete(path);
    } else {
      newSelection.add(path);
    }
    setSelectedMediaPaths(newSelection);
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
    { id: "bouton", label: "Bouton", icon: RectangleHorizontal, category: "contenu" },
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/campagnes")}
            className="h-8 w-8 p-0 hover:bg-muted"
            title="Retour aux campagnes"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
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
                onClick={() => {
                  setIsMediaLibraryOpen(true);
                  // Charger les médias si nécessaire
                  if (uploadedMedia.length === 0 && user?.id) {
                    loadUserMedia();
                  }
                }}
                className="flex flex-col items-center gap-1 p-3 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
                title="Bibliothèque"
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px] font-medium">Bibliothèque</span>
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
              {/* Panneaux GrapesJS - toujours présents dans le DOM mais cachés */}
              <div>
                <div 
                  id="grapesjs-style-panel" 
                  className="hidden"
                  style={{ position: "absolute", left: "-9999px" }}
                ></div>
                
                <div 
                  id="grapesjs-traits-panel" 
                  className="hidden"
                  style={{ position: "absolute", left: "-9999px" }}
                ></div>
              </div>
              
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
                              e.dataTransfer.effectAllowed = "copy";
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
              
              {sidebarIcon === "sonia" && (
                <div className="p-4">
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Assistant Sonia - Bientôt disponible
                  </div>
                </div>
              )}
              
              {sidebarTab === "sections" && (
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
                  {/* Bouton pour sauvegarder la section sélectionnée */}
                  <div className="space-y-2">
                    <Button
                      onClick={async () => {
                        if (getCurrentHtmlRef.current) {
                          const html = getCurrentHtmlRef.current();
                          if (html && html.trim()) {
                            setSectionToSave({ html, name: '', description: '', category: 'general' });
                            setIsSaveSectionDialogOpen(true);
                          } else {
                            toast.error('Aucun contenu à sauvegarder');
                          }
                        }
                      }}
                      className="w-full gap-2"
                      variant="default"
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer cette section
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Sélectionnez une section dans l'éditeur puis cliquez pour l'enregistrer
                    </p>
                  </div>

                  {/* Liste des sections sauvegardées */}
                  {isLoadingSections ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : savedSections.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Sections enregistrées ({savedSections.length})
                      </h3>
                      <div className="space-y-2">
                        {savedSections.map((section) => (
                          <Card
                            key={section.id}
                            className="group cursor-pointer hover:border-primary transition-colors"
                            onClick={() => {
                              // Insérer la section dans l'éditeur via TemplateEditorBrevo
                              if (getCurrentHtmlRef.current) {
                                const editor = (window as any).grapesjsEditor;
                                if (editor) {
                                  editor.setComponents(section.html_content);
                                  toast.success('Section insérée');
                                }
                              }
                            }}
                          >
                            <CardHeader className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm font-semibold truncate">{section.nom}</CardTitle>
                                  {section.description && (
                                    <CardDescription className="text-xs mt-1 line-clamp-2">
                                      {section.description}
                                    </CardDescription>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 ml-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Supprimer la section
                                    supabase
                                      .from('saved_sections')
                                      .delete()
                                      .eq('id', section.id)
                                      .then(() => {
                                        loadSavedSections();
                                        toast.success('Section supprimée');
                                      });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {section.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(section.created_at).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-4 rounded-lg bg-muted/50 inline-block mb-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Aucune section enregistrée</p>
                      <p className="text-xs text-muted-foreground">Enregistrez des sections de mail pour les réutiliser dans vos campagnes</p>
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
          
          {/* Zone d'édition - pleine largeur */}
          <div className="h-full overflow-auto relative">
            <div className="bg-white shadow-2xl h-full flex flex-col w-full">
              <TemplateEditorBrevo
                key={`editor-v${editorVersion}`}
                initialContent={htmlContent}
                onSave={handleEditorSave}
                deviceView={deviceView}
                onGetCurrentHtml={(getHtml) => {
                  getCurrentHtmlRef.current = getHtml;
                }}
                onComponentSelected={(component) => {
                  if (component) {
                    selectedComponentRef.current = component;
                    // Extraire les styles du composant
                    const styles = component.getStyle();
                    // Convertir rgb() en hex si nécessaire
                    let color = styles['color'] || '#000000';
                    if (color.startsWith('rgb')) {
                      const rgb = color.match(/\d+/g);
                      if (rgb && rgb.length >= 3) {
                        color = '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
                      }
                    }
                    setTextStyles({
                      fontFamily: styles['font-family']?.replace(/['"]/g, '') || 'Arial',
                      fontSize: styles['font-size'] || '14px',
                      color: color,
                      textAlign: styles['text-align'] || 'left',
                      fontWeight: styles['font-weight'] || 'normal',
                      fontStyle: styles['font-style'] || 'normal',
                      textDecoration: styles['text-decoration'] || 'none',
                      lineHeight: styles['line-height'] || '1.5',
                    });
                    setSelectedTextComponent(true);
                  } else {
                    selectedComponentRef.current = null;
                    setSelectedTextComponent(false);
                  }
                }}
                onOpenMediaLibrary={(onSelect) => {
                  mediaSelectCallbackRef.current = onSelect;
                  setIsMediaLibraryOpen(true);
                  // Charger les médias si nécessaire
                  if (uploadedMedia.length === 0 && user?.id) {
                    loadUserMedia();
                  }
                }}
              />
            </div>
            
            {/* Dialog Bibliothèque de contenu */}
            <Dialog 
              open={isMediaLibraryOpen} 
              onOpenChange={(open) => {
                setIsMediaLibraryOpen(open);
                if (!open) {
                  // Réinitialiser le mode de sélection à la fermeture
                  setIsSelectionMode(false);
                  setSelectedMediaPaths(new Set());
                }
              }}
            >
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Bibliothèque de contenu</DialogTitle>
                </DialogHeader>
                
                <Tabs value={mediaLibraryTab} onValueChange={(value) => setMediaLibraryTab(value as any)} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0">
                    <TabsTrigger 
                      value="mes-fichiers" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-3"
                    >
                      Mes fichiers
                    </TabsTrigger>
                    <TabsTrigger 
                      value="images-libres" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-3"
                    >
                      Images libres de droits
                    </TabsTrigger>
                    <TabsTrigger 
                      value="images-gif" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-4 py-3"
                    >
                      Images GIF
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Boutons d'action */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b">
                    <input
                      ref={mediaLibraryInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleMediaUpload}
                    />
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (mediaLibraryInputRef.current) {
                          mediaLibraryInputRef.current.click();
                        } else {
                          toast.error('Erreur: input file non trouvé');
                        }
                      }}
                      className="bg-gray-800 text-white hover:bg-gray-700"
                      type="button"
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-300"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.info('Fonctionnalité "Créer une image" à venir');
                      }}
                      type="button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une image
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.info('Fonctionnalité "Dossiers" à venir');
                      }}
                      type="button"
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      Dossiers
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  <TabsContent value="mes-fichiers" className="flex-1 overflow-y-auto mt-0">
                    {isLoadingMedia ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : uploadedMedia.filter(media => media.type === 'image').length > 0 ? (
                      <div className="grid grid-cols-4 gap-4 p-4">
                        {uploadedMedia
                          .filter(media => media.type === 'image')
                          .map((media, index) => {
                            const isSelected = selectedMediaPaths.has(media.path);
                            return (
                              <div
                                key={`${media.path}-${index}`}
                                className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                  isSelected 
                                    ? 'border-primary ring-2 ring-primary ring-offset-2' 
                                    : 'border-border hover:border-primary'
                                } ${isSelectionMode ? 'cursor-pointer' : 'cursor-pointer'}`}
                                onClick={(e) => {
                                  if (isSelectionMode) {
                                    e.stopPropagation();
                                    toggleMediaSelection(media.path);
                                  } else if (mediaSelectCallbackRef.current) {
                                    mediaSelectCallbackRef.current(media.url);
                                    setIsMediaLibraryOpen(false);
                                    mediaSelectCallbackRef.current = null;
                                  }
                                }}
                              >
                                <img
                                  src={media.url}
                                  alt={media.name}
                                  className="w-full h-full object-cover"
                                />
                                {isSelectionMode && (
                                  <div className="absolute top-2 left-2 z-10">
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                      isSelected 
                                        ? 'bg-primary border-primary' 
                                        : 'bg-white border-gray-300'
                                    }`}>
                                      {isSelected && (
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className={`absolute inset-0 transition-colors flex items-center justify-center ${
                                  isSelectionMode 
                                    ? isSelected 
                                      ? 'bg-primary/20' 
                                      : 'bg-black/0 group-hover:bg-black/20'
                                    : 'bg-black/0 group-hover:bg-black/40'
                                }`}>
                                  <div className={`transition-opacity text-white text-center p-2 ${
                                    isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  }`}>
                                    <p className="text-xs font-medium truncate">{media.name}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="p-4 rounded-lg bg-muted/50 inline-block mb-3">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Aucune image disponible
                        </p>
                        <Button
                          onClick={() => {
                            mediaInputRef.current?.click();
                          }}
                          variant="outline"
                        >
                          <ImagePlus className="h-4 w-4 mr-2" />
                          Télécharger des images
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="images-libres" className="flex-1 overflow-y-auto mt-0">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Rechercher des images..."
                            value={freeImagesSearch}
                            onChange={(e) => setFreeImagesSearch(e.target.value)}
                            className="pl-10"
                          />
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <Button
                          onClick={async () => {
                            setIsLoadingFreeImages(true);
                            try {
                              // Utiliser Unsplash API (gratuite, nécessite une clé API)
                              // Pour l'instant, on utilise des images placeholder
                              const query = freeImagesSearch || 'business';
                              // Note: Vous devrez ajouter votre clé API Unsplash dans les variables d'environnement
                              const unsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
                              
                              if (unsplashKey) {
                                const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=20&client_id=${unsplashKey}`);
                                if (response.ok) {
                                  const data = await response.json();
                                  setFreeImages(data.results.map((img: any) => ({
                                    id: img.id,
                                    url: img.urls.regular,
                                    thumbnail: img.urls.thumb,
                                    author: img.user.name
                                  })));
                                }
                              } else {
                                // Fallback: utiliser des images placeholder
                                setFreeImages([
                                  { id: '1', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400', thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=200', author: 'Unsplash' },
                                  { id: '2', url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200', author: 'Unsplash' },
                                  { id: '3', url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400', thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200', author: 'Unsplash' },
                                ]);
                              }
                            } catch (error) {
                              console.error('Erreur lors du chargement des images libres:', error);
                              toast.error('Erreur lors du chargement des images');
                            } finally {
                              setIsLoadingFreeImages(false);
                            }
                          }}
                          disabled={isLoadingFreeImages}
                        >
                          {isLoadingFreeImages ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Rechercher'
                          )}
                        </Button>
                      </div>
                      
                      {isLoadingFreeImages ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : freeImages.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                          {freeImages.map((img) => (
                            <div
                              key={img.id}
                              className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-all"
                              onClick={() => {
                                if (mediaSelectCallbackRef.current) {
                                  mediaSelectCallbackRef.current(img.url);
                                  setIsMediaLibraryOpen(false);
                                  mediaSelectCallbackRef.current = null;
                                }
                              }}
                            >
                              <img
                                src={img.thumbnail}
                                alt={img.author}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2">
                                  <p className="text-xs font-medium">{img.author}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-muted-foreground">
                            Recherchez des images libres de droits
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="images-gif" className="flex-1 overflow-y-auto mt-0">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Rechercher des GIFs..."
                            value={gifSearch}
                            onChange={(e) => setGifSearch(e.target.value)}
                            className="pl-10"
                          />
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <Button
                          onClick={async () => {
                            setIsLoadingGifs(true);
                            try {
                              // Utiliser Giphy API (gratuite, nécessite une clé API)
                              const query = gifSearch || 'business';
                              const giphyKey = import.meta.env.VITE_GIPHY_API_KEY || '';
                              
                              if (giphyKey) {
                                const response = await fetch(`https://api.giphy.com/v1/gifs/search?q=${query}&limit=20&api_key=${giphyKey}`);
                                if (response.ok) {
                                  const data = await response.json();
                                  setGifImages(data.data.map((gif: any) => ({
                                    id: gif.id,
                                    url: gif.images.original.url,
                                    thumbnail: gif.images.fixed_height_small.url,
                                    title: gif.title
                                  })));
                                }
                              } else {
                                toast.info('Clé API Giphy non configurée. Configurez VITE_GIPHY_API_KEY dans votre fichier .env');
                              }
                            } catch (error) {
                              console.error('Erreur lors du chargement des GIFs:', error);
                              toast.error('Erreur lors du chargement des GIFs');
                            } finally {
                              setIsLoadingGifs(false);
                            }
                          }}
                          disabled={isLoadingGifs}
                        >
                          {isLoadingGifs ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Rechercher'
                          )}
                        </Button>
                      </div>
                      
                      {isLoadingGifs ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : gifImages.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                          {gifImages.map((gif) => (
                            <div
                              key={gif.id}
                              className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-all"
                              onClick={() => {
                                if (mediaSelectCallbackRef.current) {
                                  mediaSelectCallbackRef.current(gif.url);
                                  setIsMediaLibraryOpen(false);
                                  mediaSelectCallbackRef.current = null;
                                }
                              }}
                            >
                              <img
                                src={gif.thumbnail}
                                alt={gif.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2">
                                  <p className="text-xs font-medium truncate">{gif.title}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-muted-foreground">
                            Recherchez des GIFs
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="border-t p-4 flex items-center justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsMediaLibraryOpen(false);
                      mediaSelectCallbackRef.current = null;
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Panneau de configuration texte à droite - style Brevo */}
            {selectedTextComponent && selectedComponentRef.current && (
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l shadow-lg z-50 overflow-y-auto">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Paramètres du texte</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setSelectedTextComponent(false);
                        selectedComponentRef.current = null;
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Police */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Police</Label>
                    <Select
                      value={textStyles.fontFamily}
                      onValueChange={(value) => {
                        if (selectedComponentRef.current) {
                          selectedComponentRef.current.addStyle({ 'font-family': value });
                          setTextStyles({ ...textStyles, fontFamily: value });
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Palatino">Palatino</SelectItem>
                        <SelectItem value="Garamond">Garamond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Taille */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Taille</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => {
                          if (selectedComponentRef.current) {
                            const currentSize = parseInt(textStyles.fontSize.replace('px', '') || '14');
                            const newSize = Math.max(8, currentSize - 1);
                            selectedComponentRef.current.addStyle({ 'font-size': `${newSize}px` });
                            setTextStyles({ ...textStyles, fontSize: `${newSize}px` });
                          }
                        }}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={parseInt(textStyles.fontSize.replace('px', '') || '14')}
                        onChange={(e) => {
                          if (selectedComponentRef.current) {
                            const size = parseInt(e.target.value) || 14;
                            selectedComponentRef.current.addStyle({ 'font-size': `${size}px` });
                            setTextStyles({ ...textStyles, fontSize: `${size}px` });
                          }
                        }}
                        className="h-9 text-sm text-center flex-1"
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => {
                          if (selectedComponentRef.current) {
                            const currentSize = parseInt(textStyles.fontSize.replace('px', '') || '14');
                            const newSize = currentSize + 1;
                            selectedComponentRef.current.addStyle({ 'font-size': `${newSize}px` });
                            setTextStyles({ ...textStyles, fontSize: `${newSize}px` });
                          }
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  {/* Couleur */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Couleur</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textStyles.color.startsWith('#') ? textStyles.color : '#000000'}
                        onChange={(e) => {
                          if (selectedComponentRef.current) {
                            selectedComponentRef.current.addStyle({ 'color': e.target.value });
                            setTextStyles({ ...textStyles, color: e.target.value });
                          }
                        }}
                        className="w-12 h-9 rounded border-2 border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={textStyles.color}
                        onChange={(e) => {
                          if (selectedComponentRef.current) {
                            selectedComponentRef.current.addStyle({ 'color': e.target.value });
                            setTextStyles({ ...textStyles, color: e.target.value });
                          }
                        }}
                        className="h-9 text-sm flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  {/* Alignement */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Alignement</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={textStyles.textAlign === 'left' ? 'default' : 'outline'}
                        size="sm"
                        className="h-9 flex-1"
                        onClick={() => {
                          if (selectedComponentRef.current) {
                            selectedComponentRef.current.addStyle({ 'text-align': 'left' });
                            setTextStyles({ ...textStyles, textAlign: 'left' });
                          }
                        }}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={textStyles.textAlign === 'center' ? 'default' : 'outline'}
                        size="sm"
                        className="h-9 flex-1"
                        onClick={() => {
                          if (selectedComponentRef.current) {
                            selectedComponentRef.current.addStyle({ 'text-align': 'center' });
                            setTextStyles({ ...textStyles, textAlign: 'center' });
                          }
                        }}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={textStyles.textAlign === 'right' ? 'default' : 'outline'}
                        size="sm"
                        className="h-9 flex-1"
                        onClick={() => {
                          if (selectedComponentRef.current) {
                            selectedComponentRef.current.addStyle({ 'text-align': 'right' });
                            setTextStyles({ ...textStyles, textAlign: 'right' });
                          }
                        }}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Gras, Italique, Souligné */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Style</Label>
                    <div className="flex items-center gap-2">
                      <Toggle
                        pressed={textStyles.fontWeight === 'bold' || textStyles.fontWeight === '700'}
                        onPressedChange={(pressed) => {
                          if (selectedComponentRef.current) {
                            selectedComponentRef.current.addStyle({ 'font-weight': pressed ? 'bold' : 'normal' });
                            setTextStyles({ ...textStyles, fontWeight: pressed ? 'bold' : 'normal' });
                          }
                        }}
                        size="sm"
                        className="h-9 flex-1"
                      >
                        <Bold className="h-4 w-4" />
                      </Toggle>
                      <Toggle
                        pressed={textStyles.fontStyle === 'italic'}
                        onPressedChange={(pressed) => {
                          if (selectedComponentRef.current) {
                            selectedComponentRef.current.addStyle({ 'font-style': pressed ? 'italic' : 'normal' });
                            setTextStyles({ ...textStyles, fontStyle: pressed ? 'italic' : 'normal' });
                          }
                        }}
                        size="sm"
                        className="h-9 flex-1"
                      >
                        <Italic className="h-4 w-4" />
                      </Toggle>
                      <Toggle
                        pressed={textStyles.textDecoration.includes('underline')}
                        onPressedChange={(pressed) => {
                          if (selectedComponentRef.current) {
                            selectedComponentRef.current.addStyle({ 'text-decoration': pressed ? 'underline' : 'none' });
                            setTextStyles({ ...textStyles, textDecoration: pressed ? 'underline' : 'none' });
                          }
                        }}
                        size="sm"
                        className="h-9 flex-1"
                      >
                        <Underline className="h-4 w-4" />
                      </Toggle>
                    </div>
                  </div>
                  
                  {/* Interlignage */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Interlignage</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => {
                          if (selectedComponentRef.current) {
                            const currentLineHeight = parseFloat(textStyles.lineHeight || '1.5');
                            const newLineHeight = Math.max(1, currentLineHeight - 0.1);
                            selectedComponentRef.current.addStyle({ 'line-height': newLineHeight.toFixed(1) });
                            setTextStyles({ ...textStyles, lineHeight: newLineHeight.toFixed(1) });
                          }
                        }}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        step="0.1"
                        value={parseFloat(textStyles.lineHeight || '1.5').toFixed(1)}
                        onChange={(e) => {
                          if (selectedComponentRef.current) {
                            const lineHeight = parseFloat(e.target.value) || 1.5;
                            selectedComponentRef.current.addStyle({ 'line-height': lineHeight.toFixed(1) });
                            setTextStyles({ ...textStyles, lineHeight: lineHeight.toFixed(1) });
                          }
                        }}
                        className="h-9 text-sm text-center flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => {
                          if (selectedComponentRef.current) {
                            const currentLineHeight = parseFloat(textStyles.lineHeight || '1.5');
                            const newLineHeight = currentLineHeight + 0.1;
                            selectedComponentRef.current.addStyle({ 'line-height': newLineHeight.toFixed(1) });
                            setTextStyles({ ...textStyles, lineHeight: newLineHeight.toFixed(1) });
                          }
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Paramètres */}
      <Dialog 
        open={isSettingsOpen} 
        onOpenChange={(open) => {
          // En mode création initial, empêcher la fermeture sans remplir les champs obligatoires
          if (!open && !isInitialConfigDone && !isEditMode && !htmlContent) {
            const hasRequiredFields = formData.nom_campagne.trim() && 
                                     formData.sujet_email.trim() && 
                                     formData.expediteur_nom.trim() && 
                                     formData.expediteur_email.trim() && 
                                     formData.list_id;
            
            if (!hasRequiredFields) {
              if (confirm("Voulez-vous vraiment quitter sans remplir la configuration ?")) {
                navigate("/campagnes");
              }
              return;
            }
          }
          setIsSettingsOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {!isInitialConfigDone && !isEditMode && !htmlContent 
                ? "Configuration de la campagne" 
                : "Paramètres de la campagne"}
            </DialogTitle>
            <DialogDescription>
              {!isInitialConfigDone && !isEditMode && !htmlContent
                ? "Configurez les informations de base de votre campagne avant de choisir un template"
                : "Configurez les informations de votre campagne"}
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

            {/* Test A/B */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ab-test">Test A/B</Label>
                  <p className="text-xs text-muted-foreground">
                    Testez différentes variantes pour optimiser vos performances
                  </p>
                </div>
                <Switch
                  id="ab-test"
                  checked={isAbTestEnabled}
                  onCheckedChange={(checked) => {
                    setIsAbTestEnabled(checked);
                    setHasUnsavedChanges(true);
                    if (!checked) {
                      // Réinitialiser les variantes si désactivé
                      setAbVariants([
                        { name: "A", sujet: formData.sujet_email, html: htmlContent },
                        { name: "B", sujet: "", html: "" },
                      ]);
                    } else {
                      // Initialiser les variantes avec les valeurs actuelles
                      setAbVariants([
                        { name: "A", sujet: formData.sujet_email, html: htmlContent },
                        { name: "B", sujet: "", html: "" },
                      ]);
                    }
                  }}
                />
              </div>

              {isAbTestEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label>Type de test</Label>
                    <Select value={abTestType} onValueChange={(value: "subject" | "content" | "both") => {
                      setAbTestType(value);
                      setHasUnsavedChanges(true);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject">Sujet uniquement</SelectItem>
                        <SelectItem value="content">Contenu uniquement</SelectItem>
                        <SelectItem value="both">Sujet et contenu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ab-percentage">Pourcentage de test (%)</Label>
                      <Input
                        id="ab-percentage"
                        type="number"
                        min="10"
                        max="50"
                        value={abTestPercentage}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 10 && val <= 50) {
                            setAbTestPercentage(val);
                            setHasUnsavedChanges(true);
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        {abTestPercentage}% de votre liste recevra chaque variante
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ab-duration">Durée du test (heures)</Label>
                      <Input
                        id="ab-duration"
                        type="number"
                        min="1"
                        max="168"
                        value={abTestDuration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 1 && val <= 168) {
                            setAbTestDuration(val);
                            setHasUnsavedChanges(true);
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Durée avant de sélectionner le gagnant
                      </p>
                    </div>
                  </div>

                  {/* Variantes */}
                  <div className="space-y-4">
                    <Label>Variantes</Label>
                    {abVariants.map((variant, index) => (
                      <Card key={variant.name} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">Variante {variant.name}</Badge>
                          </div>
                          
                          {(abTestType === "subject" || abTestType === "both") && (
                            <div className="space-y-2">
                              <Label>Sujet {variant.name}</Label>
                              <Input
                                value={variant.sujet}
                                onChange={(e) => {
                                  const newVariants = [...abVariants];
                                  newVariants[index].sujet = e.target.value;
                                  setAbVariants(newVariants);
                                  setHasUnsavedChanges(true);
                                }}
                                placeholder={`Sujet pour la variante ${variant.name}`}
                              />
                            </div>
                          )}

                          {(abTestType === "content" || abTestType === "both") && (
                            <div className="space-y-2">
                              <Label>Contenu {variant.name}</Label>
                              <p className="text-xs text-muted-foreground">
                                {variant.name === "A" 
                                  ? "Le contenu actuel de l'éditeur sera utilisé pour la variante A"
                                  : "Créez le contenu de la variante B dans l'éditeur après avoir sauvegardé"}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            {!isInitialConfigDone && !isEditMode && !htmlContent ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (confirm("Voulez-vous vraiment quitter sans remplir la configuration ?")) {
                      navigate("/campagnes");
                    }
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={() => {
                    // Valider les champs obligatoires
                    if (!formData.nom_campagne.trim()) {
                      toast.error("Le nom de la campagne est obligatoire");
                      return;
                    }
                    if (!formData.sujet_email.trim()) {
                      toast.error("Le sujet de l'e-mail est obligatoire");
                      return;
                    }
                    if (!formData.expediteur_nom.trim()) {
                      toast.error("Le nom de l'expéditeur est obligatoire");
                      return;
                    }
                    if (!formData.expediteur_email.trim()) {
                      toast.error("L'email de l'expéditeur est obligatoire");
                      return;
                    }
                    if (!formData.list_id) {
                      toast.error("La liste de contacts est obligatoire");
                      return;
                    }
                    
                    // Sauvegarder comme brouillon
                    saveMutation.mutate(true, {
                      onSuccess: () => {
                        setIsInitialConfigDone(true);
                        setIsSettingsOpen(false);
                        // Ouvrir le dialogue de sélection de template
                        setTimeout(() => {
                          setIsTemplateDialogOpen(true);
                        }, 300);
                      }
                    });
                  }}
                >
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={() => {
                  saveMutation.mutate(true);
                  setIsSettingsOpen(false);
                }}>
                  Enregistrer
                </Button>
              </>
            )}
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
