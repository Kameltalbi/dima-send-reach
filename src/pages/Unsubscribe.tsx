import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTranslation } from "react-i18next";

const Unsubscribe = () => {
  const { t } = useTranslation();
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
        setError(t('unsubscribe.error.invalidLink'));
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
          throw new Error(result.error || t('unsubscribe.error.subtitle'));
        }

        if (result.alreadyUnsubscribed) {
          setAlreadyUnsubscribed(true);
        }

        setSuccess(true);
        setEmail(result.email);
      } catch (err: any) {
        console.error("Unsubscribe error:", err);
        setError(err.message || t('unsubscribe.error.subtitle'));
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
                <CardTitle className="text-2xl">{t('unsubscribe.processing')}</CardTitle>
                <CardDescription>
                  {t('unsubscribe.processingDesc')}
                </CardDescription>
              </>
            ) : success ? (
              <>
                <div className="mx-auto w-12 h-12 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl">
                  {alreadyUnsubscribed ? t('unsubscribe.success.alreadyTitle') : t('unsubscribe.success.title')}
                </CardTitle>
                <CardDescription>
                  {alreadyUnsubscribed
                    ? t('unsubscribe.success.alreadySubtitle')
                    : t('unsubscribe.success.subtitle')}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <CardTitle className="text-2xl">{t('unsubscribe.error.title')}</CardTitle>
                <CardDescription>
                  {t('unsubscribe.error.subtitle')}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground">
                <p>{t('unsubscribe.processingDesc')}</p>
              </div>
            ) : success ? (
              <div className="space-y-4">
                {email && (
                  <Alert className="border-primary/20 bg-primary/5">
                    <Mail className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      {t('unsubscribe.success.message', { email })}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    {alreadyUnsubscribed
                      ? t('unsubscribe.success.alreadyInfo')
                      : t('unsubscribe.success.info')}
                  </p>
                  <p className="text-xs">
                    {t('unsubscribe.success.reSubscribe')}
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Link to="/">
                    <Button variant="default" className="w-full">
                      {t('unsubscribe.success.backHome')}
                    </Button>
                  </Link>
                  <Link to="/support">
                    <Button variant="outline" className="w-full">
                      {t('unsubscribe.success.contactSupport')}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    {error || t('unsubscribe.error.subtitle')}
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground">
                  <p>
                    {t('unsubscribe.error.message', { code: recipientId })}
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Link to="/">
                    <Button variant="default" className="w-full">
                      {t('unsubscribe.error.backHome')}
                    </Button>
                  </Link>
                  <Link to="/support">
                    <Button variant="outline" className="w-full">
                      {t('unsubscribe.error.contactSupport')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {t('unsubscribe.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
};

export default Unsubscribe;
