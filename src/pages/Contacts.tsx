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
import { Plus, Upload, Search, MoreVertical, Edit, Trash2, Mail, User, Filter, ListPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { usePermissions } from "@/hooks/usePermissions";
import { Download } from "lucide-react";
import { useContactQuota } from "@/hooks/useContactQuota";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const Contacts = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { canDeleteContacts, canExportContacts } = usePermissions();
  const { quota: contactQuota, canAddContacts } = useContactQuota();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [addToListEnabled, setAddToListEnabled] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [createNewList, setCreateNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    prenom: "",
    nom: "",
    telephone: "",
    fonction: "",
    societe: "",
    site_web: "",
    pays: "",
    ville: "",
    segment: "",
    statut: "actif",
    is_test_contact: false,
  });

  // Compter le total de contacts
  const { data: totalCount } = useQuery({
    queryKey: ["contacts-count", statusFilter, segmentFilter],
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      if (statusFilter !== "all") {
        query = query.eq("statut", statusFilter);
      }

      if (segmentFilter !== "all") {
        query = query.eq("segment", segmentFilter);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Charger les contacts avec pagination
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", statusFilter, segmentFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .range(from, to);

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

  // Filtrer par recherche (sur la page courante uniquement)
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

  // Calculer le nombre total de pages
  const totalPages = Math.ceil((totalCount || 0) / itemsPerPage);

  // Obtenir les segments uniques
  const segments = Array.from(new Set(contacts?.map((c) => c.segment).filter(Boolean) || []));

  // Charger les listes disponibles
  const { data: lists } = useQuery({
    queryKey: ["lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("id, nom")
        .eq("user_id", user?.id)
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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
      queryClient.invalidateQueries({ queryKey: ["contact-quota"] });
      toast.success(t('contacts.createSuccess'));
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Erreur création contact:", error);
      if (error.code === "23505") {
        toast.error(t('contacts.emailExists'));
      } else {
        toast.error(t('contacts.createError') + (error.message ? `: ${error.message}` : ''));
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
    onError: (error: any) => {
      console.error("Erreur modification contact:", error);
      toast.error(t('contacts.updateError') + (error.message ? `: ${error.message}` : ''));
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
      queryClient.invalidateQueries({ queryKey: ["contact-quota"] });
      toast.success(t('contacts.deleteSuccess'));
      setIsDeleteOpen(false);
      setSelectedContact(null);
    },
    onError: () => {
      toast.error(t('contacts.deleteError'));
    },
  });

  // Mutation pour supprimer plusieurs contacts par lots
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      setDeleteProgress(0);

      // Cas spécial : mode "tous sélectionnés" (ids vide ou selectAllMode)
      if (selectAllMode || (!ids || ids.length === 0)) {
        // Construire la requête avec les filtres appliqués
        let query = supabase
          .from("contacts")
          .delete()
          .eq("user_id", user?.id);

        if (statusFilter !== "all") {
          query = query.eq("statut", statusFilter);
        }

        if (segmentFilter !== "all") {
          query = query.eq("segment", segmentFilter);
        }

        if (searchQuery) {
          query = query.or(`nom.ilike.%${searchQuery}%,prenom.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }

        const { error } = await query;
        if (error) throw error;
        setDeleteProgress(100);
        return { deletedCount: totalCount || 0 };
      }

      // Cas spécial : vue sans filtre ni recherche et tous les contacts de la page sélectionnés
      const isDeleteAllView =
        searchQuery === "" &&
        statusFilter === "all" &&
        segmentFilter === "all" &&
        ids.length === filteredContacts.length;

      if (isDeleteAllView) {
        const { error } = await supabase.from("contacts").delete().eq("user_id", user?.id);
        if (error) throw error;
        setDeleteProgress(100);
        return { deletedCount: ids.length };
      }

      // Sinon, on supprime par lots avec liste d'IDs
      const batchSize = 50;
      const batches: string[][] = [];
      for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const { error } = await supabase.from("contacts").delete().in("id", batch);
        if (error) throw error;

        const progress = Math.round(((i + 1) / batches.length) * 100);
        setDeleteProgress(progress);
      }

      return { deletedCount: ids.length };
    },
    onSuccess: (data) => {
      const deletedCount = data?.deletedCount || (selectAllMode ? totalCount : selectedContacts.length) || 0;
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact-quota"] });
      toast.success(`${deletedCount} contact(s) supprimé(s)`);
      setDeleteProgress(0);
      setIsBulkDeleteOpen(false);
      setSelectedContacts([]);
      setSelectAllMode(false);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression des contacts");
      setDeleteProgress(0);
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      prenom: "",
      nom: "",
      telephone: "",
      fonction: "",
      societe: "",
      site_web: "",
      pays: "",
      ville: "",
      segment: "",
      statut: "actif",
      is_test_contact: false,
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEdit = (contact: any) => {
    setSelectedContact(contact);
    setFormData({
      email: contact.email || "",
      prenom: contact.prenom || "",
      nom: contact.nom || "",
      telephone: contact.telephone || "",
      fonction: contact.fonction || "",
      societe: contact.societe || "",
      site_web: contact.site_web || "",
      pays: contact.pays || "",
      ville: contact.ville || "",
      segment: contact.segment || "",
      statut: contact.statut || "actif",
      is_test_contact: contact.is_test_contact || false,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (contact: any) => {
    setSelectedContact(contact);
    setIsDeleteOpen(true);
  };

  const handleAssign = (contact: any) => {
    setSelectedContact(contact);
    setIsAssignOpen(true);
  };

  // Mutation pour assigner un contact à une liste
  const assignToListMutation = useMutation({
    mutationFn: async ({ contactId, listId }: { contactId: string; listId: string }) => {
      // Vérifier si le contact est déjà dans la liste
      const { data: existing } = await supabase
        .from("list_contacts")
        .select("id")
        .eq("list_id", listId)
        .eq("contact_id", contactId)
        .single();

      if (existing) {
        throw new Error("Le contact est déjà dans cette liste");
      }

      const { error } = await supabase
        .from("list_contacts")
        .insert({
          list_id: listId,
          contact_id: contactId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact assigné à la liste");
      setIsAssignOpen(false);
      setSelectedContact(null);
    },
    onError: (error: any) => {
      console.error("Erreur assignation:", error);
      if (error.message === "Le contact est déjà dans cette liste") {
        toast.error(error.message);
      } else {
        toast.error("Erreur lors de l'assignation");
      }
    },
  });

  // Mutation pour assigner plusieurs contacts à une liste
  const bulkAssignToListMutation = useMutation({
    mutationFn: async ({ contactIds, listId, assignAll }: { contactIds: string[]; listId: string; assignAll?: boolean }) => {
      if (assignAll) {
        // Mode "tous les contacts" : on récupère tous les IDs qui correspondent aux filtres
        let query = supabase
          .from("contacts")
          .select("id")
          .eq("user_id", user?.id);

        if (statusFilter !== "all") {
          query = query.eq("statut", statusFilter);
        }

        if (segmentFilter !== "all") {
          query = query.eq("segment", segmentFilter);
        }

        if (searchQuery) {
          // Recherche basique sur nom, prenom, email
          query = query.or(`nom.ilike.%${searchQuery}%,prenom.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }

        const { data: allContacts, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        contactIds = allContacts?.map(c => c.id) || [];
      }

      if (contactIds.length === 0) {
        throw new Error("Aucun contact à assigner");
      }

      // Récupérer les contacts déjà dans la liste
      const { data: existing } = await supabase
        .from("list_contacts")
        .select("contact_id")
        .eq("list_id", listId)
        .in("contact_id", contactIds);

      const existingIds = existing?.map(e => e.contact_id) || [];
      const newContactIds = contactIds.filter(id => !existingIds.includes(id));

      // Si tous les contacts sont déjà dans la liste, retourner un résultat sans erreur
      if (newContactIds.length === 0) {
        return {
          assigned: 0,
          skipped: existingIds.length,
        };
      }

      // Insérer par lots de 500
      const batchSize = 500;
      const batches: string[][] = [];
      for (let i = 0; i < newContactIds.length; i += batchSize) {
        batches.push(newContactIds.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const contactsToInsert = batch.map(contactId => ({
          list_id: listId,
          contact_id: contactId,
        }));

        const { error } = await supabase
          .from("list_contacts")
          .insert(contactsToInsert);

        if (error) throw error;
      }

      return {
        assigned: newContactIds.length,
        skipped: existingIds.length,
      };
    },
    onSuccess: (data) => {
      if (data.skipped > 0) {
        toast.success(`${data.assigned} contact(s) assigné(s), ${data.skipped} déjà présent(s)`);
      } else {
        toast.success(`${data.assigned} contact(s) assigné(s) à la liste`);
      }
      setIsBulkAssignOpen(false);
      setSelectedContacts([]);
      setSelectAllMode(false);
    },
    onError: (error: any) => {
      console.error("Erreur assignation en masse:", error);
      if (error.message === "Tous les contacts sont déjà dans cette liste") {
        toast.error(error.message);
      } else if (error.message === "Aucun contact à assigner") {
        toast.error(error.message);
      } else {
        toast.error("Erreur lors de l'assignation");
      }
    },
  });

  const handleSubmit = () => {
    // Vérifier les champs obligatoires dans l'ordre : Email, Prénom, Nom
    if (!formData.email) {
      toast.error("L'email est obligatoire");
      return;
    }
    if (!formData.prenom) {
      toast.error("Le prénom est obligatoire");
      return;
    }
    if (!formData.nom) {
      toast.error("Le nom est obligatoire");
      return;
    }

    // Valider le format de l'email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('common.invalidEmail'));
      return;
    }

    // Vérifier le quota de contacts (uniquement pour Free)
    // Si le quota est null (illimité pour plans pro), permettre la création
    if (!selectedContact && contactQuota && contactQuota.limit !== null && !canAddContacts(1)) {
      if (contactQuota.isBlocked) {
        const limitText = `${contactQuota.limit}`;
        toast.error(`Limite de contacts atteinte (${limitText} contacts). Passez à un plan payant pour des contacts illimités.`);
      } else {
        const limitText = `${contactQuota.limit}`;
        const remainingText = contactQuota.remaining ?? 0;
        toast.error(`Quota de contacts insuffisant. Limite: ${limitText}, Restant: ${remainingText}`);
      }
      return;
    }

    // Préparer les données
    const dataToSubmit = {
      email: formData.email.trim(),
      prenom: formData.prenom.trim(),
      nom: formData.nom.trim(),
      telephone: formData.telephone?.trim() || null,
      fonction: formData.fonction?.trim() || null,
      societe: formData.societe?.trim() || null,
      site_web: formData.site_web?.trim() || null,
      pays: formData.pays?.trim() || null,
      ville: formData.ville?.trim() || null,
      segment: formData.segment?.trim() || null,
      statut: formData.statut,
      is_test_contact: formData.is_test_contact,
    };

    if (selectedContact) {
      updateMutation.mutate({ id: selectedContact.id, ...dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Le fichier doit être au format CSV");
      return;
    }

    setCsvFile(file);
  };

  const processCSVImport = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length === 0) {
        toast.error("Le fichier CSV est vide");
        setIsImporting(false);
        return;
      }

      // Détecter le séparateur (virgule ou point-virgule)
      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const delimiter = semicolonCount > commaCount ? ";" : ",";

      console.log(`Délimiteur détecté: ${delimiter === ";" ? "point-virgule" : "virgule"}`);

      const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

      // Trouver les index des colonnes
      const emailIndex = headers.findIndex((h) => h.includes("email") || h === "e-mail");
      const nomIndex = headers.findIndex((h) => (h.includes("nom") || h === "last name") && !h.includes("prenom"));
      const prenomIndex = headers.findIndex((h) => h.includes("prenom") || h === "first name" || h === "prénom");
      const telephoneIndex = headers.findIndex((h) => h.includes("telephone") || h.includes("tel") || h.includes("phone"));
      const fonctionIndex = headers.findIndex((h) => h.includes("fonction") || h.includes("poste") || h === "role");
      const societeIndex = headers.findIndex((h) => h.includes("societe") || h.includes("entreprise") || h.includes("company"));
      const siteWebIndex = headers.findIndex((h) => h.includes("site") || h.includes("web") || h.includes("url"));
      const paysIndex = headers.findIndex((h) => h.includes("pays") || h.includes("country"));
      const villeIndex = headers.findIndex((h) => h.includes("ville") || h.includes("city"));
      const segmentIndex = headers.findIndex((h) => h.includes("segment"));

      if (emailIndex === -1) {
        toast.error("Aucune colonne 'email' trouvée dans le CSV");
        setIsImporting(false);
        return;
      }

      const contactsToImport = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map((v) => v.trim());
        const email = values[emailIndex]?.trim();
        
        // Validation stricte de l'email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Ligne ${i + 1}: Email invalide ou manquant`);
          continue;
        }

        // Récupérer les valeurs ou laisser vide si invalide
        const nom = values[nomIndex]?.trim() || "";
        const prenom = values[prenomIndex]?.trim() || "";
        const telephone = values[telephoneIndex]?.trim() || null;
        const fonction = values[fonctionIndex]?.trim() || null;
        const societe = values[societeIndex]?.trim() || null;
        const siteWeb = values[siteWebIndex]?.trim() || null;
        const pays = values[paysIndex]?.trim() || null;
        const ville = values[villeIndex]?.trim() || null;
        const segment = values[segmentIndex]?.trim() || null;

        contactsToImport.push({
          user_id: user?.id,
          email,
          nom: nom || "Contact",
          prenom: prenom || email.split("@")[0],
          telephone,
          fonction,
          societe,
          site_web: siteWeb,
          pays,
          ville,
          segment,
          statut: "actif",
        });
      }

      if (contactsToImport.length === 0) {
        toast.error("Aucun contact valide trouvé dans le fichier");
        if (errors.length > 0) {
          console.error("Erreurs d'import:", errors);
        }
        setIsImporting(false);
        return;
      }

      // Vérifier le quota de contacts (uniquement pour Free)
      // Si le quota est null (illimité pour plans pro), permettre l'import
      if (contactQuota && contactQuota.limit !== null && !canAddContacts(contactsToImport.length)) {
        if (contactQuota.isBlocked) {
          const limitText = `${contactQuota.limit}`;
          toast.error(`Limite de contacts atteinte (${limitText} contacts). Vous ne pouvez pas importer ${contactsToImport.length} contacts. Passez à un plan payant pour des contacts illimités.`);
        } else {
          const limitText = `${contactQuota.limit}`;
          const remainingText = contactQuota.remaining ?? 0;
          toast.error(`Quota de contacts insuffisant. Limite: ${limitText}, Restant: ${remainingText}, Demandé: ${contactsToImport.length}. Passez à un plan payant pour des contacts illimités.`);
        }
        setIsImporting(false);
        return;
      }

      // Créer une nouvelle liste si demandé
      let targetListId: string | null = null;
      if (addToListEnabled) {
        if (createNewList && newListName.trim()) {
        const { data: newList, error: listError } = await supabase
          .from("lists")
          .insert({
            user_id: user?.id,
            nom: newListName.trim(),
          })
          .select("id")
          .single();

        if (listError) {
          toast.error("Erreur lors de la création de la liste");
          setIsImporting(false);
          return;
        }
          targetListId = newList.id;
          queryClient.invalidateQueries({ queryKey: ["lists"] });
        } else if (selectedListId) {
          targetListId = selectedListId;
        }
      }

      // Importer par lots de 500 contacts pour éviter les timeouts et limites de taille
      const batchSize = 500;
      const batches: any[][] = [];
      for (let i = 0; i < contactsToImport.length; i += batchSize) {
        batches.push(contactsToImport.slice(i, i + batchSize));
      }

      let totalImported = 0;
      let duplicateCount = 0;
      const importedContactIds: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          const { data: insertedContacts, error } = await supabase
            .from("contacts")
            .insert(batch)
            .select("id, email");
          
          if (error) {
            if (error.code === "23505") {
              // Certains contacts en doublon dans ce lot
              // Récupérer les contacts existants pour les ajouter à la liste
              const emails = batch.map(c => c.email);
              const { data: existingContacts } = await supabase
                .from("contacts")
                .select("id")
                .eq("user_id", user?.id)
                .in("email", emails);
              
              if (existingContacts) {
                importedContactIds.push(...existingContacts.map(c => c.id));
                duplicateCount += existingContacts.length;
              } else {
                duplicateCount += batch.length;
              }
            } else {
              throw error;
            }
          } else {
            totalImported += batch.length;
            if (insertedContacts) {
              importedContactIds.push(...insertedContacts.map(c => c.id));
            }
          }
        } catch (error) {
          console.error(`Erreur lors de l'import du lot ${i + 1}:`, error);
          // En cas d'erreur, essayer de récupérer les contacts existants pour les ajouter à la liste
          if (targetListId) {
            const emails = batch.map(c => c.email);
            const { data: existingContacts } = await supabase
              .from("contacts")
              .select("id")
              .eq("user_id", user?.id)
              .in("email", emails);
            
            if (existingContacts) {
              importedContactIds.push(...existingContacts.map(c => c.id));
            }
          }
        }

        // Mettre à jour la progression
        const progress = Math.round(((i + 1) / batches.length) * 100);
        setImportProgress(progress);
      }

      // Ajouter les contacts à la liste si une liste est sélectionnée
      if (targetListId && importedContactIds.length > 0) {
        const listContactsBatchSize = 500;
        const listContactBatches: string[][] = [];
        for (let i = 0; i < importedContactIds.length; i += listContactsBatchSize) {
          listContactBatches.push(importedContactIds.slice(i, i + listContactsBatchSize));
        }

        for (const batch of listContactBatches) {
          const listContacts = batch.map(contactId => ({
            list_id: targetListId,
            contact_id: contactId,
          }));

          const { error: listContactsError } = await supabase
            .from("list_contacts")
            .insert(listContacts);

          if (listContactsError && listContactsError.code !== "23505") {
            // Ignorer les erreurs de doublons (contact déjà dans la liste)
            console.error("Erreur lors de l'ajout à la liste:", listContactsError);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact-quota"] });
      if (targetListId) {
        queryClient.invalidateQueries({ queryKey: ["list-contacts", targetListId] });
      }
      
      if (totalImported > 0) {
        if (targetListId) {
          const listName = createNewList ? newListName : lists?.find(l => l.id === targetListId)?.nom || '';
          toast.success(`${totalImported} ${t('contacts.importSuccessWithList')} "${listName}"`);
        } else {
          toast.success(`${totalImported} ${t('contacts.importSuccess')}`);
        }
      }
      
      if (duplicateCount > 0) {
        toast.warning(`${duplicateCount} contact(s) ignoré(s) (emails déjà existants)`);
      }
      
      if (errors.length > 0) {
        toast.warning(`${errors.length} ligne(s) ignorée(s) (emails invalides)`);
      }

      setIsImportOpen(false);
      setCsvFile(null);
      setImportProgress(0);
      setAddToListEnabled(false);
      setSelectedListId("");
      setCreateNewList(false);
      setNewListName("");
    } catch (error) {
      toast.error("Erreur lors de l'import");
      console.error("Erreur import:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Si on a déjà tous les contacts de la page sélectionnés, passer en mode "tous les contacts"
      if (isAllSelectedOnPage && totalCount && totalCount > filteredContacts.length) {
        setSelectAllMode(true);
        setSelectedContacts([]);
      } else {
        // Sinon, sélectionner tous les contacts de la page courante
        setSelectedContacts(filteredContacts.map((c) => c.id));
        setSelectAllMode(false);
      }
    } else {
      // Désélectionner tous
      setSelectedContacts([]);
      setSelectAllMode(false);
    }
  };

  const handleSelectAllContacts = () => {
    // Sélectionner tous les contacts (toutes les pages)
    setSelectAllMode(true);
    setSelectedContacts([]);
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
    setSelectAllMode(false);
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      // Si on est en mode "tous sélectionnés", on passe en mode sélection individuelle
      if (selectAllMode) {
        setSelectAllMode(false);
        // Récupérer tous les IDs sauf celui qu'on désélectionne
        const allIds = filteredContacts.map(c => c.id);
        setSelectedContacts(allIds.filter(id => id !== contactId));
      } else {
        setSelectedContacts([...selectedContacts, contactId]);
      }
    } else {
      // Désélectionner un contact
      if (selectAllMode) {
        // Si on était en mode "tous sélectionnés", passer en mode sélection individuelle
        setSelectAllMode(false);
        const allIds = filteredContacts.map(c => c.id);
        setSelectedContacts(allIds.filter(id => id !== contactId));
      } else {
        setSelectedContacts(selectedContacts.filter(id => id !== contactId));
      }
    }
  };

  // Calculer l'état de la checkbox "sélectionner tout"
  const isAllSelectedOnPage = filteredContacts.length > 0 && 
    filteredContacts.every(contact => selectedContacts.includes(contact.id));
  const isIndeterminate = selectedContacts.length > 0 && !isAllSelectedOnPage && !selectAllMode;
  const isAllSelected = selectAllMode || (isAllSelectedOnPage && (!totalCount || totalCount === filteredContacts.length));

  const handleBulkDelete = () => {
    if (!canDeleteContacts) {
      toast.error("Vous n'avez pas la permission de supprimer des contacts");
      return;
    }
    if (selectAllMode) {
      // En mode "tous sélectionnés", on passe un tableau vide pour indiquer qu'on veut tout supprimer
      // La mutation gérera cela en vérifiant les filtres
      bulkDeleteMutation.mutate([]);
    } else if (!selectedContacts.length) {
      toast.error("Aucun contact sélectionné");
      return;
    } else {
      bulkDeleteMutation.mutate(selectedContacts);
    }
  };

  const handleExportCSV = () => {
    if (!canExportContacts) {
      toast.error("Vous n'avez pas la permission d'exporter des contacts");
      return;
    }

    // Préparer les données pour l'export
    const csvData = filteredContacts.map(contact => ({
      email: contact.email,
      prenom: contact.prenom,
      nom: contact.nom,
      telephone: contact.telephone || "",
      fonction: contact.fonction || "",
      societe: contact.societe || "",
      site_web: contact.site_web || "",
      pays: contact.pays || "",
      ville: contact.ville || "",
      segment: contact.segment || "",
      statut: contact.statut,
    }));

    // Créer les headers CSV
    const headers = ["email", "prenom", "nom", "telephone", "fonction", "societe", "site_web", "pays", "ville", "segment", "statut"];
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Échapper les virgules et guillemets
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(",")
      )
    ].join("\n");

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${csvData.length} contact(s) exporté(s)`);
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
      {/* Widget quota contacts pour plan Free */}
      {contactQuota && contactQuota.limit !== null && (
        <Alert className={contactQuota.isBlocked ? "border-destructive" : contactQuota.isNearLimit ? "border-accent" : ""}>
          <div className="flex items-start gap-3 w-full">
            {contactQuota.isBlocked ? (
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            ) : contactQuota.isNearLimit ? (
              <AlertTriangle className="h-5 w-5 text-accent mt-0.5" />
            ) : (
              <User className="h-5 w-5 text-primary mt-0.5" />
            )}
            <div className="flex-1">
              <AlertTitle className="flex items-center justify-between">
                <span>
                  {contactQuota.isBlocked 
                    ? "Limite de contacts atteinte" 
                    : contactQuota.isNearLimit 
                    ? "Limite de contacts proche" 
                    : "Quota de contacts"}
                </span>
                {!contactQuota.isBlocked && (
                  <Link to="/pricing">
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                      Voir les plans
                    </Button>
                  </Link>
                )}
              </AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {contactQuota.used} / {contactQuota.limit} contacts utilisés
                    </span>
                    <span className="font-medium">
                      {contactQuota.remaining} restant{contactQuota.remaining !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Progress value={contactQuota.percentage} className="h-2" />
                  {contactQuota.isBlocked && (
                    <p className="text-sm text-destructive mt-2">
                      Vous avez atteint la limite de contacts du plan Free. Passez à un plan payant pour des contacts illimités.
                    </p>
                  )}
                  {contactQuota.isNearLimit && !contactQuota.isBlocked && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Vous avez utilisé {Math.round(contactQuota.percentage)}% de votre quota. Passez à un plan payant pour des contacts illimités.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{t('contacts.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('contacts.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {canExportContacts && filteredContacts.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV} className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des contacts</CardTitle>
              <CardDescription>
                {totalCount || 0} contact{(totalCount || 0) > 1 ? "s" : ""} au total
                {searchQuery && ` • ${filteredContacts.length} affiché${filteredContacts.length > 1 ? "s" : ""} sur cette page`}
                {selectAllMode && ` • ✓ Tous sélectionnés (${totalCount})`}
                {!selectAllMode && selectedContacts.length > 0 && ` • ${selectedContacts.length} sélectionné${selectedContacts.length > 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            {(selectedContacts.length > 0 || selectAllMode) && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkAssignOpen(true)}
                  className="gap-2"
                >
                  <ListPlus className="h-4 w-4" />
                  Assigner {selectAllMode ? `(${totalCount})` : `(${selectedContacts.length})`}
                </Button>
                {canDeleteContacts && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsBulkDeleteOpen(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer {selectAllMode ? `(${totalCount})` : `(${selectedContacts.length})`}
                  </Button>
                )}
              </div>
            )}
          </div>
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
                  <TableHead className="w-12">
                    <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el && 'indeterminate' in el) {
                          (el as any).indeterminate = isIndeterminate;
                        }
                      }}
                      onCheckedChange={handleSelectAll}
                        title={selectAllMode ? "Tous les contacts sélectionnés" : isAllSelectedOnPage ? "Tous les contacts de la page sélectionnés" : "Sélectionner tous"}
                      />
                      {(selectedContacts.length > 0 || selectAllMode) && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {selectAllMode ? totalCount : selectedContacts.length}
                        </span>
                      )}
                    </div>
                  </TableHead>
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
                      <TableCell>
                        <Checkbox
                          checked={selectAllMode || selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                        />
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => handleAssign(contact)}>
                              <ListPlus className="h-4 w-4 mr-2" />
                              Assigner à une liste
                            </DropdownMenuItem>
                            {canDeleteContacts && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(contact)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Barre de sélection - affichée quand des contacts sont sélectionnés */}
          {(selectedContacts.length > 0 || selectAllMode) && (
            <div className={`py-3 px-4 rounded-md border ${
              selectAllMode 
                ? "bg-primary/10 border-primary/20" 
                : "bg-muted/50 border-muted"
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={true} 
                    className="h-4 w-4"
                    disabled
                  />
                  <p className={`text-sm ${
                    selectAllMode 
                      ? "font-medium text-foreground" 
                      : "text-muted-foreground"
                  }`}>
                    {selectAllMode ? (
                      <>✓ Tous les <strong>{totalCount}</strong> contact{totalCount && totalCount > 1 ? "s" : ""} sont sélectionné{totalCount && totalCount > 1 ? "s" : ""}</>
                    ) : (
                      <>
                        <strong>{selectedContacts.length}</strong> contact{selectedContacts.length > 1 ? "s" : ""} sélectionné{selectedContacts.length > 1 ? "s" : ""}
                        {totalCount && totalCount > filteredContacts.length && (
                          <span className="ml-2 text-muted-foreground">
                            sur cette page
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectAllMode && totalCount && totalCount > filteredContacts.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllContacts}
                      className="gap-2"
                    >
                      <Checkbox checked={false} className="h-3 w-3" />
                      Sélectionner tous les {totalCount} contacts
                    </Button>
                  )}
                  <Button
                    variant={selectAllMode ? "outline" : "ghost"}
                    size="sm"
                    onClick={handleDeselectAll}
                    className="gap-2"
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {!isLoading && filteredContacts.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Première
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Dernière
                </Button>
              </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh]">
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
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Section 1: Informations essentielles */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="Jean"
                    required
                  />
                </div>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-test-contact"
                checked={formData.is_test_contact || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_test_contact: checked as boolean })
                }
              />
              <Label htmlFor="is-test-contact" className="text-sm font-normal cursor-pointer">
                Contact de test (utilisé pour les envois de test)
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Coordonnées professionnelles */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Coordonnées professionnelles</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fonction">Fonction</Label>
                  <Input
                    id="fonction"
                    value={formData.fonction}
                    onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                    placeholder="Directeur Marketing"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="societe">Société</Label>
                  <Input
                    id="societe"
                    value={formData.societe}
                    onChange={(e) => setFormData({ ...formData, societe: e.target.value })}
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_web">Site web</Label>
                  <Input
                    id="site_web"
                    type="url"
                    value={formData.site_web}
                    onChange={(e) => setFormData({ ...formData, site_web: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Localisation */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Localisation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pays">Pays</Label>
                  <Input
                    id="pays"
                    value={formData.pays}
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                    placeholder="Tunisie"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    placeholder="Tunis"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Segmentation */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Segmentation</h3>
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

      {/* Dialog assignation à une liste */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner à une liste</DialogTitle>
            <DialogDescription>
              Sélectionnez une liste pour y ajouter le contact {selectedContact?.prenom} {selectedContact?.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!lists || lists.length === 0 ? (
              <div className="text-center py-8">
                <ListPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Aucune liste disponible. Créez d'abord une liste.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => (
                  <Button
                    key={list.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => assignToListMutation.mutate({
                      contactId: selectedContact?.id,
                      listId: list.id
                    })}
                    disabled={assignToListMutation.isPending}
                  >
                    <ListPlus className="h-4 w-4 mr-2" />
                    {list.nom}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignOpen(false);
                setSelectedContact(null);
              }}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog assignation en masse à une liste */}
      <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assigner {selectAllMode ? `${totalCount} contacts` : `${selectedContacts.length} contact(s)`} à une liste
            </DialogTitle>
            <DialogDescription>
              Sélectionnez une liste pour y ajouter les contacts {selectAllMode ? "filtrés" : "sélectionnés"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!lists || lists.length === 0 ? (
              <div className="text-center py-8">
                <ListPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Aucune liste disponible. Créez d'abord une liste.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => (
                  <Button
                    key={list.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => bulkAssignToListMutation.mutate({
                      contactIds: selectedContacts,
                      listId: list.id,
                      assignAll: selectAllMode
                    })}
                    disabled={bulkAssignToListMutation.isPending}
                  >
                    <ListPlus className="h-4 w-4 mr-2" />
                    {list.nom}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkAssignOpen(false);
              }}
            >
              Annuler
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

      {/* Dialog suppression en masse */}
      <AlertDialog 
        open={isBulkDeleteOpen} 
        onOpenChange={(open) => {
          if (!bulkDeleteMutation.isPending) {
            setIsBulkDeleteOpen(open);
            if (!open) {
              setSelectedContacts([]);
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression en masse</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedContacts.length} contact{selectedContacts.length > 1 ? "s" : ""} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkDeleteMutation.isPending && (
            <div className="px-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Suppression en cours...</span>
                <span className="font-medium">{deleteProgress}%</span>
              </div>
              <Progress value={deleteProgress} className="h-2" />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setSelectedContacts([])}
              disabled={bulkDeleteMutation.isPending}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {bulkDeleteMutation.isPending 
                ? "Suppression..." 
                : `Supprimer ${selectedContacts.length} contact${selectedContacts.length > 1 ? "s" : ""}`
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog import CSV */}
      <Dialog open={isImportOpen} onOpenChange={(open) => {
        if (!isImporting) {
          setIsImportOpen(open);
          if (!open) {
            setCsvFile(null);
            setImportProgress(0);
            setAddToListEnabled(false);
            setSelectedListId("");
            setCreateNewList(false);
            setNewListName("");
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des contacts depuis CSV</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier CSV avec au minimum une colonne "email". Les autres colonnes sont optionnelles : nom, prenom, telephone, fonction, societe, site_web, pays, ville, segment.
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
                disabled={isImporting}
              />
              {csvFile && !isImporting && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Fichier sélectionné : {csvFile.name}
                </p>
              )}
            </div>

            {/* Sélection de liste */}
            <div className="space-y-2">
              <Label>{t('contacts.addToList')}</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-to-list"
                    checked={addToListEnabled}
                onCheckedChange={(checked) => {
                      setAddToListEnabled(checked === true);
                      if (!checked) {
                        // Si on décoche, réinitialiser tout
                        setSelectedListId("");
                        setCreateNewList(false);
                        setNewListName("");
                      }
                    }}
                    disabled={isImporting}
                  />
                  <Label htmlFor="add-to-list" className="cursor-pointer">
                    {t('contacts.addToListCheckbox')}
                  </Label>
                </div>

                {addToListEnabled && (
                  <div className="space-y-3 pl-6">
                    <Select
                      value={createNewList ? "new" : selectedListId}
                      onValueChange={(value) => {
                        if (value === "new") {
                          setCreateNewList(true);
                          setSelectedListId("");
                        } else {
                          setCreateNewList(false);
                          setSelectedListId(value);
                          setNewListName("");
                        }
                      }}
                      disabled={isImporting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('contacts.selectList')} />
                      </SelectTrigger>
                      <SelectContent>
                        {lists && lists.length > 0 && (
                          <>
                            {lists.map((list) => (
                              <SelectItem key={list.id} value={list.id}>
                                {list.nom}
                              </SelectItem>
                            ))}
                            <SelectItem value="new">+ {t('contacts.createNewList')}</SelectItem>
                          </>
                        )}
                        {(!lists || lists.length === 0) && (
                          <SelectItem value="new">+ {t('contacts.createNewList')}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {createNewList && (
                      <Input
                        placeholder={t('contacts.newListName')}
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        disabled={isImporting}
                        required
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Import en cours...</span>
                  <span className="font-medium">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Veuillez patienter, l'import peut prendre plusieurs minutes pour des fichiers volumineux.
                </p>
              </div>
            )}

            {!isImporting && (
              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  <strong>Format accepté :</strong> Le fichier peut utiliser des virgules (,) ou des points-virgules (;) comme séparateurs.
                </p>
                <p>
                  <strong>Colonnes requises :</strong> email (obligatoire)
                </p>
                <p>
                  <strong>Colonnes optionnelles :</strong> nom, prenom, telephone, fonction, societe, site_web, pays, ville, segment
                </p>
                <p className="text-amber-600">
                  Les lignes avec des emails invalides seront ignorées. Les champs manquants seront laissés vides.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportOpen(false);
                setCsvFile(null);
                setImportProgress(0);
                setAddToListEnabled(false);
                setSelectedListId("");
                setCreateNewList(false);
                setNewListName("");
              }}
              disabled={isImporting}
            >
              {isImporting ? "Fermer" : "Annuler"}
            </Button>
            <Button 
              onClick={processCSVImport}
              disabled={
                !csvFile || 
                isImporting || 
                (addToListEnabled && createNewList && !newListName.trim()) ||
                (addToListEnabled && !createNewList && !selectedListId)
              }
            >
              {isImporting ? "Import en cours..." : "Importer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
