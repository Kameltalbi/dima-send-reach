import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: any;
}

export function SubscriptionDialog({
  open,
  onOpenChange,
  subscription,
}: SubscriptionDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: subscription || {
      organization_id: "",
      plan_type: "free",
      statut: "active",
      email_limit: 3000,
      date_fin: "",
      notes: "",
    },
  });

  const planType = watch("plan_type");
  const statut = watch("statut");
  const organizationId = watch("organization_id");

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, nom")
        .eq("statut", "active")
        .order("nom");

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (subscription) {
      Object.keys(subscription).forEach((key) => {
        setValue(key as any, subscription[key]);
      });
    }
  }, [subscription, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        date_fin: data.date_fin || null,
      };

      if (subscription) {
        const { error } = await supabase
          .from("subscriptions")
          .update(payload)
          .eq("id", subscription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success(
        subscription
          ? "Abonnement mis à jour avec succès"
          : "Abonnement créé avec succès"
      );
      reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {subscription ? "Modifier l'abonnement" : "Nouvel abonnement"}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations de l'abonnement
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization_id">Organisation</Label>
            <Select
              value={organizationId}
              onValueChange={(value) => setValue("organization_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une organisation" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_type">Type de plan</Label>
            <Select
              value={planType}
              onValueChange={(value) => setValue("plan_type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuit (3 000 emails/mois)</SelectItem>
                <SelectItem value="starter">Starter (10 000 emails/mois)</SelectItem>
                <SelectItem value="essential">Essential (50 000 emails/mois)</SelectItem>
                <SelectItem value="pro">Pro (200 000 emails/mois)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statut">Statut</Label>
            <Select
              value={statut}
              onValueChange={(value) => setValue("statut", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="trial">Essai</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_limit">Limite d'emails</Label>
            <Input
              id="email_limit"
              type="number"
              {...register("email_limit", { valueAsNumber: true })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_fin">Date de fin (optionnelle)</Label>
            <Input
              id="date_fin"
              type="date"
              {...register("date_fin")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {subscription ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
