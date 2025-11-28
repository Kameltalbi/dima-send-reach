import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Building2,
  Receipt,
  Banknote,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Info,
  FileText,
  Building,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layouts/AppLayout";
import { useTranslation } from "react-i18next";

type PaymentMethod = "card" | "check" | "transfer" | "cash";

const plans = {
  starter: {
    name: "Starter",
    price: 340,
    currency: "DT",
    period: "/an",
    emails: "10,000 e-mails / mois",
    users: "3 utilisateurs",
    domains: "3 domaines",
  },
  essential: {
    name: "Essential",
    price: 590,
    currency: "DT",
    period: "/an",
    emails: "50,000 e-mails / mois",
    users: "10 utilisateurs",
    domains: "10 domaines",
  },
  pro: {
    name: "Pro",
    price: 990,
    currency: "DT",
    period: "/an",
    emails: "200,000 e-mails / mois",
    users: "Utilisateurs illimités",
    domains: "Domaines illimités",
  },
};

const Checkout = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const planParam = searchParams.get("plan") as keyof typeof plans;
  const selectedPlan = plans[planParam] || plans.starter;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Informations pour paiement par chèque/virement
  const [paymentInfo, setPaymentInfo] = useState({
    companyName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: user?.email || "",
    notes: "",
  });

  // Charger le profil utilisateur
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Initialiser les informations depuis le profil
  useEffect(() => {
    if (profile) {
      setPaymentInfo((prev) => ({
        ...prev,
        companyName: profile.nom_entreprise || "",
        email: user?.email || "",
      }));
    }
  }, [profile, user]);

  // Mutation pour créer une commande
  const createOrderMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      if (!user) throw new Error("Non authentifié");

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          plan_type: planParam,
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "card" ? "pending" : "pending_manual",
          billing_info: paymentInfo,
          ...paymentData,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      return order;
    },
    onSuccess: (order) => {
      setOrderId(order.id);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('checkout.orderError'));
    },
  });

  const handleCardPayment = async () => {
    setIsProcessing(true);
    try {
      // Créer la commande d'abord
      const order = await createOrderMutation.mutateAsync({});

      // Appeler l'Edge Function pour créer un lien de paiement Konnect
      const { data, error } = await supabase.functions.invoke('create-konnect-payment', {
        body: {
          orderId: order.id,
          amount: selectedPlan.price,
          currency: 'TND',
          description: `Abonnement ${selectedPlan.name} - DimaMail`,
          returnUrl: `${window.location.origin}/checkout/success?orderId=${order.id}`,
          cancelUrl: `${window.location.origin}/checkout?plan=${planParam}`,
        },
      });

      if (error) throw error;

      // Rediriger vers la page de paiement Konnect
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(t('checkout.paymentError'));
      }
    } catch (error: any) {
      toast.error(error.message || t('checkout.paymentError'));
      setIsProcessing(false);
    }
  };

  const handleManualPayment = async () => {
    if (!paymentInfo.companyName || !paymentInfo.address || !paymentInfo.email) {
      toast.error(t('checkout.fillRequired'));
      return;
    }

    setIsProcessing(true);
    try {
      const order = await createOrderMutation.mutateAsync({});

      // Envoyer un email de confirmation (via Edge Function)
      // TODO: Implémenter l'envoi d'email

      setIsSuccess(true);
      toast.success(t('checkout.orderCreated'));
    } catch (error: any) {
      toast.error(error.message || t('checkout.orderError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (paymentMethod === "card") {
      await handleCardPayment();
    } else {
      await handleManualPayment();
    }
  };

  if (isSuccess && orderId) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="border-green-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">{t('checkout.orderConfirmed')}</CardTitle>
              <CardDescription>
                {t('checkout.orderConfirmedDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('checkout.orderNumber')}</p>
                <p className="text-lg font-mono font-semibold">{orderId}</p>
              </div>

              {paymentMethod === "card" ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t('checkout.orderActive', { plan: selectedPlan.name })}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{t('checkout.nextSteps')}</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {paymentMethod === "check" && (
                        <li>{t('checkout.checkInstructions.send')}</li>
                      )}
                      {paymentMethod === "transfer" && (
                        <li>{t('checkout.transferInstructions.email')}</li>
                      )}
                      {paymentMethod === "cash" && (
                        <li>{t('checkout.cashInstructions.contact')}</li>
                      )}
                      <li>{t('checkout.transferInstructions.email')}</li>
                      {paymentMethod === "check" && (
                        <li>{t('checkout.checkInstructions.activate')}</li>
                      )}
                      {paymentMethod === "transfer" && (
                        <li>{t('checkout.checkInstructions.activate')}</li>
                      )}
                      {paymentMethod === "cash" && (
                        <li>{t('checkout.cashInstructions.activate')}</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
                  {t('checkout.backToDashboard')}
                </Button>
                <Button onClick={() => navigate("/parametres")} className="flex-1">
                  {t('checkout.viewSubscription')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/pricing")}
          className="mb-4 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('checkout.backToPricing')}
        </Button>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Colonne principale - Formulaire */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.paymentMethod')}</CardTitle>
                <CardDescription>
                  {t('checkout.paymentMethodDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <div className="space-y-4">
                    {/* Carte bancaire */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="card" id="card" className="mt-1" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{t('checkout.card')}</p>
                              <p className="text-sm text-muted-foreground">
                                {t('checkout.cardSecure')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{t('checkout.cardRecommended')}</Badge>
                        </div>
                      </Label>
                    </div>

                    {/* Virement bancaire */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="transfer" id="transfer" className="mt-1" />
                      <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{t('checkout.transfer')}</p>
                            <p className="text-sm text-muted-foreground">
                              {t('checkout.transferDesc')}
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Chèque */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="check" id="check" className="mt-1" />
                      <Label htmlFor="check" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{t('checkout.check')}</p>
                            <p className="text-sm text-muted-foreground">
                              {t('checkout.checkDesc')}
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Espèces */}
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="cash" id="cash" className="mt-1" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Banknote className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{t('checkout.cash')}</p>
                            <p className="text-sm text-muted-foreground">
                              {t('checkout.cashDesc')}
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Formulaire de paiement par carte */}
            {paymentMethod === "card" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.billingInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {t('checkout.cardRedirect')}
                    </AlertDescription>
                  </Alert>
                  <div className="p-8 border-2 border-dashed rounded-lg text-center bg-muted/30">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="font-medium mb-2">{t('checkout.cardSecureTitle')}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('checkout.cardRedirectAfter')}
                    </p>
                    <Alert className="bg-blue-50 border-blue-200 text-left">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-sm">
                        <strong>{t('checkout.cardFees')}</strong> {t('checkout.cardFeesDesc')}
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulaire pour méthodes manuelles */}
            {(paymentMethod === "check" || paymentMethod === "transfer" || paymentMethod === "cash") && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.billingInfo')}</CardTitle>
                  <CardDescription>
                    {t('checkout.billingInfoDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">
                        {t('checkout.companyNameRequired')}
                      </Label>
                      <Input
                        id="companyName"
                        value={paymentInfo.companyName}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, companyName: e.target.value })}
                        placeholder={t('checkout.companyName')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {t('checkout.emailRequired')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={paymentInfo.email}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, email: e.target.value })}
                        placeholder="contact@entreprise.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {t('checkout.addressRequired')}
                    </Label>
                    <Input
                      id="address"
                      value={paymentInfo.address}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, address: e.target.value })}
                      placeholder={t('checkout.address')}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('checkout.city')}</Label>
                      <Input
                        id="city"
                        value={paymentInfo.city}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, city: e.target.value })}
                        placeholder={t('checkout.city')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">{t('checkout.postalCode')}</Label>
                      <Input
                        id="postalCode"
                        value={paymentInfo.postalCode}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, postalCode: e.target.value })}
                        placeholder={t('checkout.postalCode')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('checkout.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={paymentInfo.phone}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, phone: e.target.value })}
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('checkout.notes')}</Label>
                    <Textarea
                      id="notes"
                      value={paymentInfo.notes}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, notes: e.target.value })}
                      placeholder={t('checkout.notes')}
                      rows={3}
                    />
                  </div>

                  {paymentMethod === "check" && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('checkout.checkInstructions.title')}</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>{t('checkout.checkInstructions.libelle')}</li>
                          <li>{t('checkout.checkInstructions.amount', { amount: selectedPlan.price, currency: selectedPlan.currency })}</li>
                          <li>{t('checkout.checkInstructions.send')}</li>
                          <li>{t('checkout.checkInstructions.activate')}</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {paymentMethod === "transfer" && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('checkout.transferInstructions.title')}</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>{t('checkout.transferInstructions.amount', { amount: selectedPlan.price, currency: selectedPlan.currency })}</li>
                          <li>{t('checkout.transferInstructions.iban')}</li>
                          <li>{t('checkout.transferInstructions.reference')}</li>
                          <li>{t('checkout.transferInstructions.email')}</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {paymentMethod === "cash" && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('checkout.cashInstructions.title')}</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>{t('checkout.cashInstructions.amount', { amount: selectedPlan.price, currency: selectedPlan.currency })}</li>
                          <li>{t('checkout.cashInstructions.contact')}</li>
                          <li>{t('checkout.cashInstructions.email')}</li>
                          <li>{t('checkout.cashInstructions.activate')}</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale - Récapitulatif */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle>{t('checkout.summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">{t('checkout.plan')}</span>
                    <span className="font-medium text-sm">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">{t('checkout.period')}</span>
                    <span className="font-medium text-sm">{t('checkout.annual')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">{t('checkout.emailsIncluded')}</span>
                    <span className="font-medium text-xs sm:text-sm">{selectedPlan.emails}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">{t('checkout.users')}</span>
                    <span className="font-medium text-xs sm:text-sm">{selectedPlan.users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">{t('checkout.domains')}</span>
                    <span className="font-medium text-xs sm:text-sm">{selectedPlan.domains}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t('checkout.total')}</span>
                    <span>
                      {selectedPlan.price} {selectedPlan.currency}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {selectedPlan.period}
                      </span>
                    </span>
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('checkout.processing')}
                    </>
                  ) : paymentMethod === "card" ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t('checkout.payNow')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t('checkout.confirmOrder')}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {t('checkout.terms')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Checkout;

