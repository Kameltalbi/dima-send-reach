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
  CheckCircle2
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

  // Vérifier l'abonnement et rediriger si nécessaire
  useEffect(() => {
    if (!quotaLoading && !quota && user) {
      // Pas d'abonnement actif, rediriger vers la page de pricing
      navigate("/pricing", { replace: true });
    }
  }, [quotaLoading, quota, user, navigate]);

  useEffect(() => {
    // Ne charger les données que si l'utilisateur a un abonnement
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
      {/* Header avec compte email et statut */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">&lt;</span>
            <span className="font-medium text-foreground truncate">{selectedEmail}</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border"></div>
          <a 
            href="#" 
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {t('dashboard.warmupFilter')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md bg-muted border">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent border-none outline-none text-xs sm:text-sm font-medium cursor-pointer"
            >
              <option value="Running">{t('dashboard.running')}</option>
              <option value="Paused">{t('dashboard.paused')}</option>
              <option value="Stopped">{t('dashboard.stopped')}</option>
            </select>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t('dashboard.settings')}</span>
        </Button>
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

      {/* KPIs - 4 cartes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.emailSent')}</CardTitle>
            <div className="relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalEnvoyes > 0 ? Math.round((stats.totalEnvoyes / 1000) * 100) : 0}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <p className="text-xs text-muted-foreground">
                {stats.totalEnvoyes.toLocaleString()} {t('dashboard.emails')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.inbox')}</CardTitle>
            <div className="relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.inboxRate.toFixed(0)}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.deliverabilityRate')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.spam')}</CardTitle>
            <div className="relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.spamRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.spamRate')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.category')}</CardTitle>
            <div className="relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.categoryRate.toFixed(0)}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.categoryRate')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget de quota d'emails */}
      <EmailQuotaWidget />

      {/* Graphique de progression et Score de réputation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique de progression */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.progress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Légende Y */}
              <div className="flex items-end gap-2 h-64">
                <div className="flex flex-col justify-between h-full text-xs text-muted-foreground pr-2">
                  {[0, 6, 12, 19, 24].map((val) => (
                    <span key={val}>{val}</span>
                  ))}
                </div>
                
                {/* Barres */}
                <div className="flex-1 flex items-end gap-2">
                  {dailyProgress.map((day, index) => {
                    const maxValue = getMaxValue();
                    const height = (day.sent / maxValue) * 100;
                    const isSuccess = day.success >= 75;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div 
                          className={`w-full rounded-t transition-all cursor-pointer ${
                            isSuccess ? 'bg-green-500' : 'bg-muted'
                          }`}
                          style={{ height: `${height}%` }}
                          title={`${day.success}% ${t('dashboard.success')}`}
                        >
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
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

        {/* Score de réputation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.reputation')}</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score circulaire */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(reputationScore / 100) * 351.86} 351.86`}
                    className="text-green-500 transition-all"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{reputationScore}%</span>
                  <span className="text-xs text-muted-foreground">{t('dashboard.reputation')}</span>
                </div>
              </div>
            </div>

              {/* Scores par provider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">{t('dashboard.reputationByProvider')}</h4>
                <Button variant="ghost" size="sm" className="h-7 gap-1">
                  <Filter className="h-3 w-3" />
                  {t('dashboard.filterBy')}
                </Button>
              </div>
              
              <div className="space-y-3">
                {/* Google */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{t('dashboard.google')}</span>
                    <span className="text-muted-foreground font-semibold">{providerScores.google}%</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${providerScores.google}%` }}
                    />
                  </div>
                </div>

                {/* Outlook */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{t('dashboard.outlook')}</span>
                    <span className="text-muted-foreground font-semibold">{providerScores.outlook}%</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${providerScores.outlook}%` }}
                    />
                  </div>
                </div>

                {/* Other */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{t('dashboard.other')}</span>
                    <span className="text-muted-foreground font-semibold">{providerScores.other}%</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full transition-all"
                      style={{ width: `${providerScores.other}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campagnes récentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('dashboard.recentCampaigns')}</CardTitle>
          <CardDescription>
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
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('dashboard.noCampaigns')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('dashboard.createCampaign')}
              </p>
              <Button onClick={() => navigate("/campagnes/nouvelle")}>
                {t('dashboard.createCampaign')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCampaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign.campaign_id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/campagnes/${campaign.campaign_id}`)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{campaign.nom_campagne}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(campaign.date_envoi).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('dashboard.totalSent')}</p>
                      <p className="font-semibold text-foreground">
                        {campaign.total_envoyes.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('dashboard.openRate')}</p>
                      <p className="font-semibold text-primary">
                        {campaign.total_envoyes > 0
                          ? ((campaign.total_ouverts / campaign.total_envoyes) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('dashboard.clickRate')}</p>
                      <p className="font-semibold text-accent">
                        {campaign.total_envoyes > 0
                          ? ((campaign.total_cliques / campaign.total_envoyes) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
