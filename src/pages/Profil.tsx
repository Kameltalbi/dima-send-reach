import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Profil = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal and company information
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">First Name</Label>
                <Input id="prenom" placeholder="Your first name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Last Name</Label>
                <Input id="nom" placeholder="Your last name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entreprise">Company Name</Label>
              <Input id="entreprise" placeholder="Your company" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-envoi">Default Sender Email</Label>
              <Input id="email-envoi" type="email" placeholder="newsletter@company.com" />
              <p className="text-sm text-muted-foreground">
                This address will be used as the default sender for your campaigns
              </p>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button>Change Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profil;
