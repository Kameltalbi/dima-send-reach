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
    period: "/mois",
    description: "Pour tester la plateforme",
    emails: "3,000 e-mails / mois",
    dailyLimit: "100 e-mails / jour",
    domains: "1 domaine",
    users: "1 utilisateur",
    contacts: "1,000 contacts",
    popular: false,
    features: [
      { text: "Éditeur email simple", included: true },
      { text: "10 modèles email basiques", included: true },
      { text: "Import contacts (CSV)", included: true },
      { text: "Liste unique (1 liste)", included: true },
      { text: "Statistiques simples : ouverture, clic", included: true },
      { text: "Anti-spam basique", included: true },
      { text: "Rétention 1 jour", included: true },
      { text: "Support Ticket uniquement", included: true },
      { text: "Branding 'Powered by DymaMail'", included: true },
      { text: "Automations", included: false },
      { text: "Segmentation", included: false },
      { text: "Warm-up", included: false },
    ],
  },
  {
    name: "Starter",
    price: "29 DT",
    period: "/mois",
    annualPrice: "348 DT",
    description: "Pour les petites entreprises",
    emails: "10,000 e-mails / mois",
    domains: "2 domaines",
    users: "3 utilisateurs",
    contacts: "Contacts illimités",
    popular: false,
    features: [
      { text: "Éditeur drag & drop avancé", included: true },
      { text: "30 modèles de newsletters professionnels", included: true },
      { text: "3 listes de contacts", included: true },
      { text: "Suppression du branding (option)", included: true },
      { text: "Statistiques détaillées (ouvertures, clics, désabonnements)", included: true },
      { text: "Tests d'envoi", included: true },
      { text: "Rétention 7 jours", included: true },
      { text: "Anti-spam amélioré", included: true },
      { text: "Support email prioritaire", included: true },
      { text: "A/B testing", included: false },
      { text: "Automations", included: false },
      { text: "Segmentation avancée", included: false },
    ],
  },
  {
    name: "Essential",
    price: "49 DT",
    period: "/mois",
    annualPrice: "588 DT",
    description: "Pour les PME et agences",
    emails: "20,000 e-mails / mois",
    domains: "5 domaines",
    users: "10 utilisateurs",
    contacts: "Contacts illimités",
    popular: true,
    features: [
      { text: "Tout de Starter, plus:", included: true },
      { text: "Segmentation simple (tags, engagement, date)", included: true },
      { text: "10 listes de contacts", included: true },
      { text: "100 templates email premium", included: true },
      { text: "Export CSV des campagnes", included: true },
      { text: "Gestion des rebonds (bounces)", included: true },
      { text: "Preview mobile + desktop", included: true },
      { text: "Rétention 15 jours", included: true },
      { text: "Support prioritaire WhatsApp", included: true },
      { text: "Tests anti-spam intégrés", included: true },
    ],
  },
  {
    name: "Pro",
    price: "170 DT",
    period: "/mois",
    description: "Pour l'e-commerce et entreprises actives",
    emails: "50,000 e-mails / mois",
    domains: "10 domaines",
    users: "Utilisateurs illimités",
    contacts: "Contacts illimités",
    popular: false,
    features: [
      { text: "Tout de Essential, plus:", included: true },
      { text: "Segmentation avancée (comportement, score)", included: true },
      { text: "Automations simples (bienvenue, anniversaire, séquences)", included: true },
      { text: "A/B testing (sujet et contenu)", included: true },
      { text: "Warm-up automatique pour nouveaux domaines", included: true },
      { text: "Rétention 30 jours", included: true },
      { text: "Support WhatsApp + Email rapide", included: true },
      { text: "Dédoublonnage automatique", included: true },
      { text: "Importation massive", included: true },
      { text: "Déclencheurs (CTA triggers)", included: true },
    ],
  },
  {
    name: "Business",
    price: "700 DT",
    period: "/mois",
    description: "Pour les grandes PME et institutions",
    emails: "100,000 e-mails / mois",
    domains: "20 domaines",
    users: "Multi-équipes (3 utilisateurs)",
    contacts: "Contacts illimités",
    popular: false,
    features: [
      { text: "Tout de Pro, plus:", included: true },
      { text: "Automations avancées (panier abandonné, workflows conditionnels)", included: true },
      { text: "Scoring avancé des leads", included: true },
      { text: "Gestion multi-équipes", included: true },
      { text: "Rétention 90 jours", included: true },
      { text: "Envoi haute priorité (file séparée)", included: true },
      { text: "Assistance délivrabilité", included: true },
      { text: "Planification avancée", included: true },
      { text: "Export complet (CSV + JSON)", included: true },
      { text: "Accès API (limité)", included: true },
      { text: "Suppression totale de branding", included: true },
    ],
  },
];

const Pricing = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      {/* Header */}
      <header className="border-b border-border bg-white dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-gray-900/95 sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center flex-shrink-0">
            <LogoWithText className="h-12 md:h-14" />
          </Link>
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Link to="/" className="text-base xl:text-lg font-semibold text-foreground hover:text-accent transition-colors">
              {t('nav.home')}
            </Link>
            <a href="/#features" className="text-base xl:text-lg font-semibold text-foreground hover:text-accent transition-colors">
              {t('nav.features')}
            </a>
            <Link to="/pricing" className="text-base xl:text-lg font-semibold text-foreground hover:text-accent transition-colors">
              {t('nav.pricing')}
            </Link>
            <a href="/#about" className="text-base xl:text-lg font-semibold text-foreground hover:text-accent transition-colors">
              {t('nav.about')}
            </a>
            <a href="/#contact" className="text-base xl:text-lg font-semibold text-foreground hover:text-accent transition-colors">
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
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-8 w-8" strokeWidth={3} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <LogoWithText className="h-12" />
                  </div>
                  <nav className="flex flex-col gap-4">
                    <Link 
                      to="/" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.home')}
                    </Link>
                    <a 
                      href="/#features" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.features')}
                    </a>
                    <Link 
                      to="/pricing" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-accent transition-colors py-2"
                    >
                      {t('nav.pricing')}
                    </Link>
                    <a 
                      href="/#about" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.about')}
                    </a>
                    <a 
                      href="/#contact" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
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
      <section className="w-full px-4 py-16 md:py-24 md:px-6">
        <div className="text-center space-y-4 mb-16 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-6 max-w-[1920px] mx-auto px-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? "border-l-4 border-l-primary border-2 border-t border-r border-b shadow-xl shadow-primary/30 scale-105 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5"
                  : "border-l-4 border-l-border border-2 border-t border-r border-b bg-card hover:border-l-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1 shadow-lg font-semibold">
                    {t('pricing.popular')}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className={`text-2xl font-heading font-bold ${plan.popular ? 'text-primary' : 'text-foreground'}`}>
                  {plan.name}
                </CardTitle>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
                <div className="mt-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline">
                      <span className={`text-5xl font-bold ${plan.popular ? 'text-primary' : 'text-foreground'}`}>{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground ml-2 text-xl">{plan.period}</span>
                      )}
                    </div>
                    {plan.annualPrice && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span>{t('landing.pricing.payableAnnual')} </span>
                        <span className={`font-medium ${plan.popular ? 'text-primary' : ''}`}>{plan.annualPrice}/an</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Capacités */}
                <div className="space-y-2 pb-6 border-b border-border">
                  <p className="font-semibold text-sm text-muted-foreground mb-3">{t('pricing.capacities')}</p>
                  <p className="text-base font-bold text-foreground">{plan.emails}</p>
                  {plan.dailyLimit && (
                    <p className="text-sm text-muted-foreground">{plan.dailyLimit}</p>
                  )}
                  <p className="text-base font-bold text-foreground mt-2">{plan.contacts}</p>
                  <p className="text-sm text-foreground mt-2">{plan.users}</p>
                  <p className="text-sm text-foreground">{plan.domains}</p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-foreground mb-3">
                    {t('pricing.features')}
                  </p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5 text-foreground" />
                        </div>
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
                      className="w-full border-2 border-primary text-foreground hover:bg-primary/5"
                      size="lg"
                    >
                      {t('pricing.startFree')}
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/checkout?plan=${plan.name.toLowerCase()}`} className="w-full">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className={`w-full ${plan.popular ? "" : "border-2 border-primary text-foreground hover:bg-primary/5"}`}
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

        {/* Emails supplémentaires */}
        <div className="mt-16 max-w-7xl mx-auto px-4">
          <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/15 via-primary/10 to-accent/10 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
                  Besoin de plus d'emails ?
                </h3>
                <p className="text-muted-foreground">
                  Dépassez votre quota mensuel en achetant des emails supplémentaires
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-lg p-5 border-2 border-primary/40 hover:border-primary transition-all text-center shadow-md hover:shadow-lg hover:scale-105">
                  <p className="text-sm font-semibold text-primary mb-2">Starter</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-2xl font-bold text-primary">10 DT</span>
                    <span className="text-sm text-muted-foreground">/ 1,000 emails</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-lg p-5 border-2 border-primary/40 hover:border-primary transition-all text-center shadow-md hover:shadow-lg hover:scale-105">
                  <p className="text-sm font-semibold text-primary mb-2">Essential</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-2xl font-bold text-primary">10 DT</span>
                    <span className="text-sm text-muted-foreground">/ 1,000 emails</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-primary/20 to-accent/10 rounded-lg p-5 border-2 border-primary hover:border-primary transition-all text-center shadow-lg hover:shadow-xl hover:scale-105">
                  <p className="text-sm font-semibold text-primary mb-2">Pro</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-2xl font-bold text-primary">9 DT</span>
                    <span className="text-sm text-muted-foreground">/ 1,000 emails</span>
                  </div>
                  <p className="text-xs text-primary mt-2 font-semibold">Avantage volume</p>
                </div>
                
                <div className="bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg p-5 border-2 border-accent hover:border-accent transition-all text-center shadow-lg hover:shadow-xl hover:scale-105">
                  <p className="text-sm font-semibold text-accent mb-2">Business</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-2xl font-bold text-accent">8 DT</span>
                    <span className="text-sm text-muted-foreground">/ 1,000 emails</span>
                  </div>
                  <p className="text-xs text-accent mt-2 font-semibold">Prix réduit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-24 text-center space-y-4 max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-foreground">
            {t('pricing.faq.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-12 text-left">
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
        <div className="mt-24 text-center space-y-6 p-12 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 border-2 border-primary/50 shadow-xl max-w-7xl mx-auto px-4">
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
                <LogoWithText className="h-14" />
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
            <p>© {new Date().getFullYear()} DymaMail — All rights reserved. Made with 🇹🇳 in Tunis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
