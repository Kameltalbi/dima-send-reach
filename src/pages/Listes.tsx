import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Listes = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Lists</h1>
          <p className="text-muted-foreground mt-1">
            Organize your contacts into targeted lists
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Mailing Lists</CardTitle>
          <CardDescription>
            Create and manage your distribution lists
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

export default Listes;
