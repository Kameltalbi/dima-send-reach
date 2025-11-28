import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp, TrendingDown, Mail, MousePointer, UserX, Eye } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];

const Statistiques = () => {
  // Récupérer les statistiques globales
  const { data: globalStats, isLoading: isLoadingGlobal } = useQuery({
    queryKey: ["global-stats"],
    queryFn: async () => {
      const { data: recipients, error } = await supabase
        .from("campaign_recipients")
        .select("statut_envoi, ouvert, clique, desabonne");

      if (error) throw error;

      const totalEnvoyes = recipients?.filter(r => r.statut_envoi === "envoye").length || 0;
      const totalOuverts = recipients?.filter(r => r.ouvert).length || 0;
      const totalCliques = recipients?.filter(r => r.clique).length || 0;
      const totalDesabonnes = recipients?.filter(r => r.desabonne).length || 0;

      return {
        totalEnvoyes,
        totalOuverts,
        totalCliques,
        totalDesabonnes,
        tauxOuverture: totalEnvoyes > 0 ? (totalOuverts / totalEnvoyes) * 100 : 0,
        tauxClic: totalEnvoyes > 0 ? (totalCliques / totalEnvoyes) * 100 : 0,
        tauxDesabonnement: totalEnvoyes > 0 ? (totalDesabonnes / totalEnvoyes) * 100 : 0,
      };
    },
  });

  // Récupérer les données par jour (7 derniers jours)
  const { data: dailyStats, isLoading: isLoadingDaily } = useQuery({
    queryKey: ["daily-stats"],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
      
      const dailyData = await Promise.all(
        days.map(async (day) => {
          const start = startOfDay(day).toISOString();
          const end = endOfDay(day).toISOString();

          const { data: recipients } = await supabase
            .from("campaign_recipients")
            .select("ouvert, clique, date_envoi")
            .gte("date_envoi", start)
            .lte("date_envoi", end)
            .eq("statut_envoi", "envoye");

          const ouvertures = recipients?.filter(r => r.ouvert).length || 0;
          const clics = recipients?.filter(r => r.clique).length || 0;

          return {
            name: format(day, "EEE", { locale: fr }),
            date: format(day, "dd/MM"),
            ouvertures,
            clics,
            total: recipients?.length || 0,
          };
        })
      );

      return dailyData;
    },
  });

  // Récupérer les performances par campagne
  const { data: campaignStats, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ["campaign-stats"],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select(`
          id,
          nom_campagne,
          date_envoi,
          statut,
          campaign_recipients(statut_envoi, ouvert, clique)
        `)
        .eq("statut", "envoye")
        .order("date_envoi", { ascending: false })
        .limit(10);

      if (error) throw error;

      return campaigns?.map((campaign) => {
        const recipients = campaign.campaign_recipients || [];
        const totalEnvoyes = recipients.filter((r: any) => r.statut_envoi === "envoye").length;
        const totalOuverts = recipients.filter((r: any) => r.ouvert).length;
        const totalCliques = recipients.filter((r: any) => r.clique).length;

        return {
          nom: campaign.nom_campagne,
          date: campaign.date_envoi ? format(new Date(campaign.date_envoi), "dd/MM/yyyy") : "-",
          envoyes: totalEnvoyes,
          ouvertures: totalOuverts,
          clics: totalCliques,
          tauxOuverture: totalEnvoyes > 0 ? (totalOuverts / totalEnvoyes) * 100 : 0,
          tauxClic: totalEnvoyes > 0 ? (totalCliques / totalEnvoyes) * 100 : 0,
        };
      }) || [];
    },
  });

  // Données pour le graphique en camembert
  const engagementData = globalStats ? [
    { name: "Ouverts", value: globalStats.totalOuverts },
    { name: "Cliqués", value: globalStats.totalCliques },
    { name: "Non ouverts", value: globalStats.totalEnvoyes - globalStats.totalOuverts },
  ] : [];

  if (isLoadingGlobal || isLoadingDaily || isLoadingCampaigns) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Statistiques</h1>
        <p className="text-muted-foreground mt-1">
          Analysez les performances de vos campagnes d'emailing
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="campaigns">Par campagne</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total envoyés
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {globalStats?.totalEnvoyes.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Emails livrés avec succès
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taux d'ouverture
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {globalStats?.tauxOuverture.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {globalStats && globalStats.tauxOuverture > 20 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">Bon taux</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-orange-500" />
                      <span className="text-orange-500">À améliorer</span>
                    </>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taux de clic
                </CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {globalStats?.tauxClic.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {globalStats && globalStats.tauxClic > 2.5 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">Excellent</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-orange-500" />
                      <span className="text-orange-500">Moyen</span>
                    </>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Désabonnements
                </CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {globalStats?.tauxDesabonnement.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {globalStats?.totalDesabonnes} contacts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique évolution */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution sur 7 jours</CardTitle>
              <CardDescription>
                Ouvertures et clics quotidiens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-sm"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ouvertures" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Ouvertures"
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clics" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Clics"
                    dot={{ fill: "hsl(var(--accent))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance par campagne</CardTitle>
              <CardDescription>
                Les 10 dernières campagnes envoyées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignStats && campaignStats.length > 0 ? (
                  campaignStats.map((campaign, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{campaign.nom}</h3>
                        <p className="text-sm text-muted-foreground">{campaign.date}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <p className="text-2xl font-bold text-foreground">{campaign.envoyes}</p>
                          <p className="text-xs text-muted-foreground">Envoyés</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-primary">{campaign.ouvertures}</p>
                          <p className="text-xs text-muted-foreground">Ouverts</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-accent">{campaign.clics}</p>
                          <p className="text-xs text-muted-foreground">Clics</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{campaign.tauxOuverture.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Taux</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune campagne envoyée pour le moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition de l'engagement</CardTitle>
                <CardDescription>
                  Distribution des interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparaison hebdomadaire</CardTitle>
                <CardDescription>
                  Ouvertures vs Clics par jour
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-sm"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      className="text-sm"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="ouvertures" fill="hsl(var(--primary))" name="Ouvertures" />
                    <Bar dataKey="clics" fill="hsl(var(--accent))" name="Clics" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistiques;
