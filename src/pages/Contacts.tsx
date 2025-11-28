import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Upload, Search, MoreVertical, Edit, Trash2, Mail, User, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const Contacts = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    segment: "",
    statut: "actif",
  });

  // Charger les contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", statusFilter, segmentFilter],
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("statut", statusFilter);
      }

      if (segmentFilter !== "all") {
        query = query.eq("segment", segmentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Filtrer par recherche
  const filteredContacts = contacts?.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.nom?.toLowerCase().includes(query) ||
      contact.prenom?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.segment?.toLowerCase().includes(query)
    );
  }) || [];

  // Obtenir les segments uniques
  const segments = Array.from(new Set(contacts?.map((c) => c.segment).filter(Boolean) || []));

  // Mutation pour créer un contact
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("contacts").insert({
        user_id: user?.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(t('contacts.createSuccess'));
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error(t('contacts.emailExists'));
      } else {
        toast.error(t('contacts.createError'));
      }
    },
  });

  // Mutation pour modifier un contact
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("contacts")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(t('contacts.updateSuccess'));
      setIsEditOpen(false);
      setSelectedContact(null);
      resetForm();
    },
    onError: () => {
      toast.error(t('contacts.updateError'));
    },
  });

  // Mutation pour supprimer un contact
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(t('contacts.deleteSuccess'));
      setIsDeleteOpen(false);
      setSelectedContact(null);
    },
    onError: () => {
      toast.error(t('contacts.deleteError'));
    },
  });

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      segment: "",
      statut: "actif",
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEdit = (contact: any) => {
    setSelectedContact(contact);
    setFormData({
      nom: contact.nom,
      prenom: contact.prenom,
      email: contact.email,
      segment: contact.segment || "",
      statut: contact.statut,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (contact: any) => {
    setSelectedContact(contact);
    setIsDeleteOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      toast.error(t('common.fillRequired'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('common.invalidEmail'));
      return;
    }

    if (selectedContact) {
      updateMutation.mutate({ id: selectedContact.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error(t('contacts.importError'));
      return;
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Trouver les index des colonnes
    const emailIndex = headers.findIndex((h) => h.includes("email"));
    const nomIndex = headers.findIndex((h) => h.includes("nom") && !h.includes("prenom"));
    const prenomIndex = headers.findIndex((h) => h.includes("prenom"));
    const segmentIndex = headers.findIndex((h) => h.includes("segment"));

    if (emailIndex === -1) {
      toast.error(t('contacts.importError'));
      return;
    }

    const contactsToImport = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const email = values[emailIndex];
      
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        contactsToImport.push({
          user_id: user?.id,
          email,
          nom: values[nomIndex] || "",
          prenom: values[prenomIndex] || "",
          segment: values[segmentIndex] || null,
          statut: "actif",
        });
      }
    }

    if (contactsToImport.length === 0) {
      toast.error(t('contacts.importError'));
      return;
    }

    try {
      const { error } = await supabase.from("contacts").insert(contactsToImport);
      if (error) {
        if (error.code === "23505") {
          toast.error(t('contacts.importError'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('contacts.importSuccess'));
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        setIsImportOpen(false);
      }
    } catch (error) {
      toast.error(t('contacts.importError'));
    }
  };

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      actif: "default",
      desabonne: "secondary",
      erreur: "destructive",
    };
    return (
      <Badge variant={variants[statut] || "default"}>
        {statut}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{t('contacts.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('contacts.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2 w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{t('contacts.importCSV')}</span>
            <span className="sm:hidden">Import CSV</span>
          </Button>
          <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t('contacts.newContact')}
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('contacts.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('contacts.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('contacts.all')}</SelectItem>
                <SelectItem value="actif">{t('contacts.active')}</SelectItem>
                <SelectItem value="desabonne">{t('contacts.unsubscribed')}</SelectItem>
                <SelectItem value="erreur">{t('contacts.inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('contacts.segment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('contacts.all')}</SelectItem>
                {segments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des contacts */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des contacts</CardTitle>
          <CardDescription>
            {filteredContacts.length} contact{filteredContacts.length > 1 ? "s" : ""} trouvé{filteredContacts.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun contact
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" || segmentFilter !== "all"
                  ? "Aucun contact ne correspond à vos critères"
                  : "Commencez par créer votre premier contact"}
              </p>
              {!searchQuery && statusFilter === "all" && segmentFilter === "all" && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un contact
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
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d'ajout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
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
                      <TableCell>{getStatusBadge(contact.statut)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(contact.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(contact)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(contact)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog création/modification */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetForm();
          setSelectedContact(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedContact ? "Modifier le contact" : "Nouveau contact"}
            </DialogTitle>
            <DialogDescription>
              {selectedContact
                ? "Modifiez les informations du contact"
                : "Ajoutez un nouveau contact à votre liste"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean.dupont@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segment</Label>
              <Input
                id="segment"
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                placeholder="Clients VIP, Newsletter, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="desabonne">Désabonné</SelectItem>
                  <SelectItem value="erreur">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetForm();
                setSelectedContact(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Enregistrement..."
                : selectedContact
                ? "Modifier"
                : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le contact "{selectedContact?.prenom} {selectedContact?.nom}" ({selectedContact?.email}) ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContact && deleteMutation.mutate(selectedContact.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog import CSV */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des contacts depuis CSV</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier CSV avec les colonnes : email, nom, prenom (optionnel), segment (optionnel)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Fichier CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Le fichier doit contenir au minimum une colonne "email". Les colonnes "nom", "prenom" et "segment" sont optionnelles.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
