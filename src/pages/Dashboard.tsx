import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, TrendingUp, MousePointer, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CampaignStat {
  campaign_id: string;
  nom_campagne: string;
  date_envoi: string;
  total_envoyes: number;
  total_ouverts: number;
  total_cliques: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEnvoyes: 0,
    tauxOuverture: 0,
    tauxClic: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<CampaignStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load recent campaigns with their stats
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select(`
          id,
          nom_campagne,
          date_envoi,
          campaign_stats (
            total_envoyes,
            total_ouverts,
            total_cliques
          )
        `)
        .eq("user_id", user?.id)
        .eq("statut", "envoye")
        .order("date_envoi", { ascending: false })
        .limit(5);

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

      setRecentCampaigns(formattedCampaigns);
      setStats({
        totalEnvoyes,
        tauxOuverture: totalEnvoyes > 0 ? (totalOuverts / totalEnvoyes) * 100 : 0,
        tauxClic: totalEnvoyes > 0 ? (totalCliques / totalEnvoyes) * 100 : 0,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your email marketing campaigns
          </p>
        </div>
        <Button onClick={() => navigate("/campagnes/nouvelle")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Main statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails sent this month</CardTitle>
            <Mail className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalEnvoyes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total emails delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.tauxOuverture.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.tauxClic.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recipient engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>
            Your 5 most recent campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No campaigns sent
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first email campaign
              </p>
              <Button onClick={() => navigate("/campagnes/nouvelle")}>
                Create my first campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div
                  key={campaign.campaign_id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/campagnes/${campaign.campaign_id}`)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{campaign.nom_campagne}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(campaign.date_envoi)}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-semibold text-foreground">
                        {campaign.total_envoyes.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Opens</p>
                      <p className="font-semibold text-primary">
                        {campaign.total_envoyes > 0
                          ? ((campaign.total_ouverts / campaign.total_envoyes) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicks</p>
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
