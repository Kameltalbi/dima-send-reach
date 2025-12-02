import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { analyzeSpamScore, getScoreColor, getScoreLabel } from "@/utils/spamScore";
import { cn } from "@/lib/utils";

interface SpamScoreCardProps {
  subject: string;
  htmlContent: string;
  senderName: string;
  senderEmail: string;
  className?: string;
}

export function SpamScoreCard({
  subject,
  htmlContent,
  senderName,
  senderEmail,
  className,
}: SpamScoreCardProps) {
  const analysis = useMemo(() => {
    if (!htmlContent || !subject) return null;
    return analyzeSpamScore(subject, htmlContent, senderName, senderEmail);
  }, [subject, htmlContent, senderName, senderEmail]);

  if (!analysis) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            Score de spam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Remplissez le sujet et le contenu pour voir l'analyse
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreIcon = () => {
    switch (analysis.level) {
      case 'excellent':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'danger':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getProgressColor = () => {
    // Inverser la logique: 100 - score car un score bas est bon
    const invertedScore = 100 - analysis.score;
    if (invertedScore >= 80) return 'bg-green-500';
    if (invertedScore >= 60) return 'bg-blue-500';
    if (invertedScore >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return <AlertCircle className="h-3 w-3 text-blue-500" />;
      case 'medium':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'high':
        return <XCircle className="h-3 w-3 text-red-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {getScoreIcon()}
            Score de spam
          </CardTitle>
          <Badge 
            variant={analysis.level === 'danger' ? 'destructive' : 'secondary'}
            className={cn(getScoreColor(analysis.level))}
          >
            {getScoreLabel(analysis.level)}
          </Badge>
        </div>
        <CardDescription>
          Vérification du contenu avant envoi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risque de spam</span>
            <span className={cn("font-medium", getScoreColor(analysis.level))}>
              {analysis.score}/100
            </span>
          </div>
          <div className="relative">
            <Progress value={100 - analysis.score} className="h-2" />
            <div 
              className={cn("absolute top-0 left-0 h-2 rounded-full transition-all", getProgressColor())}
              style={{ width: `${100 - analysis.score}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Plus le score est bas, meilleure est la délivrabilité
          </p>
        </div>

        {/* Issues */}
        {analysis.issues.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Problèmes détectés ({analysis.issues.length})</p>
            <ul className="space-y-1.5 text-sm">
              {analysis.issues.slice(0, 5).map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  {getSeverityIcon(issue.severity)}
                  <span className="text-muted-foreground">{issue.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Suggestions
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success message */}
        {analysis.issues.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Votre email est bien optimisé pour la délivrabilité !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
