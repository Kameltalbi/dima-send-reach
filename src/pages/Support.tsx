import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageCircle, Book, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const { user } = useAuth();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Support & Aide</h1>
        <p className="text-muted-foreground mt-1">
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
  );
};

export default Support;
