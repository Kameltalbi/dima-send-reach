import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Search, Trash2, Mail, Users, X, TestTube } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GestionListe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedContactToAdd, setSelectedContactToAdd] = useState("");

  // Charger la liste
  const { data: list } = useQuery({
    queryKey: ["list", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Charger les contacts de la liste
  const { data: listContacts, isLoading } = useQuery({
    queryKey: ["listContacts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("list_contacts")
        .select(`
          *,
          contacts (*)
        `)
        .eq("list_id", id);
      if (error) throw error;
      return data?.map((lc: any) => lc.contacts).filter(Boolean) || [];
    },
    enabled: !!id,
  });

  // Charger tous les contacts disponibles
  const { data: allContacts } = useQuery({
    queryKey: ["allContacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("statut", "actif")
        .order("nom", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Contacts disponibles (pas déjà dans la liste)
  const availableContacts = allContacts?.filter(
    (contact) => !listContacts?.some((lc: any) => lc.id === contact.id)
  ) || [];

  // Filtrer par recherche
  const filteredContacts = listContacts?.filter((contact: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.nom?.toLowerCase().includes(query) ||
      contact.prenom?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
  }) || [];

  // Mutation pour ajouter un contact
  const addMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase.from("list_contacts").insert({
        list_id: id,
        contact_id: contactId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listContacts", id] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast.success("Contact ajouté à la liste");
      setIsAddOpen(false);
      setSelectedContactToAdd("");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout du contact");
    },
  });

  // Mutation pour retirer un contact
  const removeMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("list_contacts")
        .delete()
        .eq("list_id", id)
        .eq("contact_id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listContacts", id] });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      toast.success("Contact retiré de la liste");
      setIsDeleteOpen(false);
      setSelectedContact(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du contact");
    },
  });

  const handleAdd = () => {
    if (!selectedContactToAdd) {
      toast.error("Veuillez sélectionner un contact");
      return;
    }
    addMutation.mutate(selectedContactToAdd);
  };

  const handleRemove = (contact: any) => {
    setSelectedContact(contact);
    setIsDeleteOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/listes")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {list?.nom || "Liste"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {list?.description || "Gérez les contacts de cette liste"}
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un contact
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listContacts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contacts disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableContacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Statut</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="default">Active</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des contacts */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts de la liste</CardTitle>
          <CardDescription>
            {filteredContacts.length} contact{filteredContacts.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun contact dans cette liste
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Aucun contact ne correspond à votre recherche"
                  : "Ajoutez des contacts à cette liste"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un contact
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact: any) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.prenom} {contact.nom}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {contact.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.segment ? (
                          <Badge variant="outline">{contact.segment}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.is_test_contact && (
                          <Badge variant="secondary" className="gap-1">
                            <TestTube className="h-3 w-3" />
                            Test
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(contact)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog ajouter contact */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un contact à la liste</DialogTitle>
            <DialogDescription>
              Sélectionnez un contact à ajouter à cette liste
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availableContacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Tous vos contacts sont déjà dans cette liste
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={selectedContactToAdd} onValueChange={setSelectedContactToAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.prenom} {contact.nom} ({contact.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedContactToAdd || addMutation.isPending}
            >
              {addMutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le contact</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer "{selectedContact?.prenom} {selectedContact?.nom}" de cette liste ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContact && removeMutation.mutate(selectedContact.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestionListe;

