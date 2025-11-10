import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Contacts = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos contacts et segmentez votre audience
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Importer CSV</Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau contact
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des contacts</CardTitle>
          <CardDescription>
            Tous vos contacts en un seul endroit
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

export default Contacts;
