import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Zap, BarChart3, Globe, ArrowRight, Check, Menu, Send, TrendingUp, Workflow, Eye, FileText, Shield, Languages, DollarSign, Headphones, Users, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoWithText, LogoLight } from "@/components/Logo";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const Landing = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useScrollAnimation();
  const featuresRef = useScrollAnimation();
  const whyChooseRef = useScrollAnimation();
  const productRef = useScrollAnimation();
  const pricingRef = useScrollAnimation();
  const aboutRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Design minimaliste style Finpay */}
      <header className="bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center flex-shrink-0">
            <LogoWithText className="h-10" />
          </div>
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
                      href="#home" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
                    >
                      {t('nav.home')}
                    </a>
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
      <section id="home" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div ref={heroRef.ref} className={`animate-on-scroll ${heroRef.isVisible ? 'visible' : ''}`}>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                {t('landing.hero.title')}
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3 max-w-md">
                  <input 
                    type="email" 
                    placeholder={t('landing.hero.emailPlaceholder') || "Votre email professionnel"}
                    className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
                  />
                  <Link to="/auth">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
                      {t('landing.hero.cta')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className={`hidden lg:block animate-on-scroll-right ${heroRef.isVisible ? 'visible animate-delay-200' : ''}`}>
              <div className="relative">
                <img 
                  src="/dimaDima.png" 
                  alt="DimaMail - Plateforme d'Email Marketing" 
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={featuresRef.ref} className={`text-center mb-20 animate-on-scroll ${featuresRef.isVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Envoi d'emails performant */}
            <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300 bg-white">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('landing.features.performance.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.features.performance.description')}
                </p>
              </CardContent>
            </Card>

            {/* Statistiques avancées */}
            <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300 bg-white">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('landing.features.statistics.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.features.statistics.description')}
                </p>
              </CardContent>
            </Card>

            {/* Automatisations intelligentes */}
            <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300 bg-white">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <Workflow className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('landing.features.automation.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.features.automation.description')}
                </p>
              </CardContent>
            </Card>

            {/* Prévisualisations professionnelles */}
            <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300 bg-white">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('landing.features.preview.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.features.preview.description')}
                </p>
              </CardContent>
            </Card>

            {/* Landing pages & formulaires */}
            <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300 bg-white">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('landing.features.landing.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.features.landing.description')}
                </p>
              </CardContent>
            </Card>

            {/* Délivrabilité optimisée */}
            <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300 bg-white">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t('landing.features.deliverability.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('landing.features.deliverability.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose DimaMail */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div ref={whyChooseRef.ref} className={`text-center mb-16 animate-on-scroll ${whyChooseRef.isVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {t('landing.whyChoose.title')}
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              {t('landing.whyChoose.subtitle')}
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mt-4"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Interface multilingue */}
            <Card className="hover-lift group transition-all duration-300">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                  <Languages className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  {t('landing.whyChoose.points.multilingual.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('landing.whyChoose.points.multilingual.description')}
                </p>
              </CardContent>
            </Card>

            {/* Prix compétitifs */}
            <Card className="hover-lift group transition-all duration-300">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                  <DollarSign className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  {t('landing.whyChoose.points.pricing.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('landing.whyChoose.points.pricing.description')}
                </p>
              </CardContent>
            </Card>

            {/* Support humain */}
            <Card className="hover-lift group transition-all duration-300">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                  <Headphones className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  {t('landing.whyChoose.points.support.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('landing.whyChoose.points.support.description')}
                </p>
              </CardContent>
            </Card>

            {/* Sous-comptes pour agences */}
            <Card className="hover-lift group transition-all duration-300">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                  <Users className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  {t('landing.whyChoose.points.subaccounts.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('landing.whyChoose.points.subaccounts.description')}
                </p>
              </CardContent>
            </Card>

            {/* Plan gratuit + flexibilité */}
            <Card className="hover-lift group transition-all duration-300 md:col-span-2 lg:col-span-1">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                  <Gift className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  {t('landing.whyChoose.points.flexible.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('landing.whyChoose.points.flexible.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section className="py-20 bg-gradient-to-br from-muted/30 to-background relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div ref={productRef.ref} className={`hidden md:block animate-on-scroll-left ${productRef.isVisible ? 'visible' : ''}`}>
              <Card className="shadow-2xl hover-lift transition-all duration-300">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 gradient-animated opacity-30"></div>
                    <BarChart3 className="h-32 w-32 text-primary/60 relative z-10 animate-pulse-slow" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div ref={productRef.ref} className={`animate-on-scroll-right ${productRef.isVisible ? 'visible animate-delay-200' : ''}`}>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
                {t('landing.product.title')}
              </h2>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {t('landing.product.subtitle')}
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{t('landing.product.features.overview')}</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{t('landing.product.features.graphs')}</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{t('landing.product.features.export')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div ref={pricingRef.ref} className={`text-center mb-16 animate-on-scroll ${pricingRef.isVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('landing.pricing.subtitle')}
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mt-4"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
            {/* Free Plan */}
            <Card className={`hover-lift transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-100' : ''}`}>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">{t('landing.pricing.plans.free.name')}</h3>
                <p className="text-muted-foreground mb-6 text-sm">{t('landing.pricing.plans.free.description')}</p>
                <p className="text-3xl font-bold text-foreground mb-6">
                  {t('landing.pricing.plans.free.price')}<span className="text-lg font-normal text-muted-foreground">{t('landing.pricing.plans.free.period')}</span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.free.features.emails')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.free.features.users')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.free.features.domains')}</span>
                  </li>
                </ul>
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
                      <span className="text-4xl font-bold text-foreground">{t('landing.pricing.plans.starter.price')}</span>
                      <span className="text-lg font-normal text-muted-foreground ml-2">{t('landing.pricing.plans.starter.period')}</span>
                    </div>
                    {t('landing.pricing.plans.starter.annualPrice') && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span>{t('landing.pricing.payableAnnual')} </span>
                        <span className="font-medium">{t('landing.pricing.plans.starter.annualPrice')}/an</span>
                      </div>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.starter.features.emails')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.starter.features.users')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.starter.features.domains')}</span>
                  </li>
                </ul>
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
                      <span className="text-4xl font-bold text-foreground">{t('landing.pricing.plans.essential.price')}</span>
                      <span className="text-lg font-normal text-muted-foreground ml-2">{t('landing.pricing.plans.essential.period')}</span>
                    </div>
                    {t('landing.pricing.plans.essential.annualPrice') && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span>{t('landing.pricing.payableAnnual')} </span>
                        <span className="font-medium">{t('landing.pricing.plans.essential.annualPrice')}/an</span>
                      </div>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.essential.features.emails')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.essential.features.users')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.essential.features.domains')}</span>
                  </li>
                </ul>
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
                <p className="text-3xl font-bold text-foreground mb-6">
                  {t('landing.pricing.plans.pro.price')}<span className="text-lg font-normal text-muted-foreground">{t('landing.pricing.plans.pro.period')}</span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.pro.features.emails')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.pro.features.users')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.pro.features.domains')}</span>
                  </li>
                </ul>
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
                <p className="text-3xl font-bold text-foreground mb-6">
                  {t('landing.pricing.plans.business.price')}<span className="text-lg font-normal text-muted-foreground">{t('landing.pricing.plans.business.period')}</span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.business.features.emails')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.business.features.users')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{t('landing.pricing.plans.business.features.domains')}</span>
                  </li>
                </ul>
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
      <section className="py-20 bg-gradient-to-br from-primary via-primary/95 to-primary text-primary-foreground relative overflow-hidden">
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
                <LogoWithText className="h-14" />
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
            <p>© 2025 DimaMail — All rights reserved. Made with 🇹🇳 in Tunis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;