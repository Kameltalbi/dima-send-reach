import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const mockData = [
  { name: "Lun", ouvertures: 145, clics: 89 },
  { name: "Mar", ouvertures: 198, clics: 112 },
  { name: "Mer", ouvertures: 176, clics: 95 },
  { name: "Jeu", ouvertures: 221, clics: 134 },
  { name: "Ven", ouvertures: 189, clics: 101 },
  { name: "Sam", ouvertures: 134, clics: 67 },
  { name: "Dim", ouvertures: 98, clics: 45 },
];

const deviceData = [
  { device: "Desktop", value: 58 },
  { device: "Mobile", value: 35 },
  { device: "Tablette", value: 7 },
];

const Statistiques = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Statistiques</h1>
        <p className="text-muted-foreground mt-1">
          Analysez les performances de vos campagnes
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="devices">Appareils</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total envoyés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">12,847</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +12.5% vs mois dernier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taux d'ouverture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">24.8%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +2.1% vs mois dernier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taux de clic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">8.4%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +1.3% vs mois dernier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Désabonnements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">0.8%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  -0.2% vs mois dernier
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Évolution hebdomadaire</CardTitle>
              <CardDescription>
                Ouvertures et clics sur les 7 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="ouvertures" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Ouvertures"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clics" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Clics"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison Ouvertures vs Clics</CardTitle>
              <CardDescription>
                Performance par jour de la semaine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip />
                  <Bar dataKey="ouvertures" fill="hsl(var(--primary))" name="Ouvertures" />
                  <Bar dataKey="clics" fill="hsl(var(--accent))" name="Clics" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {deviceData.map((item) => (
              <Card key={item.device}>
                <CardHeader>
                  <CardTitle>{item.device}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">{item.value}%</div>
                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistiques;
