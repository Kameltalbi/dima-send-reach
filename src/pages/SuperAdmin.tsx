import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, TrendingUp, DollarSign } from "lucide-react";
import { OrganizationsTable } from "@/components/superadmin/OrganizationsTable";
import { SubscriptionsTable } from "@/components/superadmin/SubscriptionsTable";
import { UsersTable } from "@/components/superadmin/UsersTable";
import { StatsCards } from "@/components/superadmin/StatsCards";

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState("overview");

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => {
      const [orgsResult, subsResult, usersResult, profilesResult] = await Promise.all([
        supabase.from("organizations").select("*", { count: "exact" }),
        supabase.from("subscriptions").select("*"),
        supabase.from("user_roles").select("*", { count: "exact" }),
        supabase.from("profiles").select("*", { count: "exact" }),
      ]);

      const activeOrgs = orgsResult.data?.filter((org) => org.statut === "active").length || 0;
      const blockedOrgs = orgsResult.data?.filter((org) => org.statut === "blocked").length || 0;
      const activeSubs = subsResult.data?.filter((sub) => sub.statut === "active").length || 0;
      const totalRevenue = subsResult.data?.reduce((acc, sub) => {
        const planPrices: { [key: string]: number } = {
          free: 0,
          starter: 29,
          pro: 99,
          enterprise: 299,
        };
        return acc + (planPrices[sub.plan_type] || 0);
      }, 0);

      return {
        totalOrgs: orgsResult.count || 0,
        activeOrgs,
        blockedOrgs,
        totalUsers: profilesResult.count || 0,
        activeSubs,
        totalRevenue,
      };
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord Super Admin</h1>
        <p className="text-muted-foreground">
          Gérez les organisations, utilisateurs et abonnements de la plateforme
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="organizations">Organisations</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatsCards stats={stats} />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>Dernières actions sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Aucune activité récente pour le moment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes système</CardTitle>
                <CardDescription>Notifications importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Aucune alerte pour le moment
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <OrganizationsTable />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionsTable />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
