import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { EmailEditor } from "@/components/editor/EmailEditor";

export default function NouveauTemplate() {
  const { id: templateId } = useParams<{ id: string }>();
  const isEditMode = !!templateId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [templateName, setTemplateName] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
        throw new Error("Le template est vide");
      }

      const templateData = {
        user_id: user?.id,
        nom: templateName,
        content_html: htmlContent,
        type: "custom",
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
      toast.success(isEditMode ? "Template modifié" : "Template créé");
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

  const handleContentChange = useCallback((html: string) => {
    setHtmlContent(html);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/templates")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="h-6 w-px bg-border" />
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Nom du template..."
            className="w-64 h-9"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !templateName.trim()}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <EmailEditor
          initialContent={existingTemplate?.content_html || htmlContent}
          onSave={handleContentChange}
          onContentChange={handleContentChange}
        />
      </div>
    </div>
  );
}
