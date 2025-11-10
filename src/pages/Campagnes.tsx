import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Campagnes = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Campagnes</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos campagnes d'email marketing
          </p>
        </div>
        <Button onClick={() => navigate("/campagnes/nouvelle")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes vos campagnes</CardTitle>
          <CardDescription>
            Consultez les performances de vos campagnes
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

export default Campagnes;
