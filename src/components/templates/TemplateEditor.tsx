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
import { ArrowLeft, Save, Eye, Download, Settings } from "lucide-react";
import { toast } from "sonner";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "grapesjs-preset-newsletter";

interface TemplateEditorProps {
  templateId: string | null;
  onClose: () => void;
}

export function TemplateEditor({ templateId, onClose }: TemplateEditorProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(!templateId);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateType, setTemplateType] = useState("newsletter");

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
      plugins: ["gjs-preset-newsletter"],
      pluginsOpts: {
        "gjs-preset-newsletter": {
          modalTitleImport: "Importer du code",
          modalLabelImport: "Collez votre HTML ici",
          modalBtnImport: "Importer",
          codeViewerTheme: "material",
          importPlaceholder: "<div>Insérez votre code HTML ici</div>",
        },
      },
      blockManager: {
        appendTo: "#blocks",
      },
      styleManager: {
        appendTo: "#styles",
        sectors: [
          {
            name: "Dimensions",
            open: false,
            buildProps: ["width", "height", "max-width", "min-height", "margin", "padding"],
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
            ],
          },
          {
            name: "Décorations",
            open: false,
            buildProps: [
              "background-color",
              "border-radius",
              "border",
              "box-shadow",
              "background",
            ],
          },
        ],
      },
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
        ],
      },
    });

    editorRef.current = editor;

    // Charger le template existant
    if (template && template.content_json) {
      editor.loadProjectData(template.content_json as any);
    } else {
      // Template par défaut
      editor.setComponents(`
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #5A6D7C; color: white; padding: 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 32px;">Votre Titre</h1>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333333;">
              Bienvenue dans votre template d'email. Utilisez les blocs à gauche pour personnaliser votre design.
            </p>
            <a href="#" style="display: inline-block; background: #D4A55D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              Bouton d'action
            </a>
          </div>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
            <p>© 2025 Votre entreprise. Tous droits réservés.</p>
          </div>
        </div>
      `);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editorRef.current) throw new Error("Éditeur non initialisé");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Barre d'outils */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">
              {templateName || "Nouveau template"}
            </h2>
            <p className="text-xs text-muted-foreground">Éditeur de template</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Aperçu
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate()}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Zone d'édition */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panneau latéral gauche - Blocs */}
        <div className="w-64 border-r bg-card overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Blocs</h3>
            <div id="blocks" className="space-y-2"></div>
          </div>
        </div>

        {/* Canvas central */}
        <div className="flex-1 bg-muted/30">
          <div ref={containerRef} className="h-full"></div>
        </div>

        {/* Panneau latéral droit - Styles */}
        <div className="w-64 border-l bg-card overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Styles</h3>
            <div id="styles"></div>
          </div>
        </div>
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
    </div>
  );
}
