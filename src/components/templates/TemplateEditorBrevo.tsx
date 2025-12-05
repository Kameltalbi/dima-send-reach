import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import newsletterPreset from "grapesjs-preset-newsletter";
import { Eye, X, Monitor, Smartphone, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TemplateEditorBrevoProps {
  initialContent?: string;
  onSave: (html: string) => void;
  deviceView?: "desktop" | "mobile";
  onGetCurrentHtml?: (getHtml: () => string) => void;
  onComponentSelected?: (component: any) => void;
  onOpenMediaLibrary?: (onSelect: (mediaUrl: string) => void) => void;
}

export function TemplateEditorBrevo({ initialContent, onSave, deviceView = "desktop", onGetCurrentHtml, onComponentSelected, onOpenMediaLibrary }: TemplateEditorBrevoProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialContentRef = useRef<string | undefined>(initialContent);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTarget, setLinkTarget] = useState(false);

  const handlePreview = useCallback(() => {
    if (editorRef.current) {
      try {
        // Essayer d'obtenir le HTML avec styles inline
        let html = '';
        try {
          html = editorRef.current.Commands.run('gjs-get-inlined-html');
        } catch {
          // Fallback
          const rawHtml = editorRef.current.getHtml();
          const css = editorRef.current.getCss();
          html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>${rawHtml}</body>
</html>`;
        }
        setPreviewHtml(html);
        setShowPreview(true);
      } catch (error) {
        console.error("Erreur preview:", error);
        toast.error("Erreur lors de la génération de l'aperçu");
      }
    }
  }, []);
  
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
          const count = components?.length || 0;
          console.log("Nombre de composants:", count);
          
          // Forcer le refresh
          editorInstance.refresh();
          console.log("refresh() appelé");
          
          // Appliquer les styles inline à tous les composants
          if (components && components.models) {
            components.models.forEach((comp: any) => {
              const styles = comp.getStyle();
              const el = comp.getEl();
              if (el && styles) {
                Object.keys(styles).forEach(prop => {
                  const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
                  el.style[camelProp] = styles[prop];
                });
              }
            });
          }
          
          console.log("Contenu chargé avec succès");
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
      // Forcer les styles inline pour les emails
      avoidInlineStyle: false,
      forceClass: false,
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
      // Configurer le TraitsManager pour afficher les propriétés (href, etc.)
      traitsManager: {
        appendTo: "#grapesjs-traits-panel",
      },
      // Configurer le styleManager
      styleManager: {
        appendTo: "#grapesjs-style-panel",
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
      },
      // Masquer la toolbar du canvas
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
          "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
          // Styles inline pour forcer max-width sur les images
          `data:text/css,img { max-width: 100% !important; height: auto !important; display: block; }`,
        ],
      },
      // Ajouter des styles personnalisés pour le canvas avec fond à points
      cssIcons: '',
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
            content: {
              type: 'image',
              style: { 'max-width': '100%', 'height': 'auto', 'display': 'block' },
              resizable: true,
            },
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

    // Configuration pour les composants de type "link" (boutons avec liens)
    // Permettre l'édition de l'attribut href dans le panneau de propriétés
    const linkType = editor.DomComponents.getType('link');
    if (linkType) {
      linkType.model.prototype.defaults.traits = [
        {
          type: 'text',
          name: 'href',
          label: 'Lien (URL)',
          placeholder: 'https://exemple.com',
          changeProp: 1, // Mettre à jour immédiatement
        },
        {
          type: 'checkbox',
          name: 'target',
          label: 'Ouvrir dans un nouvel onglet',
          changeProp: 1,
        },
      ];
    }

    // Alternative: Si le type "link" n'existe pas, configurer directement les éléments <a>
    editor.DomComponents.addType('link', {
      model: {
        defaults: {
          traits: [
            {
              type: 'text',
              name: 'href',
              label: 'Lien (URL)',
              placeholder: 'https://exemple.com',
              changeProp: 1,
            },
            {
              type: 'checkbox',
              name: 'target',
              label: 'Ouvrir dans un nouvel onglet',
              changeProp: 1,
            },
          ],
        },
      },
    });

    // S'assurer que les éléments <a> avec data-gjs-type="link" utilisent cette configuration
    editor.on('component:add', (component: any) => {
      if (component.get('tagName') === 'a' || component.get('type') === 'link') {
        // Forcer le type à 'link' pour que les traits soient appliqués
        if (component.get('tagName') === 'a') {
          component.set('type', 'link');
        }
        if (!component.get('traits') || component.get('traits').length === 0) {
          component.set('traits', [
            {
              type: 'text',
              name: 'href',
              label: 'Lien (URL)',
              placeholder: 'https://exemple.com',
              changeProp: 1,
            },
            {
              type: 'checkbox',
              name: 'target',
              label: 'Ouvrir dans un nouvel onglet',
              changeProp: 1,
            },
          ]);
        }
      }
    });

    editorRef.current = editor;

    // Commandes de la toolbar
    editor.Commands.add('tlb-move', {
      run(ed: any) {
        ed.runCommand('core:component-drag');
      }
    });

    editor.Commands.add('tlb-clone', {
      run(ed: any) {
        const selected = ed.getSelected();
        if (selected) {
          selected.clone();
        }
      }
    });

    editor.Commands.add('tlb-delete', {
      run(ed: any) {
        const selected = ed.getSelected();
        if (selected) {
          selected.remove();
        }
      }
    });

    // Configurer le Rich Text Editor (RTE) après le chargement
    editor.on('load', () => {
      setTimeout(() => {
        const rte = editor.RichTextEditor;
        if (rte && typeof rte.add === 'function') {
          // Ajouter un sélecteur de police
          rte.add('font-family', {
            icon: '<i class="fa fa-font"></i>',
            attributes: { title: 'Police' },
            result: (rteInstance: any) => {
              const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Impact'];
              const currentFont = rteInstance.getCurrentStyle('font-family') || 'Arial';
              const select = document.createElement('select');
              select.style.cssText = 'padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;';
              
              fonts.forEach(font => {
                const option = document.createElement('option');
                option.value = font;
                option.textContent = font;
                option.style.fontFamily = font;
                if (currentFont.includes(font)) {
                  option.selected = true;
                }
                select.appendChild(option);
              });
              
              select.onchange = () => {
                rteInstance.exec('fontName', select.value);
                rteInstance.close();
              };
              
              return select;
            }
          });

          // Ajouter un sélecteur de taille
          rte.add('font-size', {
            icon: '<i class="fa fa-text-height"></i>',
            attributes: { title: 'Taille' },
            result: (rteInstance: any) => {
              const sizes = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
              const currentSize = rteInstance.getCurrentStyle('font-size') || '14px';
              const select = document.createElement('select');
              select.style.cssText = 'padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;';
              
              sizes.forEach(size => {
                const option = document.createElement('option');
                option.value = size;
                option.textContent = size;
                if (currentSize === size || currentSize.includes(size.replace('px', ''))) {
                  option.selected = true;
                }
                select.appendChild(option);
              });
              
              select.onchange = () => {
                rteInstance.exec('fontSize', select.value);
                rteInstance.close();
              };
              
              return select;
            }
          });

          // Ajouter un sélecteur de couleur
          rte.add('text-color', {
            icon: '<i class="fa fa-paint-brush"></i>',
            attributes: { title: 'Couleur' },
            result: (rteInstance: any) => {
              const input = document.createElement('input');
              input.type = 'color';
              input.style.cssText = 'width: 40px; height: 30px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';
              
              // Récupérer la couleur actuelle
              const currentColor = rteInstance.getCurrentStyle('color') || '#000000';
              input.value = currentColor;
              
              input.onchange = () => {
                rteInstance.exec('foreColor', input.value);
                rteInstance.close();
              };
              
              return input;
            }
          });
          
          console.log('Contrôles RTE ajoutés: police, taille, couleur');
        } else {
          console.warn('RTE non disponible ou méthode add non trouvée');
        }
      }, 500);
    });

    // Vérifier que le TraitsManager est bien initialisé
    setTimeout(() => {
      const traitsManager = editor.Traits;
      const traitsPanel = document.getElementById('grapesjs-traits-panel');
      console.log('TraitsManager:', traitsManager);
      console.log('Panneau de traits:', traitsPanel);
      if (traitsManager && traitsPanel) {
        console.log('TraitsManager et panneau trouvés');
      } else {
        console.warn('TraitsManager ou panneau non trouvé');
      }
    }, 500);

    // Exposer une fonction pour récupérer le HTML actuel immédiatement
    const getCurrentHtml = () => {
      const currentEditor = editorRef.current;
      if (!currentEditor) {
        console.warn("getCurrentHtml: éditeur non disponible");
        return "";
      }
      try {
        // Essayer d'obtenir le HTML avec styles inline (meilleur pour les emails)
        const inlinedHtml = currentEditor.Commands.run('gjs-get-inlined-html');
        if (inlinedHtml && inlinedHtml.trim()) {
          return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  ${inlinedHtml}
</body>
</html>`;
        } else {
          // Fallback: HTML avec CSS séparé
          const html = currentEditor.getHtml();
          const css = currentEditor.getCss();
          if (!html || !html.trim()) {
            console.warn("getCurrentHtml: contenu HTML vide");
            return "";
          }
          return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css || ''}</style>
</head>
<body>
  ${html}
</body>
</html>`;
        }
      } catch (e) {
        console.error("Erreur getCurrentHtml:", e);
        // Fallback en cas d'erreur
        try {
          const html = currentEditor.getHtml();
          const css = currentEditor.getCss();
          if (!html || !html.trim()) {
            return "";
          }
          return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css || ''}</style>
</head>
<body>
  ${html}
</body>
</html>`;
        } catch (e2) {
          console.error("Erreur fallback getCurrentHtml:", e2);
          return "";
        }
      }
    };

    // Exposer la fonction au parent si fournie
    if (onGetCurrentHtml) {
      onGetCurrentHtml(getCurrentHtml);
    }

    editor.Commands.add('tlb-move', {
      run(ed: any) {
        ed.runCommand('core:component-drag');
      }
    });

    // Fonction helper pour trouver récursivement un élément <a> dans un composant
    // Utiliser function au lieu de const pour le hoisting
    function findLinkInComponent(comp: any): any {
      if (!comp) return null;
      if (comp.get && typeof comp.get === 'function') {
        if (comp.get('tagName') === 'a' || comp.get('type') === 'link') {
          return comp;
        }
      }
      // Chercher dans les enfants
      try {
        if (comp.components && typeof comp.components === 'function') {
          const children = comp.components();
          if (children && children.length && children.length > 0) {
            for (let i = 0; i < children.length; i++) {
              const child = children.at(i);
              const found = findLinkInComponent(child);
              if (found) return found;
            }
          }
        }
      } catch (e) {
        // Ignorer les erreurs
      }
      return null;
    }

    // Commande pour ouvrir le dialog de lien
    editor.Commands.add('open-link-dialog', {
      run(ed: any, sender: any, options: any) {
        let component = options?.component;
        
        // Si pas de composant fourni, chercher dans le composant sélectionné
        if (!component) {
          const selected = ed.getSelected();
          component = findLinkInComponent(selected);
        }
        
        if (component && (component.get('tagName') === 'a' || component.get('type') === 'link')) {
          console.log('Ouverture du dialog de lien pour:', component.get('tagName'));
          setSelectedComponent(component);
          setLinkUrl(component.getAttributes().href || '');
          setLinkTarget(component.getAttributes().target === '_blank');
          setLinkDialogOpen(true);
        } else {
          console.warn('Aucun lien trouvé pour ouvrir le dialog');
          toast.error('Aucun lien trouvé dans ce composant');
        }
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

    // Fonction pour ajouter l'overlay à une image
    const addImageOverlay = (component: any) => {
      if (component.get('type') !== 'image') return;
      
      setTimeout(() => {
        const el = component.getEl();
        if (!el) return;
        
        const frame = editor.Canvas.getFrameEl();
        const frameDoc = frame?.contentDocument || frame?.contentWindow?.document;
        if (!frameDoc) return;
        
        // Vérifier si l'overlay existe déjà
        if (el.parentElement?.classList.contains('gjs-image-wrapper')) {
          return;
        }
        
        // Ne pas créer de wrapper si l'image est déjà dans un wrapper GrapesJS
        // Créer un wrapper uniquement pour l'overlay
        let wrapper = el.parentElement;
        if (!wrapper || !wrapper.classList.contains('gjs-image-wrapper')) {
          wrapper = frameDoc.createElement('div');
          wrapper.className = 'gjs-image-wrapper';
          wrapper.style.cssText = 'position: relative; display: inline-block; width: 100%;';
          // Le wrapper doit permettre la sélection de l'image
          wrapper.setAttribute('data-gjs-selectable', 'false');
          wrapper.setAttribute('data-gjs-hoverable', 'false');
          
          // Insérer le wrapper avant l'image
          el.parentNode?.insertBefore(wrapper, el);
          wrapper.appendChild(el);
        }
        
        // S'assurer que l'image reste sélectionnable et interactive
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.setAttribute('data-gjs-selectable', 'true');
        el.setAttribute('data-gjs-hoverable', 'true');
        
        // S'assurer que le composant GrapesJS est bien configuré
        component.set('selectable', true);
        component.set('hoverable', true);
        component.set('editable', true);
        
        // Créer l'overlay
        const overlay = frameDoc.createElement('div');
        overlay.className = 'gjs-image-overlay';
        overlay.style.cssText = 'position: absolute; inset: 0; z-index: 10; pointer-events: none;';
        overlay.innerHTML = `
          <div class="gjs-image-overlay-content" style="position: absolute; inset: 0; background: rgba(102, 126, 234, 0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; border-radius: 4px;">
            <div style="color: white; text-align: center; padding: 20px;">
              <button class="gjs-replace-image-btn" style="background: white; color: #667eea; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 12px; pointer-events: auto; transition: transform 0.2s;">Remplacer</button>
              <p style="font-size: 12px; margin: 0; color: white; opacity: 0.9;">Sélectionnez une image ou faites un glisser-déposer depuis votre bureau</p>
            </div>
          </div>
        `;
        wrapper.appendChild(overlay);
        
        const overlayContent = overlay.querySelector('.gjs-image-overlay-content') as HTMLElement;
        const replaceBtn = overlay.querySelector('.gjs-replace-image-btn') as HTMLElement;
        
        // Événements hover
        wrapper.addEventListener('mouseenter', () => {
          if (overlayContent) {
            overlayContent.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
          }
        });
        
        wrapper.addEventListener('mouseleave', () => {
          if (overlayContent) {
            overlayContent.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
          }
        });
        
        // Bouton remplacer
        if (replaceBtn) {
          replaceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Si onOpenMediaLibrary est fourni, l'utiliser
            if (onOpenMediaLibrary) {
              onOpenMediaLibrary((mediaUrl: string) => {
                // Remplacer l'image
                component.addAttributes({ src: mediaUrl });
                component.set('src', mediaUrl);
                const el = component.getEl();
                if (el && el.tagName === 'IMG') {
                  (el as HTMLImageElement).src = mediaUrl;
                }
                editor.refresh();
              });
            } else {
              // Fallback: utiliser le gestionnaire d'assets par défaut
              editor.runCommand('open-assets', {
                target: component,
                types: ['image'],
                accept: 'image/*',
              });
            }
          });
        }
      }, 100);
    };

    // Appliquer des styles par défaut aux images ajoutées
    editor.on('component:add', (component: any) => {
      if (component.get('type') === 'image') {
        component.addStyle({
          'max-width': '100%',
          'height': 'auto',
          'display': 'block',
        });
        component.set('resizable', true);
        component.set('selectable', true);
        component.set('hoverable', true);
        component.set('editable', true);
        addImageOverlay(component);
      }
    });
    
    // Ajouter l'overlay aux images existantes lors de la sélection
    editor.on('component:selected', (component: any) => {
      if (component.get('type') === 'image') {
        // S'assurer que l'image est bien sélectionnable
        component.set('selectable', true);
        component.set('hoverable', true);
        component.set('editable', true);
        
        const el = component.getEl();
        if (el) {
          el.style.cursor = 'pointer';
          el.style.pointerEvents = 'auto';
        }
        
        addImageOverlay(component);
      }
    });
    
    // S'assurer que les images sont toujours sélectionnables
    editor.on('component:update', (component: any) => {
      if (component.get('type') === 'image') {
        component.set('selectable', true);
        component.set('hoverable', true);
        const el = component.getEl();
        if (el) {
          el.style.pointerEvents = 'auto';
          el.style.cursor = 'pointer';
        }
      }
    });
    
    // Ajouter l'overlay après le chargement du contenu
    editor.on('load', () => {
      setTimeout(() => {
        const allComponents = editor.getComponents();
        const findImages = (comp: any) => {
          if (!comp || typeof comp.get !== 'function') {
            return;
          }
          if (comp.get('type') === 'image') {
            addImageOverlay(comp);
          }
          // Vérifier si comp.components existe et est une fonction avant de l'appeler
          if (comp.components && typeof comp.components === 'function') {
            const children = comp.components();
            if (children && children.length && typeof children.each === 'function') {
              children.each((child: any) => findImages(child));
            }
          }
        };
        findImages(allComponents);
      }, 500);
    });

    // S'assurer que tous les composants ont une toolbar
    editor.on('component:selected', (component: any) => {
      // Si c'est un lien (<a>), s'assurer qu'il a les traits href et target
      if (component.get('tagName') === 'a' || component.get('type') === 'link') {
        // Forcer le type à 'link' pour que les traits soient appliqués
        if (component.get('tagName') === 'a') {
          component.set('type', 'link');
        }
        // Toujours forcer les traits pour les liens
        component.set('traits', [
          {
            type: 'text',
            name: 'href',
            label: 'Lien (URL)',
            placeholder: 'https://exemple.com',
            changeProp: 1,
          },
          {
            type: 'checkbox',
            name: 'target',
            label: 'Ouvrir dans un nouvel onglet',
            changeProp: 1,
          },
        ]);
        
        console.log('Traits appliqués au bouton:', component.get('traits'));
        
        // Le TraitsManager se met à jour automatiquement quand un composant est sélectionné
        // Pas besoin d'appeler update() manuellement
      }
      
      // Utiliser la fonction helper définie plus haut

      // Configurer la toolbar selon le type de composant
      let toolbarConfig = [
        { attributes: { class: 'fa fa-arrows', draggable: true, title: 'Déplacer' }, command: 'tlb-move' },
        { attributes: { class: 'fa fa-clone', title: 'Dupliquer' }, command: 'tlb-clone' },
        { attributes: { class: 'fa fa-trash-o', title: 'Supprimer' }, command: 'tlb-delete' },
      ];

      // Chercher un élément <a> dans le composant sélectionné ou ses enfants
      const linkComponent = findLinkInComponent(component);
      
      // Ajouter l'icône de lien si on trouve un lien
      if (linkComponent) {
        console.log('Lien trouvé dans le composant:', linkComponent.get('tagName'), linkComponent.get('type'));
        toolbarConfig.unshift({
          attributes: { 
            class: 'gjs-link-btn fa fa-link', 
            title: 'Modifier le lien',
            style: 'cursor: pointer;'
          }, 
          command: 'open-link-dialog',
          commandOptions: { component: linkComponent }
        });
      } else {
        console.log('Aucun lien trouvé. tagName:', component.get('tagName'), 'type:', component.get('type'));
      }

      component.set('toolbar', toolbarConfig);
      
      component.set('editable', true);
      component.set('selectable', true);
      component.set('hoverable', true);
      
      // Notifier le parent quand un composant texte/titre est sélectionné
      if (onComponentSelected) {
        const tagName = component.get('tagName') || '';
        const type = component.get('type') || '';
        const isTextElement = tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6' || 
                             tagName === 'p' || tagName === 'span' || tagName === 'div' || 
                             type === 'text' || component.get('editable');
        
        if (isTextElement) {
          onComponentSelected(component);
        } else {
          onComponentSelected(null);
        }
      }
    });
    
    // Écouter aussi les désélections
    editor.on('component:deselected', () => {
      if (onComponentSelected) {
        onComponentSelected(null);
      }
    });

    // Appliquer les styles directement en inline sur les composants
    editor.on('component:styleUpdate', (component: any) => {
      const el = component.getEl();
      if (el) {
        const styles = component.getStyle();
        Object.keys(styles).forEach(prop => {
          const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
          el.style[camelProp] = styles[prop];
        });
      }
    });

    // Écouter les changements de style du StyleManager - plusieurs événements
    const applyStylesToElement = (component: any) => {
      if (!component || typeof component.getEl !== 'function') {
        return;
      }
      const el = component.getEl();
      if (el && typeof component.getStyle === 'function') {
        const styles = component.getStyle();
        Object.keys(styles).forEach(prop => {
          const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
          el.style[camelProp] = styles[prop];
        });
        console.log("Styles appliqués:", styles);
      }
    };

    editor.on('style:property:update', () => {
      const selected = editor.getSelected();
      if (selected) {
        applyStylesToElement(selected);
      }
    });

    editor.on('component:update', (component: any) => {
      applyStylesToElement(component);
    });

    // Écouter aussi style:target pour le changement de cible
    editor.on('style:target', (target: any) => {
      if (target) {
        setTimeout(() => applyStylesToElement(target), 50);
      }
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
        // Utiliser gjs-get-inlined-html pour avoir les styles inline (important pour emails)
        try {
          const inlinedHtml = editor.Commands.run('gjs-get-inlined-html');
          if (inlinedHtml) {
            const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  ${inlinedHtml}
</body>
</html>`;
            onSave(fullHtml);
          } else {
            // Fallback si la commande n'existe pas
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
          }
        } catch (e) {
          console.warn("Erreur gjs-get-inlined-html, utilisation du fallback:", e);
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
        }
      }, 500); // Debounce de 500ms
    });

    // Gérer le drag and drop depuis la sidebar
    let isProcessingDrop = false; // Flag pour éviter les doubles drops
    
    const handleDrop = (e: DragEvent) => {
      console.log("=== DROP EVENT DÉTECTÉ ===");
      console.log("Event target:", e.target);
      console.log("Event currentTarget:", e.currentTarget);
      console.log("DataTransfer types:", e.dataTransfer?.types);
      
      // Vérifier si c'est un drop depuis notre sidebar (avec nos données personnalisées)
      const blockType = e.dataTransfer?.getData("block-type");
      const sectionHtml = e.dataTransfer?.getData("text/html");
      const sectionType = e.dataTransfer?.getData("section-type");
      
      console.log("Drop détecté - blockType:", blockType, "sectionHtml:", sectionHtml?.substring(0, 100), "sectionType:", sectionType);
      
      // Si ce n'est pas un drop depuis notre sidebar, laisser GrapesJS gérer
      if (!blockType && !sectionHtml && !sectionType) {
        console.log("Pas de données personnalisées, laisser GrapesJS gérer");
        return;
      }
      
      // Si on est déjà en train de traiter un drop, ignorer
      if (isProcessingDrop) {
        console.log("Drop déjà en cours de traitement, ignorer");
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      isProcessingDrop = true;
      
      // Cacher l'indicateur visuel
      hideDropIndicator();
      
      // Trouver le composant cible à la position du drop
      let targetComponent: any = null;
      let insertIndex = -1;
      
      try {
        const target = e.target as HTMLElement;
        if (target) {
          // Trouver le composant GrapesJS le plus proche
          const canvas = editor.Canvas;
          if (canvas) {
            const frame = canvas.getFrameEl();
            if (frame && frame.contentDocument) {
              // Obtenir l'élément sous le curseur dans le frame
              const frameTarget = frame.contentDocument.elementFromPoint(e.clientX, e.clientY);
              if (frameTarget) {
                // Trouver le composant GrapesJS correspondant
                const comps = editor.getComponents();
                comps.each((comp: any) => {
                  const compEl = comp.getEl();
                  if (compEl && (compEl === frameTarget || compEl.contains(frameTarget))) {
                    targetComponent = comp;
                    // Trouver l'index du composant dans le wrapper
                    const wrapper = editor.getWrapper();
                    const wrapperComps = wrapper.components();
                    wrapperComps.each((child: any, index: number) => {
                      if (child === comp) {
                        insertIndex = index;
                      }
                    });
                  }
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn("Erreur lors de la détection de la position:", err);
      }
      
      console.log("Position du drop - targetComponent:", targetComponent, "insertIndex:", insertIndex);
      
      console.log("Traitement du drop - blockType:", blockType, "sectionHtml:", sectionHtml?.substring(0, 100));
      
      // Utiliser setTimeout pour s'assurer que le drop n'est traité qu'une fois
      setTimeout(() => {
        try {
          if (sectionHtml && editor) {
            // Ajouter une section complète
            console.log("Ajout d'une section complète");
            const wrapper = editor.getWrapper();
            const newComponent = wrapper.components().add(sectionHtml);
            
            // Si on a une position cible, déplacer le composant avant cette position
            if (targetComponent && insertIndex >= 0) {
              newComponent.moveBefore(targetComponent);
            }
            
            editor.refresh();
            editor.trigger('update');
            toast.success("Section ajoutée avec succès");
          } else if (blockType && editor) {
            // Ajouter un bloc simple à la position du drop
            console.log("Ajout d'un bloc:", blockType, "à l'index:", insertIndex);
            // Utiliser setTimeout pour s'assurer que l'éditeur est prêt
            setTimeout(() => {
              addBlockToEditor(editor, blockType, insertIndex, targetComponent);
            }, 50);
          } else {
            console.warn("Aucun contenu à ajouter ou éditeur non disponible");
          }
        } catch (error) {
          console.error("Erreur lors de l'ajout:", error);
          toast.error("Erreur lors de l'ajout du bloc");
        }
        
        // Réinitialiser le flag après un court délai
        setTimeout(() => {
          isProcessingDrop = false;
        }, 100);
      }, 10);
    };

    // Créer un indicateur visuel pour montrer où le bloc sera inséré
    let dropIndicator: HTMLElement | null = null;
    
    const createDropIndicator = () => {
      if (dropIndicator) return dropIndicator;
      
      const indicator = document.createElement('div');
      indicator.id = 'gjs-drop-indicator';
      indicator.style.cssText = `
        position: absolute;
        height: 3px;
        background: #667eea;
        width: 100%;
        z-index: 10000;
        pointer-events: none;
        box-shadow: 0 0 4px rgba(102, 126, 234, 0.5);
        display: none;
      `;
      
      const canvas = editor.Canvas;
      if (canvas) {
        const frame = canvas.getFrameEl();
        if (frame && frame.contentDocument) {
          frame.contentDocument.body.appendChild(indicator);
          dropIndicator = indicator;
        }
      }
      
      return indicator;
    };
    
    const showDropIndicator = (e: DragEvent) => {
      const indicator = createDropIndicator();
      if (!indicator) return;
      
      const canvas = editor.Canvas;
      if (!canvas) return;
      
      const frame = canvas.getFrameEl();
      if (!frame || !frame.contentDocument) return;
      
      try {
        // Obtenir l'élément sous le curseur
        const frameTarget = frame.contentDocument.elementFromPoint(e.clientX, e.clientY);
        if (!frameTarget) {
          indicator.style.display = 'none';
          return;
        }
        
        // Trouver le composant GrapesJS correspondant
        let targetComponent: any = null;
        const wrapper = editor.getWrapper();
        const wrapperComps = wrapper.components();
        
        wrapperComps.each((comp: any) => {
          const compEl = comp.getEl();
          if (compEl && (compEl === frameTarget || compEl.contains(frameTarget))) {
            targetComponent = comp;
          }
        });
        
        if (targetComponent) {
          const compEl = targetComponent.getEl();
          if (compEl) {
            const rect = compEl.getBoundingClientRect();
            const frameRect = frame.getBoundingClientRect();
            
            // Positionner l'indicateur au-dessus du composant cible
            indicator.style.top = `${rect.top - frameRect.top + frame.contentWindow.scrollY}px`;
            indicator.style.left = `${rect.left - frameRect.left}px`;
            indicator.style.width = `${rect.width}px`;
            indicator.style.display = 'block';
          }
        } else {
          // Si aucun composant trouvé, positionner à la fin
          const wrapperEl = wrapper.getEl();
          if (wrapperEl) {
            const rect = wrapperEl.getBoundingClientRect();
            const frameRect = frame.getBoundingClientRect();
            indicator.style.top = `${rect.bottom - frameRect.top + frame.contentWindow.scrollY}px`;
            indicator.style.left = `${rect.left - frameRect.left}px`;
            indicator.style.width = `${rect.width}px`;
            indicator.style.display = 'block';
          }
        }
      } catch (err) {
        console.warn("Erreur lors de l'affichage de l'indicateur:", err);
      }
    };
    
    const hideDropIndicator = () => {
      if (dropIndicator) {
        dropIndicator.style.display = 'none';
      }
    };
    
    const handleDragOver = (e: DragEvent) => {
      // Vérifier si c'est un drag depuis notre sidebar
      const types = e.dataTransfer?.types || [];
      const hasCustomData = types.includes("block-type") || types.includes("text/html") || types.includes("section-type");
      
      console.log("DragOver détecté - types:", types, "hasCustomData:", hasCustomData);
      
      // Si c'est notre drag, empêcher le comportement par défaut et permettre le drop
      if (hasCustomData) {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy';
        }
        
        // Afficher l'indicateur visuel
        showDropIndicator(e);
        
        return false;
      }
    };
    
    const handleDragLeave = (e: DragEvent) => {
      // Cacher l'indicateur quand on quitte la zone de drop
      hideDropIndicator();
    };

    // Attacher les événements au conteneur principal ET à l'iframe
    containerRef.current?.addEventListener('drop', handleDrop, true);
    containerRef.current?.addEventListener('dragover', handleDragOver, true);
    containerRef.current?.addEventListener('dragleave', handleDragLeave, true);
    
    // Attacher aussi sur l'iframe une fois qu'elle est chargée
    const attachIframeEvents = () => {
      const frame = editor.Canvas?.getFrameEl();
      if (frame && frame.contentDocument) {
        console.log("Attachement des événements sur l'iframe");
        frame.contentDocument.addEventListener('drop', handleDrop, true);
        frame.contentDocument.addEventListener('dragover', handleDragOver, true);
        frame.contentDocument.addEventListener('dragleave', handleDragLeave, true);
        frame.contentDocument.addEventListener('dragenter', (e) => {
          const types = e.dataTransfer?.types || [];
          if (types.includes("block-type") || types.includes("text/html") || types.includes("section-type")) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
      }
    };
    
    // Attendre que l'iframe soit chargée
    editor.on('canvas:frame:load', attachIframeEvents);
    
    // Essayer immédiatement aussi
    setTimeout(attachIframeEvents, 1000);

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

    function addBlockToEditor(editorInstance: any, blockType: string, insertIndex: number = -1, targetComponent: any = null) {
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
        case 'produit':
          blockContent = '<div data-gjs-type="section" style="padding: 20px; background: #ffffff;"><div data-gjs-type="row" style="display: flex; gap: 20px;"><div data-gjs-type="column" style="flex: 1;"><img src="https://via.placeholder.com/300x200" alt="Produit" style="width: 100%; height: auto; border-radius: 8px;" /></div><div data-gjs-type="column" style="flex: 1;"><h3 data-gjs-type="text" style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">Nom du produit</h3><p data-gjs-type="text" style="font-size: 18px; font-weight: 700; color: #667eea; margin: 0 0 16px 0;">49,99€</p><a href="#" data-gjs-type="link" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Acheter</a></div></div></div>';
          break;
        case 'navigation':
          blockContent = '<nav data-gjs-type="default" style="background: #f8f9fa; padding: 15px 20px; text-align: center;"><a href="#" data-gjs-type="link" style="margin: 0 15px; color: #333; text-decoration: none;">Accueil</a><a href="#" data-gjs-type="link" style="margin: 0 15px; color: #333; text-decoration: none;">Produits</a><a href="#" data-gjs-type="link" style="margin: 0 15px; color: #333; text-decoration: none;">Contact</a></nav>';
          break;
        case 'bloc-vide':
          blockContent = '<div data-gjs-type="default" style="padding: 20px; min-height: 50px;"></div>';
          break;
        default:
          blockContent = '<div data-gjs-type="text" style="padding: 20px;">Nouveau bloc</div>';
      }

      try {
        console.log("Ajout du contenu:", blockContent.substring(0, 100));
        
        // Vérifier que le wrapper existe
        if (!wrapper) {
          console.error("Wrapper non trouvé");
          toast.error("Erreur: wrapper non trouvé");
          return;
        }
        
        // Ajouter le composant au wrapper
        const component = wrapper.components().add(blockContent);
        
        console.log("Composant créé:", component);
        console.log("Type du composant:", component?.get('type'));
        console.log("Wrapper components count avant:", wrapper.components().length);
        console.log("InsertIndex:", insertIndex, "targetComponent:", targetComponent);
        
        // Si on a une position cible, déplacer le composant avant cette position
        if (targetComponent && insertIndex >= 0) {
          try {
            component.moveBefore(targetComponent);
            console.log("Composant déplacé avant targetComponent");
          } catch (moveError) {
            console.warn("Erreur lors du déplacement:", moveError);
            // Fallback: utiliser l'index
            if (insertIndex >= 0) {
              const wrapperComps = wrapper.components();
              const targetAtIndex = wrapperComps.at(insertIndex);
              if (targetAtIndex && targetAtIndex !== component) {
                component.moveBefore(targetAtIndex);
              }
            }
          }
        }
        
        // Attendre que le composant soit ajouté
        setTimeout(() => {
          console.log("Wrapper components count après:", wrapper.components().length);
          
          // Vérifier que le composant a bien un élément DOM
          const el = component?.getEl();
          console.log("Élément DOM du composant:", el);
          
          if (component && el) {
            // Sélectionner le composant pour le rendre visible
            editorInstance.select(component);
            
            // Forcer le refresh et le rendu
            editorInstance.refresh();
            editorInstance.trigger('update');
            
            // Forcer le rendu du canvas
            const canvas = editorInstance.Canvas;
            if (canvas) {
              canvas.render();
              
              // Forcer le rendu de la frame
              const frame = canvas.getFrameEl();
              if (frame && frame.contentWindow) {
                // Déclencher un événement de resize pour forcer le rendu
                frame.contentWindow.dispatchEvent(new Event('resize'));
              }
            }
            
            // Forcer le scroll vers le composant après un court délai
            setTimeout(() => {
              const el2 = component.getEl();
              if (el2) {
                el2.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 200);
            
            toast.success(`Bloc "${blockType}" ajouté`);
            console.log("Bloc ajouté avec succès:", blockType);
          } else {
            console.error("Composant ou élément DOM non trouvé");
            toast.error(`Erreur: le composant n'a pas pu être rendu`);
          }
        }, 100);
        
        toast.success(`Bloc "${blockType}" ajouté`);
        console.log("Bloc ajouté avec succès:", blockType, "composant:", component);
      } catch (error) {
        console.error("Erreur lors de l'ajout du bloc:", error);
        toast.error(`Erreur lors de l'ajout du bloc "${blockType}"`);
      }
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
      containerRef.current?.removeEventListener('drop', handleDrop, true);
      containerRef.current?.removeEventListener('dragover', handleDragOver, true);
      containerRef.current?.removeEventListener('dragleave', handleDragLeave, true);
      
      // Nettoyer l'indicateur visuel
      if (dropIndicator && dropIndicator.parentNode) {
        dropIndicator.parentNode.removeChild(dropIndicator);
      }
      
      // Nettoyer les événements de l'iframe
      const frame = editor.Canvas?.getFrameEl();
      if (frame && frame.contentDocument) {
        frame.contentDocument.removeEventListener('drop', handleDrop, true);
        frame.contentDocument.removeEventListener('dragover', handleDragOver, true);
        frame.contentDocument.removeEventListener('dragleave', handleDragLeave, true);
      }
      
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

  // Fonction pour sauvegarder le lien
  const handleLinkSave = () => {
    if (selectedComponent && editorRef.current) {
      const attributes: any = {};
      if (linkUrl.trim()) {
        attributes.href = linkUrl.trim();
      } else {
        attributes.href = '#';
      }
      if (linkTarget) {
        attributes.target = '_blank';
      } else {
        attributes.target = '';
      }
      selectedComponent.setAttributes(attributes);
      editorRef.current.refresh();
      setLinkDialogOpen(false);
      toast.success('Lien mis à jour');
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Bouton Aperçu flottant */}
      <Button
        onClick={handlePreview}
        variant="secondary"
        size="sm"
        className="absolute top-2 right-2 z-50 shadow-lg"
      >
        <Eye className="h-4 w-4 mr-2" />
        Aperçu
      </Button>

      <div
        ref={containerRef}
        className="w-full flex-1 grapesjs-dotted-bg"
        style={{ 
          backgroundColor: '#f8f9fa',
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          minHeight: 0,
        }}
      />

      {/* Dialog pour modifier le lien */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le lien</DialogTitle>
            <DialogDescription>
              Entrez l'URL du lien pour ce bouton
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL du lien</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://exemple.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLinkSave();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="link-target"
                checked={linkTarget}
                onChange={(e) => setLinkTarget(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="link-target" className="text-sm font-normal cursor-pointer">
                Ouvrir dans un nouvel onglet
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleLinkSave}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'aperçu */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 border-b flex-row items-center justify-between">
            <DialogTitle>Aperçu de l'email</DialogTitle>
            <div className="flex items-center gap-2">
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
          </DialogHeader>
          <div className="p-4 bg-muted overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            <div 
              className="mx-auto bg-white shadow-lg transition-all duration-300"
              style={{ 
                width: previewDevice === "mobile" ? "375px" : "100%",
                maxWidth: previewDevice === "mobile" ? "375px" : "800px",
              }}
            >
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full border-0"
                style={{ 
                  height: previewDevice === "mobile" ? "667px" : "600px",
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

