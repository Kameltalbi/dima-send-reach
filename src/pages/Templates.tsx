import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Sparkles, 
  X, 
  Eye, 
  FileText,
  Search,
  Mail,
  Filter,
  Grid3x3,
  List,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Clock,
  ChevronDown,
  ArrowRight,
  Menu,
  Loader2,
  Code,
  Save
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useNavigate } from "react-router-dom";

export default function Templates() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "type">("recent");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // États pour le formulaire de création
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateType, setNewTemplateType] = useState("newsletter");
  const [newTemplateHtml, setNewTemplateHtml] = useState("");

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      if (!newTemplateName.trim()) {
        throw new Error("Le nom du template est obligatoire");
      }

      if (!newTemplateHtml.trim()) {
        throw new Error("Le contenu HTML est obligatoire");
      }

      const { error } = await supabase.from("templates").insert({
        user_id: userData.user.id,
        nom: newTemplateName.trim(),
        description: newTemplateDescription.trim() || null,
        type: newTemplateType,
        content_html: newTemplateHtml.trim(),
        content_json: {},
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template créé avec succès");
      setShowCreateDialog(false);
      // Réinitialiser le formulaire
      setNewTemplateName("");
      setNewTemplateDescription("");
      setNewTemplateType("newsletter");
      setNewTemplateHtml("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création du template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template supprimé avec succès");
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: any) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { error } = await supabase.from("templates").insert({
        user_id: userData.user.id,
        nom: `${template.nom} (copie)`,
        description: template.description,
        type: template.type,
        content_html: template.content_html,
        content_json: template.content_json || {},
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template dupliqué avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la duplication");
    },
  });

  const handleLoadExamples = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Vous devez être connecté");
        return;
      }

      // Vérifier si les templates d'exemple existent déjà
      const templateNames = exampleTemplateNames;

      const { data: existingTemplates } = await supabase
        .from("templates")
        .select("nom")
        .eq("user_id", userData.user.id)
        .in("nom", templateNames);

      if (existingTemplates && existingTemplates.length > 0) {
        const existingNames = existingTemplates.map(t => t.nom);
        toast.info(`Vous avez déjà ${existingNames.length} template(s) d'exemple. Supprimez-les d'abord si vous voulez les recharger.`);
        return;
      }

      const { error } = await supabase.from("templates").insert([
        {
          user_id: userData.user.id,
          nom: "Template B2B Complet Pro",
          description: "Template B2B professionnel complet avec titre, image, corps, bouton CTA et footer avec réseaux sociaux",
          type: "newsletter",
          content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Template B2B Professionnel</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header avec titre -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 50px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;">Votre Titre Principal</h1>
              <p style="margin: 15px 0 0 0; color: #e0e7ff; font-size: 16px; line-height: 1.5;">Sous-titre ou description courte</p>
            </td>
          </tr>

          <!-- Image Hero -->
          <tr>
            <td style="padding: 0;">
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=300&fit=crop" alt="Image principale" width="600" height="300" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0; outline: none; text-decoration: none;" />
            </td>
          </tr>

          <!-- Corps du mail -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600; line-height: 1.3;">Titre de section</h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>

              <!-- Liste à puces -->
              <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">Point clé numéro un avec description</li>
                <li style="margin-bottom: 10px;">Point clé numéro deux avec description</li>
                <li style="margin-bottom: 10px;">Point clé numéro trois avec description</li>
              </ul>

              <!-- Bouton CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #3b82f6; border-radius: 6px;">
                          <a href="#" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; background-color: #3b82f6;">Appel à l'action</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Séparateur -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer avec réseaux sociaux -->
          <tr>
            <td style="background-color: #f9fafb; padding: 40px 40px 30px 40px; text-align: center;">
              <!-- Logo ou nom de l'entreprise -->
              <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">Votre Entreprise</h3>
              
              <!-- Réseaux sociaux -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 30px auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="#" style="display: inline-block; width: 40px; height: 40px; background-color: #3b82f6; border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none;">
                      <span style="color: #ffffff; font-size: 18px;">f</span>
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="#" style="display: inline-block; width: 40px; height: 40px; background-color: #1da1f2; border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none;">
                      <span style="color: #ffffff; font-size: 18px;">t</span>
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="#" style="display: inline-block; width: 40px; height: 40px; background-color: #0077b5; border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none;">
                      <span style="color: #ffffff; font-size: 18px;">in</span>
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="#" style="display: inline-block; width: 40px; height: 40px; background-color: #000000; border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none;">
                      <span style="color: #ffffff; font-size: 18px;">ig</span>
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="#" style="display: inline-block; width: 40px; height: 40px; background-color: #ff0000; border-radius: 50%; text-align: center; line-height: 40px; text-decoration: none;">
                      <span style="color: #ffffff; font-size: 18px;">yt</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Informations de contact -->
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                123 Rue de l'Exemple<br />
                75000 Paris, France<br />
                Tél: +33 1 23 45 67 89<br />
                Email: contact@entreprise.com
              </p>

              <!-- Liens légaux -->
              <p style="margin: 20px 0 10px 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                <a href="#" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Mentions légales</a>
                <span style="color: #d1d5db;">|</span>
                <a href="#" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Politique de confidentialité</a>
                <span style="color: #d1d5db;">|</span>
                <a href="#" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">CGU</a>
              </p>

              <!-- Désabonnement -->
              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 Votre Entreprise. Tous droits réservés.<br />
                <a href="#" style="color: #3b82f6; text-decoration: underline;">Se désabonner</a> | 
                <a href="#" style="color: #3b82f6; text-decoration: underline;">Gérer mes préférences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
          content_json: {}
        },
        {
          user_id: userData.user.id,
          nom: "Newsletter B2B Professionnelle",
          description: "Template B2B épuré et professionnel pour newsletters d'entreprise",
          type: "newsletter",
          content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter B2B</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Newsletter Entreprise</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Janvier 2025</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px; font-weight: 600;">Actualités et insights</h2>
              <p style="margin: 0 0 20px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Découvrez les dernières tendances et innovations dans votre secteur d'activité.</p>
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px; font-weight: 600;">Tendances du marché</h3>
                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">Analyse approfondie des évolutions récentes et opportunités à saisir.</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" style="width: 100%; margin: 20px 0;">
                <tr>
                  <td align="center" style="padding: 15px 0;">
                    <a href="#" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">En savoir plus</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px;">© 2025 Votre Entreprise. Tous droits réservés.</p>
              <p style="margin: 0;"><a href="#" style="color: #3b82f6; text-decoration: none; font-size: 12px;">Se désabonner</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
          content_json: {}
        },
        {
          user_id: userData.user.id,
          nom: "Email B2B - Présentation Produit",
          description: "Template professionnel pour présenter un produit ou service B2B",
          type: "annonce",
          content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Présentation Produit B2B</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding: 0 0 40px 0; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="margin: 0; color: #111827; font-size: 32px; font-weight: 700;">Nouvelle Solution</h1>
              <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 18px;">Découvrez notre dernière innovation</p>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 0;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">Transformez votre façon de travailler</h2>
              <p style="margin: 0 0 25px 0; color: #374151; font-size: 16px; line-height: 1.7;">Notre nouvelle solution vous permet d'optimiser vos processus et d'augmenter votre productivité de manière significative.</p>
              
              <!-- Features -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background-color: #3b82f6; border-radius: 8px; display: inline-block; text-align: center; line-height: 40px; color: #ffffff; font-size: 20px;">✓</div>
                        </td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px; font-weight: 600;">Performance optimale</h3>
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Augmentez votre efficacité opérationnelle</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background-color: #3b82f6; border-radius: 8px; display: inline-block; text-align: center; line-height: 40px; color: #ffffff; font-size: 20px;">✓</div>
                        </td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px; font-weight: 600;">Sécurité renforcée</h3>
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Protection avancée de vos données</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="width: 50px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background-color: #3b82f6; border-radius: 8px; display: inline-block; text-align: center; line-height: 40px; color: #ffffff; font-size: 20px;">✓</div>
                        </td>
                        <td style="vertical-align: top;">
                          <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px; font-weight: 600;">Support dédié</h3>
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Équipe d'experts à votre service</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 40px 0;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Demander une démo</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">© 2025 Votre Entreprise</p>
              <p style="margin: 0;"><a href="#" style="color: #3b82f6; text-decoration: none; font-size: 12px;">Se désabonner</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
          content_json: {}
        },
        {
          user_id: userData.user.id,
          nom: "Email B2B - Invitation Événement",
          description: "Template professionnel pour inviter à un événement B2B (webinaire, conférence, etc.)",
          type: "annonce",
          content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation Événement B2B</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 50px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <!-- Header avec image -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 50px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Webinaire Exclusif</h1>
              <p style="margin: 15px 0 0 0; color: #dbeafe; font-size: 18px;">Rejoignez-nous pour une session enrichissante</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 26px; font-weight: 600;">Vous êtes invité</h2>
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">Nous avons le plaisir de vous inviter à notre prochain webinaire où nous partagerons des insights exclusifs sur les tendances du marché.</p>
              
              <!-- Event Details -->
              <table role="presentation" style="width: 100%; background-color: #f3f4f6; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <tr>
                  <td>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #111827; font-size: 14px;">📅 Date :</strong>
                          <span style="color: #4b5563; font-size: 14px; margin-left: 10px;">15 Février 2025</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #111827; font-size: 14px;">⏰ Heure :</strong>
                          <span style="color: #4b5563; font-size: 14px; margin-left: 10px;">14h00 - 15h30 (CET)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <strong style="color: #111827; font-size: 14px;">🌐 Format :</strong>
                          <span style="color: #4b5563; font-size: 14px; margin-left: 10px;">En ligne (Zoom)</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Agenda -->
              <h3 style="margin: 30px 0 15px 0; color: #111827; font-size: 20px; font-weight: 600;">Au programme</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">Analyse des tendances du marché</li>
                <li style="margin-bottom: 10px;">Cas d'usage et meilleures pratiques</li>
                <li style="margin-bottom: 10px;">Session Q&A avec nos experts</li>
              </ul>

              <!-- CTA -->
              <table role="presentation" style="width: 100%; margin: 40px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Réserver ma place</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; text-align: center; color: #6b7280; font-size: 13px;">Places limitées - Inscription gratuite</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">© 2025 Votre Entreprise</p>
              <p style="margin: 0;"><a href="#" style="color: #3b82f6; text-decoration: none; font-size: 12px;">Se désabonner</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
          content_json: {}
        },
        {
          user_id: userData.user.id,
          nom: "Email Texte B2B Professionnel",
          description: "Template texte épuré et professionnel pour emails B2B sans images, optimisé pour tous les clients email",
          type: "newsletter",
          content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Texte B2B</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; color: #111827; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; border-bottom: 2px solid #e5e7eb;">
              <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Votre Entreprise</h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Email professionnel</p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              
              <!-- Salutation -->
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; font-weight: 600;">Bonjour,</p>
              
              <!-- Paragraphe d'introduction -->
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.7;">
                Nous espérons que ce message vous trouve en bonne santé. Nous souhaitons vous informer des dernières actualités concernant nos services et solutions.
              </p>

              <!-- Section principale -->
              <h2 style="margin: 30px 0 15px 0; color: #111827; font-size: 22px; font-weight: 600;">Sujet principal</h2>
              
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.7;">
                Nous avons le plaisir de vous annoncer de nouvelles fonctionnalités qui amélioreront votre expérience et optimiseront vos processus métier.
              </p>

              <!-- Points clés -->
              <div style="margin: 25px 0;">
                <p style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600;">Points clés :</p>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                  <li style="margin-bottom: 10px;">Amélioration de la performance et de l'efficacité</li>
                  <li style="margin-bottom: 10px;">Nouvelles fonctionnalités pour répondre à vos besoins</li>
                  <li style="margin-bottom: 10px;">Support client renforcé et disponible</li>
                </ul>
              </div>

              <!-- Appel à l'action -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">Prochaines étapes</p>
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
                  Pour en savoir plus ou discuter de vos besoins spécifiques, n'hésitez pas à nous contacter. Notre équipe est à votre disposition pour répondre à toutes vos questions.
                </p>
                <p style="margin: 0; color: #374151; font-size: 15px;">
                  <strong>Email :</strong> contact@entreprise.com<br />
                  <strong>Téléphone :</strong> +33 1 23 45 67 89<br />
                  <strong>Horaires :</strong> Lundi - Vendredi, 9h - 18h
                </p>
              </div>

              <!-- Conclusion -->
              <p style="margin: 30px 0 20px 0; color: #374151; font-size: 16px; line-height: 1.7;">
                Nous restons à votre entière disposition pour toute information complémentaire.
              </p>

              <p style="margin: 0 0 5px 0; color: #111827; font-size: 16px;">Cordialement,</p>
              <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">L'équipe [Votre Entreprise]</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                <strong>[Votre Entreprise]</strong><br />
                123 Rue de l'Exemple<br />
                75000 Paris, France<br />
                SIRET: 123 456 789 00012
              </p>
              <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                © 2025 [Votre Entreprise]. Tous droits réservés.<br />
                <a href="#" style="color: #3b82f6; text-decoration: none;">Se désabonner</a> | 
                <a href="#" style="color: #3b82f6; text-decoration: none;">Gérer mes préférences</a> | 
                <a href="#" style="color: #3b82f6; text-decoration: none;">Mentions légales</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
          content_json: {}
        },
        {
          user_id: userData.user.id,
          nom: "Newsletter Moderne",
          description: "Template professionnel pour vos newsletters mensuelles avec design épuré et responsive",
          type: "newsletter",
          content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Moderne</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 700;">Votre Newsletter</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Janvier 2025</p>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Bienvenue dans notre newsletter</h2>
      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Nous sommes ravis de vous partager les dernières actualités et nouveautés de notre entreprise.</p>
      <a href="#" style="display: inline-block; background: #667eea; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">Découvrir maintenant</a>
    </div>
    <div style="background: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #999999;">
      <p style="margin: 0;">© 2025 Votre Entreprise. Tous droits réservés.</p>
      <p style="margin: 10px 0 0 0;"><a href="#" style="color: #667eea; text-decoration: none;">Se désabonner</a></p>
    </div>
  </div>
</body>
</html>`,
          content_json: {}
        },
        {
          user_id: userData.user.id,
          nom: "Promotion Flash",
          description: "Template accrocheur pour vos promotions et offres spéciales avec design moderne",
          type: "promotion",
          content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promotion Flash</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px 20px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 48px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Promotion</h1>
      <div style="font-size: 72px; font-weight: 900; margin: 20px 0;">-50%</div>
      <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: 600;">OFFRE LIMITÉE</p>
    </div>
    <div style="padding: 40px 30px; text-align: center;">
      <h2 style="color: #333333; font-size: 28px; margin: 0 0 15px 0;">Ne manquez pas cette opportunité !</h2>
      <p style="color: #666666; font-size: 18px; line-height: 1.6; margin: 0 0 30px 0;">Profitez de notre offre exceptionnelle avec une réduction de 50% sur tous nos produits.</p>
      <a href="#" style="display: inline-block; background: #f5576c; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; text-transform: uppercase;">Profiter de l'offre</a>
    </div>
    <div style="background: #2c3e50; padding: 30px; text-align: center; color: #ffffff; font-size: 12px;">
      <p style="margin: 0;">© 2025 Votre Entreprise. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`,
          content_json: {}
        },
        {
          user_id: userData.user.id,
          nom: "Email de Bienvenue",
          description: "Template chaleureux pour accueillir vos nouveaux clients et utilisateurs",
          type: "annonce",
          content_html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email de Bienvenue</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 20px; text-align: center; color: #ffffff;">
      <div style="font-size: 64px; margin-bottom: 20px;">👋</div>
      <h1 style="margin: 0; font-size: 36px; font-weight: 700;">Bienvenue !</h1>
      <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Nous sommes ravis de vous compter parmi nous</p>
    </div>
    <div style="padding: 50px 40px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #333333; font-size: 28px; margin: 0 0 15px 0;">Merci de nous rejoindre</h2>
        <p style="color: #666666; font-size: 18px; line-height: 1.8; margin: 0;">Votre compte a été créé avec succès. Nous sommes là pour vous accompagner dans votre parcours.</p>
      </div>
      <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 12px;">
        <h3 style="color: #333333; margin: 0 0 15px 0;">Prêt à commencer ?</h3>
        <a href="#" style="display: inline-block; background: #667eea; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accéder à mon compte</a>
      </div>
    </div>
    <div style="background: #2c3e50; padding: 40px 30px; text-align: center; color: #ffffff; font-size: 14px;">
      <p style="margin: 10px 0;"><strong>Votre Entreprise</strong></p>
      <p style="margin: 10px 0; color: #ecf0f1;">© 2025 Votre Entreprise. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`,
          content_json: {}
        }
      ]);

      if (error) throw error;
      toast.success("3 templates d'exemple ont été ajoutés");
      refetch();
    } catch (error: any) {
      console.error("Error adding templates:", error);
      toast.error("Erreur lors de l'ajout des templates");
    }
  };

  const handleDelete = (template: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDuplicate = (template: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    duplicateMutation.mutate(template);
  };

  const handleUseInCampaign = (templateId: string) => {
    navigate(`/campagnes/nouvelle?template=${templateId}`);
  };

  // Liste des noms de templates d'exemple
  const exampleTemplateNames = [
    "Template B2B Complet Pro",
    "Newsletter B2B Professionnelle",
    "Email B2B - Présentation Produit",
    "Email B2B - Invitation Événement",
    "Email Texte B2B Professionnel",
    "Newsletter Moderne",
    "Promotion Flash",
    "Email de Bienvenue"
  ];

  const isExampleTemplate = (templateName: string) => {
    return exampleTemplateNames.includes(templateName);
  };

  const filteredTemplates = templates?.filter(template => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.nom?.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.type?.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  // Trier les templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    } else if (sortBy === "name") {
      return a.nom.localeCompare(b.nom);
    } else {
      return a.type.localeCompare(b.type);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("templates.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Créez et gérez vos templates d'email. Vous pourrez les modifier lors de la création de campagne.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate("/templates/nouveau")} 
              size="default"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("templates.newTemplate")}
            </Button>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("templates.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-background"
            />
          </div>
          {!isMobile && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2 h-10">
                    <Filter className="h-4 w-4" />
                    Trier
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setSortBy("recent")}
                    className={sortBy === "recent" ? "bg-primary/10 font-medium" : ""}
                  >
                    Plus récents
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy("name")}
                    className={sortBy === "name" ? "bg-primary/10 font-medium" : ""}
                  >
                    Par nom
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy("type")}
                    className={sortBy === "type" ? "bg-primary/10 font-medium" : ""}
                  >
                    Par type
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                  title="Vue grille"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                  title="Vue liste"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Liste des templates */}
        {isLoading ? (
          <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse border-border overflow-hidden">
                <div className="aspect-[4/3] bg-muted/50"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                  <div className="h-3 bg-muted/50 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : sortedTemplates.length === 0 ? (
          <Card className="border-border border-dashed bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground mb-1">
                Aucun template
              </p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Créez votre premier template ou chargez des exemples pour commencer
              </p>
              <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau template
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-border overflow-hidden bg-card"
              >
                {/* Preview */}
                <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
                  {template.thumbnail_url ? (
                    <img
                      src={template.thumbnail_url}
                      alt={template.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Mail className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseInCampaign(template.id);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      Utiliser
                    </Button>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm line-clamp-1 text-foreground">
                          {template.nom}
                        </h4>
                        {isExampleTemplate(template.nom) && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Exemple
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/templates/${template.id}/edit`);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleUseInCampaign(template.id);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Utiliser
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDuplicate(template, e)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => handleDelete(template, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {template.description || "Pas de description"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs font-normal border-border">
                      {template.type}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(template.updated_at).toLocaleDateString("fr-FR", {
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTemplates.map((template) => (
              <Card 
                key={template.id}
                className="hover:shadow-md transition-all duration-200 cursor-pointer border-border bg-card"
                onClick={() => handleUseInCampaign(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h4 className="font-medium text-sm">
                            {template.nom}
                          </h4>
                          {isExampleTemplate(template.nom) && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Exemple
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleUseInCampaign(template.id);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Utiliser
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDuplicate(template, e)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => handleDelete(template, e)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {template.description || "Pas de description"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs font-normal border-border">
                          {template.type}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(template.updated_at).toLocaleDateString("fr-FR", {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de création simplifié */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau template</DialogTitle>
            <DialogDescription>
              Collez votre HTML ou créez un template simple. Vous pourrez le modifier lors de la création de campagne.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nom du template *</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Ex: Newsletter Janvier 2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description (optionnel)</Label>
              <Input
                id="template-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Description du template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Type</Label>
              <Select value={newTemplateType} onValueChange={setNewTemplateType}>
                <SelectTrigger id="template-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="annonce">Annonce</SelectItem>
                  <SelectItem value="transactionnel">Transactionnel</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="template-html">Contenu HTML *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-8"
                  onClick={() => {
                    setNewTemplateHtml(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${newTemplateName || "Template"}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
    <h1 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Votre contenu ici</h1>
    <p style="color: #666666; font-size: 16px; line-height: 1.6;">Modifiez ce template lors de la création de votre campagne.</p>
  </div>
</body>
</html>`);
                  }}
                >
                  <Code className="h-3 w-3" />
                  Template de base
                </Button>
              </div>
              <Textarea
                id="template-html"
                value={newTemplateHtml}
                onChange={(e) => setNewTemplateHtml(e.target.value)}
                placeholder="Collez votre HTML ici ou utilisez le bouton 'Template de base' pour commencer"
                className="font-mono text-sm min-h-[300px]"
              />
              <p className="text-xs text-muted-foreground">
                Vous pourrez modifier ce template lors de la création de votre campagne avec l'éditeur visuel.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => createMutation.mutate()} 
              disabled={createMutation.isPending || !newTemplateName.trim() || !newTemplateHtml.trim()}
              className="gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Créer le template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le template "{templateToDelete?.nom}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && deleteMutation.mutate(templateToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
