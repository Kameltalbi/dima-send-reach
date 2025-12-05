import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import newsletterPreset from "grapesjs-preset-newsletter";

interface TemplateEditorBrevoProps {
  initialContent?: string;
  onSave: (html: string) => void;
  deviceView?: "desktop" | "mobile";
}

export function TemplateEditorBrevo({ initialContent, onSave, deviceView = "desktop" }: TemplateEditorBrevoProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialContentRef = useRef<string | undefined>(initialContent);
  
  // Garder la ref à jour avec la dernière valeur de initialContent
  useEffect(() => {
    initialContentRef.current = initialContent;
  }, [initialContent]);

  // Fonction pour charger le HTML dans l'éditeur
  const loadHtmlIntoEditor = useCallback((editorInstance: any, html: string) => {
    try {
      console.log("loadHtmlIntoEditor appelé avec HTML de longueur:", html.length);
      
      if (!html || !html.trim()) {
        console.error("Le contenu HTML est vide");
        return;
      }
      
      // Désactiver temporairement l'événement update
      editorInstance.off('update');
      
      // Extraire les styles
      let css = '';
      const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (styleMatches) {
        styleMatches.forEach(styleTag => {
          const cssMatch = styleTag.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
          if (cssMatch && cssMatch[1]) {
            css += cssMatch[1] + '\n';
          }
        });
        console.log("CSS extrait, longueur:", css.length);
      }
      
      // Extraire le contenu du body
      let bodyContent = html;
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
        console.log("Contenu body extrait");
      }
      
      // Supprimer les balises inutiles
      bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      bodyContent = bodyContent.replace(/<!DOCTYPE[^>]*>/gi, '');
      bodyContent = bodyContent.replace(/<\/?html[^>]*>/gi, '');
      bodyContent = bodyContent.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
      bodyContent = bodyContent.replace(/<\/?body[^>]*>/gi, '');
      bodyContent = bodyContent.trim();
      
      console.log("Contenu nettoyé, longueur:", bodyContent.length);
      console.log("Aperçu:", bodyContent.substring(0, 300));
      
      // Charger le contenu
      editorInstance.setComponents(bodyContent);
      if (css) {
        editorInstance.setStyle(css);
      }
      console.log("setComponents et setStyle appelés");
      
      // Forcer le rendu après un délai
      setTimeout(() => {
        try {
          // Vérifier si le contenu est chargé
          const wrapper = editorInstance.getWrapper();
          const components = wrapper?.components();
          const count = components?.length ? components.length() : 0;
          console.log("Nombre de composants:", count);
          
          // Forcer le refresh
          editorInstance.refresh();
          console.log("refresh() appelé");
          
          // Réactiver l'événement update
          const updateHandler = () => {
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
              const htmlOut = editorInstance.getHtml();
              const cssOut = editorInstance.getCss();
              const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${cssOut}</style>
</head>
<body>
  ${htmlOut}
</body>
</html>`;
              onSave(fullHtml);
            }, 500);
          };
          editorInstance.on('update', updateHandler);
          console.log("Événement update réactivé");
        } catch (error) {
          console.error("Erreur lors du chargement:", error);
        }
      }, 300);
    } catch (error) {
      console.error("Error loading HTML:", error);
    }
  }, [onSave]);

  // Fonction pour rendre les composants éditables
  const makeComponentEditable = (component: any) => {
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
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "600px",
      width: "100%",
      storageManager: false,
      plugins: [newsletterPreset],
      pluginsOpts: {
        [newsletterPreset as any]: {
          modalTitleImport: 'Importer un template',
          modalBtnImport: 'Importer',
        }
      },
      // Désactiver les panneaux par défaut de GrapesJS
      panels: {
        defaults: []
      },
      // Configurer le styleManager pour qu'il s'affiche dans la sidebar (optionnel)
      styleManager: (() => {
        const stylePanel = document.getElementById("grapesjs-style-panel");
        if (!stylePanel) {
          // Si le panneau n'existe pas encore, ne pas configurer le styleManager
          return undefined;
        }
        return {
          appendTo: stylePanel,
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
              "background",
              "border-radius",
              "border",
              "box-shadow",
              "opacity",
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
            ],
          },
        ],
        };
      })(),
      // Masquer la toolbar du canvas
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
          "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
        ],
      },
      blockManager: {
        blocks: [
          {
            id: 'section',
            label: 'Section',
            category: 'Layout',
            content: '<div data-gjs-type="section" style="padding: 20px; background: #ffffff;"></div>',
          },
          {
            id: 'column',
            label: 'Colonne',
            category: 'Layout',
            content: '<div data-gjs-type="column" style="padding: 10px;"></div>',
          },
          {
            id: 'text',
            label: 'Texte',
            category: 'Contenu',
            content: '<div data-gjs-type="text">Votre texte ici</div>',
          },
          {
            id: 'image',
            label: 'Image',
            category: 'Contenu',
            content: { type: 'image' },
            activate: true,
          },
          {
            id: 'button',
            label: 'Bouton',
            category: 'Contenu',
            content: '<a href="#" data-gjs-type="link" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Cliquez ici</a>',
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

    // Attendre que l'éditeur soit complètement chargé avant de charger le contenu
    editor.on('load', () => {
      console.log("Événement 'load' de GrapesJS déclenché");
      // Utiliser la ref pour avoir la dernière valeur de initialContent
      const contentToLoad = initialContentRef.current;
      console.log("Contenu à charger:", contentToLoad ? `${contentToLoad.length} caractères` : "aucun");
      
      // Charger le contenu initial une fois que l'éditeur est prêt
      if (contentToLoad && contentToLoad.trim()) {
        console.log("Chargement du contenu initial depuis l'événement load");
        loadHtmlIntoEditor(editor, contentToLoad);
      } else {
        console.log("Pas de contenu initial, chargement du template par défaut");
        setDefaultTemplate(editor);
      }
    });

    // Sauvegarder automatiquement les changements avec debounce
    editor.on('update', () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
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
      }, 500); // Debounce de 500ms
    });

    // Gérer le drag and drop depuis la sidebar
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const blockType = e.dataTransfer?.getData("block-type");
      const sectionHtml = e.dataTransfer?.getData("text/html");
      
      console.log("Drop détecté - blockType:", blockType, "sectionHtml:", sectionHtml?.substring(0, 100));
      
      if (sectionHtml && editor) {
        // Ajouter une section complète
        try {
          const wrapper = editor.getWrapper();
          wrapper.components().add(sectionHtml);
          editor.refresh();
          toast.success("Section ajoutée avec succès");
        } catch (error) {
          console.error("Error adding section:", error);
          toast.error("Erreur lors de l'ajout de la section");
        }
      } else if (blockType && editor) {
        // Ajouter un bloc simple
        addBlockToEditor(editor, blockType);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Attacher les événements au conteneur
    containerRef.current?.addEventListener('drop', handleDrop);
    containerRef.current?.addEventListener('dragover', handleDragOver);
    
    // Attacher aussi à l'iframe du canvas GrapesJS
    setTimeout(() => {
      try {
        const frame = editor.Canvas?.getFrameEl();
        if (frame) {
          frame.addEventListener('dragover', handleDragOver);
          frame.addEventListener('drop', handleDrop);
          
          // Aussi sur le document de l'iframe
          if (frame.contentDocument) {
            frame.contentDocument.addEventListener('dragover', handleDragOver);
            frame.contentDocument.addEventListener('drop', handleDrop);
          }
        }
      } catch (e) {
        console.warn("Erreur lors de l'attachement des événements à l'iframe:", e);
      }
    }, 500);

    function setDefaultTemplate(editorInstance: any) {
      // Vérifier que l'éditeur est prêt avant d'appeler getComponents
      if (!editorInstance || typeof editorInstance.getComponents !== 'function') {
        console.warn('Editor not ready yet, retrying...');
        setTimeout(() => setDefaultTemplate(editorInstance), 200);
        return;
      }

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
        try {
          const components = editorInstance.getComponents();
          if (components && typeof components.each === 'function') {
            components.each((component: any) => {
              makeComponentEditable(component);
            });
          }
        } catch (error) {
          console.error('Error accessing components:', error);
        }
      }, 200);
    }

    function addBlockToEditor(editorInstance: any, blockType: string) {
      const wrapper = editorInstance.getWrapper();
      let blockContent = '';

      switch (blockType) {
        case 'titre':
          blockContent = '<h1 data-gjs-type="text" style="font-size: 32px; font-weight: 700; margin: 20px 0;">Votre titre</h1>';
          break;
        case 'texte':
          blockContent = '<p data-gjs-type="text" style="font-size: 16px; line-height: 1.6; margin: 20px 0;">Votre texte ici</p>';
          break;
        case 'image':
          blockContent = '<img src="https://via.placeholder.com/600x300" alt="Image" style="max-width: 100%; height: auto; display: block; margin: 20px auto;" />';
          break;
        case 'bouton':
          blockContent = '<a href="#" data-gjs-type="link" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Bouton</a>';
          break;
        case 'diviseur':
          blockContent = '<hr data-gjs-type="default" style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>';
          break;
        case 'video':
          blockContent = '<div style="position: relative; padding-bottom: 56.25%; height: 0; margin: 20px 0;"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>';
          break;
        case 'logo':
          blockContent = '<img src="https://via.placeholder.com/200x80?text=Logo" alt="Logo" style="max-width: 200px; height: auto; display: block; margin: 20px auto;" />';
          break;
        case 'social':
          blockContent = '<div style="text-align: center; margin: 20px 0;"><a href="#" style="margin: 0 10px; display: inline-block;"><img src="https://via.placeholder.com/32x32?text=f" alt="Facebook" /></a><a href="#" style="margin: 0 10px; display: inline-block;"><img src="https://via.placeholder.com/32x32?text=t" alt="Twitter" /></a><a href="#" style="margin: 0 10px; display: inline-block;"><img src="https://via.placeholder.com/32x32?text=in" alt="LinkedIn" /></a></div>';
          break;
        case 'html':
          blockContent = '<div data-gjs-type="text" style="padding: 20px; background: #f5f5f5; border: 1px dashed #ccc; margin: 20px 0;">Code HTML personnalisé</div>';
          break;
        case 'paiement':
          blockContent = '<a href="#" data-gjs-type="link" style="display: inline-block; padding: 14px 28px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">💳 Payer maintenant</a>';
          break;
        default:
          blockContent = '<div data-gjs-type="text" style="padding: 20px;">Nouveau bloc</div>';
      }

      wrapper.components().add(blockContent);
      editorInstance.refresh();
      toast.success(`Bloc "${blockType}" ajouté`);
      console.log("Bloc ajouté:", blockType);
    }

    // Ajuster la largeur selon le device view
    if (deviceView === "mobile") {
      editor.setDevice("Mobile");
    } else {
      editor.setDevice("Desktop");
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      containerRef.current?.removeEventListener('drop', handleDrop);
      containerRef.current?.removeEventListener('dragover', handleDragOver);
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, [onSave, deviceView]);

  // Surveiller les changements de initialContent après l'initialisation
  const previousContentRef = useRef<string>("");
  useEffect(() => {
    if (!initialContent || initialContent.trim() === "") {
      console.log("initialContent est vide ou null");
      return;
    }
    
    if (!editorRef.current) {
      console.log("editorRef.current n'est pas encore défini");
      return;
    }
    
    // Éviter de recharger le même contenu
    if (previousContentRef.current === initialContent) {
      console.log("Le contenu est identique, pas de rechargement");
      return;
    }
    
    console.log("Chargement du contenu dans l'éditeur, longueur:", initialContent.length);
    
    // Vérifier que l'éditeur est prêt (a la méthode getComponents)
    if (typeof editorRef.current.getComponents !== 'function') {
      console.log("L'éditeur n'est pas encore prêt, attente...");
      // Attendre un peu plus si l'éditeur n'est pas encore prêt
      const timer = setTimeout(() => {
        if (editorRef.current && typeof editorRef.current.getComponents === 'function') {
          console.log("Chargement du contenu après attente...");
          loadHtmlIntoEditor(editorRef.current, initialContent);
          previousContentRef.current = initialContent;
        } else {
          console.error("L'éditeur n'est toujours pas prêt après l'attente");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // Attendre que l'éditeur soit prêt
    const timer = setTimeout(() => {
      try {
        console.log("Chargement du contenu dans l'éditeur...");
        loadHtmlIntoEditor(editorRef.current, initialContent);
        previousContentRef.current = initialContent;
        console.log("Contenu chargé avec succès");
      } catch (error) {
        console.error('Error loading content into editor:', error);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [initialContent, loadHtmlIntoEditor]);

  return (
    <div 
      ref={containerRef}
      className="w-full min-h-[600px]"
      style={{ 
        backgroundColor: '#ffffff',
      }}
    />
  );
}

