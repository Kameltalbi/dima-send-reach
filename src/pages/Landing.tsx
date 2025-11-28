import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Zap, BarChart3, Globe, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoWithText, LogoLight } from "@/components/Logo";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Landing = () => {
  const heroRef = useScrollAnimation();
  const featuresRef = useScrollAnimation();
  const productRef = useScrollAnimation();
  const pricingRef = useScrollAnimation();
  const aboutRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 animate-fade-in-left">
            <LogoWithText className="h-10" />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-foreground hover:text-accent transition-all duration-300 hover:scale-110">Home</a>
            <a href="#features" className="text-foreground hover:text-accent transition-all duration-300 hover:scale-110">Features</a>
            <Link to="/pricing" className="text-foreground hover:text-accent transition-all duration-300 hover:scale-110">Pricing</Link>
            <a href="#about" className="text-foreground hover:text-accent transition-all duration-300 hover:scale-110">About</a>
            <a href="#contact" className="text-foreground hover:text-accent transition-all duration-300 hover:scale-110">Contact</a>
          </nav>
          <Link to="/auth" className="animate-fade-in-right">
            <Button variant="default" className="transition-all duration-300 hover:scale-105 hover:shadow-lg">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20 bg-gradient-to-br from-muted/30 via-background to-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div ref={heroRef.ref} className={`animate-on-scroll ${heroRef.isVisible ? 'visible' : ''}`}>
              <h1 className="text-5xl md:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
                Send your email campaigns <span className="text-accent">simply</span> and effectively
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                DimaMail is the email marketing platform that allows you to send up to 1,000,000 emails per campaign, with real-time tracking.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <Link to="/pricing">Discover Pricing</Link>
                </Button>
              </div>
            </div>
            <div className={`hidden md:block animate-on-scroll-right ${heroRef.isVisible ? 'visible animate-delay-200' : ''}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur-3xl -z-10 animate-pulse-slow"></div>
                <img 
                  src="/dimaDima.png" 
                  alt="DimaMail - Plateforme d'Email Marketing" 
                  className="rounded-lg shadow-2xl w-full h-auto object-contain animate-float relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div ref={featuresRef.ref} className={`text-center mb-16 animate-on-scroll ${featuresRef.isVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Everything you need to succeed with your campaigns
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mt-4"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover-lift group transition-all duration-300">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                  <Mail className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Easy Creation
                </h3>
                <p className="text-muted-foreground">
                  Create your emails in a few clicks with our visual editor.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-lift group transition-all duration-300 animate-delay-100">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                  <Zap className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Secure Mass Sending
                </h3>
                <p className="text-muted-foreground">
                  Up to 1 million emails per campaign via Amazon SES.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-lift group transition-all duration-300 animate-delay-200">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                  <BarChart3 className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Detailed Statistics
                </h3>
                <p className="text-muted-foreground">
                  Track your performance in real-time: opens, clicks, unsubscribes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-lift group transition-all duration-300 animate-delay-300">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                  <Globe className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Global Reliability
                </h3>
                <p className="text-muted-foreground">
                  Compliant with international security and deliverability standards.
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
                A clear dashboard to manage all your campaigns
              </h2>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Analyze your results and improve your communication with every send.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">Real-time performance overview</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">Detailed graphs and statistics per campaign</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">CSV export for in-depth analysis</span>
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
              Tarifs flexibles pour tous les besoins
            </h2>
            <p className="text-xl text-muted-foreground">
              Choisissez le plan qui correspond à votre entreprise
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto mt-4"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free Plan */}
            <Card className={`hover-lift transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-100' : ''}`}>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Free</h3>
                <p className="text-muted-foreground mb-6 text-sm">Pour tester la plateforme</p>
                <p className="text-3xl font-bold text-foreground mb-6">
                  0 DT<span className="text-lg font-normal text-muted-foreground">/an</span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">3,000 e-mails / mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">1 utilisateur</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">1 domaine</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">3 templates</span>
                  </li>
                </ul>
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105">Commencer gratuitement</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Starter Plan */}
            <Card className={`hover-lift transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-200' : ''}`}>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Starter</h3>
                <p className="text-muted-foreground mb-6 text-sm">Pour les petites entreprises</p>
                <p className="text-3xl font-bold text-foreground mb-6">
                  340 DT<span className="text-lg font-normal text-muted-foreground">/an</span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">10,000 e-mails / mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">3 utilisateurs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">3 domaines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">5 templates</span>
                  </li>
                </ul>
                <Link to="/checkout?plan=starter" className="block">
                  <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105">Choisir ce plan</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Essential Plan - POPULAR */}
            <Card className={`border-primary border-2 relative hover-lift hover-glow transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-300 scale-105' : ''}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-pulse-slow">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                  PLUS POPULAIRE
                </span>
              </div>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Essential</h3>
                <p className="text-muted-foreground mb-6 text-sm">Pour les PME et équipes marketing</p>
                <p className="text-3xl font-bold text-foreground mb-6">
                  590 DT<span className="text-lg font-normal text-muted-foreground">/an</span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">50,000 e-mails / mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">10 utilisateurs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">10 domaines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">10 templates</span>
                  </li>
                </ul>
                <Link to="/checkout?plan=essential" className="block">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    Choisir ce plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className={`hover-lift transition-all duration-300 animate-on-scroll-scale ${pricingRef.isVisible ? 'visible animate-delay-400' : ''}`}>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Pro</h3>
                <p className="text-muted-foreground mb-6 text-sm">Pour les grandes entreprises</p>
                <p className="text-3xl font-bold text-foreground mb-6">
                  990 DT<span className="text-lg font-normal text-muted-foreground">/an</span>
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">200,000 e-mails / mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Utilisateurs illimités</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Domaines illimités</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">15 templates</span>
                  </li>
                </ul>
                <Link to="/checkout?plan=pro" className="block">
                  <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105">Choisir ce plan</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <div className={`text-center mt-12 animate-on-scroll ${pricingRef.isVisible ? 'visible animate-delay-500' : ''}`}>
            <Link to="/pricing">
              <Button variant="ghost" className="transition-all duration-300 hover:scale-110">
                Voir tous les détails des plans
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
            A solution designed for professionals
          </h2>
          <p className="text-xl mb-8 text-muted-foreground leading-relaxed">
            DimaMail was born from the desire to offer businesses a reliable and powerful email marketing solution. Simple, fast, and effective, DimaMail helps you stay connected with your customers, wherever they are.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-110 hover:shadow-xl">
            Contact Us
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/95 to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent"></div>
        <div ref={ctaRef.ref} className={`container mx-auto px-6 text-center relative z-10 animate-on-scroll ${ctaRef.isVisible ? 'visible' : ''}`}>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            Start sending your campaigns today
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Join the businesses that trust DimaMail for their communication.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-110 hover:shadow-2xl group">
              Create Free Account
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
                <LogoWithText className="h-10" />
              </div>
              <p className="text-sm opacity-80">
                Professional email marketing platform.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4 text-background">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">Home</a></li>
                <li><a href="#features" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">Features</a></li>
                <li><a href="#pricing" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">Pricing</a></li>
                <li><a href="#contact" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">Contact</a></li>
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