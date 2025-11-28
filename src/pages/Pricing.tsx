import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoWithText } from "@/components/Logo";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: "0 DT",
    period: "/an",
    description: "Pour tester la plateforme",
    emails: "3,000 e-mails / mois",
    dailyLimit: "100 e-mails / jour",
    domains: "1 domaine",
    users: "1 utilisateur",
    popular: false,
    features: [
      { text: "Dashboard simple", included: true },
      { text: "Envoi email manuel", included: true },
      { text: "Envoi via API (clé API unique)", included: true },
      { text: "Tracking ouvertures (basique)", included: true },
      { text: "Historique 7 jours", included: true },
      { text: "3 templates e-mail gratuits", included: true },
      { text: "Import CSV limité (200 contacts)", included: true },
      { text: "Webhooks", included: false },
      { text: "Automatisation", included: false },
      { text: "A/B testing", included: false },
    ],
  },
  {
    name: "Starter",
    price: "340 DT",
    period: "/an",
    description: "Pour les petites entreprises",
    emails: "10,000 e-mails / mois",
    domains: "3 domaines",
    users: "3 utilisateurs",
    popular: false,
    features: [
      { text: "Toutes les fonctionnalités Free", included: true },
      { text: "Tracking ouvertures + clics", included: true },
      { text: "5 templates premium", included: true },
      { text: "Import CSV illimité", included: true },
      { text: "Segmentation simple (tags)", included: true },
      { text: "Automatisations simples", included: true },
      { text: "Welcome email & confirmation", included: true },
      { text: "E-mails programmés", included: true },
      { text: "Webhooks basiques (bounces)", included: true },
      { text: "Statistiques hebdomadaires", included: true },
      { text: "Support par email", included: true },
    ],
  },
  {
    name: "Essential",
    price: "590 DT",
    period: "/an",
    description: "Pour les PME et équipes marketing",
    emails: "50,000 e-mails / mois",
    domains: "10 domaines",
    users: "10 utilisateurs",
    popular: true,
    features: [
      { text: "Toutes les fonctionnalités Starter", included: true },
      { text: "10 templates premium", included: true },
      { text: "Segmentation avancée (filtres logiques)", included: true },
      { text: "Automatisation avancée (workflows multi-étapes)", included: true },
      { text: "A/B testing", included: true },
      { text: "Routage automatique des envois", included: true },
      { text: "API multi-clés avec permissions", included: true },
      { text: "Webhooks complets (délivrabilité, spam, bounce)", included: true },
      { text: "Analytics complets avec heatmaps", included: true },
      { text: "Rapports exportables (PDF/Excel)", included: true },
      { text: "Validation et nettoyage email", included: true },
      { text: "Support prioritaire", included: true },
    ],
  },
  {
    name: "Pro",
    price: "990 DT",
    period: "/an",
    description: "Pour les grandes entreprises et SaaS",
    emails: "200,000 e-mails / mois",
    domains: "Domaines illimités",
    users: "Utilisateurs illimités",
    popular: false,
    features: [
      { text: "Toutes les fonctionnalités Essential", included: true },
      { text: "15 templates premium", included: true },
      { text: "Serveurs dédiés d'envoi (IP dedicated)", included: true },
      { text: "Limite de débit personnalisée", included: true },
      { text: "SLA 99.9%", included: true },
      { text: "Authentification SSO / SAML", included: true },
      { text: "API haute performance", included: true },
      { text: "Logs 12 mois", included: true },
      { text: "Monitoring avancé (GraphQL metrics)", included: true },
      { text: "Nettoyage auto des listes (AI scoring)", included: true },
      { text: "Support premium 24/7", included: true },
      { text: "Accompagnement onboarding (1h)", included: true },
    ],
  },
];

const Pricing = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-white dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-gray-900/95 sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center flex-shrink-0">
            <LogoWithText className="h-8 md:h-10" />
          </Link>
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Link to="/" className="text-sm xl:text-base text-foreground hover:text-accent transition-colors">
              {t('nav.home')}
            </Link>
            <a href="/#features" className="text-sm xl:text-base text-foreground hover:text-accent transition-colors">
              {t('nav.features')}
            </a>
            <Link to="/pricing" className="text-sm xl:text-base text-foreground hover:text-accent transition-colors font-medium">
              {t('nav.pricing')}
            </Link>
            <a href="/#about" className="text-sm xl:text-base text-foreground hover:text-accent transition-colors">
              {t('nav.about')}
            </a>
            <a href="/#contact" className="text-sm xl:text-base text-foreground hover:text-accent transition-colors">
              {t('nav.contact')}
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">{t('common.signIn')}</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="hidden sm:inline-flex text-xs sm:text-sm">{t('pricing.cta.startFree')}</Button>
            </Link>
            {/* Menu mobile */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <LogoWithText className="h-8" />
                  </div>
                  <nav className="flex flex-col gap-4">
                    <Link 
                      to="/" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.home')}
                    </Link>
                    <a 
                      href="/#features" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.features')}
                    </a>
                    <Link 
                      to="/pricing" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-accent transition-colors py-2"
                    >
                      {t('nav.pricing')}
                    </Link>
                    <a 
                      href="/#about" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.about')}
                    </a>
                    <a 
                      href="/#contact" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.contact')}
                    </a>
                  </nav>
                  <div className="pt-4 border-t space-y-3">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full" size="lg">
                        {t('common.signIn')}
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full" size="lg">
                        {t('pricing.cta.startFree')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-16 md:py-24 md:px-6">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/20 scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {t('pricing.popular')}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-heading font-bold">
                  {plan.name}
                </CardTitle>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Capacités */}
                <div className="space-y-2 pb-6 border-b border-border">
                  <p className="font-semibold text-sm text-muted-foreground">{t('pricing.capacities')}</p>
                  <p className="text-sm font-medium">{plan.emails}</p>
                  {plan.dailyLimit && (
                    <p className="text-xs text-muted-foreground">{plan.dailyLimit}</p>
                  )}
                  <p className="text-sm">{plan.users}</p>
                  <p className="text-sm">{plan.domains}</p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-muted-foreground">
                    {t('pricing.features')}
                  </p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                {plan.name === "Free" ? (
                  <Link to="/auth" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      {t('pricing.startFree')}
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/checkout?plan=${plan.name.toLowerCase()}`} className="w-full">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                      size="lg"
                    >
                      {t('pricing.choosePlan')}
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-24 text-center space-y-4">
          <h2 className="text-3xl font-heading font-bold text-foreground">
            {t('pricing.faq.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 text-left">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{t('pricing.faq.changePlan.q')}</h3>
              <p className="text-muted-foreground">
                {t('pricing.faq.changePlan.a')}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{t('pricing.faq.billing.q')}</h3>
              <p className="text-muted-foreground">
                {t('pricing.faq.billing.a')}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{t('pricing.faq.limit.q')}</h3>
              <p className="text-muted-foreground">
                {t('pricing.faq.limit.a')}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{t('pricing.faq.support.q')}</h3>
              <p className="text-muted-foreground">
                {t('pricing.faq.support.a')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center space-y-6 p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            {t('pricing.cta.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="min-w-[200px]">
                {t('pricing.cta.startFree')}
              </Button>
            </Link>
            <Link to="/support">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                {t('pricing.cta.contactSales')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-to-br from-foreground/95 to-foreground text-background py-12 mt-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <LogoWithText className="h-10" />
              </div>
              <p className="text-sm opacity-80">
                Professional email marketing platform.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4 text-background">{t('nav.home')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.home')}</Link></li>
                <li><Link to="/#features" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.features')}</Link></li>
                <li><Link to="/pricing" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.pricing')}</Link></li>
                <li><Link to="/#contact" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4 text-background">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/support" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">FAQ</Link></li>
                <li><Link to="/support" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">Technical Support</Link></li>
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">Blog (coming soon)</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4 text-background">Follow Us</h4>
              <div className="flex gap-4">
                <a href="#" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">LinkedIn</a>
                <a href="#" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">Facebook</a>
              </div>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center text-sm opacity-80">
            <p>© {new Date().getFullYear()} DimaMail — All rights reserved. Made with 🇹🇳 in Tunis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
