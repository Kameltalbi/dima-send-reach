import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Contacts = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your contacts and segment your audience
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Import CSV</Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact List</CardTitle>
          <CardDescription>
            All your contacts in one place
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

export default Contacts;
