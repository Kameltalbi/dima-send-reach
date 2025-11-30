import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmailQuota } from "@/hooks/useEmailQuota";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface SubscriptionProtectedRouteProps {
  children: ReactNode;
}

export const SubscriptionProtectedRoute = ({ children }: SubscriptionProtectedRouteProps) => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { quota, isLoading: quotaLoading } = useEmailQuota();

  useEffect(() => {
    const checkSubscription = async () => {
      // Attendre que l'authentification soit chargée
      if (authLoading) return;
      
      // Si pas d'utilisateur, rediriger vers la page d'authentification
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      // Si le quota est chargé et qu'il n'y a pas d'abonnement
      if (!quotaLoading && !quota) {
        // Vérifier si l'utilisateur est superadmin
        const { data: isSuperadmin } = await supabase.rpc('is_superadmin');
        
        if (!isSuperadmin) {
          // Pas d'abonnement actif et pas superadmin, rediriger vers la page de pricing
          navigate("/pricing", { replace: true });
        }
      }
    };
    
    checkSubscription();
  }, [authLoading, quotaLoading, quota, user, navigate]);

  // Afficher un loader pendant la vérification
  if (authLoading || quotaLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

  // Si pas d'abonnement et pas superadmin, afficher un message
  if (!quota) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('quota.noSubscription')}</AlertTitle>
            <AlertDescription className="mt-4 space-y-4">
              <p>{t('quota.noSubscriptionDesc')}</p>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/pricing")} className="flex-1">
                  {t('quota.viewPlans')}
                </Button>
                <Button variant="outline" onClick={() => navigate("/checkout")} className="flex-1">
                  {t('quota.upgrade')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

