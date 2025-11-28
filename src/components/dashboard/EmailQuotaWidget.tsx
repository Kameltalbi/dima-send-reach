import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEmailQuota } from "@/hooks/useEmailQuota";
import { Mail, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const EmailQuotaWidget = () => {
  const { t } = useTranslation();
  const { quota, isLoading } = useEmailQuota();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('quota.title', { defaultValue: 'Quota d\'emails' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quota) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('quota.title', { defaultValue: 'Quota d\'emails' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('quota.noSubscription', { defaultValue: 'Aucun abonnement actif' })}</AlertTitle>
            <AlertDescription>
              {t('quota.noSubscriptionDesc', { defaultValue: 'Veuillez souscrire à un plan pour envoyer des emails.' })}
            </AlertDescription>
          </Alert>
          <Link to="/pricing" className="mt-4 block">
            <Button className="w-full">{t('quota.viewPlans', { defaultValue: 'Voir les plans' })}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = () => {
    if (quota.isBlocked) return "bg-destructive";
    if (quota.isNearLimit) return "bg-yellow-500";
    return "bg-primary";
  };

  const getStatusBadge = () => {
    if (quota.isBlocked) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('quota.blocked', { defaultValue: 'Bloqué' })}
        </Badge>
      );
    }
    if (quota.isNearLimit) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600 gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('quota.nearLimit', { defaultValue: 'Limite proche' })}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {t('quota.ok', { defaultValue: 'OK' })}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('quota.title', { defaultValue: 'Quota d\'emails' })}
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {t('quota.monthlyLimit', { defaultValue: 'Limite mensuelle' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {quota.used.toLocaleString()} / {quota.limit.toLocaleString()} {t('quota.emails', { defaultValue: 'emails' })}
            </span>
            <span className={`font-semibold ${quota.isBlocked ? 'text-destructive' : quota.isNearLimit ? 'text-yellow-600' : 'text-primary'}`}>
              {quota.percentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(quota.percentage, 100)} 
            className="h-3"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('quota.remaining', { defaultValue: 'Restant' })}: {quota.remaining.toLocaleString()}
            </span>
            {quota.resetDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {t('quota.resetDate', { 
                  defaultValue: 'Réinitialisation: {{date}}',
                  date: quota.resetDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                })}
              </span>
            )}
          </div>
        </div>

        {/* Alertes */}
        {quota.isBlocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('quota.blockedTitle', { defaultValue: 'Quota dépassé' })}</AlertTitle>
            <AlertDescription>
              {t('quota.blockedDesc', { 
                defaultValue: 'Vous avez atteint votre limite mensuelle. L\'envoi d\'emails est bloqué jusqu\'au {{date}}.',
                date: quota.resetDate?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
              })}
            </AlertDescription>
          </Alert>
        )}

        {quota.isNearLimit && !quota.isBlocked && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('quota.warningTitle', { defaultValue: 'Attention' })}</AlertTitle>
            <AlertDescription>
              {t('quota.warningDesc', { 
                defaultValue: 'Vous avez utilisé {{percentage}}% de votre quota mensuel. Il reste {{remaining}} emails disponibles.',
                percentage: quota.percentage.toFixed(0),
                remaining: quota.remaining.toLocaleString()
              })}
            </AlertDescription>
          </Alert>
        )}

        {/* Lien vers les plans */}
        {quota.isNearLimit && (
          <Link to="/pricing">
            <Button variant="outline" className="w-full">
              {t('quota.upgrade', { defaultValue: 'Mettre à niveau mon plan' })}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

