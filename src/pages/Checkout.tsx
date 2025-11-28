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
    mutationFn: async (orderData: any) => {
      if (!user) throw new Error("User not authenticated");
      
      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          organization_id: profile?.organization_id,
          plan_type: planParam,
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "card" ? "pending" : "pending",
          billing_info: orderData.billing_info || null,
          notes: orderData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setOrderId(data.id);
      setIsSuccess(true);
    },
    onError: (error: any) => {
      toast.error(error.message || t('checkout.orderError'));
    },
  });

  const handleCardPayment = async () => {
    setIsProcessing(true);
    try {
      // Create order first
      const order = await createOrderMutation.mutateAsync({
        billing_info: null,
        notes: "Card payment via Konnect",
      });

      // TODO: Initiate Konnect payment flow
      toast.info('Card payment integration coming soon');
      setIsProcessing(false);
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
      const order = await createOrderMutation.mutateAsync({
        billing_info: {
          companyName: paymentInfo.companyName,
          address: paymentInfo.address,
          city: paymentInfo.city,
          postalCode: paymentInfo.postalCode,
          phone: paymentInfo.phone,
          email: paymentInfo.email,
        },
        notes: paymentInfo.notes,
      });

      // TODO: Send confirmation email via Edge Function
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="mb-6 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('checkout.backToPricing')}
            </Button>
            
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Complete your order
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose your payment method and finalize your {selectedPlan.name} subscription
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Methods */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Payment Method</CardTitle>
                      <CardDescription>
                        Select your preferred payment option
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {/* Card Payment */}
                    <div className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                      paymentMethod === "card" 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-border hover:border-primary/50"
                    }`}>
                      <RadioGroupItem value="card" id="card" className="sr-only" />
                      <Label htmlFor="card" className="cursor-pointer flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Card Payment</p>
                              <p className="text-sm text-muted-foreground">Secure & Instant</p>
                            </div>
                          </div>
                          <Badge variant={paymentMethod === "card" ? "default" : "outline"}>
                            Recommended
                          </Badge>
                        </div>
                      </Label>
                    </div>

                    {/* Bank Transfer */}
                    <div className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                      paymentMethod === "transfer" 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-border hover:border-primary/50"
                    }`}>
                      <RadioGroupItem value="transfer" id="transfer" className="sr-only" />
                      <Label htmlFor="transfer" className="cursor-pointer flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Bank Transfer</p>
                            <p className="text-sm text-muted-foreground">1-2 business days</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Check */}
                    <div className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                      paymentMethod === "check" 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-border hover:border-primary/50"
                    }`}>
                      <RadioGroupItem value="check" id="check" className="sr-only" />
                      <Label htmlFor="check" className="cursor-pointer flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Check</p>
                            <p className="text-sm text-muted-foreground">Traditional payment</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Cash */}
                    <div className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                      paymentMethod === "cash" 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-border hover:border-primary/50"
                    }`}>
                      <RadioGroupItem value="cash" id="cash" className="sr-only" />
                      <Label htmlFor="cash" className="cursor-pointer flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                            <Banknote className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Cash</p>
                            <p className="text-sm text-muted-foreground">In-person payment</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Card Payment Section */}
              {paymentMethod === "card" && (
                <Card className="border-2 shadow-lg">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">Secure Card Payment</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <Alert className="border-primary/20 bg-primary/5">
                      <Info className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm">
                        You'll be redirected to our secure payment partner to complete your transaction.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-8 text-center border-2 border-dashed border-border">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Secure Payment Gateway</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your payment will be processed through our PCI-DSS compliant payment partner
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>SSL Encrypted</span>
                        <span>•</span>
                        <span>Secure Transaction</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manual Payment Methods */}
              {(paymentMethod === "check" || paymentMethod === "transfer" || paymentMethod === "cash") && (
                <Card className="border-2 shadow-lg">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Billing Information</CardTitle>
                        <CardDescription>
                          Required for processing your order
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Company & Email Row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          Company Name
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          value={paymentInfo.companyName}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, companyName: e.target.value })}
                          placeholder="Your Company LLC"
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email Address
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={paymentInfo.email}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, email: e.target.value })}
                          placeholder="contact@company.com"
                          className="h-11"
                          required
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Street Address
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Input
                        id="address"
                        value={paymentInfo.address}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, address: e.target.value })}
                        placeholder="123 Business Street"
                        className="h-11"
                        required
                      />
                    </div>

                    {/* City & Postal */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">City</Label>
                        <Input
                          id="city"
                          value={paymentInfo.city}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, city: e.target.value })}
                          placeholder="Tunis"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={paymentInfo.postalCode}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, postalCode: e.target.value })}
                          placeholder="1000"
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={paymentInfo.phone}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, phone: e.target.value })}
                        placeholder="+216 XX XXX XXX"
                        className="h-11"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={paymentInfo.notes}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, notes: e.target.value })}
                        placeholder="Any special instructions..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {/* Payment Instructions */}
                    {paymentMethod === "check" && (
                      <Alert className="border-primary/20 bg-primary/5">
                        <FileText className="h-4 w-4 text-primary" />
                        <AlertDescription>
                          <strong className="block mb-2">Check Payment Instructions:</strong>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Make check payable to "DimaMail"</li>
                            <li>Amount: {selectedPlan.price} {selectedPlan.currency}</li>
                            <li>Mail to our business address</li>
                            <li>Your subscription will be activated upon receipt</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {paymentMethod === "transfer" && (
                      <Alert className="border-primary/20 bg-primary/5">
                        <FileText className="h-4 w-4 text-primary" />
                        <AlertDescription>
                          <strong className="block mb-2">Bank Transfer Instructions:</strong>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Amount: {selectedPlan.price} {selectedPlan.currency}</li>
                            <li>Bank details will be sent to your email</li>
                            <li>Include your order reference in the transfer</li>
                            <li>Activation upon payment confirmation</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {paymentMethod === "cash" && (
                      <Alert className="border-primary/20 bg-primary/5">
                        <FileText className="h-4 w-4 text-primary" />
                        <AlertDescription>
                          <strong className="block mb-2">Cash Payment Instructions:</strong>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Amount: {selectedPlan.price} {selectedPlan.currency}</li>
                            <li>We'll contact you to schedule an appointment</li>
                            <li>Payment at our office location</li>
                            <li>Immediate activation after payment</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-2 shadow-lg lg:sticky lg:top-6">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Plan Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <Badge variant="outline" className="font-semibold">
                        {selectedPlan.name}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Billing Period</span>
                        <span className="font-medium">Annual</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Emails/month</span>
                        <span className="font-medium">{selectedPlan.emails}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Users</span>
                        <span className="font-medium">{selectedPlan.users}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Domains</span>
                        <span className="font-medium">{selectedPlan.domains}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-primary">
                          {selectedPlan.price}
                        </span>
                        <span className="text-lg font-semibold text-primary ml-1">
                          {selectedPlan.currency}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedPlan.period}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : paymentMethod === "card" ? (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Proceed to Payment
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Confirm Order
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground leading-relaxed">
                    By proceeding, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Checkout;

