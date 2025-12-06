import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Code, 
  Eye, 
  FileText,
  Smartphone,
  Monitor,
  CheckCircle2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NouveauTemplate() {
  const { id: templateId } = useParams<{ id: string }>();
  const isEditMode = !!templateId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateType, setTemplateType] = useState("newsletter");
  const [htmlContent, setHtmlContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Charger le template existant en mode édition
  const { data: existingTemplate, isLoading } = useQuery({
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
    enabled: isEditMode,
  });

  // Pré-remplir les champs en mode édition
  useEffect(() => {
    if (existingTemplate) {
      setTemplateName(existingTemplate.nom || "");
      setTemplateDescription(existingTemplate.description || "");
      setTemplateType(existingTemplate.type || "newsletter");
      setHtmlContent(existingTemplate.content_html || "");
    }
  }, [existingTemplate]);

  // Mutation pour sauvegarder
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!templateName.trim()) {
        throw new Error("Veuillez saisir un nom pour le template");
      }
      if (!htmlContent.trim()) {
        throw new Error("Veuillez coller le code HTML du template");
      }

      const templateData = {
        user_id: user?.id,
        nom: templateName.trim(),
        description: templateDescription.trim() || null,
        type: templateType,
        content_html: htmlContent,
        content_json: {},
        updated_at: new Date().toISOString(),
      };

      if (isEditMode && templateId) {
        const { error } = await supabase
          .from("templates")
          .update(templateData)
          .eq("id", templateId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("templates")
          .insert(templateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success(isEditMode ? "Template modifié avec succès" : "Template créé avec succès");
      navigate("/templates");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement du template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/templates")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour aux templates</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || !templateName.trim() || !htmlContent.trim()}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditMode ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditMode ? "Modifier le template" : "Nouveau template"}
              </h1>
              <p className="text-muted-foreground">
                Collez le code HTML de votre template email pour l'enregistrer et l'utiliser dans vos campagnes.
              </p>
            </div>

            {/* Template Info Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du template *</Label>
                  <Input
                    id="name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ex: Newsletter Janvier 2025"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Input
                    id="description"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Décrivez brièvement ce template..."
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="transactional">Transactionnel</SelectItem>
                      <SelectItem value="announcement">Annonce</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* HTML Code Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Code HTML
                </CardTitle>
                <CardDescription>
                  Collez le code HTML complet de votre template email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder={`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mon Email</title>
</head>
<body>
  <!-- Collez votre code HTML ici -->
</body>
</html>`}
                  className="min-h-[400px] font-mono text-sm leading-relaxed resize-y"
                />
                
                {htmlContent.trim() && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{htmlContent.length.toLocaleString()} caractères</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Aperçu
                  </CardTitle>
                  
                  {/* Device Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                    <Button
                      variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewDevice("desktop")}
                      className="h-8 px-3 gap-1.5"
                    >
                      <Monitor className="h-4 w-4" />
                      <span className="hidden sm:inline">Desktop</span>
                    </Button>
                    <Button
                      variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewDevice("mobile")}
                      className="h-8 px-3 gap-1.5"
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="hidden sm:inline">Mobile</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className={`bg-white border rounded-lg overflow-hidden transition-all duration-300 mx-auto ${
                    previewDevice === "mobile" ? "max-w-[375px]" : "w-full"
                  }`}
                >
                  {htmlContent.trim() ? (
                    <iframe
                      srcDoc={htmlContent}
                      className="w-full border-0"
                      style={{ 
                        height: previewDevice === "mobile" ? "600px" : "500px",
                        pointerEvents: "none"
                      }}
                      title="Aperçu du template"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-center p-8">
                      <div className="space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <Code className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Aucun contenu</p>
                          <p className="text-sm text-muted-foreground max-w-[250px]">
                            Collez votre code HTML à gauche pour voir l'aperçu ici
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
