import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Building2,
  Receipt,
  Banknote,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layouts/AppLayout";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "check" | "transfer" | "cash";

const plans = {
  starter: {
    name: "Starter",
    price: 35,
    currency: "DT",
    period: "/mois",
    emails: "10,000 e-mails / mois",
    users: "3 utilisateurs",
    domains: "2 domaines",
  },
  essential: {
    name: "Essential",
    price: 70,
    currency: "DT",
    period: "/mois",
    emails: "20,000 e-mails / mois",
    users: "10 utilisateurs",
    domains: "5 domaines",
  },
  pro: {
    name: "Pro",
    price: 170,
    currency: "DT",
    period: "/mois",
    emails: "50,000 e-mails / mois",
    users: "Utilisateurs illimités",
    domains: "10 domaines",
  },
  business: {
    name: "Business",
    price: 700,
    currency: "DT",
    period: "/mois",
    emails: "100,000 e-mails / mois",
    users: "Multi-équipes (3 utilisateurs)",
    domains: "20 domaines",
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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Informations pour paiement
  const [paymentInfo, setPaymentInfo] = useState({
    fullName: "",
    companyName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: user?.email || "",
    notes: "",
  });

  // Informations carte bancaire
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
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
        fullName: `${profile.prenom} ${profile.nom}`,
        companyName: profile.nom_entreprise || "",
        email: user?.email || "",
      }));
    }
  }, [profile, user]);

  // Mutation pour créer une commande
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      if (!user) throw new Error("User not authenticated");
      
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation des champs communs
    if (!paymentInfo.fullName.trim()) {
      newErrors.fullName = t('checkout.validation.fullNameRequired');
    }
    if (!paymentInfo.email.trim()) {
      newErrors.email = t('checkout.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentInfo.email)) {
      newErrors.email = t('checkout.validation.emailInvalid');
    }
    if (!paymentInfo.phone.trim()) {
      newErrors.phone = t('checkout.validation.phoneRequired');
    }

    // Validation pour paiements manuels
    if (paymentMethod !== "card") {
      if (!paymentInfo.companyName.trim()) {
        newErrors.companyName = t('checkout.validation.companyRequired');
      }
      if (!paymentInfo.address.trim()) {
        newErrors.address = t('checkout.validation.addressRequired');
      }
    }

    // Validation pour carte bancaire
    if (paymentMethod === "card") {
      if (!cardInfo.cardNumber.trim()) {
        newErrors.cardNumber = t('checkout.validation.cardNumberRequired');
      } else if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(cardInfo.cardNumber)) {
        newErrors.cardNumber = t('checkout.validation.cardNumberInvalid');
      }
      if (!cardInfo.cardName.trim()) {
        newErrors.cardName = t('checkout.validation.cardNameRequired');
      }
      if (!cardInfo.expiryDate) {
        newErrors.expiryDate = t('checkout.validation.expiryRequired');
      }
      if (!cardInfo.cvv.trim()) {
        newErrors.cvv = t('checkout.validation.cvvRequired');
      } else if (!/^\d{3,4}$/.test(cardInfo.cvv)) {
        newErrors.cvv = t('checkout.validation.cvvInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    try {
      const order = await createOrderMutation.mutateAsync({
        billing_info: {
          fullName: paymentInfo.fullName,
          email: paymentInfo.email,
          phone: paymentInfo.phone,
        },
        notes: "Card payment via Konnect",
      });

      toast.info('Card payment integration coming soon');
      setIsProcessing(false);
    } catch (error: any) {
      toast.error(error.message || t('checkout.paymentError'));
      setIsProcessing(false);
    }
  };

  const handleManualPayment = async () => {
    setIsProcessing(true);
    try {
      const order = await createOrderMutation.mutateAsync({
        billing_info: {
          fullName: paymentInfo.fullName,
          companyName: paymentInfo.companyName,
          address: paymentInfo.address,
          city: paymentInfo.city,
          postalCode: paymentInfo.postalCode,
          phone: paymentInfo.phone,
          email: paymentInfo.email,
        },
        notes: paymentInfo.notes,
      });

      toast.success(t('checkout.orderCreated'));
    } catch (error: any) {
      toast.error(error.message || t('checkout.orderError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      toast.error(t('checkout.validation.paymentMethodRequired'));
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (paymentMethod === "card") {
      await handleCardPayment();
    } else {
      await handleManualPayment();
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  // Success state
  if (isSuccess && orderId) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-background rounded-2xl shadow-2xl p-8 border-2 border-primary/20">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                  {t('checkout.orderConfirmed')}
                </h2>
                <p className="text-muted-foreground">
                  {t('checkout.orderConfirmedDesc')}
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  {t('checkout.orderNumber')}
                </p>
                <p className="text-2xl font-mono font-bold text-primary">
                  {orderId}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  {t('checkout.backToDashboard')}
                </Button>
                <Button onClick={() => navigate("/parametres")} className="flex-1">
                  {t('checkout.viewSubscription')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="mb-8 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('checkout.backToPricing')}
          </Button>

          {/* Main Container */}
          <div className="bg-background rounded-2xl shadow-2xl p-8 border">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Registration Section */}
              <div className="space-y-6">
                <div className="relative pl-4 border-l-4 border-primary">
                  <h2 className="text-3xl font-bold text-foreground">
                    {t('checkout.registrationForm')}
                  </h2>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-semibold">
                      {t('checkout.fullName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={paymentInfo.fullName}
                      onChange={(e) => {
                        setPaymentInfo({ ...paymentInfo, fullName: e.target.value });
                        setErrors({ ...errors, fullName: "" });
                      }}
                      className={cn(
                        "h-12 transition-all",
                        errors.fullName && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t('checkout.fullNamePlaceholder')}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      {t('checkout.email')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={paymentInfo.email}
                      onChange={(e) => {
                        setPaymentInfo({ ...paymentInfo, email: e.target.value });
                        setErrors({ ...errors, email: "" });
                      }}
                      className={cn(
                        "h-12 transition-all",
                        errors.email && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder="email@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      {t('checkout.phone')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={paymentInfo.phone}
                      onChange={(e) => {
                        setPaymentInfo({ ...paymentInfo, phone: e.target.value });
                        setErrors({ ...errors, phone: "" });
                      }}
                      className={cn(
                        "h-12 transition-all",
                        errors.phone && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder="+216 XX XXX XXX"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-semibold">
                      {t('checkout.company')} {paymentMethod !== "card" && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="company"
                      value={paymentInfo.companyName}
                      onChange={(e) => {
                        setPaymentInfo({ ...paymentInfo, companyName: e.target.value });
                        setErrors({ ...errors, companyName: "" });
                      }}
                      className={cn(
                        "h-12 transition-all",
                        errors.companyName && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t('checkout.companyPlaceholder')}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-destructive">{errors.companyName}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Payment Method Section */}
              <div className="space-y-6">
                <div className="relative pl-4 border-l-4 border-primary">
                  <h2 className="text-3xl font-bold text-foreground">
                    {t('checkout.paymentMethod')}
                  </h2>
                </div>

                <div className="grid gap-4">
                  {/* Bank Transfer */}
                  <label
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50",
                      paymentMethod === "transfer"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={paymentMethod === "transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-5 h-5 text-primary"
                    />
                    <Building2 className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-foreground">
                      {t('checkout.transfer')}
                    </span>
                  </label>

                  {/* Cash */}
                  <label
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50",
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-5 h-5 text-primary"
                    />
                    <Banknote className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-foreground">
                      {t('checkout.cash')}
                    </span>
                  </label>

                  {/* Check */}
                  <label
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50",
                      paymentMethod === "check"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="check"
                      checked={paymentMethod === "check"}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-5 h-5 text-primary"
                    />
                    <Receipt className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-foreground">
                      {t('checkout.check')}
                    </span>
                  </label>

                  {/* Card */}
                  <label
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50",
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-5 h-5 text-primary"
                    />
                    <CreditCard className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-foreground">
                      {t('checkout.card')}
                    </span>
                  </label>
                </div>

                {/* Card Details */}
                {paymentMethod === "card" && (
                  <div className="mt-6 p-6 bg-primary/5 rounded-xl border-l-4 border-primary space-y-4 animate-in slide-in-from-top duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className="text-sm font-semibold">
                        {t('checkout.cardNumber')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="cardNumber"
                        value={cardInfo.cardNumber}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          if (formatted.replace(/\s/g, '').length <= 16) {
                            setCardInfo({ ...cardInfo, cardNumber: formatted });
                            setErrors({ ...errors, cardNumber: "" });
                          }
                        }}
                        className={cn(
                          "h-12 transition-all",
                          errors.cardNumber && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder="XXXX XXXX XXXX XXXX"
                        maxLength={19}
                      />
                      {errors.cardNumber && (
                        <p className="text-sm text-destructive">{errors.cardNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardName" className="text-sm font-semibold">
                        {t('checkout.cardName')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="cardName"
                        value={cardInfo.cardName}
                        onChange={(e) => {
                          setCardInfo({ ...cardInfo, cardName: e.target.value });
                          setErrors({ ...errors, cardName: "" });
                        }}
                        className={cn(
                          "h-12 transition-all",
                          errors.cardName && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder={t('checkout.cardNamePlaceholder')}
                      />
                      {errors.cardName && (
                        <p className="text-sm text-destructive">{errors.cardName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate" className="text-sm font-semibold">
                          {t('checkout.expiryDate')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="expiryDate"
                          type="month"
                          value={cardInfo.expiryDate}
                          onChange={(e) => {
                            setCardInfo({ ...cardInfo, expiryDate: e.target.value });
                            setErrors({ ...errors, expiryDate: "" });
                          }}
                          className={cn(
                            "h-12 transition-all",
                            errors.expiryDate && "border-destructive focus-visible:ring-destructive"
                          )}
                          min={new Date().toISOString().slice(0, 7)}
                        />
                        {errors.expiryDate && (
                          <p className="text-sm text-destructive">{errors.expiryDate}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cvv" className="text-sm font-semibold">
                          CVV <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="cvv"
                          type="text"
                          value={cardInfo.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 4) {
                              setCardInfo({ ...cardInfo, cvv: value });
                              setErrors({ ...errors, cvv: "" });
                            }
                          }}
                          className={cn(
                            "h-12 transition-all",
                            errors.cvv && "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.cvv && (
                          <p className="text-sm text-destructive">{errors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Payment Fields */}
                {paymentMethod && paymentMethod !== "card" && (
                  <div className="mt-6 space-y-4 animate-in slide-in-from-top duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-semibold">
                        {t('checkout.address')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="address"
                        value={paymentInfo.address}
                        onChange={(e) => {
                          setPaymentInfo({ ...paymentInfo, address: e.target.value });
                          setErrors({ ...errors, address: "" });
                        }}
                        className={cn(
                          "h-12 transition-all",
                          errors.address && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder={t('checkout.addressPlaceholder')}
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive">{errors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-semibold">
                          {t('checkout.city')}
                        </Label>
                        <Input
                          id="city"
                          value={paymentInfo.city}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, city: e.target.value })
                          }
                          className="h-12"
                          placeholder={t('checkout.cityPlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-sm font-semibold">
                          {t('checkout.postalCode')}
                        </Label>
                        <Input
                          id="postalCode"
                          value={paymentInfo.postalCode}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, postalCode: e.target.value })
                          }
                          className="h-12"
                          placeholder="XXXX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-semibold">
                        {t('checkout.notes')}
                      </Label>
                      <Textarea
                        id="notes"
                        value={paymentInfo.notes}
                        onChange={(e) =>
                          setPaymentInfo({ ...paymentInfo, notes: e.target.value })
                        }
                        placeholder={t('checkout.notesPlaceholder')}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full h-14 text-lg font-semibold uppercase tracking-wider"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('checkout.processing')}
                  </>
                ) : (
                  t('checkout.validateOrder')
                )}
              </Button>

              {/* Plan Summary */}
              <div className="mt-6 p-6 bg-muted/30 rounded-xl border-2 border-dashed space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    {t('checkout.plan')}
                  </span>
                  <span className="text-foreground font-bold">
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    {t('checkout.total')}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {selectedPlan.price} {selectedPlan.currency}
                    <span className="text-sm text-muted-foreground">
                      {selectedPlan.period}
                    </span>
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Checkout;
