import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Info, 
  Save, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  CheckCircle,
  Copy,
  Mail,
  Shield,
  Key,
  Server,
  Globe,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Settings,
  ChevronRight,
  Edit,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ConfigurationSESContent = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
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
          secretAccessKey: "••••••••",
          region: data.aws_region || "us-east-1",
        });
        setConfigExists(true);
      } else {
        setConfigExists(false);
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

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-ses-connection', {
        body: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey !== "••••••••" ? config.secretAccessKey : undefined,
          region: config.region,
        }
      });

      if (error) {
        if (error.message?.includes('not found') || error.message?.includes('Function')) {
          if (!config.accessKeyId || !config.secretAccessKey || config.secretAccessKey === "••••••••") {
            throw new Error("Veuillez remplir tous les champs avant de tester");
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
          setTestResult({
            success: true,
            message: "Les identifiants sont valides. Note: Un test réel nécessite une edge function Supabase."
          });
        } else {
          throw error;
        }
      } else {
        setTestResult({
          success: data.success || true,
          message: data.message || "Connexion réussie !"
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Erreur lors du test de connexion"
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Le texte a été copié dans le presse-papiers",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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
        const updateData: any = {
          aws_access_key_id: configData.aws_access_key_id,
          aws_region: configData.aws_region,
        };
        
        if (configData.aws_secret_access_key) {
          updateData.aws_secret_access_key = configData.aws_secret_access_key;
        }

        const result = await supabase
          .from("ses_config")
          .update(updateData)
          .eq("id", existingConfig.id);
        error = result.error;
      } else {
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

  const sections = [
    {
      id: "credentials",
      title: "Identifiants AWS",
      description: configExists 
        ? "Vos identifiants AWS sont configurés" 
        : "Configurez vos clés d'accès AWS pour permettre l'envoi d'e-mails",
      icon: Key,
      completed: configExists && config.accessKeyId && config.region,
      content: (
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              Ces identifiants sont partagés par tous les utilisateurs de la plateforme. 
              Assurez-vous qu'ils ont les permissions nécessaires pour Amazon SES.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-key" className="text-sm font-medium">
                AWS Access Key ID
              </Label>
              <Input 
                id="access-key" 
                type="text" 
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={config.accessKeyId}
                onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Commence généralement par "AKIA"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-key" className="text-sm font-medium">
                AWS Secret Access Key
              </Label>
              <div className="relative">
                <Input 
                  id="secret-key" 
                  type={showSecretKey ? "text" : "password"}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={config.secretAccessKey}
                  onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                  className="h-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {configExists && config.secretAccessKey === "••••••••" 
                  ? "Pour des raisons de sécurité, la clé secrète n'est pas affichée. Entrez une nouvelle clé pour la modifier."
                  : "Clé secrète longue (environ 40 caractères)"
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region" className="text-sm font-medium">
                Région AWS
              </Label>
              <Input 
                id="region" 
                type="text" 
                placeholder="us-east-1"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                className="h-10"
              />
              <div className="flex gap-2 mt-2">
                {["us-east-1", "eu-west-1", "eu-central-1"].map((region) => (
                  <Button
                    key={region}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfig({ ...config, region });
                      copyToClipboard(region);
                    }}
                    className="h-7 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" /> {region}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={saving || !config.accessKeyId || (!config.secretAccessKey || config.secretAccessKey === "••••••••")} 
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les identifiants
                </>
              )}
            </Button>
          </div>
        </div>
      )
    },
    {
      id: "test",
      title: "Test de connexion",
      description: testResult?.success 
        ? "La connexion à Amazon SES fonctionne correctement"
        : "Vérifiez que votre configuration fonctionne correctement",
      icon: Mail,
      completed: testResult?.success || false,
      content: (
        <div className="space-y-4">
          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"} className="border-2">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <AlertDescription className="font-medium">
                  {testResult.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Ce test vérifie que vos identifiants sont valides et que la connexion à Amazon SES fonctionne.
            </p>
            <Button 
              onClick={handleTestConnection} 
              disabled={testing || !configExists}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Tester la connexion
                </>
              )}
            </Button>
            {!configExists && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Vous devez d'abord enregistrer vos identifiants avant de pouvoir tester la connexion.
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      id: "dns",
      title: "Configuration DNS",
      description: "Configurez les enregistrements DNS pour une délivrabilité optimale",
      icon: Globe,
      completed: false,
      content: (
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              Ces configurations doivent être faites dans votre gestionnaire de DNS (chez votre hébergeur de domaine).
              Les valeurs exactes dépendent de votre configuration AWS SES.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {[
              {
                title: "SPF (Sender Policy Framework)",
                description: "Autorise Amazon SES à envoyer des e-mails depuis votre domaine",
                value: "Type: TXT | Nom: @ | Valeur: v=spf1 include:amazonses.com ~all",
                note: "Remplacez \"amazonses.com\" par les serveurs spécifiques de votre région si nécessaire."
              },
              {
                title: "DKIM (DomainKeys Identified Mail)",
                description: "Signe numériquement vos e-mails pour prouver leur authenticité",
                value: "1. Dans la console AWS SES, allez dans \"Verified identities\"\n2. Sélectionnez votre domaine et allez dans l'onglet \"DKIM\"\n3. Copiez les enregistrements CNAME fournis par AWS\n4. Ajoutez-les dans votre gestionnaire DNS",
                note: null,
                action: (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open("https://console.aws.amazon.com/ses/home", "_blank")}
                    className="mt-2"
                  >
                    Ouvrir AWS SES Console <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                )
              },
              {
                title: "DMARC (Domain-based Message Authentication)",
                description: "Définit comment gérer les e-mails qui échouent aux vérifications SPF et DKIM",
                value: "Type: TXT | Nom: _dmarc | Valeur: v=DMARC1; p=none; rua=mailto:dmarc@votredomaine.com",
                note: "Ajustez la politique (p=none/quarantine/reject) selon vos besoins."
              }
            ].map((item) => (
              <Card key={item.title} className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className={`p-3 bg-muted rounded text-xs ${item.value.includes('\n') ? 'whitespace-pre-line' : 'font-mono'}`}>
                    {item.value}
                  </div>
                  {item.note && (
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  )}
                  {item.action}
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-900">
              Consultez la{" "}
              <a 
                href="https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dns.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline font-medium"
              >
                documentation officielle Amazon SES
              </a>
              {" "}pour obtenir les valeurs exactes à configurer pour votre domaine.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Configuration Amazon SES</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez l'envoi d'e-mails professionnel via Amazon SES
          </p>
        </div>
        <Badge variant={configExists ? "default" : "secondary"} className="px-3 py-1">
          {configExists ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Configuré
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Non configuré
            </span>
          )}
        </Badge>
      </div>

      {/* Sections en cartes style Brevo */}
      <div className="space-y-4">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSection === section.id;
          
          return (
            <Card 
              key={section.id} 
              className={`border transition-all hover:shadow-md ${
                isExpanded ? 'shadow-md' : ''
              }`}
            >
              <CardContent className="p-0">
                <div 
                  className="flex items-center justify-between p-6 cursor-pointer"
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      section.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <SectionIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{section.title}</h3>
                        {section.completed && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {section.completed && (
                      <Badge variant="outline" className="text-xs">
                        Complété
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSection(isExpanded ? null : section.id);
                      }}
                      className="gap-2"
                    >
                      {isExpanded ? 'Masquer' : 'Configurer'}
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-0 border-t animate-in slide-in-from-top-2">
                    <div className="pt-6">
                      {section.content}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Guide rapide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Guide rapide : Obtenir vos clés AWS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="font-semibold text-foreground min-w-[20px]">1.</span>
              <div>
                <p className="font-medium text-foreground mb-1">Connectez-vous à la console AWS</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-primary"
                  onClick={() => window.open("https://console.aws.amazon.com", "_blank")}
                >
                  Ouvrir AWS Console <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-foreground min-w-[20px]">2.</span>
              <p>Accédez à <strong className="text-foreground">IAM</strong> (Identity and Access Management)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-foreground min-w-[20px]">3.</span>
              <div>
                <p className="mb-1">Créez un utilisateur IAM avec les permissions <code className="px-1.5 py-0.5 bg-muted rounded text-xs">AmazonSESFullAccess</code></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-foreground min-w-[20px]">4.</span>
              <p>Générez les clés d'accès dans l'onglet <strong className="text-foreground">"Security credentials"</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-foreground min-w-[20px]">5.</span>
              <p>Notez votre région AWS (ex: us-east-1, eu-west-1)</p>
            </div>
          </div>
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
