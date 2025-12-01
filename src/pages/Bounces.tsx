import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
import { format } from "date-fns";

interface Bounce {
  id: string;
  email: string;
  bounce_type: string;
  bounce_reason: string;
  bounce_code: string | null;
  bounce_message: string | null;
  source: string;
  is_processed: boolean;
  action_taken: string | null;
  created_at: string;
  contact_id: string | null;
  contacts?: {
    nom: string;
    prenom: string;
    email: string;
  };
}

interface BounceStats {
  total: number;
  hard: number;
  soft: number;
  complaints: number;
}

// Type helper for supabase client with custom tables
type SupabaseAny = ReturnType<typeof supabase.from> extends infer T ? T : never;

const Bounces = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [bounceTypeFilter, setBounceTypeFilter] = useState<string>("all");
  const [processedFilter, setProcessedFilter] = useState<string>("all");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBounce, setSelectedBounce] = useState<Bounce | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ["bounce-stats", user?.id],
    queryFn: async (): Promise<BounceStats> => {
      // Cast to any to call custom RPC function
      const client = supabase as unknown as {
        rpc: (fn: string, params: { p_user_id: string }) => Promise<{ data: unknown; error: unknown }>;
      };
      
      const { data, error } = await client.rpc("get_bounce_stats", { p_user_id: user?.id || "" });
      
      if (error) {
        console.error("Error fetching bounce stats:", error);
        return { total: 0, hard: 0, soft: 0, complaints: 0 };
      }
      
      return (data as BounceStats) || { total: 0, hard: 0, soft: 0, complaints: 0 };
    },
    enabled: !!user,
  });

  // Récupérer les bounces
  const { data: bouncesData, isLoading } = useQuery({
    queryKey: ["bounces", user?.id, bounceTypeFilter, processedFilter, currentPage],
    queryFn: async () => {
      // Cast to any for custom table
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (q: string, opts?: { count: string; head: boolean }) => {
            eq: (col: string, val: unknown) => {
              eq?: (col: string, val: unknown) => unknown;
              order: (col: string, opts: { ascending: boolean }) => {
                range: (start: number, end: number) => Promise<{ data: unknown[]; error: unknown }>;
              };
            };
          };
        };
      };
      
      // Build main query
      let baseQuery = client.from("bounces").select("*, contacts (nom, prenom, email)");
      let filteredQuery = baseQuery.eq("user_id", user?.id);
      
      if (bounceTypeFilter !== "all") {
        filteredQuery = (filteredQuery as unknown as { eq: (col: string, val: unknown) => typeof filteredQuery }).eq("bounce_type", bounceTypeFilter);
      }

      if (processedFilter === "processed") {
        filteredQuery = (filteredQuery as unknown as { eq: (col: string, val: unknown) => typeof filteredQuery }).eq("is_processed", true);
      } else if (processedFilter === "unprocessed") {
        filteredQuery = (filteredQuery as unknown as { eq: (col: string, val: unknown) => typeof filteredQuery }).eq("is_processed", false);
      }

      const { data, error } = await (filteredQuery as unknown as { order: (col: string, opts: { ascending: boolean }) => { range: (start: number, end: number) => Promise<{ data: unknown[]; error: unknown }> } })
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      // Count total - simplified approach
      const countResult = await client.from("bounces").select("*", { count: "exact", head: true }).eq("user_id", user?.id);

      return {
        bounces: (data || []) as Bounce[],
        totalCount: (countResult as unknown as { count?: number })?.count || 0,
      };
    },
    enabled: !!user,
  });

  // Supprimer un bounce
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = supabase as unknown as {
        from: (table: string) => {
          delete: () => {
            eq: (col: string, val: string) => Promise<{ error: unknown }>;
          };
        };
      };
      const { error } = await client.from("bounces").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounces"] });
      queryClient.invalidateQueries({ queryKey: ["bounce-stats"] });
      toast.success(t("bounces.deleteSuccess") || "Bounce supprimé");
      setIsDeleteOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("bounces.deleteError") || "Erreur lors de la suppression");
    },
  });

  // Marquer comme traité
  const processMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = supabase as unknown as {
        from: (table: string) => {
          update: (data: unknown) => {
            eq: (col: string, val: string) => Promise<{ error: unknown }>;
          };
        };
      };
      const { error } = await client.from("bounces")
        .update({
          is_processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounces"] });
      queryClient.invalidateQueries({ queryKey: ["bounce-stats"] });
      toast.success(t("bounces.processSuccess") || "Bounce marqué comme traité");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("bounces.processError") || "Erreur");
    },
  });

  const filteredBounces = bouncesData?.bounces.filter((bounce) =>
    bounce.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bounce.bounce_reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBounceTypeBadge = (type: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary"> = {
      hard: "destructive",
      soft: "default",
      complaint: "destructive",
      unknown: "secondary",
    };
    return variants[type] || "secondary";
  };

  const getBounceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hard: t("bounces.type.hard") || "Hard bounce",
      soft: t("bounces.type.soft") || "Soft bounce",
      complaint: t("bounces.type.complaint") || "Plainte spam",
      unknown: t("bounces.type.unknown") || "Inconnu",
    };
    return labels[type] || type;
  };

  const totalPages = Math.ceil((bouncesData?.totalCount || 0) / itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("bounces.title") || "Gestion des Bounces"}
          </h1>
          <p className="text-muted-foreground">
            {t("bounces.subtitle") || "Gérez les bounces et plaintes spam de vos emails"}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("bounces.stats.total") || "Total bounces"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("bounces.stats.hard") || "Hard bounces"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.hard || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("bounces.stats.soft") || "Soft bounces"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.soft || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t("bounces.stats.complaints") || "Plaintes spam"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.complaints || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("bounces.searchPlaceholder") || "Rechercher par email ou raison..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={bounceTypeFilter} onValueChange={setBounceTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("bounces.filter.type") || "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("bounces.filter.all") || "Tous"}</SelectItem>
                <SelectItem value="hard">{t("bounces.type.hard") || "Hard bounce"}</SelectItem>
                <SelectItem value="soft">{t("bounces.type.soft") || "Soft bounce"}</SelectItem>
                <SelectItem value="complaint">
                  {t("bounces.type.complaint") || "Plainte spam"}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={processedFilter} onValueChange={setProcessedFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("bounces.filter.status") || "Statut"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("bounces.filter.all") || "Tous"}</SelectItem>
                <SelectItem value="processed">
                  {t("bounces.filter.processed") || "Traités"}
                </SelectItem>
                <SelectItem value="unprocessed">
                  {t("bounces.filter.unprocessed") || "Non traités"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des bounces */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("common.loading") || "Chargement..."}</p>
        </div>
      ) : filteredBounces && filteredBounces.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("bounces.table.email") || "Email"}</TableHead>
                    <TableHead>{t("bounces.table.type") || "Type"}</TableHead>
                    <TableHead>{t("bounces.table.reason") || "Raison"}</TableHead>
                    <TableHead>{t("bounces.table.date") || "Date"}</TableHead>
                    <TableHead>{t("bounces.table.status") || "Statut"}</TableHead>
                    <TableHead className="text-right">
                      {t("bounces.table.actions") || "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBounces.map((bounce) => (
                    <TableRow key={bounce.id}>
                      <TableCell className="font-medium">
                        {bounce.contacts?.email || bounce.email}
                        {bounce.contacts && (
                          <div className="text-xs text-muted-foreground">
                            {bounce.contacts.prenom} {bounce.contacts.nom}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBounceTypeBadge(bounce.bounce_type)}>
                          {getBounceTypeLabel(bounce.bounce_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {bounce.bounce_reason || bounce.bounce_message || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(bounce.created_at), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bounce.is_processed ? "default" : "secondary"}>
                          {bounce.is_processed
                            ? t("bounces.processed") || "Traité"
                            : t("bounces.unprocessed") || "Non traité"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!bounce.is_processed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => processMutation.mutate(bounce.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBounce(bounce);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} ({bouncesData?.totalCount || 0} bounces)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t("common.previous") || "Précédent"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t("common.next") || "Suivant"}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {t("bounces.noBounces") || "Aucun bounce trouvé"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bounces.confirmDelete") || "Supprimer ce bounce ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("bounces.deleteWarning") ||
                "Cette action est irréversible. Le bounce sera supprimé définitivement."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Annuler"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBounce && deleteMutation.mutate(selectedBounce.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete") || "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Bounces;
