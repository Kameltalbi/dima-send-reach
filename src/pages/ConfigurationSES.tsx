import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Save, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ConfigurationSESContent = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ses_config")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          accessKeyId: data.aws_access_key_id || "",
          secretAccessKey: "••••••••", // Ne pas afficher la clé secrète
          region: data.aws_region || "us-east-1",
        });
      }
    } catch (error: any) {
      console.error("Error loading SES config:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration SES",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Vérifier si une config existe déjà
      const { data: existingConfig } = await supabase
        .from("ses_config")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();

      const configData = {
        aws_access_key_id: config.accessKeyId,
        aws_secret_access_key: config.secretAccessKey !== "••••••••" ? config.secretAccessKey : undefined,
        aws_region: config.region,
        is_active: true,
      };

      let error;
      if (existingConfig) {
        // Mise à jour
        const updateData: any = {
          aws_access_key_id: configData.aws_access_key_id,
          aws_region: configData.aws_region,
        };
        
        // Ne mettre à jour la clé secrète que si elle a été modifiée
        if (configData.aws_secret_access_key) {
          updateData.aws_secret_access_key = configData.aws_secret_access_key;
        }

        const result = await supabase
          .from("ses_config")
          .update(updateData)
          .eq("id", existingConfig.id);
        error = result.error;
      } else {
        // Insertion
        const result = await supabase
          .from("ses_config")
          .insert([{
            aws_access_key_id: configData.aws_access_key_id,
            aws_secret_access_key: configData.aws_secret_access_key,
            aws_region: configData.aws_region,
            is_active: true,
          }]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Configuration enregistrée",
        description: "La configuration Amazon SES a été mise à jour avec succès",
      });

      // Recharger la config
      await loadConfig();
    } catch (error: any) {
      console.error("Error saving SES config:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la configuration SES",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Configuration Amazon SES</h1>
        <p className="text-muted-foreground mt-1">
          Configuration globale pour l'envoi d'e-mails de la plateforme
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Cette configuration est unique pour toute la plateforme DimaMail. 
          Tous les utilisateurs enverront leurs campagnes via ces identifiants AWS SES.
        </AlertDescription>
      </Alert>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Identifiants Amazon SES</CardTitle>
          <CardDescription>
            Configurez les clés d'accès AWS pour permettre l'envoi d'e-mails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-key">AWS Access Key ID</Label>
            <Input 
              id="access-key" 
              type="text" 
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={config.accessKeyId}
              onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret-key">AWS Secret Access Key</Label>
            <Input 
              id="secret-key" 
              type="password" 
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              value={config.secretAccessKey}
              onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Pour des raisons de sécurité, la clé secrète n'est pas affichée après l'enregistrement
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Région AWS</Label>
            <Input 
              id="region" 
              type="text" 
              placeholder="us-east-1"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Exemples : us-east-1, eu-west-1, ap-southeast-1
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer la configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Configuration DNS</CardTitle>
          <CardDescription>
            Instructions pour les administrateurs de domaines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Pour que les e-mails soient correctement délivrés, les enregistrements DNS suivants 
            doivent être configurés sur les domaines d'envoi :
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">SPF</strong>
                <p className="text-sm text-muted-foreground">
                  Autorise Amazon SES à envoyer des e-mails depuis le domaine
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">DKIM</strong>
                <p className="text-sm text-muted-foreground">
                  Signe numériquement les e-mails pour prouver leur authenticité
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">DMARC</strong>
                <p className="text-sm text-muted-foreground">
                  Définit comment gérer les e-mails qui échouent aux vérifications
                </p>
              </div>
            </div>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Consultez la <a href="https://docs.aws.amazon.com/ses/" target="_blank" rel="noopener noreferrer" className="underline">documentation Amazon SES</a> pour obtenir les valeurs exactes à configurer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

const ConfigurationSES = () => {
  return (
    <ProtectedRoute requiredRole="superadmin">
      <ConfigurationSESContent />
    </ProtectedRoute>
  );
};

export default ConfigurationSES;
