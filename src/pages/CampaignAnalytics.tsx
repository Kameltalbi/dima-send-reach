import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { ArrowLeft, Download, FileText, FileSpreadsheet, TrendingUp, TrendingDown, Mail, MousePointer, Eye, UserX, Clock } from "lucide-react";
import { format, parseISO, subHours, startOfHour, endOfHour } from "date-fns";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#FF6B6B", "#4ECDC4"];

const CampaignAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("all");

  // Récupérer les détails de la campagne
  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          campaign_stats (*),
          lists (nom)
        `)
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Récupérer les statistiques détaillées des destinataires
  const { data: recipientsData, isLoading: isLoadingRecipients } = useQuery({
    queryKey: ["campaign-recipients", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_recipients")
        .select(`
          *,
          contacts (nom, prenom, email, pays, ville)
        `)
        .eq("campaign_id", id)
        .order("date_envoi", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Calculer les statistiques agrégées
  const stats = recipientsData
    ? {
        total: recipientsData.length,
        sent: recipientsData.filter((r: any) => r.statut_envoi === "envoye").length,
        opened: recipientsData.filter((r: any) => r.ouvert).length,
        clicked: recipientsData.filter((r: any) => r.clique).length,
        unsubscribed: recipientsData.filter((r: any) => r.desabonne).length,
        openRate: 0,
        clickRate: 0,
        unsubscribeRate: 0,
        clickToOpenRate: 0,
      }
    : null;

  if (stats) {
    stats.openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
    stats.clickRate = stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0;
    stats.unsubscribeRate = stats.sent > 0 ? (stats.unsubscribed / stats.sent) * 100 : 0;
    stats.clickToOpenRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;
  }

  // Données pour graphiques temporels (par heure)
  const hourlyData = recipientsData
    ? (() => {
        const hours: Record<string, { sent: number; opened: number; clicked: number }> = {};

        recipientsData.forEach((recipient: any) => {
          if (recipient.date_envoi) {
            const hour = format(parseISO(recipient.date_envoi), "HH:mm");
            if (!hours[hour]) {
              hours[hour] = { sent: 0, opened: 0, clicked: 0 };
            }
            hours[hour].sent++;
            if (recipient.ouvert) hours[hour].opened++;
            if (recipient.clique) hours[hour].clicked++;
          }
        });

        return Object.entries(hours)
          .map(([hour, data]) => ({
            hour,
            ...data,
          }))
          .sort((a, b) => a.hour.localeCompare(b.hour));
      })()
    : [];

  // Données pour graphique géographique
  const geographicData = recipientsData
    ? (() => {
        const countries: Record<string, { sent: number; opened: number; clicked: number }> = {};

        recipientsData.forEach((recipient: any) => {
          const country = recipient.contacts?.pays || "Non spécifié";
          if (!countries[country]) {
            countries[country] = { sent: 0, opened: 0, clicked: 0 };
          }
          countries[country].sent++;
          if (recipient.ouvert) countries[country].opened++;
          if (recipient.clique) countries[country].clicked++;
        });

        return Object.entries(countries)
          .map(([country, data]) => ({
            country,
            ...data,
            openRate: data.sent > 0 ? (data.opened / data.sent) * 100 : 0,
          }))
          .sort((a, b) => b.sent - a.sent)
          .slice(0, 10);
      })()
    : [];

  // Données pour graphique d'engagement
  const engagementData = stats
    ? [
        { name: t("analytics.engaged") || "Engagés", value: stats.clicked },
        { name: t("analytics.opened") || "Ouverts", value: stats.opened - stats.clicked },
        { name: t("analytics.notOpened") || "Non ouverts", value: stats.sent - stats.opened },
      ]
    : [];

  // Export Excel
  const exportToExcel = () => {
    if (!recipientsData) return;

    const headers = [
      t("analytics.export.email") || "Email",
      t("analytics.export.name") || "Nom",
      t("analytics.export.sent") || "Envoyé",
      t("analytics.export.opened") || "Ouvert",
      t("analytics.export.clicked") || "Cliqué",
      t("analytics.export.unsubscribed") || "Désabonné",
      t("analytics.export.country") || "Pays",
      t("analytics.export.city") || "Ville",
    ];

    const rows = recipientsData.map((r: any) => [
      r.contacts?.email || "",
      `${r.contacts?.prenom || ""} ${r.contacts?.nom || ""}`.trim(),
      r.statut_envoi === "envoye" ? t("analytics.export.yes") || "Oui" : t("analytics.export.no") || "Non",
      r.ouvert ? t("analytics.export.yes") || "Oui" : t("analytics.export.no") || "Non",
      r.clique ? t("analytics.export.yes") || "Oui" : t("analytics.export.no") || "Non",
      r.desabonne ? t("analytics.export.yes") || "Oui" : t("analytics.export.no") || "Non",
      r.contacts?.pays || "",
      r.contacts?.ville || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `campaign-${id}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t("analytics.export.success") || "Export réussi");
  };

  // Export PDF (simplifié - génère un rapport HTML)
  const exportToPDF = () => {
    if (!campaign || !stats) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport Campagne - ${campaign.nom_campagne}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Rapport de Campagne</h1>
          <h2>${campaign.nom_campagne}</h2>
          <p><strong>Date d'envoi:</strong> ${campaign.date_envoi ? format(parseISO(campaign.date_envoi), "dd/MM/yyyy HH:mm") : "N/A"}</p>
          <p><strong>Sujet:</strong> ${campaign.sujet_email}</p>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${stats.sent}</div>
              <div>Emails envoyés</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.opened}</div>
              <div>Ouvertures</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.clicked}</div>
              <div>Clics</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.openRate.toFixed(1)}%</div>
              <div>Taux d'ouverture</div>
            </div>
          </div>
          
          <h3>Détails des destinataires</h3>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nom</th>
                <th>Ouvert</th>
                <th>Cliqué</th>
                <th>Pays</th>
              </tr>
            </thead>
            <tbody>
              ${recipientsData
                ?.slice(0, 100)
                .map(
                  (r: any) => `
                <tr>
                  <td>${r.contacts?.email || ""}</td>
                  <td>${r.contacts?.prenom || ""} ${r.contacts?.nom || ""}</td>
                  <td>${r.ouvert ? "Oui" : "Non"}</td>
                  <td>${r.clique ? "Oui" : "Non"}</td>
                  <td>${r.contacts?.pays || ""}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm")}
          </p>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-${id}-report-${format(new Date(), "yyyy-MM-dd")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(t("analytics.export.pdfSuccess") || "Rapport généré");
  };

  if (isLoadingCampaign || isLoadingRecipients) {
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

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("analytics.notFound") || "Campagne non trouvée"}</p>
        <Button onClick={() => navigate("/campagnes")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("analytics.backToCampaigns") || "Retour aux campagnes"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/campagnes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{campaign.nom_campagne}</h1>
            <p className="text-muted-foreground mt-1">
              {campaign.date_envoi
                ? format(parseISO(campaign.date_envoi), "dd MMMM yyyy à HH:mm")
                : t("analytics.notSent") || "Non envoyée"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t("analytics.export.excel") || "Excel"}
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            {t("analytics.export.pdf") || "PDF"}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analytics.kpi.sent") || "Envoyés"}
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats?.sent || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analytics.kpi.total") || "Total"} {stats?.total || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analytics.kpi.openRate") || "Taux d'ouverture"}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.openRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {stats && stats.openRate > 20 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{t("analytics.good") || "Bon"}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-orange-500" />
                  <span className="text-orange-500">{t("analytics.toImprove") || "À améliorer"}</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analytics.kpi.clickRate") || "Taux de clic"}
            </CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.clickRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.clicked || 0} {t("analytics.kpi.clicks") || "clics"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analytics.kpi.unsubscribeRate") || "Désabonnements"}
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.unsubscribeRate.toFixed(2) || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.unsubscribed || 0} {t("analytics.kpi.unsubscribed") || "contacts"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t("analytics.tabs.overview") || "Vue d'ensemble"}</TabsTrigger>
          <TabsTrigger value="timeline">{t("analytics.tabs.timeline") || "Timeline"}</TabsTrigger>
          <TabsTrigger value="geography">{t("analytics.tabs.geography") || "Géographie"}</TabsTrigger>
          <TabsTrigger value="engagement">{t("analytics.tabs.engagement") || "Engagement"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Graphique d'évolution temporelle */}
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.charts.timeline") || "Évolution temporelle"}</CardTitle>
              <CardDescription>
                {t("analytics.charts.timelineDesc") || "Ouvertures et clics par heure"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hour"
                    className="text-sm"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis className="text-sm" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    name={t("analytics.charts.sent") || "Envoyés"}
                  />
                  <Area
                    type="monotone"
                    dataKey="opened"
                    stackId="2"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.6}
                    name={t("analytics.charts.opened") || "Ouverts"}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicked"
                    stackId="3"
                    stroke="#FF6B6B"
                    fill="#FF6B6B"
                    fillOpacity={0.6}
                    name={t("analytics.charts.clicked") || "Clics"}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Graphique de répartition */}
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.charts.distribution") || "Répartition de l'engagement"}</CardTitle>
              <CardDescription>
                {t("analytics.charts.distributionDesc") || "Distribution des interactions"}
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
                    outerRadius={100}
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
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.charts.hourly") || "Performance par heure"}</CardTitle>
              <CardDescription>
                {t("analytics.charts.hourlyDesc") || "Détail des ouvertures et clics"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hour"
                    className="text-sm"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis className="text-sm" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sent" fill="hsl(var(--primary))" name={t("analytics.charts.sent") || "Envoyés"} />
                  <Bar dataKey="opened" fill="hsl(var(--accent))" name={t("analytics.charts.opened") || "Ouverts"} />
                  <Bar dataKey="clicked" fill="#FF6B6B" name={t("analytics.charts.clicked") || "Clics"} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.charts.geography") || "Performance par pays"}</CardTitle>
              <CardDescription>
                {t("analytics.charts.geographyDesc") || "Top 10 des pays par nombre d'envois"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geographicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-sm" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    dataKey="country"
                    type="category"
                    className="text-sm"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sent" fill="hsl(var(--primary))" name={t("analytics.charts.sent") || "Envoyés"} />
                  <Bar dataKey="opened" fill="hsl(var(--accent))" name={t("analytics.charts.opened") || "Ouverts"} />
                  <Bar dataKey="clicked" fill="#FF6B6B" name={t("analytics.charts.clicked") || "Clics"} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.charts.engagement") || "Taux d'engagement"}</CardTitle>
                <CardDescription>
                  {t("analytics.charts.engagementDesc") || "Répartition des interactions"}
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
                      outerRadius={100}
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
                <CardTitle>{t("analytics.charts.metrics") || "Métriques clés"}</CardTitle>
                <CardDescription>
                  {t("analytics.charts.metricsDesc") || "Indicateurs de performance"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("analytics.metrics.openRate") || "Taux d'ouverture"}
                  </span>
                  <span className="text-lg font-bold">{stats?.openRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("analytics.metrics.clickRate") || "Taux de clic"}
                  </span>
                  <span className="text-lg font-bold">{stats?.clickRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("analytics.metrics.clickToOpen") || "Taux de clic/ouverture"}
                  </span>
                  <span className="text-lg font-bold">{stats?.clickToOpenRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("analytics.metrics.unsubscribeRate") || "Taux de désabonnement"}
                  </span>
                  <span className="text-lg font-bold">{stats?.unsubscribeRate.toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignAnalytics;

