import { Bell, User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEmailQuota } from "@/hooks/useEmailQuota";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Topbar = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { quota } = useEmailQuota();

  // Récupérer le type de plan depuis la subscription
  const { data: subscription } = useQuery({
    queryKey: ["user-subscription-topbar", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return null;

      const { data } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("organization_id", profile.organization_id)
        .eq("statut", "active")
        .order("date_debut", { ascending: false })
        .limit(1)
        .maybeSingle();

      return data;
    },
    enabled: !!user,
  });

  const getPlanLabel = (plan?: string) => {
    const labels: { [key: string]: string } = {
      free: "Gratuit",
      starter: "Starter",
      essential: "Essential",
      pro: "Pro",
    };
    return labels[plan || "free"] || "Gratuit";
  };

  const getPlanColor = (plan?: string) => {
    const colors: { [key: string]: string } = {
      free: "secondary",
      starter: "default",
      essential: "default",
      pro: "default",
    };
    return colors[plan || "free"] || "secondary";
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-6 sticky top-0 z-10">
      <SidebarTrigger className="mr-4" />
      
      <div className="flex-1" />

      <div className="flex items-center gap-3 ml-auto">
        {subscription && (
          <Badge variant={getPlanColor(subscription.plan_type) as any} className="gap-1.5 px-3">
            <Crown className="h-3.5 w-3.5" />
            {getPlanLabel(subscription.plan_type)}
          </Badge>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.email}</span>
                <span className="text-xs text-muted-foreground">Mon compte</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/parametres")}>
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/support")}>
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
