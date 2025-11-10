import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Save, Eye } from "lucide-react";

const NouvelleCampagne = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/campagnes")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold text-foreground">Nouvelle campagne</h1>
          <p className="text-muted-foreground mt-1">
            Créez et configurez votre campagne d'e-mailing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Aperçu
          </Button>
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            Envoyer
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="envoi">Envoi</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Configurez les détails de votre campagne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom-campagne">Nom de la campagne</Label>
                <Input 
                  id="nom-campagne" 
                  placeholder="Ex: Newsletter Janvier 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sujet">Sujet de l'e-mail</Label>
                <Input 
                  id="sujet" 
                  placeholder="Le sujet qui apparaîtra dans la boîte mail"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expediteur-nom">Nom de l'expéditeur</Label>
                  <Input 
                    id="expediteur-nom" 
                    placeholder="Votre entreprise"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expediteur-email">Email de l'expéditeur</Label>
                  <Input 
                    id="expediteur-email" 
                    type="email"
                    placeholder="contact@entreprise.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="liste-cible">Liste de contacts</Label>
                <Select>
                  <SelectTrigger id="liste-cible">
                    <SelectValue placeholder="Sélectionnez une liste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les contacts</SelectItem>
                    <SelectItem value="liste1">Newsletter mensuelle</SelectItem>
                    <SelectItem value="liste2">Clients VIP</SelectItem>
                    <SelectItem value="liste3">Nouveaux inscrits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Éditeur d'e-mail</CardTitle>
              <CardDescription>
                Créez le contenu de votre e-mail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Utiliser un template</Label>
                <Select>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Choisir un template ou partir de zéro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">Vierge</SelectItem>
                    <SelectItem value="newsletter">Newsletter Moderne</SelectItem>
                    <SelectItem value="promo">Promo Flash</SelectItem>
                    <SelectItem value="welcome">Bienvenue Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contenu-html">Contenu HTML</Label>
                <Textarea 
                  id="contenu-html"
                  placeholder="<html>...</html>"
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Un éditeur visuel sera bientôt disponible
                </p>
              </div>

              <Button variant="outline" className="w-full">
                Ouvrir l'éditeur visuel (bientôt)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="envoi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'envoi</CardTitle>
              <CardDescription>
                Configurez quand et comment envoyer votre campagne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quand envoyer ?</Label>
                <Select defaultValue="now">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Maintenant</SelectItem>
                    <SelectItem value="schedule">Programmer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-test">Envoyer un e-mail de test</Label>
                <div className="flex gap-2">
                  <Input 
                    id="email-test" 
                    type="email"
                    placeholder="votre@email.com"
                  />
                  <Button variant="outline">Envoyer le test</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vérifiez le rendu avant d'envoyer à tous vos contacts
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Récapitulatif</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Destinataires :</dt>
                    <dd className="font-medium">1,247 contacts</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Envoi :</dt>
                    <dd className="font-medium">Immédiat</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("design")}>
              Retour
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                Enregistrer en brouillon
              </Button>
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Envoyer maintenant
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NouvelleCampagne;
