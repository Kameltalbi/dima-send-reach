import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubscriptionDialog } from "./SubscriptionDialog";

export function SubscriptionsTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          organizations (
            nom
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ statut: "cancelled" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Abonnement annulé avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation");
    },
  });

  const handleEdit = (sub: any) => {
    setSelectedSub(sub);
    setDialogOpen(true);
  };

  const getPlanLabel = (plan: string) => {
    const labels: { [key: string]: string } = {
      free: "Gratuit",
      starter: "Starter",
      pro: "Pro",
      enterprise: "Enterprise",
    };
    return labels[plan] || plan;
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Abonnements</h2>
        <Button
          onClick={() => {
            setSelectedSub(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvel abonnement
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organisation</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Limite emails</TableHead>
              <TableHead>Date début</TableHead>
              <TableHead>Date fin</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions?.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">
                  {sub.organizations?.nom}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getPlanLabel(sub.plan_type)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sub.statut === "active"
                        ? "default"
                        : sub.statut === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {sub.statut === "active"
                      ? "Actif"
                      : sub.statut === "cancelled"
                      ? "Annulé"
                      : sub.statut === "expired"
                      ? "Expiré"
                      : "Essai"}
                  </Badge>
                </TableCell>
                <TableCell>{sub.email_limit.toLocaleString()}</TableCell>
                <TableCell>
                  {new Date(sub.date_debut).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  {sub.date_fin
                    ? new Date(sub.date_fin).toLocaleDateString("fr-FR")
                    : "Indéfini"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(sub)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Modifier l'abonnement</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {sub.statut === "active" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelMutation.mutate(sub.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Annuler l'abonnement</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={selectedSub}
      />
    </>
  );
}
