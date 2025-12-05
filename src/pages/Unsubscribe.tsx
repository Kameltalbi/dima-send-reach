import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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
  const [showPreferences, setShowPreferences] = useState(false);
  const [unsubscribeType, setUnsubscribeType] = useState<"all" | "selective">("all");
  const [preferences, setPreferences] = useState({
    newsletters: true,
    promotions: true,
    transactional: true,
    updates: true,
  });
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const processUnsubscribe = async () => {
      if (!recipientId) {
        setError(t('unsubscribe.error.invalidLink'));
        setLoading(false);
        return;
      }

      try {
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
          setSuccess(true);
        } else {
          // Afficher le formulaire de préférences
          setShowPreferences(true);
        }
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

  const handleSubmitPreferences = async () => {
    if (!recipientId) return;

    setIsSubmitting(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe?r=${recipientId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId,
          unsubscribeAll: unsubscribeType === "all",
          preferences: unsubscribeType === "selective" ? preferences : {},
          reason: reason || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('unsubscribe.error.subtitle'));
      }

      setSuccess(true);
      setShowPreferences(false);
    } catch (err: any) {
      console.error("Error submitting preferences:", err);
      setError(err.message || t('unsubscribe.error.subtitle'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            ) : showPreferences ? (
              <div className="space-y-6">
                {email && (
                  <Alert className="border-primary/20 bg-primary/5">
                    <Mail className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      {t('unsubscribe.preferences.email', { email })}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">
                      {t('unsubscribe.preferences.title') || "Choisissez vos préférences"}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('unsubscribe.preferences.subtitle') ||
                        "Vous pouvez vous désabonner de tous les emails ou choisir les types d'emails que vous souhaitez continuer à recevoir."}
                    </p>
                  </div>

                  <RadioGroup value={unsubscribeType} onValueChange={(value: "all" | "selective") => setUnsubscribeType(value)}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="flex-1 cursor-pointer">
                        <div className="font-medium">
                          {t('unsubscribe.preferences.unsubscribeAll') || "Me désabonner de tous les emails"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('unsubscribe.preferences.unsubscribeAllDesc') ||
                            "Vous ne recevrez plus aucun email de notre part"}
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="selective" id="selective" />
                      <Label htmlFor="selective" className="flex-1 cursor-pointer">
                        <div className="font-medium">
                          {t('unsubscribe.preferences.selective') || "Choisir les types d'emails"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('unsubscribe.preferences.selectiveDesc') ||
                            "Choisissez les types d'emails que vous souhaitez continuer à recevoir"}
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {unsubscribeType === "selective" && (
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium">
                        {t('unsubscribe.preferences.selectTypes') || "Types d'emails à recevoir"}
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="newsletters"
                            checked={preferences.newsletters}
                            onCheckedChange={(checked) =>
                              setPreferences({ ...preferences, newsletters: !!checked })
                            }
                          />
                          <Label htmlFor="newsletters" className="cursor-pointer">
                            {t('unsubscribe.preferences.newsletters') || "Newsletters"}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="promotions"
                            checked={preferences.promotions}
                            onCheckedChange={(checked) =>
                              setPreferences({ ...preferences, promotions: !!checked })
                            }
                          />
                          <Label htmlFor="promotions" className="cursor-pointer">
                            {t('unsubscribe.preferences.promotions') || "Promotions et offres"}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="transactional"
                            checked={preferences.transactional}
                            onCheckedChange={(checked) =>
                              setPreferences({ ...preferences, transactional: !!checked })
                            }
                          />
                          <Label htmlFor="transactional" className="cursor-pointer">
                            {t('unsubscribe.preferences.transactional') || "Emails transactionnels"}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="updates"
                            checked={preferences.updates}
                            onCheckedChange={(checked) =>
                              setPreferences({ ...preferences, updates: !!checked })
                            }
                          />
                          <Label htmlFor="updates" className="cursor-pointer">
                            {t('unsubscribe.preferences.updates') || "Mises à jour importantes"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="reason" className="text-sm">
                      {t('unsubscribe.preferences.reason') || "Raison (optionnel)"}
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t('unsubscribe.preferences.reasonPlaceholder') || "Pourquoi vous désabonnez-vous ?"}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleSubmitPreferences}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? t('common.loading') || "Traitement..."
                      : t('unsubscribe.preferences.confirm') || "Confirmer"}
                  </Button>
                  <Link to="/">
                    <Button variant="outline" className="w-full">
                      {t('common.cancel') || "Annuler"}
                    </Button>
                  </Link>
                </div>
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
