import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageCircle, Book } from "lucide-react";

const faqs = [
  {
    question: "Comment importer mes contacts ?",
    answer: "Vous pouvez importer vos contacts via un fichier CSV depuis la page Contacts. Cliquez sur 'Importer CSV' et suivez les instructions. Le fichier doit contenir au minimum les colonnes : email, nom, prénom."
  },
  {
    question: "Comment configurer Amazon SES ?",
    answer: "Rendez-vous dans Paramètres > Configuration SES. Vous aurez besoin de vos clés d'accès AWS (Access Key ID et Secret Access Key). N'oubliez pas de vérifier votre domaine d'envoi dans la console AWS SES."
  },
  {
    question: "Puis-je programmer l'envoi de mes campagnes ?",
    answer: "Oui, lors de la création d'une campagne, vous pouvez choisir de l'envoyer immédiatement ou de la programmer pour une date et heure ultérieure."
  },
  {
    question: "Comment créer une liste de contacts ?",
    answer: "Allez dans la section Listes, cliquez sur 'Nouvelle liste', donnez-lui un nom et une description, puis ajoutez-y vos contacts depuis la page de gestion de la liste."
  },
  {
    question: "Où puis-je voir les statistiques de mes campagnes ?",
    answer: "Les statistiques globales sont disponibles dans la section Statistiques. Pour voir les détails d'une campagne spécifique, cliquez sur son nom depuis la liste des campagnes."
  },
];

const Support = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Support & Aide</h1>
        <p className="text-muted-foreground mt-1">
          Trouvez des réponses à vos questions ou contactez-nous
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Book className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Guides et tutoriels complets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Consulter la doc
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Chat en direct</CardTitle>
            <CardDescription>
              Assistance en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Démarrer le chat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Mail className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Réponse sous 24h
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
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
              <Label htmlFor="contact-nom">Nom</Label>
              <Input id="contact-nom" placeholder="Votre nom" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" placeholder="votre@email.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-sujet">Sujet</Label>
            <Input id="contact-sujet" placeholder="En quoi pouvons-nous vous aider ?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea 
              id="contact-message" 
              placeholder="Décrivez votre question ou problème..." 
              rows={5}
            />
          </div>
          <Button>Envoyer le message</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Support;
