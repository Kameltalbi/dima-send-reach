import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const TestEmail = () => {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    to: "",
    fromName: "DimaMail Test",
    fromEmail: "onboarding@resend.dev",
    subject: "Email de test - DimaMail",
    html: "<h1>Test d'envoi</h1><p>Ceci est un email de test envoyé depuis DimaMail.</p>",
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log("🚀 Envoi de l'email de test...", testData);

      const { data, error: invokeError } = await supabase.functions.invoke("send-email", {
        body: {
          testEmail: {
            to: testData.to,
            subject: testData.subject,
            html: testData.html,
            fromName: testData.fromName,
            fromEmail: testData.fromEmail,
          },
        },
      });

      console.log("📥 Réponse reçue:", { data, error: invokeError });

      if (invokeError) {
        console.error("❌ Erreur d'invocation:", invokeError);
        setError(JSON.stringify(invokeError, null, 2));
        toast.error("Erreur lors de l'appel à la fonction");
        return;
      }

      if (data?.success) {
        console.log("✅ Email envoyé avec succès!");
        setResult(data);
        toast.success("Email envoyé avec succès!");
      } else {
        console.error("⚠️ Échec de l'envoi:", data);
        setError(data?.message || "Erreur inconnue");
        toast.error(data?.message || "Erreur lors de l'envoi");
      }
    } catch (err: any) {
      console.error("💥 Exception:", err);
      setError(err.message || "Erreur inattendue");
      toast.error("Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Test d'envoi d'email</h1>
        <p className="text-muted-foreground mt-1">
          Diagnostiquez les problèmes d'envoi avec cette interface de test
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration du test</CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour envoyer un email de test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">Destinataire *</Label>
            <Input
              id="to"
              type="email"
              placeholder="exemple@email.com"
              value={testData.to}
              onChange={(e) => setTestData({ ...testData, to: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromName">Nom de l'expéditeur</Label>
              <Input
                id="fromName"
                value={testData.fromName}
                onChange={(e) => setTestData({ ...testData, fromName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">Email de l'expéditeur</Label>
              <Input
                id="fromEmail"
                type="email"
                value={testData.fromEmail}
                onChange={(e) => setTestData({ ...testData, fromEmail: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Utilisez onboarding@resend.dev pour les tests sans configuration
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={testData.subject}
              onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="html">Contenu HTML</Label>
            <Textarea
              id="html"
              rows={6}
              value={testData.html}
              onChange={(e) => setTestData({ ...testData, html: e.target.value })}
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={loading || !testData.to}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Envoyer le test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-green-900 dark:text-green-100">
                Email envoyé avec succès!
              </p>
              <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Erreur détectée</p>
              <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-auto">
                {error}
              </pre>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Checklist de diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <p className="font-medium">Vérifiez les points suivants :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>La clé API RESEND_API_KEY est configurée dans les secrets du backend</li>
              <li>Si vous utilisez un domaine personnalisé, il doit être vérifié sur resend.com/domains</li>
              <li>L'adresse onboarding@resend.dev fonctionne sans configuration</li>
              <li>Vérifiez la console du navigateur (F12) pour les logs détaillés</li>
              <li>Consultez les logs de l'edge function dans votre backend</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestEmail;
