import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

const CheckoutSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | "pending">("pending");

  // Vérifier le statut du paiement
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      // TODO: Implémenter la récupération de commande quand la table orders sera créée
      return null;
    },
    enabled: false, // Désactivé jusqu'à implémentation de la table orders
  });

  useEffect(() => {
    // TODO: Gérer le statut de paiement quand la table orders sera créée
    setPaymentStatus("success"); // Temporaire
  }, []);

  if (isLoading || paymentStatus === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">
                  {t('checkoutSuccess.verifying')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed" || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="border-red-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">{t('checkoutSuccess.failed.title')}</CardTitle>
              <CardDescription>
                {t('checkoutSuccess.failed.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>
                  {t('checkoutSuccess.failed.message')}
                </AlertDescription>
              </Alert>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate("/pricing")} className="flex-1">
                  {t('checkoutSuccess.failed.backToPricing')}
                </Button>
                <Button onClick={() => navigate("/support")} className="flex-1">
                  {t('checkoutSuccess.failed.contactSupport')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-green-500">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t('checkoutSuccess.success.title')}</CardTitle>
            <CardDescription>
              {t('checkoutSuccess.success.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('checkoutSuccess.success.orderNumber')}</p>
              <p className="text-lg font-mono font-semibold">{order.id}</p>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {t('checkoutSuccess.success.message', { plan: 'Starter', defaultValue: 'Votre abonnement a été activé avec succès' })}
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
                {t('checkoutSuccess.success.backToDashboard')}
              </Button>
              <Button onClick={() => navigate("/parametres")} className="flex-1">
                {t('checkoutSuccess.success.viewSubscription')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutSuccess;

