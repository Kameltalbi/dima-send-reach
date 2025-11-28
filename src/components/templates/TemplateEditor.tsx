import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Download, 
  Settings, 
  Code,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  FileCode,
  Undo2,
  Redo2,
  Trash2,
  Layers,
  Loader2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelRightClose,
  PanelLeftOpen,
  PanelRightOpen
} from "lucide-react";
import { toast } from "sonner";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import newsletterPreset from "grapesjs-preset-newsletter";

interface TemplateEditorProps {
  templateId: string | null;
  onClose: () => void;
  onSave?: (html: string) => void;
}

export function TemplateEditor({ templateId, onClose, onSave }: TemplateEditorProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(!templateId);
  const [importOpen, setImportOpen] = useState(false);
  const [importHtml, setImportHtml] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateType, setTemplateType] = useState("newsletter");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const [blocksPanelOpen, setBlocksPanelOpen] = useState(true);
  const [stylesPanelOpen, setStylesPanelOpen] = useState(true);

  const { data: template } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });

  useEffect(() => {
    if (template) {
      setTemplateName(template.nom);
      setTemplateDescription(template.description || "");
      setTemplateType(template.type);
    }
  }, [template]);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "auto",
      storageManager: false,
      plugins: [newsletterPreset],
      blockManager: {
        appendTo: "#blocks",
        blocks: [
          {
            id: 'section',
            label: 'Section',
            category: 'Layout',
            content: '<div data-gjs-type="section" style="padding: 20px; background: #ffffff;"></div>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
          },
          {
            id: 'column',
            label: 'Colonne',
            category: 'Layout',
            content: '<div data-gjs-type="column" style="padding: 10px;"></div>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="3" x2="12" y2="21"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
          },
          {
            id: 'text',
            label: 'Texte',
            category: 'Contenu',
            content: '<div data-gjs-type="text">Votre texte ici</div>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>',
          },
          {
            id: 'image',
            label: 'Image',
            category: 'Contenu',
            content: '<img src="https://via.placeholder.com/350x250" data-gjs-type="image"/>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
          },
          {
            id: 'button',
            label: 'Bouton',
            category: 'Contenu',
            content: '<a href="#" data-gjs-type="link" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Cliquez ici</a>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 12h10"/></svg>',
          },
          {
            id: 'divider',
            label: 'Séparateur',
            category: 'Contenu',
            content: '<hr data-gjs-type="default" style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>',
          },
        ],
      },
      styleManager: {
        appendTo: "#styles",
        sectors: [
          {
            name: "Dimensions",
            open: true,
            buildProps: [
              "width",
              "height",
              "min-height",
              "max-width",
              "margin",
              "padding",
            ],
            properties: [
              {
                name: "Margin",
                property: "margin",
                type: "composite",
                properties: [
                  { name: "Top", property: "margin-top" },
                  { name: "Right", property: "margin-right" },
                  { name: "Bottom", property: "margin-bottom" },
                  { name: "Left", property: "margin-left" },
                ],
              },
              {
                name: "Padding",
                property: "padding",
                type: "composite",
                properties: [
                  { name: "Top", property: "padding-top" },
                  { name: "Right", property: "padding-right" },
                  { name: "Bottom", property: "padding-bottom" },
                  { name: "Left", property: "padding-left" },
                ],
              },
            ],
          },
          {
            name: "Typographie",
            open: false,
            buildProps: [
              "font-family",
              "font-size",
              "font-weight",
              "letter-spacing",
              "color",
              "line-height",
              "text-align",
              "text-decoration",
              "text-shadow",
            ],
          },
          {
            name: "Décorations",
            open: false,
            buildProps: [
              "background-color",
              "background-image",
              "background-repeat",
              "background-position",
              "background-size",
              "border-radius",
              "border",
              "box-shadow",
              "opacity",
            ],
            properties: [
              {
                name: "Border",
                property: "border",
                type: "composite",
                properties: [
                  { name: "Width", property: "border-width" },
                  { name: "Style", property: "border-style" },
                  { name: "Color", property: "border-color" },
                ],
              },
            ],
          },
          {
            name: "Position",
            open: false,
            buildProps: [
              "position",
              "top",
              "right",
              "bottom",
              "left",
              "z-index",
              "float",
              "display",
            ],
          },
        ],
      },
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
        ],
      },
      deviceManager: {
        devices: [
          {
            name: "Desktop",
            width: "",
          },
          {
            name: "Tablet",
            width: "768px",
            widthMedia: "992px",
          },
          {
            name: "Mobile",
            width: "320px",
            widthMedia: "768px",
          },
        ],
      },
      panels: {
        defaults: [],
      },
    });

    editorRef.current = editor;

    // Charger le template existant
    if (template) {
      console.log("Loading template:", template.nom, {
        hasContentJson: !!template.content_json,
        hasContentHtml: !!template.content_html,
        contentJsonKeys: template.content_json ? Object.keys(template.content_json) : []
      });
      
      // Essayer de charger depuis content_json d'abord
      if (template.content_json && Object.keys(template.content_json).length > 0) {
        try {
          editor.loadProjectData(template.content_json as any);
          console.log("Template loaded from content_json");
        } catch (error) {
          console.error("Error loading project data:", error);
          // Si échec, charger depuis HTML
          if (template.content_html) {
            console.log("Falling back to content_html");
            loadHtmlIntoEditor(editor, template.content_html);
          } else {
            setDefaultTemplate(editor);
          }
        }
      } 
      // Sinon charger depuis content_html
      else if (template.content_html) {
        console.log("Loading template from content_html");
        loadHtmlIntoEditor(editor, template.content_html);
      }
      // Template vide par défaut
      else {
        console.log("No content found, using default template");
        setDefaultTemplate(editor);
      }
    } else {
      // Nouveau template - template par défaut
      console.log("New template, using default");
      setDefaultTemplate(editor);
    }

    // Fonction helper pour charger HTML dans l'éditeur
    function loadHtmlIntoEditor(editorInstance: any, html: string) {
      try {
        // Extraire le contenu du body si c'est un document HTML complet
        let htmlContent = html.trim();
        
        // Si c'est un document HTML complet, extraire le contenu du body
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          htmlContent = bodyMatch[1];
        }
        
        // Si c'est encore un document complet, essayer d'extraire juste le contenu
        const htmlMatch = htmlContent.match(/<html[^>]*>([\s\S]*)<\/html>/i);
        if (htmlMatch) {
          htmlContent = htmlMatch[1];
        }
        
        // Nettoyer et préparer le HTML pour GrapesJS
        // GrapesJS newsletter preset fonctionne mieux avec des structures simples
        // On enveloppe le contenu dans une structure de base si nécessaire
        if (!htmlContent.includes('data-gjs-type')) {
          // Si le HTML n'a pas de structure GrapesJS, on l'enveloppe
          htmlContent = `<div data-gjs-type="wrapper">${htmlContent}</div>`;
        }
        
        // Utiliser setComponents avec le HTML nettoyé
        editorInstance.setComponents(htmlContent);
        
        // Forcer le rendu
        setTimeout(() => {
          editorInstance.refresh();
        }, 100);
      } catch (error) {
        console.error("Error loading HTML:", error);
        setDefaultTemplate(editorInstance);
      }
    }

    // Fonction helper pour le template par défaut
    function setDefaultTemplate(editorInstance: any) {
      editorInstance.setComponents(`
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700;">Votre Titre</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Sous-titre de votre email</p>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
              Bienvenue dans votre template d'email professionnel. Utilisez les blocs à gauche pour personnaliser votre design.
            </p>
            <a href="#" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600;">
              Bouton d'action
            </a>
          </div>
          <div style="background: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #666666;">
            <p style="margin: 0;">© 2025 Votre entreprise. Tous droits réservés.</p>
            <p style="margin: 10px 0 0 0;">
              <a href="#" style="color: #667eea; text-decoration: none;">Se désabonner</a>
            </p>
          </div>
        </div>
      `);
    }

    // Écouter les changements de device
    editor.on("change:device", () => {
      const device = editor.getDevice();
      if (device === "Desktop") setDeviceMode("desktop");
      else if (device === "Tablet") setDeviceMode("tablet");
      else setDeviceMode("mobile");
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, [template]);

  // Réinitialiser les panneaux GrapesJS quand ils sont réouverts
  useEffect(() => {
    if (!editorRef.current) return;
    
    if (blocksPanelOpen) {
      const blockManager = editorRef.current.BlockManager;
      if (blockManager) {
        blockManager.render();
      }
    }
  }, [blocksPanelOpen]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    if (stylesPanelOpen) {
      const styleManager = editorRef.current.StyleManager;
      if (styleManager) {
        styleManager.render();
      }
    }
  }, [stylesPanelOpen]);

  const changeDevice = (device: "desktop" | "tablet" | "mobile") => {
    if (!editorRef.current) return;
    setDeviceMode(device);
    if (device === "desktop") editorRef.current.setDevice("Desktop");
    else if (device === "tablet") editorRef.current.setDevice("Tablet");
    else editorRef.current.setDevice("Mobile");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editorRef.current) throw new Error("Éditeur non initialisé");

      const html = editorRef.current.getHtml();
      const css = editorRef.current.getCss();
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`;

      // Si onSave est fourni, l'utiliser (depuis NouvelleCampagne)
      if (onSave) {
        onSave(fullHtml);
        return;
      }

      // Sinon, sauvegarder comme template
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const projectData = editorRef.current.getProjectData();

      const payload = {
        user_id: userData.user.id,
        nom: templateName || "Sans titre",
        description: templateDescription,
        type: templateType,
        content_html: fullHtml,
        content_json: projectData,
      };

      if (templateId) {
        const { error } = await supabase
          .from("templates")
          .update(payload)
          .eq("id", templateId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      if (onSave) {
        // Si onSave est utilisé, on ferme juste l'éditeur
        onClose();
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template enregistré avec succès");
      setSettingsOpen(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const handlePreview = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`;

    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(fullHtml);
      previewWindow.document.close();
    }
  };

  const handleExport = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName || "template"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template exporté avec succès");
  };

  const handleImport = () => {
    setImportOpen(true);
  };

  const handleImportConfirm = () => {
    if (!editorRef.current || !importHtml.trim()) {
      toast.error("Veuillez entrer du code HTML");
      return;
    }
    
    try {
      // Extraire le HTML du body si c'est un document HTML complet
      let htmlToImport = importHtml.trim();
      
      // Si c'est un document HTML complet, extraire le contenu du body
      const bodyMatch = htmlToImport.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        htmlToImport = bodyMatch[1];
      }
      
      // Si c'est encore un document complet, essayer d'extraire juste le contenu
      const htmlMatch = htmlToImport.match(/<html[^>]*>([\s\S]*)<\/html>/i);
      if (htmlMatch) {
        htmlToImport = htmlMatch[1];
      }
      
      editorRef.current.setComponents(htmlToImport);
      toast.success("Template HTML importé avec succès");
      setImportOpen(false);
      setImportHtml("");
    } catch (error) {
      console.error("Erreur import:", error);
      toast.error("Erreur lors de l'importation du HTML");
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html')) {
      toast.error("Veuillez sélectionner un fichier HTML");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportHtml(content);
        setImportOpen(true);
      }
    };
    reader.onerror = () => {
      toast.error("Erreur lors de la lecture du fichier");
    };
    reader.readAsText(file);
  };

  const handleUndo = () => {
    if (!editorRef.current) return;
    editorRef.current.UndoManager.undo();
  };

  const handleRedo = () => {
    if (!editorRef.current) return;
    editorRef.current.UndoManager.redo();
  };

  const toggleCodeView = () => {
    if (!editorRef.current) return;
    setShowCode(!showCode);
    const codeViewer = editorRef.current.CodeManager;
    if (!showCode) {
      codeViewer.open();
    } else {
      codeViewer.close();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header moderne et épuré */}
      <div className="border-b bg-white px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-8 w-8 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-semibold text-sm text-foreground">
              {templateName || "Nouveau template"}
            </h2>
            <p className="text-xs text-muted-foreground">Éditeur de template</p>
          </div>
        </div>

        {/* Device switcher centré */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
          <Button
            variant={deviceMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => changeDevice("desktop")}
            className={`h-7 px-3 text-xs ${deviceMode === "desktop" ? "bg-white shadow-sm" : ""}`}
          >
            <Monitor className="h-3.5 w-3.5 mr-1.5" />
            Desktop
          </Button>
          <Button
            variant={deviceMode === "tablet" ? "default" : "ghost"}
            size="sm"
            onClick={() => changeDevice("tablet")}
            className={`h-7 px-3 text-xs ${deviceMode === "tablet" ? "bg-white shadow-sm" : ""}`}
          >
            <Tablet className="h-3.5 w-3.5 mr-1.5" />
            Tablet
          </Button>
          <Button
            variant={deviceMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => changeDevice("mobile")}
            className={`h-7 px-3 text-xs ${deviceMode === "mobile" ? "bg-white shadow-sm" : ""}`}
          >
            <Smartphone className="h-3.5 w-3.5 mr-1.5" />
            Mobile
          </Button>
        </div>

        {/* Actions groupées */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUndo}
            className="h-8 w-8 p-0"
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRedo}
            className="h-8 w-8 p-0"
            title="Refaire (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleCodeView}
            className="h-8 px-2 text-xs"
            title="Code"
          >
            <FileCode className="h-3.5 w-3.5 mr-1.5" />
            Code
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePreview}
            className="h-8 px-2 text-xs"
            title="Aperçu"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Aperçu
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleImport}
            className="h-8 px-2 text-xs"
            title="Importer un template HTML"
          >
            <FileCode className="h-3.5 w-3.5 mr-1.5" />
            Importer HTML
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSettingsOpen(true)}
            className="h-8 px-2 text-xs"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Paramètres
          </Button>
          <Button 
            size="sm" 
            onClick={() => saveMutation.mutate()}
            className="h-8 px-3 text-xs"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Zone d'édition - Layout moderne */}
      <div className="flex-1 flex overflow-hidden bg-muted/30">
        {/* Panneau gauche - Blocs */}
        {blocksPanelOpen ? (
          <div className="w-72 border-r-2 bg-white overflow-hidden flex flex-col shadow-sm transition-all duration-300">
            <div className="px-5 py-4 border-b-2 bg-gradient-to-r from-muted/50 to-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-0.5">Blocs</h3>
                  <p className="text-xs text-muted-foreground font-medium">Glissez-déposez pour ajouter</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!editorRef.current) return;
                      if (confirm("Tout supprimer ?")) {
                        editorRef.current.setComponents("");
                      }
                    }}
                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                    title="Tout supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBlocksPanelOpen(false)}
                    className="h-7 w-7 hover:bg-muted"
                    title="Fermer le panneau"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-muted/10">
              <div id="blocks"></div>
            </div>
          </div>
        ) : (
          <div className="border-r-2 bg-white flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBlocksPanelOpen(true)}
              className="h-10 w-10 hover:bg-primary/10 hover:text-primary rounded-none"
              title="Ouvrir le panneau de blocs"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Canvas central - Design épuré */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30">
          <div className="h-full w-full p-8 overflow-auto">
            <div 
              ref={containerRef} 
              className={`h-full mx-auto bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${
                deviceMode === "mobile" ? "max-w-sm" : 
                deviceMode === "tablet" ? "max-w-2xl" : 
                "max-w-4xl"
              }`}
            ></div>
          </div>
        </div>

        {/* Panneau droit - Styles */}
        {stylesPanelOpen ? (
          <div className="w-80 border-l-2 bg-white overflow-hidden flex flex-col shadow-sm transition-all duration-300">
            <div className="px-5 py-4 border-b-2 bg-gradient-to-r from-muted/50 to-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-0.5">Styles</h3>
                  <p className="text-xs text-muted-foreground font-medium">Personnalisez l'apparence</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                    title="Layers"
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStylesPanelOpen(false)}
                    className="h-7 w-7 hover:bg-muted"
                    title="Fermer le panneau"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-muted/10">
              <div id="styles"></div>
            </div>
          </div>
        ) : (
          <div className="border-l-2 bg-white flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStylesPanelOpen(true)}
              className="h-10 w-10 hover:bg-primary/10 hover:text-primary rounded-none"
              title="Ouvrir le panneau de styles"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Dialog paramètres */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres du template</DialogTitle>
            <DialogDescription>
              Configurez les informations de votre template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du template</Label>
              <Input
                id="nom"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Mon template d'email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Description de votre template..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de template</Label>
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="annonce">Annonce</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => saveMutation.mutate()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog import HTML */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Importer un template HTML</DialogTitle>
            <DialogDescription>
              Importez un template HTML acheté ou créé ailleurs. Collez le code HTML ou importez un fichier .html
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Import depuis fichier */}
            <div className="space-y-2">
              <Label htmlFor="file-import">Importer depuis un fichier</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-import"
                  type="file"
                  accept=".html"
                  onChange={handleFileImport}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Sélectionnez un fichier .html
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou
                </span>
              </div>
            </div>

            {/* Import depuis code */}
            <div className="space-y-2">
              <Label htmlFor="html-import">Coller le code HTML</Label>
              <Textarea
                id="html-import"
                value={importHtml}
                onChange={(e) => setImportHtml(e.target.value)}
                placeholder={`<html>
  <body>
    <div style="max-width: 600px; margin: 0 auto;">
      <!-- Votre template HTML ici -->
    </div>
  </body>
</html>`}
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Vous pouvez coller un document HTML complet ou juste le contenu du body
              </p>
            </div>

            {/* Sources recommandées */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="text-sm font-semibold mb-2">Où trouver des templates ?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>ThemeForest</strong> - Templates premium professionnels</li>
                <li>• <strong>Stripo</strong> - Templates gratuits et premium</li>
                <li>• <strong>Really Good Emails</strong> - Collection gratuite</li>
                <li>• <strong>Mailchimp</strong> - Templates gratuits</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportOpen(false);
              setImportHtml("");
            }}>
              Annuler
            </Button>
            <Button onClick={handleImportConfirm} disabled={!importHtml.trim()}>
              Importer dans l'éditeur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
