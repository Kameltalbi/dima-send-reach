import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft,
  ChevronRight,
  Layers,
  ImagePlus,
  FolderOpen,
  Plus,
  Loader2,
  X,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import newsletterPreset from "grapesjs-preset-newsletter";

interface TemplateEditorInlineProps {
  templateId: string | null;
  initialContent?: string;
  onSave: (html: string) => void;
}

export function TemplateEditorInline({ templateId, initialContent, onSave }: TemplateEditorInlineProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [blocksPanelOpen, setBlocksPanelOpen] = useState(true);
  const [stylesPanelOpen, setStylesPanelOpen] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<"blocks" | "images">("blocks");
  const [userImages, setUserImages] = useState<{name: string, url: string}[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Charger le template si templateId est fourni
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

  // Charger les images existantes de l'utilisateur
  const loadUserImages = async () => {
    setLoadingImages(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: files, error } = await supabase.storage
        .from('template-images')
        .list(userData.user.id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      if (files && files.length > 0) {
        const images = files
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(file => ({
            name: file.name,
            url: supabase.storage.from('template-images').getPublicUrl(`${userData.user.id}/${file.name}`).data.publicUrl
          }));
        setUserImages(images);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    loadUserImages();
  }, []);

  // Insérer une image de la galerie dans l'éditeur
  const insertImageFromGallery = (imageUrl: string, imageName: string) => {
    if (!editorRef.current) return;

    const wrapper = editorRef.current.getWrapper();
    const selected = editorRef.current.getSelected();

    const imageComponent = {
      type: 'image',
      attributes: { src: imageUrl, alt: imageName },
      style: { 
        'max-width': '100%', 
        'height': 'auto',
        'display': 'block',
        'margin': '10px auto'
      }
    };

    let targetComponent;
    
    if (selected && selected.get('type') !== 'wrapper') {
      const parent = selected.parent();
      if (parent) {
        const index = parent.components().indexOf(selected);
        parent.components().add(imageComponent, { at: index + 1 });
        targetComponent = parent.components().at(index + 1);
      } else {
        wrapper.components().add(imageComponent, { at: 0 });
        targetComponent = wrapper.components().at(0);
      }
    } else {
      wrapper.components().add(imageComponent, { at: 0 });
      targetComponent = wrapper.components().at(0);
    }
    
    if (targetComponent) {
      editorRef.current.select(targetComponent);
    }
    
    toast.success(`Image "${imageName}" ajoutée!`);
  };

  // Supprimer une image de la galerie
  const deleteImageFromGallery = async (imageName: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase.storage
        .from('template-images')
        .remove([`${userData.user.id}/${imageName}`]);

      if (error) {
        toast.error('Erreur lors de la suppression');
        return;
      }

      setUserImages(prev => prev.filter(img => img.name !== imageName));
      toast.success('Image supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "auto",
      storageManager: false,
      plugins: [newsletterPreset],
      pluginsOpts: {
        [newsletterPreset as any]: {
          modalTitleImport: 'Importer un template',
          modalBtnImport: 'Importer',
        }
      },
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
          "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
        ],
      },
      assetManager: {
        embedAsBase64: false,
        autoAdd: true,
        dropzone: true,
        openAssetsOnDrop: true,
        dropzoneContent: 'Glissez vos images ici ou cliquez pour sélectionner',
        upload: false,
        uploadFile: async function(e: any) {
          const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
          if (!files || files.length === 0) return;

          try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
              toast.error('Vous devez être connecté pour uploader des images');
              return;
            }

            toast.info('Téléchargement en cours...');
            const uploadedAssets: any[] = [];

            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const fileExt = file.name.split('.').pop();
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
              const filePath = `${userData.user.id}/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('template-images')
                .upload(filePath, file);

              if (uploadError) {
                console.error('Upload error:', uploadError);
                toast.error(`Erreur: ${file.name}`);
                continue;
              }

              const { data: { publicUrl } } = supabase.storage
                .from('template-images')
                .getPublicUrl(filePath);

              uploadedAssets.push({
                src: publicUrl,
                name: file.name,
                type: 'image',
              });
            }

            if (uploadedAssets.length > 0 && editor) {
              editor.AssetManager.add(uploadedAssets);
              toast.success('Images téléchargées!');
              loadUserImages();
            }
          } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erreur lors du téléchargement');
          }
        },
      },
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
            content: { type: 'image' },
            activate: true,
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
      selectorManager: {
        appendTo: "#styles",
      },
    });
    
    // Configuration des composants
    editor.DomComponents.getType('default').model.prototype.defaults.editable = true;
    editor.DomComponents.getType('default').model.prototype.defaults.draggable = true;
    editor.DomComponents.getType('default').model.prototype.defaults.droppable = true;
    editor.DomComponents.getType('default').model.prototype.defaults.selectable = true;
    editor.DomComponents.getType('default').model.prototype.defaults.hoverable = true;
    
    const defaultToolbar = [
      { attributes: { class: 'fa fa-arrows', draggable: true, title: 'Déplacer' }, command: 'tlb-move' },
      { attributes: { class: 'fa fa-clone', title: 'Dupliquer' }, command: 'tlb-clone' },
      { attributes: { class: 'fa fa-trash-o', title: 'Supprimer' }, command: 'tlb-delete' },
    ];
    
    editor.DomComponents.getType('default').model.prototype.defaults.toolbar = defaultToolbar;

    editorRef.current = editor;

    editor.Commands.add('tlb-move', {
      run(ed: any) {
        ed.runCommand('core:component-drag');
      }
    });

    // Double-click sur image ouvre asset manager
    editor.on('component:dblclick', (component: any) => {
      if (component.get('type') === 'image') {
        editor.runCommand('open-assets', {
          target: component,
          types: ['image'],
          accept: 'image/*',
        });
      }
    });

    // S'assurer que tous les composants ont une toolbar
    editor.on('component:selected', (component: any) => {
      const currentToolbar = component.get('toolbar');
      if (!currentToolbar || currentToolbar.length === 0) {
        component.set('toolbar', [
          { attributes: { class: 'fa fa-arrows', draggable: true, title: 'Déplacer' }, command: 'tlb-move' },
          { attributes: { class: 'fa fa-clone', title: 'Dupliquer' }, command: 'tlb-clone' },
          { attributes: { class: 'fa fa-trash-o', title: 'Supprimer' }, command: 'tlb-delete' },
        ]);
      }
      
      component.set('editable', true);
      component.set('selectable', true);
      component.set('hoverable', true);
    });
    
    function makeComponentEditable(component: any) {
      component.set({
        editable: true,
        selectable: true,
        hoverable: true,
        draggable: true,
        droppable: true,
        toolbar: [
          { attributes: { class: 'fa fa-arrows', draggable: true, title: 'Déplacer' }, command: 'tlb-move' },
          { attributes: { class: 'fa fa-clone', title: 'Dupliquer' }, command: 'tlb-clone' },
          { attributes: { class: 'fa fa-trash-o', title: 'Supprimer' }, command: 'tlb-delete' },
        ],
      });
      
      const children = component.get('components');
      if (children && children.length) {
        children.each((child: any) => makeComponentEditable(child));
      }
    }

    // Charger le contenu initial
    if (template) {
      if (template.content_json && Object.keys(template.content_json).length > 0) {
        try {
          editor.loadProjectData(template.content_json as any);
          setTimeout(() => {
            editor.getComponents().each((component: any) => {
              makeComponentEditable(component);
            });
          }, 100);
        } catch (error) {
          console.error("Error loading project data:", error);
          if (template.content_html) {
            loadHtmlIntoEditor(editor, template.content_html);
          } else {
            setDefaultTemplate(editor);
          }
        }
      } else if (template.content_html) {
        loadHtmlIntoEditor(editor, template.content_html);
      } else {
        setDefaultTemplate(editor);
      }
    } else if (initialContent) {
      loadHtmlIntoEditor(editor, initialContent);
    } else {
      setDefaultTemplate(editor);
    }

    // Sauvegarder automatiquement les changements
    editor.on('update', () => {
      const html = editor.getHtml();
      const css = editor.getCss();
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
      onSave(fullHtml);
    });

    function loadHtmlIntoEditor(editorInstance: any, html: string) {
      try {
        let htmlContent = html.trim();
        
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          htmlContent = bodyMatch[1];
        }
        
        const htmlMatch = htmlContent.match(/<html[^>]*>([\s\S]*)<\/html>/i);
        if (htmlMatch) {
          htmlContent = htmlMatch[1];
        }
        
        if (!htmlContent.includes('data-gjs-type')) {
          htmlContent = `<div data-gjs-type="wrapper">${htmlContent}</div>`;
        }
        
        editorInstance.setComponents(htmlContent);
        
        setTimeout(() => {
          editorInstance.refresh();
          editorInstance.getComponents().each((component: any) => {
            makeComponentEditable(component);
          });
        }, 100);
      } catch (error) {
        console.error("Error loading HTML:", error);
        setDefaultTemplate(editorInstance);
      }
    }

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
      
      setTimeout(() => {
        editorInstance.getComponents().each((component: any) => {
          makeComponentEditable(component);
        });
      }, 100);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, [template, templateId, initialContent, onSave]);

  // Réinitialiser les panneaux quand ils sont réouverts
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

  const handleAddImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    toast.info('Téléchargement en cours...');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Vous devez être connecté pour uploader des images');
        setIsUploading(false);
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userData.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('template-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erreur: ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('template-images')
          .getPublicUrl(filePath);

        if (editorRef.current) {
          const selected = editorRef.current.getSelected();
          const wrapper = editorRef.current.getWrapper();
          
          const imageComponent = {
            type: 'image',
            attributes: { src: publicUrl, alt: file.name },
            style: { 
              'max-width': '100%', 
              'height': 'auto',
              'display': 'block',
              'margin': '10px auto'
            }
          };

          let targetComponent;
          
          if (selected && selected.get('type') !== 'wrapper') {
            const parent = selected.parent();
            if (parent) {
              const index = parent.components().indexOf(selected);
              parent.components().add(imageComponent, { at: index + 1 });
              targetComponent = parent.components().at(index + 1);
            } else {
              wrapper.components().add(imageComponent, { at: 0 });
              targetComponent = wrapper.components().at(0);
            }
          } else {
            wrapper.components().add(imageComponent, { at: 0 });
            targetComponent = wrapper.components().at(0);
          }
          
          if (targetComponent) {
            editorRef.current.select(targetComponent);
          }
          
          toast.success(`Image "${file.name}" ajoutée!`);
        }
      }
      await loadUserImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="h-full flex overflow-hidden bg-muted/30">
      {/* Panneau gauche - Blocs & Images */}
      <div className={`border-r-2 bg-white overflow-hidden flex flex-col shadow-sm transition-all duration-300 ${blocksPanelOpen ? 'w-80' : 'w-10'}`}>
        {/* Header avec onglets */}
        <div className={`border-b-2 bg-gradient-to-r from-muted/50 to-muted/30 ${blocksPanelOpen ? '' : 'hidden'}`}>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex gap-1">
              <Button
                variant={leftPanelTab === "blocks" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLeftPanelTab("blocks")}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <Layers className="h-3.5 w-3.5" />
                Blocs
              </Button>
              <Button
                variant={leftPanelTab === "images" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLeftPanelTab("images")}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Mes Images
                {userImages.length > 0 && (
                  <span className="ml-1 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                    {userImages.length}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {leftPanelTab === "blocks" && (
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
              )}
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
        
        {/* Contenu des blocs */}
        <div className={`flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-muted/10 ${blocksPanelOpen && leftPanelTab === "blocks" ? '' : 'hidden'}`}>
          <div id="blocks"></div>
        </div>

        {/* Contenu de la galerie d'images */}
        <div className={`flex-1 overflow-y-auto bg-gradient-to-b from-white to-muted/10 ${blocksPanelOpen && leftPanelTab === "images" ? 'flex flex-col' : 'hidden'}`}>
          <div className="p-3 border-b">
            <Button
              onClick={handleAddImage}
              disabled={isUploading}
              className="w-full gap-2"
              size="sm"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Ajouter une image
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loadingImages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : userImages.length === 0 ? (
              <div className="text-center py-8 px-4">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-1">Aucune image</p>
                <p className="text-xs text-muted-foreground/70">
                  Téléchargez des images pour les utiliser dans vos templates
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {userImages.map((image) => (
                  <div 
                    key={image.name} 
                    className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/30 hover:ring-2 hover:ring-primary/50 cursor-pointer transition-all"
                    onClick={() => insertImageFromGallery(image.url, image.name)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity">
                        Cliquez pour ajouter
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Supprimer cette image ?')) {
                          deleteImageFromGallery(image.name);
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {userImages.length > 0 && (
            <div className="p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={loadUserImages}
                disabled={loadingImages}
                className="w-full text-xs"
              >
                {loadingImages ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : null}
                Actualiser la galerie
              </Button>
            </div>
          )}
        </div>
        
        {/* Bouton ouvrir - affiché quand fermé */}
        <div className={`flex items-center justify-center h-full ${blocksPanelOpen ? 'hidden' : ''}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBlocksPanelOpen(true)}
            className="h-10 w-10 hover:bg-primary/10 hover:text-primary rounded-none"
            title="Ouvrir le panneau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas central */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30">
        <div className="h-full w-full p-8 overflow-auto">
          <div 
            ref={containerRef} 
            className="h-full mx-auto bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 max-w-4xl"
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

      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}

