import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const ParametresEnvoi = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Paramètres d'envoi</h1>
        <p className="text-muted-foreground mt-1">
          Configurez votre compte Amazon SES pour l'envoi d'emails
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ces informations sont nécessaires pour envoyer vos campagnes via Amazon SES. 
          Assurez-vous de configurer correctement vos enregistrements DNS (SPF, DKIM, DMARC) 
          sur votre domaine avant d'envoyer des emails.
        </AlertDescription>
      </Alert>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Configuration Amazon SES</CardTitle>
          <CardDescription>
            Renseignez vos clés d'accès AWS pour activer l'envoi d'emails
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
              Exemples: us-east-1, eu-west-1, ap-southeast-1
            </p>
          </div>
          <Button>Enregistrer la configuration</Button>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Configuration DNS</CardTitle>
          <CardDescription>
            Instructions pour configurer vos enregistrements DNS
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">
            Pour que vos emails soient correctement livrés, vous devez configurer 
            les enregistrements suivants dans votre zone DNS :
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>SPF</strong> : Autorise Amazon SES à envoyer des emails depuis votre domaine</li>
            <li><strong>DKIM</strong> : Signe numériquement vos emails pour prouver leur authenticité</li>
            <li><strong>DMARC</strong> : Définit comment traiter les emails qui échouent aux vérifications</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Consultez la documentation d'Amazon SES pour obtenir les valeurs exactes 
            à configurer pour votre domaine.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParametresEnvoi;
