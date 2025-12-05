import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Mail, 
  TrendingUp, 
  MousePointer, 
  Plus, 
  Info,
  Settings,
  ExternalLink,
  Filter,
  Inbox,
  AlertTriangle,
  AlertCircle,
  Folder,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Users,
  BarChart3,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { EmailQuotaWidget } from "@/components/dashboard/EmailQuotaWidget";
import { useEmailQuota } from "@/hooks/useEmailQuota";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CampaignStat {
  campaign_id: string;
  nom_campagne: string;
  date_envoi: string;
  total_envoyes: number;
  total_ouverts: number;
  total_cliques: number;
}

interface DailyProgress {
  date: string;
  sent: number;
  inbox: number;
  spam: number;
  success: number;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quota, isLoading: quotaLoading } = useEmailQuota();
  const [timePeriod, setTimePeriod] = useState("week");
  const [stats, setStats] = useState({
    totalEnvoyes: 0,
    tauxOuverture: 0,
    tauxClic: 0,
    inboxRate: 100,
    spamRate: 0,
    categoryRate: 0,
  });
  const [reputationScore, setReputationScore] = useState(91);
  const [providerScores, setProviderScores] = useState({
    google: 100,
    outlook: 98,
    other: 76,
  });
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<CampaignStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(user?.email || "votre@email.com");
  const [status, setStatus] = useState("Running");

  useEffect(() => {
    // Ne charger les données que si l'utilisateur a un abonnement
    // La vérification d'abonnement est gérée par SubscriptionProtectedRoute
    if (quota && !quotaLoading) {
      loadDashboardData();
    }
  }, [user, timePeriod, quota, quotaLoading]);

  const loadDashboardData = async () => {
    try {
      // Load recent campaigns with their stats
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select(`
          id,
          nom_campagne,
          date_envoi,
          expediteur_email,
          campaign_stats (
            total_envoyes,
            total_ouverts,
            total_cliques
          )
        `)
        .eq("user_id", user?.id)
        .eq("statut", "envoye")
        .order("date_envoi", { ascending: false })
        .limit(10);

      if (campaignsError) throw campaignsError;

      // Calculate global statistics
      let totalEnvoyes = 0;
      let totalOuverts = 0;
      let totalCliques = 0;

      const formattedCampaigns: CampaignStat[] = (campaigns || []).map((campaign: any) => {
        const stats = campaign.campaign_stats?.[0] || {
          total_envoyes: 0,
          total_ouverts: 0,
          total_cliques: 0,
        };
        
        totalEnvoyes += stats.total_envoyes;
        totalOuverts += stats.total_ouverts;
        totalCliques += stats.total_cliques;

        return {
          campaign_id: campaign.id,
          nom_campagne: campaign.nom_campagne,
          date_envoi: campaign.date_envoi,
          total_envoyes: stats.total_envoyes,
          total_ouverts: stats.total_ouverts,
          total_cliques: stats.total_cliques,
        };
      });

      // Calculate rates
      const tauxOuverture = totalEnvoyes > 0 ? (totalOuverts / totalEnvoyes) * 100 : 0;
      const tauxClic = totalEnvoyes > 0 ? (totalCliques / totalEnvoyes) * 100 : 0;
      
      // Simulate deliverability stats (in real app, these would come from SES/webhooks)
      const inboxRate = totalEnvoyes > 0 ? Math.min(100, 100 - (totalEnvoyes * 0.01)) : 100;
      const spamRate = totalEnvoyes > 0 ? Math.max(0, totalEnvoyes * 0.001) : 0;
      const categoryRate = 0; // Would come from actual tracking

      setRecentCampaigns(formattedCampaigns);
      setStats({
        totalEnvoyes,
        tauxOuverture,
        tauxClic,
        inboxRate,
        spamRate,
        categoryRate,
      });

      // Generate daily progress data
      generateDailyProgress(totalEnvoyes, inboxRate);

      // Set sender email from most recent campaign
      if (campaigns && campaigns.length > 0 && campaigns[0].expediteur_email) {
        setSelectedEmail(campaigns[0].expediteur_email);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyProgress = (totalSent: number, inboxRate: number) => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate daily data
      const sent = i < 2 ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 10);
      const inbox = Math.floor(sent * (inboxRate / 100));
      const spam = Math.floor(sent * 0.01);
      const success = Math.floor((inbox / sent) * 100);
      
      days.push({
        date: date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
        sent,
        inbox,
        spam,
        success,
      });
    }
    
    setDailyProgress(days);
  };

  const getMaxValue = () => {
    return Math.max(...dailyProgress.map(d => d.sent), 24);
  };

  // Afficher un loader pendant la vérification de l'abonnement
  if (quotaLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t('common.loading', { defaultValue: 'Chargement...' })}</p>
        </div>
      </div>
    );
  }

  // Si pas d'abonnement, ne rien afficher (redirection en cours)
  if (!quota) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header amélioré avec actions rapides */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">
              Vue d'ensemble de vos performances email
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate("/campagnes/nouvelle")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle campagne</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.settings')}</span>
            </Button>
          </div>
        </div>
        
        {/* Barre d'informations rapides */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-foreground">{selectedEmail}</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-background border">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-medium cursor-pointer"
            >
              <option value="Running">{t('dashboard.running')}</option>
              <option value="Paused">{t('dashboard.paused')}</option>
              <option value="Stopped">{t('dashboard.stopped')}</option>
            </select>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border"></div>
          <a 
            href="#" 
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {t('dashboard.warmupFilter')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Sélecteur de période */}
      <Tabs value={timePeriod} onValueChange={setTimePeriod} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="week" className="text-xs sm:text-sm">{t('dashboard.week')}</TabsTrigger>
          <TabsTrigger value="two-weeks" className="text-xs sm:text-sm">{t('dashboard.twoWeeks')}</TabsTrigger>
          <TabsTrigger value="month" className="text-xs sm:text-sm">{t('dashboard.month')}</TabsTrigger>
          <TabsTrigger value="quarter" className="text-xs sm:text-sm">{t('dashboard.quarter')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPIs - 4 cartes améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Emails envoyés */}
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.emailSent')}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalEnvoyes.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">+12%</span>
              <span>vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Taux d'ouverture */}
        <Card className="relative overflow-hidden border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.openRate')}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Eye className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.tauxOuverture.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">+2.3%</span>
              <span>vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Taux de clic */}
        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.clickRate')}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <MousePointer className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.tauxClic.toFixed(2)}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">+0.5%</span>
              <span>vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Délivrabilité */}
        <Card className="relative overflow-hidden border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.inbox')}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Inbox className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.inboxRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>{t('dashboard.deliverabilityRate')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget de quota d'emails */}
      <EmailQuotaWidget />

      {/* Graphiques de performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique de tendances - Ouvertures et Clics */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t('dashboard.progress')}
              </CardTitle>
              <CardDescription className="mt-1">
                Évolution des performances sur 7 jours
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Légende */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground">Emails envoyés</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">Ouvertures</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="text-muted-foreground">Clics</span>
                </div>
              </div>

              {/* Graphique combiné */}
              <div className="flex items-end gap-3 h-64">
                <div className="flex flex-col justify-between h-full text-xs text-muted-foreground pr-2 min-w-[30px]">
                  {[0, 25, 50, 75, 100].map((val) => (
                    <span key={val}>{val}</span>
                  ))}
                </div>
                
                {/* Barres groupées */}
                <div className="flex-1 flex items-end gap-2">
                  {dailyProgress.map((day, index) => {
                    const maxValue = getMaxValue();
                    const sentHeight = (day.sent / maxValue) * 100;
                    const openHeight = day.sent > 0 ? (day.sent * (stats.tauxOuverture / 100) / maxValue) * 100 : 0;
                    const clickHeight = day.sent > 0 ? (day.sent * (stats.tauxClic / 100) / maxValue) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="w-full flex items-end justify-center gap-0.5 h-full">
                          {/* Barre emails envoyés */}
                          <div 
                            className="w-full bg-blue-500 rounded-t transition-all cursor-pointer hover:bg-blue-600"
                            style={{ height: `${sentHeight}%` }}
                            title={`${day.sent} emails envoyés`}
                          />
                          {/* Barre ouvertures */}
                          {openHeight > 0 && (
                            <div 
                              className="w-full bg-green-500 rounded-t transition-all cursor-pointer hover:bg-green-600"
                              style={{ height: `${openHeight}%` }}
                              title={`${Math.round(day.sent * (stats.tauxOuverture / 100))} ouvertures`}
                            />
                          )}
                          {/* Barre clics */}
                          {clickHeight > 0 && (
                            <div 
                              className="w-full bg-purple-500 rounded-t transition-all cursor-pointer hover:bg-purple-600"
                              style={{ height: `${Math.max(clickHeight, 2)}%` }}
                              title={`${Math.round(day.sent * (stats.tauxClic / 100))} clics`}
                            />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap mt-2">
                          {day.date.split(' ')[0]} {day.date.split(' ')[1]?.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score de réputation amélioré */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {t('dashboard.reputation')}
              </CardTitle>
              <CardDescription className="mt-1">
                Score de réputation d'expéditeur
              </CardDescription>
            </div>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score circulaire amélioré */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-36 h-36">
                <svg className="transform -rotate-90 w-36 h-36">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${(reputationScore / 100) * 402.12} 402.12`}
                    className={`transition-all ${
                      reputationScore >= 90 ? 'text-green-500' : 
                      reputationScore >= 70 ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{reputationScore}</span>
                  <span className="text-xs text-muted-foreground mt-1">Score</span>
                  <Badge 
                    variant={reputationScore >= 90 ? "default" : reputationScore >= 70 ? "secondary" : "destructive"}
                    className="mt-2"
                  >
                    {reputationScore >= 90 ? "Excellent" : reputationScore >= 70 ? "Bon" : "À améliorer"}
                  </Badge>
                </div>
              </div>
            </div>

              {/* Scores par provider */}
            <div className="space-y-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold mb-1">{t('dashboard.reputationByProvider')}</h4>
                  <p className="text-xs text-muted-foreground">
                    Réputation spécifique selon le fournisseur de messagerie de vos destinataires
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 gap-1 flex-shrink-0">
                  <Filter className="h-3 w-3" />
                  {t('dashboard.filterBy')}
                </Button>
              </div>
              
              <div className="space-y-3">
                {/* Google */}
                <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-semibold">{t('dashboard.google')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-600">{providerScores.google}%</span>
                      <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                        Excellent
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${providerScores.google}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vos emails arrivent bien dans la boîte de réception Gmail
                  </p>
                </div>

                {/* Outlook */}
                <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-semibold">{t('dashboard.outlook')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-purple-600">{providerScores.outlook}%</span>
                      <Badge variant="outline" className="text-xs border-purple-500 text-purple-600">
                        Très bon
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${providerScores.outlook}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bonne réputation auprès des utilisateurs Outlook/Hotmail
                  </p>
                </div>

                {/* Other */}
                <div className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-semibold">{t('dashboard.other')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-yellow-600">{providerScores.other}%</span>
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                        À améliorer
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-yellow-500 rounded-full transition-all"
                      style={{ width: `${providerScores.other}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Réputation moyenne avec les autres fournisseurs (Yahoo, etc.)
                  </p>
                </div>
              </div>
              
              {/* Explication */}
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Qu'est-ce que la réputation par fournisseur ?</AlertTitle>
                <AlertDescription className="text-xs mt-1 leading-relaxed">
                  Chaque fournisseur de messagerie (Gmail, Outlook, Yahoo...) évalue différemment votre réputation d'expéditeur 
                  basée sur vos taux d'ouverture, de clic, de rebond et de spam. Un score élevé (90%+) signifie que vos emails 
                  arrivent bien dans la boîte de réception plutôt que dans les spams.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campagnes récentes améliorées */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              {t('dashboard.recentCampaigns')}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('dashboard.recentCampaignsDesc')}
            </CardDescription>
          </div>
          <Button onClick={() => navigate("/campagnes/nouvelle")} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('dashboard.newCampaign')}
          </Button>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('dashboard.noCampaigns')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('dashboard.createCampaign')}
              </p>
              <Button onClick={() => navigate("/campagnes/nouvelle")} size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('dashboard.createCampaign')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.slice(0, 5).map((campaign) => {
                const openRate = campaign.total_envoyes > 0
                  ? ((campaign.total_ouverts / campaign.total_envoyes) * 100)
                  : 0;
                const clickRate = campaign.total_envoyes > 0
                  ? ((campaign.total_cliques / campaign.total_envoyes) * 100)
                  : 0;
                
                return (
                  <div
                    key={campaign.campaign_id}
                    className="group p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer bg-card"
                    onClick={() => navigate(`/campagnes/${campaign.campaign_id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground mb-1 truncate">
                              {campaign.nom_campagne}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(campaign.date_envoi).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 flex-shrink-0">
                        {/* Emails envoyés */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{t('dashboard.totalSent')}</p>
                          </div>
                          <p className="text-lg font-bold text-foreground">
                            {campaign.total_envoyes.toLocaleString()}
                          </p>
                        </div>
                        
                        {/* Taux d'ouverture */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <Eye className="h-3.5 w-3.5 text-green-600" />
                            <p className="text-xs text-muted-foreground">{t('dashboard.openRate')}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-green-600">
                              {openRate.toFixed(1)}%
                            </p>
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                          </div>
                        </div>
                        
                        {/* Taux de clic */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <MousePointer className="h-3.5 w-3.5 text-purple-600" />
                            <p className="text-xs text-muted-foreground">{t('dashboard.clickRate')}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="text-lg font-bold text-purple-600">
                              {clickRate.toFixed(2)}%
                            </p>
                            <ArrowUpRight className="h-3 w-3 text-purple-500" />
                          </div>
                        </div>
                        
                        {/* Badge de performance */}
                        <div className="flex items-center">
                          <Badge 
                            variant={openRate >= 20 ? "default" : openRate >= 10 ? "secondary" : "outline"}
                            className="gap-1"
                          >
                            {openRate >= 20 ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Excellent
                              </>
                            ) : openRate >= 10 ? (
                              <>
                                <AlertCircle className="h-3 w-3" />
                                Bon
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                À améliorer
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Lien vers toutes les campagnes */}
              {recentCampaigns.length > 5 && (
                <div className="pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center gap-2"
                    onClick={() => navigate("/campagnes")}
                  >
                    Voir toutes les campagnes
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
