import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageCircle, Book, ExternalLink, Loader2, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { LogoWithText } from "@/components/Logo";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const faqs = [
  {
    question: "Comment importer mes contacts ?",
    answer: "Vous pouvez importer vos contacts via un fichier CSV depuis la page Contacts. Cliquez sur 'Importer CSV' et suivez les instructions. Le fichier doit contenir au minimum les colonnes : email, nom, prénom.",
  },
  {
    question: "Comment configurer Amazon SES ?",
    answer: "Rendez-vous dans Paramètres > Configuration SES. Vous aurez besoin de vos clés d'accès AWS (Access Key ID et Secret Access Key). N'oubliez pas de vérifier votre domaine d'envoi dans la console AWS SES.",
  },
  {
    question: "Puis-je programmer l'envoi de mes campagnes ?",
    answer: "Oui, lors de la création d'une campagne, vous pouvez choisir de l'envoyer immédiatement ou de la programmer pour une date et heure ultérieure.",
  },
  {
    question: "Comment créer une liste de contacts ?",
    answer: "Allez dans la section Listes, cliquez sur 'Nouvelle liste', donnez-lui un nom et une description, puis ajoutez-y vos contacts depuis la page de gestion de la liste.",
  },
  {
    question: "Où puis-je voir les statistiques de mes campagnes ?",
    answer: "Les statistiques globales sont disponibles dans la section Statistiques. Pour voir les détails d'une campagne spécifique, cliquez sur son nom depuis la liste des campagnes.",
  },
];

const Support = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    nom: "",
    email: user?.email || "",
    sujet: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitContact = async () => {
    if (!contactForm.nom || !contactForm.email || !contactForm.sujet || !contactForm.message) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setIsSubmitting(true);
    
    // TODO: Implémenter l'envoi réel via Edge Function ou service email
    // Pour l'instant, on simule
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("Votre message a été envoyé. Nous vous répondrons sous 24h.");
    setContactForm({
      nom: "",
      email: user?.email || "",
      sujet: "",
      message: "",
    });
    setIsSubmitting(false);
  };

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
            <Link to="/support" className="text-base xl:text-lg font-semibold text-accent transition-colors">
              {t('nav.support')}
            </Link>
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
                      className="text-xl font-semibold text-foreground hover:text-accent transition-colors py-2"
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
                    <Link 
                      to="/support" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-semibold text-accent transition-colors py-2"
                    >
                      {t('nav.support')}
                    </Link>
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

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16 md:py-24 md:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Support & Aide</h1>
            <p className="text-xl text-muted-foreground">
              Trouvez des réponses à vos questions ou contactez-nous
            </p>
          </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Book className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Guides et tutoriels complets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open("https://docs.dimamail.com", "_blank")}
            >
              Consulter la doc
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Chat en direct</CardTitle>
            <CardDescription>
              Assistance en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                toast.info("Le chat en direct sera bientôt disponible");
              }}
            >
              Démarrer le chat
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <Mail className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Réponse sous 24h
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                window.location.href = "mailto:support@dimamail.com?subject=Support DimaMail";
              }}
            >
              support@dimamail.com
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions fréquentes</CardTitle>
          <CardDescription>
            Les réponses aux questions les plus courantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contactez-nous</CardTitle>
          <CardDescription>
            Posez-nous votre question directement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-nom">Nom *</Label>
              <Input
                id="contact-nom"
                value={contactForm.nom}
                onChange={(e) => setContactForm({ ...contactForm, nom: e.target.value })}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email *</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="votre@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-sujet">Sujet *</Label>
            <Input
              id="contact-sujet"
              value={contactForm.sujet}
              onChange={(e) => setContactForm({ ...contactForm, sujet: e.target.value })}
              placeholder="En quoi pouvons-nous vous aider ?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message *</Label>
            <Textarea
              id="contact-message"
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              placeholder="Décrivez votre question ou problème..."
              rows={5}
            />
          </div>
          <Button
            onClick={handleSubmitContact}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              "Envoyer le message"
            )}
          </Button>
        </CardContent>
      </Card>
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
                <li><Link to="/support" className="opacity-80 hover:text-accent transition-colors hover:opacity-100">{t('nav.support')}</Link></li>
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

export default Support;
