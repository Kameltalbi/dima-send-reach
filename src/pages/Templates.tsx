import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { TemplatesList } from "@/components/templates/TemplatesList";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { useSeedTemplates } from "@/hooks/useSeedTemplates";
import { toast } from "sonner";

export default function Templates() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { seedTemplates } = useSeedTemplates();

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

  const handleCreateNew = () => {
    setSelectedTemplateId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedTemplateId(null);
  };

  const handleLoadExamples = async () => {
    const result = await seedTemplates();
    if (result.success) {
      toast.success("4 templates d'exemple ont été ajoutés à votre collection");
      refetch();
    } else if (result.error === "Templates already exist") {
      toast.info("Vous avez déjà des templates dans votre collection");
    } else {
      toast.error("Erreur lors du chargement des templates d'exemple");
    }
  };

  if (isEditorOpen) {
    return (
      <TemplateEditor
        templateId={selectedTemplateId}
        onClose={handleCloseEditor}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates d'emails</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos modèles d'emails avec l'éditeur drag-and-drop
          </p>
        </div>
        <div className="flex gap-3">
          {(!templates || templates.length === 0) && !isLoading && (
            <Button onClick={handleLoadExamples} variant="outline" size="lg">
              <Sparkles className="mr-2 h-5 w-5" />
              Charger des exemples
            </Button>
          )}
          <Button onClick={handleCreateNew} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Nouveau template
          </Button>
        </div>
      </div>

      <TemplatesList
        templates={templates}
        isLoading={isLoading}
        onEdit={handleEdit}
      />
    </div>
  );
}
