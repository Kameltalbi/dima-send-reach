import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const ParametresEnvoi = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Sending Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your Amazon SES account for email sending
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This information is required to send your campaigns via Amazon SES. 
          Make sure to properly configure your DNS records (SPF, DKIM, DMARC) 
          on your domain before sending emails.
        </AlertDescription>
      </Alert>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Amazon SES Configuration</CardTitle>
          <CardDescription>
            Enter your AWS access keys to enable email sending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-key">AWS Access Key ID</Label>
            <Input 
              id="access-key" 
              type="text" 
              placeholder="AKIAIOSFODNN7EXAMPLE"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret-key">AWS Secret Access Key</Label>
            <Input 
              id="secret-key" 
              type="password" 
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">AWS Region</Label>
            <Input 
              id="region" 
              type="text" 
              placeholder="us-east-1"
              defaultValue="us-east-1"
            />
            <p className="text-sm text-muted-foreground">
              Examples: us-east-1, eu-west-1, ap-southeast-1
            </p>
          </div>
          <Button>Save Configuration</Button>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>DNS Configuration</CardTitle>
          <CardDescription>
            Instructions for configuring your DNS records
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">
            For your emails to be properly delivered, you must configure 
            the following records in your DNS zone:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>SPF</strong>: Authorizes Amazon SES to send emails from your domain</li>
            <li><strong>DKIM</strong>: Digitally signs your emails to prove their authenticity</li>
            <li><strong>DMARC</strong>: Defines how to handle emails that fail verification</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Consult the Amazon SES documentation to get the exact values 
            to configure for your domain.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParametresEnvoi;
