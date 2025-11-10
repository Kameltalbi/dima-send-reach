import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Zap, BarChart3, Globe, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-dima-mail.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="DimaMail" className="h-10" />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#accueil" className="text-foreground hover:text-accent transition-colors">Accueil</a>
            <a href="#fonctionnalites" className="text-foreground hover:text-accent transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="text-foreground hover:text-accent transition-colors">Tarifs</a>
            <a href="#apropos" className="text-foreground hover:text-accent transition-colors">À propos</a>
            <a href="#contact" className="text-foreground hover:text-accent transition-colors">Contact</a>
          </nav>
          <Link to="/auth">
            <Button variant="default">Se connecter</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section id="accueil" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-heading font-bold text-foreground mb-6">
                Envoyez vos campagnes d'e-mails simplement et efficacement
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                DimaMail est la plateforme d'e-mail marketing qui vous permet d'envoyer jusqu'à 1 000 000 d'e-mails par campagne, avec un suivi en temps réel.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Créer un compte gratuit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Découvrir les fonctionnalités
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-32 w-32 text-primary/40" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin pour réussir vos campagnes
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Mail className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Création facile
                </h3>
                <p className="text-muted-foreground">
                  Créez vos e-mails en quelques clics grâce à notre éditeur visuel.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Zap className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Envoi massif sécurisé
                </h3>
                <p className="text-muted-foreground">
                  Jusqu'à 1 million d'e-mails par campagne via Amazon SES.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Statistiques détaillées
                </h3>
                <p className="text-muted-foreground">
                  Suivez vos performances en temps réel : ouvertures, clics, désabonnements.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Fiabilité mondiale
                </h3>
                <p className="text-muted-foreground">
                  Conforme aux standards internationaux de sécurité et de deliverabilité.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Aperçu produit */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Card className="shadow-xl">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-primary/30 to-accent/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-40 w-40 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <div>
              <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
                Un tableau de bord clair pour piloter toutes vos campagnes
              </h2>
              <p className="text-xl text-muted-foreground mb-6">
                Analysez vos résultats et améliorez votre communication à chaque envoi.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Vue d'ensemble de vos performances en temps réel</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Graphiques et statistiques détaillées par campagne</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Export CSV pour analyses approfondies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-foreground mb-4">
              Des offres flexibles pour tous les besoins
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Découverte</h3>
                <p className="text-muted-foreground mb-6">Gratuit</p>
                <p className="text-3xl font-bold text-foreground mb-6">0 DT<span className="text-lg font-normal">/mois</span></p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">10 000 e-mails par mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Statistiques de base</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">Commencer</Button>
              </CardContent>
            </Card>

            <Card className="border-accent border-2">
              <CardContent className="pt-8 pb-8">
                <div className="text-xs font-semibold text-accent mb-2">POPULAIRE</div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Pro</h3>
                <p className="text-muted-foreground mb-6">Pour les professionnels</p>
                <p className="text-3xl font-bold text-foreground mb-6">À partir de 49 DT<span className="text-lg font-normal">/mois</span></p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Jusqu'à 100 000 e-mails/mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Statistiques avancées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Support prioritaire</span>
                  </li>
                </ul>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Commencer</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Entreprise</h3>
                <p className="text-muted-foreground mb-6">Volume élevé</p>
                <p className="text-3xl font-bold text-foreground mb-6">Sur mesure</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Jusqu'à 1 million d'envois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Support dédié</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">SLA garanti</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">Nous contacter</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* À propos */}
      <section id="apropos" className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-4xl font-heading font-bold mb-6">
            Une solution conçue pour les professionnels
          </h2>
          <p className="text-xl mb-8 opacity-90">
            DimaMail est née de la volonté d'offrir aux entreprises une solution fiable et performante d'email marketing. Simple, rapide et efficace, DimaMail vous aide à rester toujours en contact avec vos clients, où qu'ils soient.
          </p>
          <Button size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Nous contacter
          </Button>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-heading font-bold mb-6">
            Commencez à envoyer vos campagnes dès aujourd'hui
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Rejoignez les entreprises qui font confiance à DimaMail pour leur communication.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Créer un compte gratuit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={logo} alt="DimaMail" className="h-8 mb-4 brightness-0 invert" />
              <p className="text-sm opacity-80">
                Plateforme professionnelle d'e-mail marketing.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#accueil" className="opacity-80 hover:text-accent transition-colors">Accueil</a></li>
                <li><a href="#fonctionnalites" className="opacity-80 hover:text-accent transition-colors">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="opacity-80 hover:text-accent transition-colors">Tarifs</a></li>
                <li><a href="#contact" className="opacity-80 hover:text-accent transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors">FAQ</a></li>
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors">Support technique</a></li>
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors">Blog (à venir)</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Suivez-nous</h4>
              <div className="flex gap-4">
                <a href="#" className="opacity-80 hover:text-accent transition-colors">LinkedIn</a>
                <a href="#" className="opacity-80 hover:text-accent transition-colors">Facebook</a>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm opacity-80">
            <p>© 2025 DimaMail — Tous droits réservés. Fait avec 🇹🇳 à Tunis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;