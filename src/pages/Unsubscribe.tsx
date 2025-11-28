import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get("r");
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [alreadyUnsubscribed, setAlreadyUnsubscribed] = useState(false);

  useEffect(() => {
    const processUnsubscribe = async () => {
      if (!recipientId) {
        setError("Lien de désinscription invalide");
        setLoading(false);
        return;
      }

      try {
        const { data, error: functionError } = await supabase.functions.invoke("unsubscribe", {
          body: {},
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Construire l'URL manuellement avec le paramètre
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe?r=${recipientId}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors du désabonnement");
        }

        if (result.alreadyUnsubscribed) {
          setAlreadyUnsubscribed(true);
        }

        setSuccess(true);
        setEmail(result.email);
      } catch (err: any) {
        console.error("Unsubscribe error:", err);
        setError(err.message || "Une erreur est survenue lors du désabonnement");
      } finally {
        setLoading(false);
      }
    };

    processUnsubscribe();
  }, [recipientId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="mx-auto mb-4" />
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center space-y-2">
            {loading ? (
              <>
                <div className="mx-auto w-12 h-12 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <CardTitle className="text-2xl">Traitement en cours...</CardTitle>
                <CardDescription>
                  Veuillez patienter pendant que nous traitons votre demande
                </CardDescription>
              </>
            ) : success ? (
              <>
                <div className="mx-auto w-12 h-12 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl">
                  {alreadyUnsubscribed ? "Déjà désabonné" : "Désabonnement confirmé"}
                </CardTitle>
                <CardDescription>
                  {alreadyUnsubscribed
                    ? "Vous étiez déjà désabonné de notre liste de diffusion"
                    : "Vous avez été désabonné avec succès de notre liste de diffusion"}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Erreur</CardTitle>
                <CardDescription>
                  Une erreur est survenue lors du traitement de votre demande
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground">
                <p>Nous traitons votre demande de désabonnement...</p>
              </div>
            ) : success ? (
              <div className="space-y-4">
                {email && (
                  <Alert className="border-primary/20 bg-primary/5">
                    <Mail className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      L'adresse <span className="font-semibold">{email}</span> ne recevra plus d'emails de notre part.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    {alreadyUnsubscribed
                      ? "Vous ne recevrez plus d'emails de notre part."
                      : "Nous sommes désolés de vous voir partir. Vous ne recevrez plus d'emails marketing de notre part."}
                  </p>
                  <p className="text-xs">
                    Si vous avez été désabonné par erreur ou si vous souhaitez vous réabonner, 
                    veuillez nous contacter directement.
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Link to="/">
                    <Button variant="default" className="w-full">
                      Retour à l'accueil
                    </Button>
                  </Link>
                  <Link to="/support">
                    <Button variant="outline" className="w-full">
                      Contacter le support
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    {error || "Une erreur est survenue"}
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Si le problème persiste, veuillez nous contacter directement 
                    en indiquant ce code d'erreur : <code className="text-xs bg-muted px-1 py-0.5 rounded">{recipientId}</code>
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Link to="/">
                    <Button variant="default" className="w-full">
                      Retour à l'accueil
                    </Button>
                  </Link>
                  <Link to="/support">
                    <Button variant="outline" className="w-full">
                      Contacter le support
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} DimaMail. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Unsubscribe;
