import { useEffect, useRef, useState } from "react";
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

    // Charger le contenu initial
    if (initialContent) {
      loadHtmlIntoEditor(editor, initialContent);
    } else {
      setDefaultTemplate(editor);
    }

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
      if (blockType && editor) {
        addBlockToEditor(editor, blockType);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    containerRef.current?.addEventListener('drop', handleDrop);
    containerRef.current?.addEventListener('dragover', handleDragOver);

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
        setDefaultTemplate(editor);
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
  }, [initialContent, onSave, deviceView]);

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

