import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UsersTable() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (
            role
          ),
          organizations (
            nom
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Utilisateurs</h2>
        <p className="text-muted-foreground">Liste de tous les utilisateurs de la plateforme</p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Date inscription</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nom}</TableCell>
                <TableCell>{user.prenom}</TableCell>
                <TableCell>{user.nom_entreprise}</TableCell>
                <TableCell>{user.organizations?.nom || "-"}</TableCell>
                <TableCell>
                  {user.user_roles && Array.isArray(user.user_roles) && user.user_roles.length > 0 ? (
                    <Badge
                      variant={
                        (user.user_roles[0] as any).role === "superadmin"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {(user.user_roles[0] as any).role === "superadmin"
                        ? "Super Admin"
                        : "Utilisateur"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Utilisateur</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
