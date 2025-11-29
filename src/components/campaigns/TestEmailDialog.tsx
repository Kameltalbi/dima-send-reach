import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TestEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendTest: (emails: string[]) => void;
  isSending: boolean;
}

export function TestEmailDialog({ open, onOpenChange, onSendTest, isSending }: TestEmailDialogProps) {
  const { user } = useAuth();
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Charger les contacts de test
  const { data: testContacts, isLoading } = useQuery({
    queryKey: ["test-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, email, prenom, nom")
        .eq("user_id", user?.id)
        .eq("is_test_contact", true)
        .eq("statut", "actif")
        .order("prenom", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user && open,
  });

  const handleToggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (testContacts && selectedEmails.length === testContacts.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(testContacts?.map((c) => c.email) || []);
    }
  };

  const handleSend = () => {
    if (selectedEmails.length > 0) {
      onSendTest(selectedEmails);
      setSelectedEmails([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoi de test
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les contacts de test qui recevront un aperçu de votre email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : testContacts && testContacts.length > 0 ? (
            <>
              <div className="flex items-center justify-between py-2">
                <Label className="text-sm font-medium">
                  {selectedEmails.length} contact{selectedEmails.length > 1 ? "s" : ""} sélectionné{selectedEmails.length > 1 ? "s" : ""}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedEmails.length === testContacts.length ? "Tout désélectionner" : "Tout sélectionner"}
                </Button>
              </div>

              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                <div className="divide-y">
                  {testContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleEmail(contact.email)}
                    >
                      <Checkbox
                        checked={selectedEmails.includes(contact.email)}
                        onCheckedChange={() => handleToggleEmail(contact.email)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {contact.prenom} {contact.nom}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun contact de test configuré. Allez dans Contacts ou Listes pour marquer des contacts comme "Contact de test".
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedEmails.length === 0 || isSending}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Envoyer à {selectedEmails.length} contact{selectedEmails.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
