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
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "check" | "transfer" | "cash";
type BillingPeriod = "quarter" | "semester" | "year";

const plans = {
  starter: {
    name: "Starter",
    price: 29,
    currency: "DT",
    period: "/mois",
    emails: "10,000 e-mails / mois",
    users: "3 utilisateurs",
    domains: "2 domaines",
  },
  essential: {
    name: "Essential",
    price: 49,
    currency: "DT",
    period: "/mois",
    emails: "20,000 e-mails / mois",
    users: "10 utilisateurs",
    domains: "5 domaines",
  },
  pro: {
    name: "Pro",
    price: 150,
    currency: "DT",
    period: "/mois",
    emails: "50,000 e-mails / mois",
    users: "Utilisateurs illimités",
    domains: "10 domaines",
  },
  business: {
    name: "Business",
    price: 270,
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
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("year");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculer le prix selon la période choisie avec remises
  const calculatePrice = (period: BillingPeriod): { basePrice: number; discount: number; finalPrice: number } => {
    const monthlyPrice = selectedPlan.price;
    let basePrice: number;
    let discountPercent: number = 0;

    switch (period) {
      case "quarter":
        basePrice = monthlyPrice * 3;
        discountPercent = 0; // Pas de remise sur 3 mois
        break;
      case "semester":
        basePrice = monthlyPrice * 6;
        discountPercent = 5; // 5% de remise sur 6 mois
        break;
      case "year":
        basePrice = monthlyPrice * 12;
        discountPercent = 10; // 10% de remise sur 12 mois
        break;
      default:
        basePrice = monthlyPrice;
        discountPercent = 0;
    }

    const discountAmount = (basePrice * discountPercent) / 100;
    const finalPrice = basePrice - discountAmount;

    return {
      basePrice,
      discount: discountPercent,
      finalPrice: Math.round(finalPrice * 100) / 100, // Arrondir à 2 décimales
    };
  };

  const priceDetails = calculatePrice(billingPeriod);
  const totalPrice = priceDetails.finalPrice;

  // Obtenir le libellé de la période
  const getPeriodLabel = (period: BillingPeriod): string => {
    switch (period) {
      case "quarter":
        return t('checkout.period.quarter');
      case "semester":
        return t('checkout.period.semester');
      case "year":
        return t('checkout.period.year');
      default:
        return t('checkout.period.year');
    }
  };

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
          amount: totalPrice,
          currency: selectedPlan.currency,
          billing_period: billingPeriod,
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo and Back Button */}
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-Dyma-Mail-F.png" 
              alt="DymaMail Logo" 
              className="h-10 w-auto object-contain"
            />
            <Button
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('checkout.backToPricing')}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">{t('checkout.progress.planSelection')}</span>
            </div>
            <div className="h-1 w-8 bg-primary" />
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">{t('checkout.progress.customize')}</span>
            </div>
            <div className="h-1 w-8 bg-primary" />
            <div className="flex items-center gap-2 text-primary font-semibold">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
              <span>{t('checkout.progress.checkout')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('checkout.proceedToCheckout')}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Billing Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Billing Information Section */}
            <div className="bg-background border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-primary mb-2">
                {t('checkout.billingInfo')}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t('checkout.billingInfoDescFull')}
              </p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      {t('checkout.firstName')}
                    </Label>
                    <Input
                      id="fullName"
                      value={paymentInfo.fullName.split(' ')[0] || ''}
                      onChange={(e) => {
                        const lastName = paymentInfo.fullName.split(' ').slice(1).join(' ') || '';
                        setPaymentInfo({ ...paymentInfo, fullName: `${e.target.value} ${lastName}`.trim() });
                        setErrors({ ...errors, fullName: "" });
                      }}
                      className={cn(
                        "h-11",
                        errors.fullName && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t('checkout.firstNamePlaceholder')}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-destructive">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      {t('checkout.lastName')}
                    </Label>
                    <Input
                      id="lastName"
                      value={paymentInfo.fullName.split(' ').slice(1).join(' ') || ''}
                      onChange={(e) => {
                        const firstName = paymentInfo.fullName.split(' ')[0] || '';
                        setPaymentInfo({ ...paymentInfo, fullName: `${firstName} ${e.target.value}`.trim() });
                        setErrors({ ...errors, fullName: "" });
                      }}
                      className={cn(
                        "h-11",
                        errors.fullName && "border-destructive focus-visible:ring-destructive"
                      )}
                      placeholder={t('checkout.lastNamePlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium">
                    {t('checkout.companyName')}
                  </Label>
                  <Input
                    id="company"
                    value={paymentInfo.companyName}
                    onChange={(e) => {
                      setPaymentInfo({ ...paymentInfo, companyName: e.target.value });
                      setErrors({ ...errors, companyName: "" });
                    }}
                    className={cn(
                      "h-11",
                      errors.companyName && "border-destructive focus-visible:ring-destructive"
                    )}
                    placeholder={t('checkout.companyPlaceholder')}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-destructive">{errors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    {t('checkout.address')}
                  </Label>
                  <Input
                    id="address"
                    value={paymentInfo.address}
                    onChange={(e) => {
                      setPaymentInfo({ ...paymentInfo, address: e.target.value });
                      setErrors({ ...errors, address: "" });
                    }}
                    className={cn(
                      "h-11",
                      errors.address && "border-destructive focus-visible:ring-destructive"
                    )}
                    placeholder={t('checkout.addressPlaceholder')}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-sm font-medium">
                      {t('checkout.postalCode')}
                    </Label>
                    <Input
                      id="postalCode"
                      value={paymentInfo.postalCode}
                      onChange={(e) =>
                        setPaymentInfo({ ...paymentInfo, postalCode: e.target.value })
                      }
                      className="h-11"
                      placeholder={t('checkout.postalCodePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      {t('checkout.city')}
                    </Label>
                    <Input
                      id="city"
                      value={paymentInfo.city}
                      onChange={(e) =>
                        setPaymentInfo({ ...paymentInfo, city: e.target.value })
                      }
                      className="h-11"
                      placeholder={t('checkout.cityPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium">
                      {t('checkout.country')}
                    </Label>
                    <Input
                      id="country"
                      value="Tunisia"
                      readOnly
                      className="h-11 bg-muted"
                    />
                  </div>
                </div>

                {/* VAT Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vat"
                        checked={true}
                        readOnly
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm font-medium">{t('checkout.haveVAT')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vat"
                        checked={false}
                        readOnly
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm font-medium">{t('checkout.noVAT')}</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber" className="text-sm font-medium">
                      {t('checkout.vatNumber')}
                    </Label>
                    <Input
                      id="vatNumber"
                      className="h-11"
                      placeholder={t('checkout.vatNumberPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceEmail" className="text-sm font-medium">
                    {t('checkout.invoiceEmail')}
                  </Label>
                  <Input
                    id="invoiceEmail"
                    type="email"
                    value={paymentInfo.email}
                    onChange={(e) => {
                      setPaymentInfo({ ...paymentInfo, email: e.target.value });
                      setErrors({ ...errors, email: "" });
                    }}
                    className={cn(
                      "h-11",
                      errors.email && "border-destructive focus-visible:ring-destructive"
                    )}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="w-full h-11"
                >
                  {t('checkout.confirmBillingInfo')}
                </Button>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-background border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-primary mb-6">
                {t('checkout.paymentMethod')}
              </h2>
              
              <div className="space-y-4">
                {/* Card Payment Display */}
                {paymentMethod === "card" && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-12 bg-primary/10 rounded flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">**** **** **** 0596</p>
                        <p className="text-xs text-muted-foreground">11/2026</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="grid gap-3">
                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
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
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">
                      {t('checkout.card')}
                    </span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      paymentMethod === "transfer"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
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
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">
                      {t('checkout.transfer')}
                    </span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      paymentMethod === "check"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
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
                    <Receipt className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">
                      {t('checkout.check')}
                    </span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
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
                    <Banknote className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">
                      {t('checkout.cash')}
                    </span>
                  </label>
                </div>

                {/* Card Details */}
                {paymentMethod === "card" && (
                  <div className="mt-6 p-6 bg-muted/30 rounded-lg border space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className="text-sm font-medium">
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
                          "h-11",
                          errors.cardNumber && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder="XXXX XXXX XXXX XXXX"
                        maxLength={19}
                      />
                      {errors.cardNumber && (
                        <p className="text-xs text-destructive">{errors.cardNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardName" className="text-sm font-medium">
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
                          "h-11",
                          errors.cardName && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder={t('checkout.cardNamePlaceholder')}
                      />
                      {errors.cardName && (
                        <p className="text-xs text-destructive">{errors.cardName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate" className="text-sm font-medium">
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
                            "h-11",
                            errors.expiryDate && "border-destructive focus-visible:ring-destructive"
                          )}
                          min={new Date().toISOString().slice(0, 7)}
                        />
                        {errors.expiryDate && (
                          <p className="text-xs text-destructive">{errors.expiryDate}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cvv" className="text-sm font-medium">
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
                            "h-11",
                            errors.cvv && "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.cvv && (
                          <p className="text-xs text-destructive">{errors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Payment Fields */}
                {paymentMethod && paymentMethod !== "card" && (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
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
                          "h-11",
                          errors.phone && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder="+216 XX XXX XXX"
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium">
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
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Summary */}
          <div className="lg:col-span-1">
            <div className="bg-background border rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-primary mb-4">
                {t('checkout.purchaseSummary')}
              </h2>

              {/* Billing Period Selector */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t('checkout.billingPeriod')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("quarter")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 relative",
                      billingPeriod === "quarter"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {t('checkout.quarter')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("semester")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 relative",
                      billingPeriod === "semester"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span>{t('checkout.semester')}</span>
                      <span className="text-[10px] font-semibold text-primary mt-0.5">
                        -5%
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod("year")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 relative",
                      billingPeriod === "year"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span>{t('checkout.year')}</span>
                      <span className="text-[10px] font-semibold text-primary mt-0.5">
                        -10%
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Plan Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {selectedPlan.name} {t('checkout.plan')}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedPlan.emails}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlan.users}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlan.domains}</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex flex-col items-center mb-2">
                    <div className="flex items-baseline gap-2 flex-wrap justify-center">
                      {priceDetails.discount > 0 && (
                        <span className="text-lg line-through text-muted-foreground whitespace-nowrap">
                          {priceDetails.basePrice.toFixed(2)} {selectedPlan.currency}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-foreground whitespace-nowrap">
                        {totalPrice.toFixed(2)} {selectedPlan.currency}
                      </span>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        / {getPeriodLabel(billingPeriod)}
                      </span>
                    </div>
                    {priceDetails.discount > 0 && (
                      <div className="mt-1">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                          {t('checkout.discount')} {priceDetails.discount}%
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      ({selectedPlan.price} {selectedPlan.currency} {t('checkout.perMonth')})
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('checkout.subtotal')}</span>
                  <span className="font-medium text-foreground whitespace-nowrap">
                    {priceDetails.basePrice.toFixed(2)} {selectedPlan.currency}
                  </span>
                </div>
                {priceDetails.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('checkout.discount')} ({priceDetails.discount}%)
                    </span>
                    <span className="font-medium text-primary whitespace-nowrap">
                      -{(priceDetails.basePrice - totalPrice).toFixed(2)} {selectedPlan.currency}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-3 border-t">
                  <span>{t('checkout.totalAmountDue')}</span>
                  <span className="text-primary whitespace-nowrap">
                    {totalPrice.toFixed(2)} {selectedPlan.currency}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-6">
                {t('checkout.subscriptionPeriod')}
              </p>

              <div className="space-y-4 mb-6">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  {t('checkout.addCouponCode')}
                </button>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline block"
                >
                  {t('checkout.addPurchaseOrder')}
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-primary"
                    required
                  />
                  <span className="text-sm text-muted-foreground">
                    {t('checkout.agreeTerms')}
                  </span>
                </label>

                <form onSubmit={handleSubmit}>
                  <Button
                    type="submit"
                    disabled={isProcessing || !paymentMethod}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('checkout.processing')}
                      </>
                    ) : (
                      t('checkout.payNow')
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
