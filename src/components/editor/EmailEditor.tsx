import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import newsletterPreset from "grapesjs-preset-newsletter";
import { Eye, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailEditorProps {
  initialContent?: string;
  onSave: (html: string) => void;
  onContentChange?: (html: string) => void;
  deviceView?: "desktop" | "mobile";
}

// Configuration des blocs email
const emailBlocks = [
  {
    id: 'heading',
    label: 'Titre',
    category: 'Contenu',
    content: '<h1 style="font-size: 28px; font-weight: 700; margin: 20px 0; color: #333; text-align: center;">Votre titre ici</h1>',
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 4v3h5.5v12h3V7H19V4z"/></svg>',
  },
  {
    id: 'text',
    label: 'Texte',
    category: 'Contenu',
    content: '<p style="font-size: 16px; line-height: 1.6; margin: 15px 0; color: #555;">Votre texte ici. Cliquez pour modifier.</p>',
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"/></svg>',
  },
  {
    id: 'image',
    label: 'Image',
    category: 'Contenu',
    content: '<img src="https://via.placeholder.com/600x300?text=Votre+Image" alt="Image" style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />',
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
  },
  {
    id: 'button',
    label: 'Bouton',
    category: 'Contenu',
    content: '<a href="#" style="display: inline-block; padding: 14px 32px; background: #5A6D7C; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; text-align: center;">Cliquez ici</a>',
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z"/></svg>',
  },
  {
    id: 'divider',
    label: 'Diviseur',
    category: 'Contenu',
    content: '<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />',
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 11h16v2H4z"/></svg>',
  },
  {
    id: 'spacer',
    label: 'Espace',
    category: 'Contenu',
    content: '<div style="height: 40px;"></div>',
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z"/></svg>',
  },
  {
    id: 'two-columns',
    label: '2 Colonnes',
    category: 'Mise en page',
    content: `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
        <tr>
          <td width="50%" style="padding: 10px; vertical-align: top;">
            <p style="margin: 0; color: #555;">Colonne gauche</p>
          </td>
          <td width="50%" style="padding: 10px; vertical-align: top;">
            <p style="margin: 0; color: #555;">Colonne droite</p>
          </td>
        </tr>
      </table>
    `,
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h5V5h-5v13zm-6 0h5V5H4v13zM16 5v13h5V5h-5z"/></svg>',
  },
  {
    id: 'three-columns',
    label: '3 Colonnes',
    category: 'Mise en page',
    content: `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
        <tr>
          <td width="33.33%" style="padding: 10px; vertical-align: top;">
            <p style="margin: 0; color: #555;">Colonne 1</p>
          </td>
          <td width="33.33%" style="padding: 10px; vertical-align: top;">
            <p style="margin: 0; color: #555;">Colonne 2</p>
          </td>
          <td width="33.33%" style="padding: 10px; vertical-align: top;">
            <p style="margin: 0; color: #555;">Colonne 3</p>
          </td>
        </tr>
      </table>
    `,
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5v13h5V5H4zm6 0v13h5V5h-5zm6 0v13h5V5h-5z"/></svg>',
  },
  {
    id: 'social',
    label: 'Réseaux sociaux',
    category: 'Contenu',
    content: `
      <div style="text-align: center; margin: 20px 0;">
        <a href="#" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/32/733/733547.png" alt="Facebook" style="width: 32px; height: 32px;" /></a>
        <a href="#" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/32/733/733558.png" alt="Twitter" style="width: 32px; height: 32px;" /></a>
        <a href="#" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/32/733/733561.png" alt="Instagram" style="width: 32px; height: 32px;" /></a>
        <a href="#" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/32/733/733609.png" alt="LinkedIn" style="width: 32px; height: 32px;" /></a>
      </div>
    `,
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
  },
  {
    id: 'footer',
    label: 'Pied de page',
    category: 'Sections',
    content: `
      <div style="background: #f5f5f5; padding: 30px 20px; text-align: center; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; margin: 0 0 10px 0;">© 2024 Votre Entreprise. Tous droits réservés.</p>
        <p style="font-size: 12px; color: #888; margin: 0;">
          <a href="#" style="color: #5A6D7C; text-decoration: none;">Se désabonner</a> | 
          <a href="#" style="color: #5A6D7C; text-decoration: none;">Politique de confidentialité</a>
        </p>
      </div>
    `,
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-4h16v4z"/></svg>',
  },
  {
    id: 'header',
    label: 'En-tête',
    category: 'Sections',
    content: `
      <div style="background: #5A6D7C; padding: 30px 20px; text-align: center;">
        <img src="https://via.placeholder.com/150x50?text=LOGO" alt="Logo" style="max-width: 150px; height: auto; margin-bottom: 15px;" />
        <h1 style="color: white; font-size: 24px; margin: 0;">Bienvenue</h1>
      </div>
    `,
    media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4H4V6h16v2z"/></svg>',
  },
];

export function EmailEditor({ initialContent, onSave, onContentChange, deviceView = "desktop" }: EmailEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blocksContainerRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isReady, setIsReady] = useState(false);

  // Réagir aux changements de deviceView depuis le parent
  useEffect(() => {
    if (editorRef.current && isReady) {
      const deviceName = deviceView === "mobile" ? "Mobile" : "Desktop";
      editorRef.current.setDevice(deviceName);
    }
  }, [deviceView, isReady]);

  // Récupérer le HTML actuel
  const getCurrentHtml = useCallback((): string => {
    if (!editorRef.current) return "";
    try {
      const html = editorRef.current.runCommand('gjs-get-inlined-html');
      return html || "";
    } catch {
      const rawHtml = editorRef.current.getHtml();
      const css = editorRef.current.getCss();
      return `<!DOCTYPE html><html><head><style>${css}</style></head><body>${rawHtml}</body></html>`;
    }
  }, []);

  // Preview
  const handlePreview = useCallback(() => {
    const html = getCurrentHtml();
    setPreviewHtml(html);
    setShowPreview(true);
  }, [getCurrentHtml]);

  // Initialiser l'éditeur
  useEffect(() => {
    if (!containerRef.current || !blocksContainerRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "100%",
      storageManager: false,
      avoidInlineStyle: false,
      forceClass: false,
      plugins: [newsletterPreset],
      pluginsOpts: {
        [newsletterPreset as any]: {
          modalTitleImport: 'Importer un template',
          modalBtnImport: 'Importer',
        }
      },
      blockManager: {
        appendTo: blocksContainerRef.current,
        blocks: emailBlocks,
      },
      styleManager: {
        appendTo: '#email-editor-styles',
        sectors: [
          {
            name: "Dimensions",
            open: true,
            buildProps: ["width", "height", "padding", "margin"],
          },
          {
            name: "Typographie",
            open: false,
            buildProps: ["font-family", "font-size", "font-weight", "color", "text-align", "line-height"],
          },
          {
            name: "Décoration",
            open: false,
            buildProps: ["background-color", "border-radius", "border"],
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
          { name: "Desktop", width: "" },
          { name: "Mobile", width: "320px", widthMedia: "480px" },
        ],
      },
      // Panneau vide - on utilise nos propres panneaux
      panels: { defaults: [] },
    });

    editorRef.current = editor;

    // Configurer les composants par défaut
    const defaults = editor.DomComponents.getType('default')?.model.prototype.defaults;
    if (defaults) {
      defaults.draggable = true;
      defaults.droppable = true;
      defaults.editable = true;
      defaults.selectable = true;
      defaults.hoverable = true;
    }

    // Charger le contenu initial
    editor.on('load', () => {
      if (initialContent) {
        // Nettoyer le HTML
        let content = initialContent;
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) content = bodyMatch[1];
        
        content = content
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<\/?html[^>]*>/gi, '')
          .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
          .replace(/<\/?body[^>]*>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<meta[^>]*>/gi, '')
          .replace(/<link[^>]*>/gi, '')
          .trim();

        if (content) {
          editor.setComponents(content);
        }
      }
      
      setIsReady(true);
    });

    // Écouter les changements
    editor.on('update', () => {
      if (onContentChange) {
        const html = getCurrentHtml();
        onContentChange(html);
      }
    });

    // Cleanup
    return () => {
      editor.destroy();
    };
  }, []);

  // Exposer la fonction getCurrentHtml via onSave
  useEffect(() => {
    if (isReady && onSave) {
      // Créer une fonction qui sera appelée par le parent pour sauvegarder
      const saveInterval = setInterval(() => {
        const html = getCurrentHtml();
        if (html) onSave(html);
      }, 30000); // Auto-save toutes les 30s

      return () => clearInterval(saveInterval);
    }
  }, [isReady, onSave, getCurrentHtml]);

  return (
    <div className="flex h-full bg-background">
      {/* Panneau gauche - Blocs */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Blocs</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Glissez les éléments sur le canvas
          </p>
        </div>
        <div 
          ref={blocksContainerRef} 
          className="flex-1 overflow-y-auto p-2"
          id="email-editor-blocks"
        />
      </div>

      {/* Canvas central */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editorRef.current?.setDevice("Desktop")}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editorRef.current?.setDevice("Mobile")}
              className="gap-2"
            >
              <Smartphone className="h-4 w-4" />
              Mobile
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Aperçu
          </Button>
        </div>

        {/* Zone d'édition */}
        <div className="flex-1 overflow-hidden bg-muted/30">
          <div 
            ref={containerRef} 
            className="h-full"
            style={{ 
              background: 'repeating-conic-gradient(#f5f5f5 0% 25%, transparent 0% 50%) 50% / 20px 20px',
            }}
          />
        </div>
      </div>

      {/* Panneau droit - Styles */}
      <div className="w-64 border-l bg-card flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Styles</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Personnalisez l'élément sélectionné
          </p>
        </div>
        <div 
          id="email-editor-styles" 
          className="flex-1 overflow-y-auto p-2"
        />
      </div>

      {/* Dialog Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Aperçu de l'email</span>
              <div className="flex gap-2">
                <Button
                  variant={previewDevice === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex justify-center bg-muted/30 rounded-lg p-4">
            <iframe
              srcDoc={previewHtml}
              className="bg-white shadow-lg rounded"
              style={{
                width: previewDevice === "mobile" ? "375px" : "100%",
                height: "100%",
                border: "none",
              }}
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmailEditor;
