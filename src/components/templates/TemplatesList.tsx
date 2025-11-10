import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
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
import { useState } from "react";

interface TemplatesListProps {
  templates?: any[];
  isLoading: boolean;
  onEdit: (templateId: string) => void;
}

export function TemplatesList({ templates, isLoading, onEdit }: TemplatesListProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);

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

  const handleDelete = (template: any) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      newsletter: "Newsletter",
      promotion: "Promotion",
      annonce: "Annonce",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  const getTypeVariant = (type: string): "default" | "secondary" | "outline" => {
    const variants: { [key: string]: "default" | "secondary" | "outline" } = {
      newsletter: "default",
      promotion: "secondary",
      annonce: "outline",
      autre: "outline",
    };
    return variants[type] || "outline";
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">
            Aucun template pour le moment
          </p>
          <p className="text-sm text-muted-foreground">
            Créez votre premier template en cliquant sur "Nouveau template"
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="line-clamp-1">{template.nom}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {template.description || "Pas de description"}
                  </CardDescription>
                </div>
                <Badge variant={getTypeVariant(template.type)}>
                  {getTypeLabel(template.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {template.thumbnail_url ? (
                  <img
                    src={template.thumbnail_url}
                    alt={template.nom}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <FileText className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Modifié le {new Date(template.updated_at).toLocaleDateString("fr-FR")}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(template.id)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Éditer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => duplicateMutation.mutate(template)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(template)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

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
    </>
  );
}
