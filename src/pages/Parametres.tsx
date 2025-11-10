import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Parametres = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre profil et vos configurations
        </p>
      </div>

      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="ses">Amazon SES</TabsTrigger>
          <TabsTrigger value="domaine">Domaine d'envoi</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos coordonnées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" placeholder="Votre prénom" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" placeholder="Votre nom" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="votre@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entreprise">Nom de l'entreprise</Label>
                <Input id="entreprise" placeholder="Votre entreprise" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-envoi">Email d'envoi par défaut</Label>
                <Input id="email-envoi" type="email" placeholder="newsletter@entreprise.com" />
                <p className="text-sm text-muted-foreground">
                  Cette adresse sera utilisée comme expéditeur par défaut
                </p>
              </div>
              <Button>Enregistrer les modifications</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>
                Modifier votre mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Changer le mot de passe</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ses" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ces informations sont requises pour envoyer vos campagnes via Amazon SES. 
              Assurez-vous de bien configurer vos enregistrements DNS (SPF, DKIM, DMARC) 
              sur votre domaine avant d'envoyer des e-mails.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Configuration Amazon SES</CardTitle>
              <CardDescription>
                Entrez vos clés d'accès AWS pour activer l'envoi d'e-mails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-key">AWS Access Key ID</Label>
                <Input 
                  id="access-key" 
                  type="text" 
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret-key">AWS Secret Access Key</Label>
                <Input 
                  id="secret-key" 
                  type="password" 
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Région AWS</Label>
                <Input 
                  id="region" 
                  type="text" 
                  placeholder="us-east-1"
                  defaultValue="us-east-1"
                />
                <p className="text-sm text-muted-foreground">
                  Exemples : us-east-1, eu-west-1, ap-southeast-1
                </p>
              </div>
              <Button>Enregistrer la configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domaine" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration DNS</CardTitle>
              <CardDescription>
                Instructions pour configurer vos enregistrements DNS
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">
                Pour que vos e-mails soient correctement délivrés, vous devez configurer 
                les enregistrements suivants dans votre zone DNS :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>SPF</strong> : Autorise Amazon SES à envoyer des e-mails depuis votre domaine</li>
                <li><strong>DKIM</strong> : Signe numériquement vos e-mails pour prouver leur authenticité</li>
                <li><strong>DMARC</strong> : Définit comment gérer les e-mails qui échouent aux vérifications</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Consultez la documentation Amazon SES pour obtenir les valeurs exactes 
                à configurer pour votre domaine.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences générales</CardTitle>
              <CardDescription>
                Personnalisez votre expérience DimaMail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="langue">Langue</Label>
                <Input id="langue" defaultValue="Français" disabled />
                <p className="text-sm text-muted-foreground">
                  D'autres langues seront bientôt disponibles
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Input id="timezone" defaultValue="Europe/Paris (GMT+1)" />
              </div>
              <Button>Enregistrer les préférences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Parametres;
