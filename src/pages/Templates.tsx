import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

const templates = [
  {
    id: 1,
    name: "Newsletter Moderne",
    description: "Design épuré avec en-tête coloré",
    category: "Newsletter"
  },
  {
    id: 2,
    name: "Promo Flash",
    description: "Mise en avant de promotion limitée",
    category: "Promotion"
  },
  {
    id: 3,
    name: "Bienvenue Client",
    description: "Email d'accueil personnalisé",
    category: "Transactionnel"
  },
  {
    id: 4,
    name: "Annonce Produit",
    description: "Lancement de nouveau produit",
    category: "Produit"
  },
  {
    id: 5,
    name: "Événement",
    description: "Invitation à un événement",
    category: "Événement"
  },
  {
    id: 6,
    name: "Rapport Mensuel",
    description: "Récapitulatif des activités",
    category: "Newsletter"
  },
];

const Templates = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Modèles d'e-mails prêts à l'emploi
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Créer un template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {template.category}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" className="flex-1">
                Aperçu
              </Button>
              <Button className="flex-1">
                Utiliser
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créer votre propre template</CardTitle>
          <CardDescription>
            Concevez des modèles personnalisés réutilisables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Créez vos propres templates avec notre éditeur visuel et réutilisez-les 
            pour gagner du temps dans la création de vos campagnes.
          </p>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau template personnalisé
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Templates;
