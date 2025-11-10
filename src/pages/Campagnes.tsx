import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Campagnes = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your email marketing campaigns
          </p>
        </div>
        <Button onClick={() => navigate("/campagnes/nouvelle")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Your Campaigns</CardTitle>
          <CardDescription>
            View your campaign performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Feature in development...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campagnes;
