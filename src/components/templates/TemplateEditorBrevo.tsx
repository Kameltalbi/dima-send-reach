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

  // Fonction pour charger le HTML dans l'éditeur
  const loadHtmlIntoEditor = useCallback((editorInstance: any, html: string) => {
    try {
      console.log("loadHtmlIntoEditor appelé avec HTML de longueur:", html.length);
      let htmlContent = html.trim();
      
      if (!htmlContent) {
        console.error("Le contenu HTML est vide après trim");
        return;
      }
      
      // Extraire le contenu du body si présent (plusieurs fois pour être sûr)
      let bodyMatch;
      let extractionCount = 0;
      while ((bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i))) {
        htmlContent = bodyMatch[1];
        extractionCount++;
        console.log(`Contenu extrait du body (itération ${extractionCount})`);
      }
      
      // Supprimer toute balise body restante (ouvrante ou fermante) - plusieurs fois pour être sûr
      let previousLength = htmlContent.length;
      htmlContent = htmlContent.replace(/<\/?body[^>]*>/gi, '');
      while (htmlContent.length !== previousLength) {
        previousLength = htmlContent.length;
        htmlContent = htmlContent.replace(/<\/?body[^>]*>/gi, '');
      }
      
      if (extractionCount > 0 || previousLength !== htmlContent.length) {
        console.log("Toutes les balises body ont été supprimées");
      }
      
      // Extraire le contenu du html si présent
      const htmlMatch = htmlContent.match(/<html[^>]*>([\s\S]*)<\/html>/i);
      if (htmlMatch) {
        htmlContent = htmlMatch[1];
        console.log("Contenu extrait du html");
      }
      
      // Supprimer les balises DOCTYPE, html, head, style restantes
      htmlContent = htmlContent.replace(/<!DOCTYPE[^>]*>/gi, '');
      htmlContent = htmlContent.replace(/<\/?html[^>]*>/gi, '');
      htmlContent = htmlContent.replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, '');
      htmlContent = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Nettoyer les espaces en début et fin
      htmlContent = htmlContent.trim();
      
      // Vérifier si le contenu a déjà un wrapper ou des sections GrapesJS
      const hasWrapper = htmlContent.includes('data-gjs-type="wrapper"');
      const hasSection = htmlContent.includes('data-gjs-type="section"');
      
      // Si le contenu n'a pas de structure GrapesJS, en ajouter un wrapper
      if (!hasWrapper && !hasSection) {
        htmlContent = `<div data-gjs-type="wrapper">${htmlContent}</div>`;
        console.log("Wrapper GrapesJS ajouté");
      }
      
      console.log("Chargement du contenu dans GrapesJS, longueur finale:", htmlContent.length);
      console.log("Aperçu du contenu (premiers 200 caractères):", htmlContent.substring(0, 200));
      
      // Désactiver temporairement l'événement update pour éviter la boucle infinie
      editorInstance.off('update');
      
      // Charger le contenu avec setComponents (méthode recommandée par GrapesJS)
      editorInstance.setComponents(htmlContent);
      console.log("setComponents appelé");
      
      // Attendre que le contenu soit chargé puis forcer le rendu avec refresh()
      setTimeout(() => {
        try {
          const components = editorInstance.getComponents();
          // GrapesJS utilise components.length() comme méthode, pas comme propriété
          const componentCount = components && typeof components.length === 'function' ? components.length() : (components ? 1 : 0);
          console.log(`Nombre de composants chargés: ${componentCount}`);
          
          if (componentCount === 0) {
            console.warn("Aucun composant chargé, tentative de rechargement...");
            // Réessayer avec setComponents
            editorInstance.setComponents(htmlContent);
          }
          
          // Utiliser refresh() comme dans TemplateEditor.tsx pour forcer le rendu
          try {
            // Vérifier que le canvas est prêt avant d'appeler refresh()
            const canvas = editorInstance.Canvas;
            if (canvas && canvas.getFrameEl) {
              const frame = canvas.getFrameEl();
              if (frame && frame.contentDocument) {
                // Appeler refresh() pour forcer le rendu du contenu dans le frame
                editorInstance.refresh();
                console.log("refresh() appelé pour forcer le rendu");
                
                // Vérifier que le contenu est maintenant dans le frame
                setTimeout(() => {
                  const frameBody = frame.contentDocument?.body;
                  if (frameBody) {
                    const bodyContent = frameBody.innerHTML;
                    console.log("Contenu du frame body après refresh:", bodyContent.substring(0, 200));
                  }
                }, 100);
              }
            } else {
              // Si le canvas n'est pas encore prêt, essayer refresh() quand même
              editorInstance.refresh();
              console.log("refresh() appelé (canvas peut ne pas être prêt)");
            }
          } catch (refreshError) {
            console.warn("Erreur lors de l'appel à refresh():", refreshError);
            // Essayer une alternative : sélectionner puis désélectionner le wrapper
            try {
              const wrapper = editorInstance.getWrapper();
              if (wrapper) {
                editorInstance.select(wrapper);
                setTimeout(() => {
                  editorInstance.select(null);
                  console.log("Wrapper sélectionné puis désélectionné pour forcer le rendu");
                }, 50);
              }
            } catch (selectError) {
              console.warn("Erreur lors de la sélection du wrapper:", selectError);
            }
          }
        } catch (error) {
          console.warn("Erreur lors de la vérification du chargement:", error);
        }
      }, 300);
      
      // Attendre que le contenu soit rendu
      setTimeout(() => {
        try {
          // Ne pas appeler refresh() car cela cause des erreurs si le canvas n'est pas prêt
          // Le contenu devrait s'afficher automatiquement après setComponents
          
          const components = editorInstance.getComponents();
          if (components && typeof components.each === 'function') {
            console.log("Rendu des composants éditables");
            components.each((component: any) => {
              makeComponentEditable(component);
            });
          } else {
            console.warn("getComponents() ne retourne pas un objet avec each()");
          }
          
          // Réactiver l'événement update après le chargement (avec un délai pour éviter la boucle)
          setTimeout(() => {
            const updateHandler = () => {
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }
              saveTimeoutRef.current = setTimeout(() => {
                const html = editorInstance.getHtml();
                const css = editorInstance.getCss();
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
              }, 500);
            };
            editorInstance.on('update', updateHandler);
            console.log("Événement update réactivé");
          }, 1000);
        } catch (error) {
          console.error('Error accessing components after HTML load:', error);
        }
      }, 500);
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
      height: "auto",
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
      // Charger le contenu initial une fois que l'éditeur est prêt
      if (initialContent && initialContent.trim()) {
        console.log("Chargement du contenu initial depuis l'événement load");
        loadHtmlIntoEditor(editor, initialContent);
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
      const blockType = e.dataTransfer?.getData("block-type");
      const sectionHtml = e.dataTransfer?.getData("text/html");
      
      if (sectionHtml && editor) {
        // Ajouter une section complète
        try {
          const wrapper = editor.getWrapper();
          wrapper.components().add(sectionHtml);
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
    };

    containerRef.current?.addEventListener('drop', handleDrop);
    containerRef.current?.addEventListener('dragover', handleDragOver);

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
          blockContent = { type: 'image', attributes: { src: 'https://via.placeholder.com/600x300', alt: 'Image' } };
          break;
        case 'bouton':
          blockContent = '<a href="#" data-gjs-type="link" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Bouton</a>';
          break;
        case 'diviseur':
          blockContent = '<hr data-gjs-type="default" style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"/>';
          break;
        default:
          blockContent = '<div data-gjs-type="text" style="padding: 20px;">Nouveau bloc</div>';
      }

      wrapper.components().add(blockContent);
      toast.success(`Bloc "${blockType}" ajouté`);
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

