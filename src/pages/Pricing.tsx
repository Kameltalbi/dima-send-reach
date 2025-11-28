import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const plans = [
  {
    name: "Free",
    price: "Gratuit",
    description: "Pour tester la plateforme",
    emails: "3,000 e-mails / mois",
    dailyLimit: "100 e-mails / jour",
    domains: "1 domaine vérifié",
    users: "1 utilisateur",
    popular: false,
    features: [
      { text: "Dashboard simple", included: true },
      { text: "Envoi email manuel", included: true },
      { text: "Envoi via API (clé API unique)", included: true },
      { text: "Tracking ouvertures (basique)", included: true },
      { text: "Historique 7 jours", included: true },
      { text: "5 templates e-mail gratuits", included: true },
      { text: "Import CSV limité (200 contacts)", included: true },
      { text: "Webhooks", included: false },
      { text: "Automatisation", included: false },
      { text: "A/B testing", included: false },
    ],
  },
  {
    name: "Starter",
    price: "160 DT",
    period: "/mois",
    description: "Pour les petites entreprises",
    emails: "10,000 e-mails / mois",
    domains: "Jusqu'à 3 domaines",
    users: "3 utilisateurs",
    popular: true,
    features: [
      { text: "Toutes les fonctionnalités Free", included: true },
      { text: "Tracking ouvertures + clics", included: true },
      { text: "15 templates premium", included: true },
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
    price: "490 DT",
    period: "/mois",
    description: "Pour les PME et équipes marketing",
    emails: "50,000 e-mails / mois",
    domains: "10 domaines",
    users: "10 utilisateurs",
    popular: false,
    features: [
      { text: "Toutes les fonctionnalités Starter", included: true },
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
    price: "1,320 DT",
    period: "/mois",
    description: "Pour les grandes entreprises et SaaS",
    emails: "200,000 e-mails / mois",
    domains: "Domaines illimités",
    users: "Utilisateurs illimités",
    popular: false,
    features: [
      { text: "Toutes les fonctionnalités Essential", included: true },
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link to="/auth">
              <Button>Commencer gratuitement</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-16 md:py-24 md:px-6">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground">
            Tarifs simples et transparents
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
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
                    Plus populaire
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
                {/* Envois */}
                <div className="space-y-2 pb-6 border-b border-border">
                  <p className="font-semibold text-sm text-muted-foreground">Envois</p>
                  <p className="text-sm font-medium">{plan.emails}</p>
                  {plan.dailyLimit && (
                    <p className="text-xs text-muted-foreground">{plan.dailyLimit}</p>
                  )}
                  <p className="text-sm">{plan.domains}</p>
                  <p className="text-sm">{plan.users}</p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-muted-foreground">
                    Fonctionnalités
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
                <Link to="/auth" className="w-full">
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    {plan.name === "Free" ? "Commencer gratuitement" : "Choisir ce plan"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-24 text-center space-y-4">
          <h2 className="text-3xl font-heading font-bold text-foreground">
            Questions fréquentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 text-left">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Puis-je changer de plan ?</h3>
              <p className="text-muted-foreground">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les
                changements prennent effet immédiatement.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Comment fonctionne la facturation ?</h3>
              <p className="text-muted-foreground">
                Tous les plans sont facturés mensuellement. Vous ne payez que pour ce que
                vous utilisez, sans engagement.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Que se passe-t-il si je dépasse ma limite ?</h3>
              <p className="text-muted-foreground">
                Vous serez notifié avant d'atteindre votre limite. Vous pouvez upgrader
                votre plan ou attendre le mois suivant.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Support technique inclus ?</h3>
              <p className="text-muted-foreground">
                Oui, tous les plans incluent un support. Les plans payants bénéficient
                d'un support prioritaire et 24/7 pour le plan Pro.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center space-y-6 p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Prêt à démarrer avec DimaMail ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Commencez gratuitement dès aujourd'hui. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="min-w-[200px]">
                Commencer gratuitement
              </Button>
            </Link>
            <Link to="/support">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Contacter les ventes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/95 mt-24">
        <div className="container px-4 py-8 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DimaMail. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground">
                Support
              </Link>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                Tarifs
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
