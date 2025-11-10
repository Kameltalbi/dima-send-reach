import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Listes = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Listes</h1>
          <p className="text-muted-foreground mt-1">
            Organisez vos contacts en listes ciblées
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle liste
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos listes d'envoi</CardTitle>
          <CardDescription>
            Créez et gérez vos listes de diffusion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Fonctionnalité en développement...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Listes;
