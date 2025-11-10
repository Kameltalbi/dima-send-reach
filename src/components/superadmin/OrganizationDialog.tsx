import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface OrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: any;
}

export function OrganizationDialog({
  open,
  onOpenChange,
  organization,
}: OrganizationDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: organization || {
      nom: "",
      email_contact: "",
      statut: "active",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (organization) {
        const { error } = await supabase
          .from("organizations")
          .update(data)
          .eq("id", organization.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("organizations").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success(
        organization
          ? "Organisation mise à jour avec succès"
          : "Organisation créée avec succès"
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
            {organization ? "Modifier l'organisation" : "Nouvelle organisation"}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations de l'organisation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom de l'organisation</Label>
            <Input id="nom" {...register("nom")} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_contact">Email de contact</Label>
            <Input
              id="email_contact"
              type="email"
              {...register("email_contact")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statut">Statut</Label>
            <Select
              defaultValue={organization?.statut || "active"}
              onValueChange={(value) => setValue("statut", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Bloquée</SelectItem>
                <SelectItem value="suspended">Suspendue</SelectItem>
              </SelectContent>
            </Select>
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
              {organization ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
