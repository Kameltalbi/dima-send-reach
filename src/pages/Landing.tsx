import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, Menu, Send, TrendingUp, Workflow, Eye, FileText, Shield, Languages, DollarSign, Headphones, Users, Gift, X, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoWithText, LogoLight } from "@/components/Logo";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SoniaAssistant } from "@/components/SoniaAssistant";
import { useState } from "react";

// Données des plans avec toutes les fonctionnalités détaillées
const plansData = {
  free: {
    emails: "3,000 e-mails / mois",
    dailyLimit: "100 e-mails / jour",
    contacts: "1,000 contacts",
    users: "1 utilisateur",
    domains: "1 domaine",
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
  starter: {
    emails: "10,000 e-mails / mois",
    contacts: "Contacts illimités",
    users: "3 utilisateurs",
    domains: "2 domaines",
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
  essential: {
    emails: "20,000 e-mails / mois",
    contacts: "Contacts illimités",
    users: "10 utilisateurs",
    domains: "5 domaines",
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
  pro: {
    emails: "50,000 e-mails / mois",
    contacts: "Contacts illimités",
    users: "Utilisateurs illimités",
    domains: "10 domaines",
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
  business: {
    emails: "100,000 e-mails / mois",
    contacts: "Contacts illimités",
    users: "Multi-équipes (3 utilisateurs)",
    domains: "20 domaines",
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
};

const Landing = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useScrollAnimation();
  const featuresRef = useScrollAnimation();
  const whyChooseRef = useScrollAnimation();
  const pricingRef = useScrollAnimation();
  const aboutRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Design minimaliste style Finpay */}
      <header className="bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center flex-shrink-0">
            <LogoWithText className="h-10" />
          </Link>
          <nav className="hidden lg:flex items-center gap-8 mx-auto">
            <a href="#features" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">{t('nav.features')}</a>
            <Link to="/pricing" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">{t('nav.pricing')}</Link>
            <a href="#about" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">{t('nav.about')}</a>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-sm font-medium">{t('common.signIn')}</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium">{t('common.signUp')}</Button>
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
                    <a 
                      href="#features" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.features')}
                    </a>
                    <Link 
                      to="/pricing" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.pricing')}
                    </Link>
                    <a 
                      href="#about" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.about')}
                    </a>
                    <a 
                      href="#contact" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.contact')}
                    </a>
                  </nav>
                  <div className="pt-4 border-t">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full" size="lg">
                        {t('common.signIn')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section - Design minimaliste style Finpay */}
      <section id="home" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div ref={heroRef.ref} className={`animate-on-scroll ${heroRef.isVisible ? 'visible' : ''}`}>
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  DymaMail la solution tunisienne emailing
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                {t('landing.hero.title')}
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/pricing">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap text-lg px-8 py-6">
                    {t('landing.hero.cta')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className={`hidden lg:block animate-on-scroll-right ${heroRef.isVisible ? 'visible animate-delay-200' : ''}`}>
              <div className="relative">
                <img 
                  src="/dimaDima.png" 
                  alt="DymaMail - Plateforme d'Email Marketing" 
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Design épuré sans cartes */}
      <section id="features" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={featuresRef.ref} className={`mb-12 animate-on-scroll ${featuresRef.isVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mb-12">
              {t('landing.features.subtitle')}
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Colonne gauche */}
              <div className="space-y-8">
                {/* Envoi d'emails performant */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('landing.features.performance.title')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('landing.features.performance.description')}
                    </p>
                  </div>
                </div>

                {/* Automatisations intelligentes */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Workflow className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('landing.features.automation.title')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('landing.features.automation.description')}
                    </p>
                  </div>
                </div>

                {/* Landing pages & formulaires */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('landing.features.landing.title')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('landing.features.landing.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-8">
                {/* Statistiques avancées */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('landing.features.statistics.title')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('landing.features.statistics.description')}
                    </p>
                  </div>
                </div>

                {/* Prévisualisations professionnelles */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('landing.features.preview.title')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('landing.features.preview.description')}
                    </p>
                  </div>
                </div>

                {/* Délivrabilité optimisée */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t('landing.features.deliverability.title')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('landing.features.deliverability.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose DymaMail - Design épuré sans cartes */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={whyChooseRef.ref} className={`mb-12 animate-on-scroll ${whyChooseRef.isVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              {t('landing.whyChoose.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mb-12">
              {t('landing.whyChoose.subtitle')}
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Interface multilingue */}
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Languages className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('landing.whyChoose.points.multilingual.title')}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('landing.whyChoose.points.multilingual.description')}
                  </p>
                </div>
              </div>

              {/* Prix compétitifs */}
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('landing.whyChoose.points.pricing.title')}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('landing.whyChoose.points.pricing.description')}
                  </p>
                </div>
              </div>

              {/* Support humain */}
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('landing.whyChoose.points.support.title')}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('landing.whyChoose.points.support.description')}
                  </p>
                </div>
              </div>

              {/* Sous-comptes pour agences */}
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('landing.whyChoose.points.subaccounts.title')}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('landing.whyChoose.points.subaccounts.description')}
                  </p>
                </div>
              </div>

              {/* Plan gratuit + flexibilité */}
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('landing.whyChoose.points.flexible.title')}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('landing.whyChoose.points.flexible.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 lg:py-20 relative">
        <div className="container mx-auto px-6">
          <div ref={pricingRef.ref} className={`text-center mb-12 animate-on-scroll ${pricingRef.isVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('landing.pricing.subtitle')}
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mt-4"></div>
          </div>
          
          {/* Domain Requirement Alert */}
          <div className="max-w-[1600px] mx-auto mb-8">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary text-sm font-bold">!</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">{t('pricing.domainRequiredNote')}</p>
                <p className="text-xs text-muted-foreground">{t('pricing.domainRequired')}</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
            {/* Free Plan */}
            <Card className={`hover-lift transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-100' : ''}`}>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">{t('landing.pricing.plans.free.name')}</h3>
                <p className="text-muted-foreground mb-6 text-sm">{t('landing.pricing.plans.free.description')}</p>
                <div className="mb-6">
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {t('landing.pricing.plans.free.price')}<span className="text-sm md:text-base font-normal text-muted-foreground ml-1">{t('landing.pricing.plans.free.period')}</span>
                  </p>
                </div>
                
                {/* Capacités */}
                <div className="space-y-2 pb-6 border-b border-border mb-6">
                  <p className="font-semibold text-xs text-muted-foreground mb-3">CAPACITÉS</p>
                  <p className="text-sm font-bold text-foreground">{plansData.free.emails}</p>
                  {plansData.free.dailyLimit && (
                    <p className="text-xs text-muted-foreground">{plansData.free.dailyLimit}</p>
                  )}
                  <p className="text-sm font-bold text-foreground mt-2">{plansData.free.contacts}</p>
                  <p className="text-xs text-foreground mt-2">{plansData.free.users}</p>
                  <p className="text-xs text-foreground">{plansData.free.domains}</p>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2 mb-8">
                  <p className="font-semibold text-xs text-foreground mb-3">FONCTIONNALITÉS</p>
                  {plansData.free.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                  <Link to="/pricing" className="text-xs text-primary hover:underline mt-2 block">
                    Voir toutes les fonctionnalités →
                  </Link>
                </div>
                
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105">{t('landing.pricing.plans.free.cta')}</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Starter Plan */}
            <Card className={`hover-lift transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-200' : ''}`}>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">{t('landing.pricing.plans.starter.name')}</h3>
                <p className="text-muted-foreground mb-6 text-sm">{t('landing.pricing.plans.starter.description')}</p>
                <div className="mb-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline">
                      <span className="text-2xl md:text-3xl font-bold text-foreground">{t('landing.pricing.plans.starter.price')}</span>
                      <span className="text-sm md:text-base font-normal text-muted-foreground ml-1">{t('landing.pricing.plans.starter.period')}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      {t('landing.pricing.annualOnlyNote')}
                    </p>
                  </div>
                </div>
                
                {/* Capacités */}
                <div className="space-y-2 pb-6 border-b border-border mb-6">
                  <p className="font-semibold text-xs text-muted-foreground mb-3">CAPACITÉS</p>
                  <p className="text-sm font-bold text-foreground">{plansData.starter.emails}</p>
                  <p className="text-sm font-bold text-foreground mt-2">{plansData.starter.contacts}</p>
                  <p className="text-xs text-foreground mt-2">{plansData.starter.users}</p>
                  <p className="text-xs text-foreground">{plansData.starter.domains}</p>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2 mb-8">
                  <p className="font-semibold text-xs text-foreground mb-3">FONCTIONNALITÉS</p>
                  {plansData.starter.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                  <Link to="/pricing" className="text-xs text-primary hover:underline mt-2 block">
                    Voir toutes les fonctionnalités →
                  </Link>
                </div>
                
                <Link to="/checkout?plan=starter" className="block">
                  <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105">{t('landing.pricing.plans.starter.cta')}</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Essential Plan - POPULAR */}
            <Card className={`border-primary border-2 relative hover-lift hover-glow transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-300 scale-105' : ''}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-pulse-slow">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                  {t('landing.pricing.plans.essential.popular')}
                </span>
              </div>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">{t('landing.pricing.plans.essential.name')}</h3>
                <p className="text-muted-foreground mb-6 text-sm">{t('landing.pricing.plans.essential.description')}</p>
                <div className="mb-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline">
                      <span className="text-2xl md:text-3xl font-bold text-foreground">{t('landing.pricing.plans.essential.price')}</span>
                      <span className="text-sm md:text-base font-normal text-muted-foreground ml-1">{t('landing.pricing.plans.essential.period')}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      {t('landing.pricing.annualOnlyNote')}
                    </p>
                  </div>
                </div>
                
                {/* Capacités */}
                <div className="space-y-2 pb-6 border-b border-border mb-6">
                  <p className="font-semibold text-xs text-muted-foreground mb-3">CAPACITÉS</p>
                  <p className="text-sm font-bold text-foreground">{plansData.essential.emails}</p>
                  <p className="text-sm font-bold text-foreground mt-2">{plansData.essential.contacts}</p>
                  <p className="text-xs text-foreground mt-2">{plansData.essential.users}</p>
                  <p className="text-xs text-foreground">{plansData.essential.domains}</p>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2 mb-8">
                  <p className="font-semibold text-xs text-foreground mb-3">FONCTIONNALITÉS</p>
                  {plansData.essential.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                  <Link to="/pricing" className="text-xs text-primary hover:underline mt-2 block">
                    Voir toutes les fonctionnalités →
                  </Link>
                </div>
                
                <Link to="/checkout?plan=essential" className="block">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    {t('landing.pricing.plans.essential.cta')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className={`hover-lift transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-400' : ''}`}>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">{t('landing.pricing.plans.pro.name')}</h3>
                <p className="text-muted-foreground mb-6 text-sm">{t('landing.pricing.plans.pro.description')}</p>
                <div className="mb-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline">
                      <span className="text-2xl md:text-3xl font-bold text-foreground">{t('landing.pricing.plans.pro.price')}</span>
                      <span className="text-sm md:text-base font-normal text-muted-foreground ml-1">{t('landing.pricing.plans.pro.period')}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      {t('landing.pricing.annualOnlyNote')}
                    </p>
                  </div>
                </div>
                
                {/* Capacités */}
                <div className="space-y-2 pb-6 border-b border-border mb-6">
                  <p className="font-semibold text-xs text-muted-foreground mb-3">CAPACITÉS</p>
                  <p className="text-sm font-bold text-foreground">{plansData.pro.emails}</p>
                  <p className="text-sm font-bold text-foreground mt-2">{plansData.pro.contacts}</p>
                  <p className="text-xs text-foreground mt-2">{plansData.pro.users}</p>
                  <p className="text-xs text-foreground">{plansData.pro.domains}</p>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2 mb-8">
                  <p className="font-semibold text-xs text-foreground mb-3">FONCTIONNALITÉS</p>
                  {plansData.pro.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                  <Link to="/pricing" className="text-xs text-primary hover:underline mt-2 block">
                    Voir toutes les fonctionnalités →
                  </Link>
                </div>
                
                <Link to="/checkout?plan=pro" className="block">
                  <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105">{t('landing.pricing.plans.pro.cta')}</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Business Plan */}
            <Card className={`hover-lift transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-500' : ''}`}>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">{t('landing.pricing.plans.business.name')}</h3>
                <p className="text-muted-foreground mb-6 text-sm">{t('landing.pricing.plans.business.description')}</p>
                <div className="mb-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline">
                      <span className="text-2xl md:text-3xl font-bold text-foreground">{t('landing.pricing.plans.business.price')}</span>
                      <span className="text-sm md:text-base font-normal text-muted-foreground ml-1">{t('landing.pricing.plans.business.period')}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      {t('landing.pricing.annualOnlyNote')}
                    </p>
                  </div>
                </div>
                
                {/* Capacités */}
                <div className="space-y-2 pb-6 border-b border-border mb-6">
                  <p className="font-semibold text-xs text-muted-foreground mb-3">CAPACITÉS</p>
                  <p className="text-sm font-bold text-foreground">{plansData.business.emails}</p>
                  <p className="text-sm font-bold text-foreground mt-2">{plansData.business.contacts}</p>
                  <p className="text-xs text-foreground mt-2">{plansData.business.users}</p>
                  <p className="text-xs text-foreground">{plansData.business.domains}</p>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2 mb-8">
                  <p className="font-semibold text-xs text-foreground mb-3">FONCTIONNALITÉS</p>
                  {plansData.business.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                  <Link to="/pricing" className="text-xs text-primary hover:underline mt-2 block">
                    Voir toutes les fonctionnalités →
                  </Link>
                </div>
                
                <Link to="/checkout?plan=business" className="block">
                  <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105">{t('landing.pricing.plans.business.cta')}</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <div className={`text-center mt-12 animate-on-scroll ${pricingRef.isVisible ? 'visible animate-delay-600' : ''}`}>
            <Link to="/pricing">
              <Button variant="ghost" className="transition-all duration-300 hover:scale-110">
                {t('landing.pricing.seeDetails')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-gradient-to-br from-accent/10 via-background to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div ref={aboutRef.ref} className={`container mx-auto px-6 text-center max-w-4xl relative z-10 animate-on-scroll ${aboutRef.isVisible ? 'visible' : ''}`}>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-foreground">
            {t('landing.about.title')}
          </h2>
          <p className="text-xl mb-8 text-muted-foreground leading-relaxed">
            {t('landing.about.description')}
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-110 hover:shadow-xl">
            {t('landing.about.cta')}
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary via-primary/95 to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent"></div>
        <div ref={ctaRef.ref} className={`container mx-auto px-6 text-center relative z-10 animate-on-scroll ${ctaRef.isVisible ? 'visible' : ''}`}>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            {t('landing.cta.subtitle')}
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-110 hover:shadow-2xl group">
              {t('landing.cta.button')}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-to-br from-foreground/95 to-foreground text-background py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img 
                  src="/logo-DymaMail-F-blanc.png" 
                  alt="DymaMail Logo" 
                  className="h-14 w-auto object-contain"
                />
              </div>
              <p className="text-sm opacity-80">
                Professional email marketing platform.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4 text-background">{t('nav.home')}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.home')}</a></li>
                <li><a href="#features" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.features')}</a></li>
                <li><a href="#pricing" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.pricing')}</a></li>
                <li><a href="#contact" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4 text-background">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">FAQ</a></li>
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">Technical Support</a></li>
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
            <p>© 2025 DymaMail — All rights reserved. Made with 🇹🇳 in Tunis.</p>
          </div>
        </div>
      </footer>
      <SoniaAssistant />
    </div>
  );
};

export default Landing;