import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Layout,
  Filter,
  Grid3x3,
  List,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Clock,
  Tag,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { useSeedTemplates } from "@/hooks/useSeedTemplates";
import { toast } from "sonner";
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

export default function Templates() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("saved");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "type">("recent");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const { seedTemplates } = useSeedTemplates();
  const queryClient = useQueryClient();

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
        content_json: template.content_json,
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

  const handleCreateNew = () => {
    setSelectedTemplateId(null);
    setIsEditorOpen(true);
    setShowCreateModal(false);
  };

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsEditorOpen(true);
    setShowCreateModal(false);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedTemplateId(null);
    refetch();
  };

  const handleLoadExamples = async () => {
    const result = await seedTemplates();
    if (result.success) {
      toast.success("3 templates d'exemple ont été ajoutés à votre collection");
      refetch();
    } else if (result.error === "Templates already exist") {
      toast.info("Vous avez déjà des templates dans votre collection. Les nouveaux templates seront ajoutés.");
      // Forcer l'ajout même si des templates existent déjà
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          // Ajouter les templates même s'il en existe déjà
          const { error } = await supabase.from("templates").insert([
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
          toast.success("3 nouveaux templates ont été ajoutés à votre collection");
          refetch();
        }
      } catch (error) {
        console.error("Error adding templates:", error);
        toast.error("Erreur lors de l'ajout des templates");
      }
    } else {
      toast.error("Erreur lors du chargement des templates d'exemple");
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

  const filteredTemplates = templates?.filter(template => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.nom?.toLowerCase().includes(query) ||
        template.id?.toString().includes(query) ||
        template.description?.toLowerCase().includes(query)
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

  if (isEditorOpen) {
    return (
      <TemplateEditor
        templateId={selectedTemplateId}
        onClose={handleCloseEditor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Header élégant */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Templates d'emails
            </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
              Créez et gérez vos modèles d'emails professionnels
          </p>
        </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button 
              onClick={handleLoadExamples} 
              variant="outline" 
              className="gap-2 border-2 w-full sm:w-auto"
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Charger des exemples</span>
              <span className="sm:hidden">Exemples</span>
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)} 
              className="gap-2 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Créer un template
          </Button>
        </div>
      </div>

        {/* Barre de recherche et filtres */}
        <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 text-base border-2 focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 h-11 border-2 flex-1 sm:flex-initial">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Trier</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={() => setSortBy("recent")}
                      className={sortBy === "recent" ? "bg-primary/10" : ""}
                    >
                      Plus récent
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy("name")}
                      className={sortBy === "name" ? "bg-primary/10" : ""}
                    >
                      Par nom
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy("type")}
                      className={sortBy === "type" ? "bg-primary/10" : ""}
                    >
                      Par type
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-1 border-2 rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9 p-0"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-9 w-9 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu principal */}
        {!showCreateModal ? (
          <div>
            {isLoading ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse border-2">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] bg-muted"></div>
                      <div className="p-6 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedTemplates.length === 0 ? (
              <Card className="border-2 border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="p-5 rounded-2xl bg-primary/10 mb-6">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Aucun template
                  </h3>
                  <p className="text-muted-foreground mb-8 text-center max-w-md">
                    {searchQuery 
                      ? "Aucun template ne correspond à votre recherche"
                      : "Créez votre premier template pour commencer à envoyer des emails professionnels"}
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={handleCreateNew} size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Créer un template
                    </Button>
                    <Button onClick={handleLoadExamples} variant="outline" size="lg" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Charger des exemples
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden bg-card"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <CardContent className="p-0">
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
                              <p className="text-sm text-muted-foreground font-medium">
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
                              handleUseTemplate(template.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Utiliser ce template
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
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                              {template.nom}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.description || "Pas de description"}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplateId(template.id);
                                setIsEditorOpen(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Éditer
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
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Badge variant="outline" className="text-xs font-medium">
                            <Tag className="h-3 w-3 mr-1" />
                            {template.type}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(template.updated_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short"
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-card"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Mail className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg mb-1.5 group-hover:text-primary transition-colors">
                                {template.nom}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.description || "Pas de description"}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTemplateId(template.id);
                                  setIsEditorOpen(true);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Éditer
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
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-xs font-medium">
                              <Tag className="h-3 w-3 mr-1" />
                              {template.type}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Modifié le {new Date(template.updated_at).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Modal de création professionnel */
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in-0">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border-2 animate-in slide-in-from-bottom-4">
              {/* Header du modal */}
              <div className="flex items-center justify-between px-8 py-6 border-b-2 bg-gradient-to-r from-card to-card/50">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Créer un email</h2>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Choisissez un template ou créez-en un nouveau
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateModal(false)}
                  className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Contenu du modal */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar gauche - Catégories */}
                <div className="w-72 border-r-2 bg-muted/30 p-6 space-y-6 overflow-y-auto">
                  {/* Bouton créer depuis zéro */}
                  <div>
                    <Button 
                      onClick={handleCreateNew}
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
                          onClick={() => setSelectedCategory("saved")}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            selectedCategory === "saved"
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4" />
                            Templates enregistrés
                          </div>
                          {selectedCategory === "saved" && templates && (
                            <span className="text-xs opacity-90 ml-7 block mt-1">
                              {templates.length} template{templates.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedCategory("campaigns")}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            selectedCategory === "campaigns"
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4" />
                            Campagnes email
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Templates prédéfinis */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider px-2">
                        Templates prédéfinis
                      </h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedCategory("basic")}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            selectedCategory === "basic"
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Layout className="h-4 w-4" />
                            Templates de base
                          </div>
                        </button>
                        <button
                          onClick={() => setSelectedCategory("ready")}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            selectedCategory === "ready"
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4" />
                            Prêt à l'emploi
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone principale - Liste des templates */}
                <div className="flex-1 flex flex-col overflow-hidden bg-background">
                  <div className="px-8 py-6 border-b-2 bg-card/50">
                    <div className="mb-5">
                      <h3 className="text-xl font-bold mb-2">
                        {selectedCategory === "saved" && "Tous les templates enregistrés"}
                        {selectedCategory === "campaigns" && "Campagnes email"}
                        {selectedCategory === "basic" && "Templates de base"}
                        {selectedCategory === "ready" && "Templates prêts à l'emploi"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCategory === "saved" 
                          ? "Commencez à créer votre email à l'aide d'un template précédemment enregistré."
                          : "Sélectionnez un template pour commencer."}
                      </p>
                    </div>

                    {/* Barre de recherche dans le modal */}
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Nom ou ID du template"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-11 h-11 text-base border-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grille de templates */}
                  <div className="flex-1 overflow-y-auto p-8">
                    {selectedCategory === "saved" && (
                      <>
                        {isLoading ? (
                          <div className="grid grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                              <Card key={i} className="animate-pulse border-2">
                                <CardContent className="p-0">
                                  <div className="aspect-[4/3] bg-muted"></div>
                                  <div className="p-6 space-y-3">
                                    <div className="h-5 bg-muted rounded w-3/4"></div>
                                    <div className="h-4 bg-muted rounded w-1/2"></div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : sortedTemplates.length === 0 ? (
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
                              <Button onClick={handleCreateNew} size="lg" className="gap-2">
                                Créer un template
                              </Button>
                              {(!templates || templates.length === 0) && (
                                <Button onClick={handleLoadExamples} variant="outline" size="lg" className="gap-2">
                                  <Sparkles className="h-4 w-4" />
                                  Charger des exemples
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-6">
                            {sortedTemplates.map((template) => (
                              <Card 
                                key={template.id} 
                                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden bg-card"
                                onClick={() => handleUseTemplate(template.id)}
                              >
                                <CardContent className="p-0">
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
                                          handleUseTemplate(template.id);
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
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Templates prédéfinis - Placeholder */}
                    {(selectedCategory === "basic" || selectedCategory === "ready") && (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="p-5 rounded-2xl bg-primary/10 mb-6">
                          <Layout className="h-12 w-12 text-primary" />
                        </div>
                        <p className="text-lg font-semibold text-foreground mb-2">
                          Templates prédéfinis
                        </p>
                        <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                          Cette fonctionnalité sera bientôt disponible. Créez vos propres templates en attendant.
                        </p>
                        <Button onClick={handleCreateNew} size="lg" className="gap-2">
                          Créer depuis zéro
                        </Button>
                      </div>
                    )}

                    {/* Campagnes email - Placeholder */}
                    {selectedCategory === "campaigns" && (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="p-5 rounded-2xl bg-primary/10 mb-6">
                          <Mail className="h-12 w-12 text-primary" />
                        </div>
                        <p className="text-lg font-semibold text-foreground mb-2">
                          Campagnes email
                        </p>
                        <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                          Vos campagnes précédentes apparaîtront ici une fois que vous aurez créé et envoyé des campagnes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
