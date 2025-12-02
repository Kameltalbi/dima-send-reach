import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Percent, Clock, Target, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export interface ABTestSettings {
  enabled: boolean;
  testType: 'subject' | 'content' | 'both';
  variantASubject: string;
  variantBSubject: string;
  variantAContent: string;
  variantBContent: string;
  testPercentage: number;
  winningCriteria: 'open_rate' | 'click_rate';
  testDurationHours: number;
}

interface ABTestConfigProps {
  settings: ABTestSettings;
  onSettingsChange: (settings: ABTestSettings) => void;
  defaultSubject: string;
  defaultContent: string;
}

export function ABTestConfig({
  settings,
  onSettingsChange,
  defaultSubject,
  defaultContent,
}: ABTestConfigProps) {
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');

  const handleToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      enabled,
      variantASubject: defaultSubject,
      variantBSubject: defaultSubject,
      variantAContent: defaultContent,
      variantBContent: defaultContent,
    });
  };

  const updateSetting = <K extends keyof ABTestSettings>(
    key: K,
    value: ABTestSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Test A/B</CardTitle>
              <CardDescription>
                Testez 2 versions pour optimiser vos résultats
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>

      {settings.enabled && (
        <CardContent className="space-y-6">
          {/* Type de test */}
          <div className="space-y-2">
            <Label>Que souhaitez-vous tester ?</Label>
            <Select
              value={settings.testType}
              onValueChange={(value: 'subject' | 'content' | 'both') =>
                updateSetting('testType', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subject">
                  <div className="flex items-center gap-2">
                    <span>📧</span> Sujet de l'email
                  </div>
                </SelectItem>
                <SelectItem value="content">
                  <div className="flex items-center gap-2">
                    <span>📝</span> Contenu de l'email
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <span>🎯</span> Sujet et contenu
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variantes */}
          <div className="space-y-3">
            <Label>Configurez vos variantes</Label>
            <Tabs value={activeVariant} onValueChange={(v) => setActiveVariant(v as 'A' | 'B')}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="A" className="gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">A</Badge>
                  Variante A
                </TabsTrigger>
                <TabsTrigger value="B" className="gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">B</Badge>
                  Variante B
                </TabsTrigger>
              </TabsList>

              <TabsContent value="A" className="space-y-4 mt-4">
                {(settings.testType === 'subject' || settings.testType === 'both') && (
                  <div className="space-y-2">
                    <Label htmlFor="variant-a-subject">Sujet A</Label>
                    <Input
                      id="variant-a-subject"
                      value={settings.variantASubject}
                      onChange={(e) => updateSetting('variantASubject', e.target.value)}
                      placeholder="Sujet de la variante A"
                    />
                  </div>
                )}
                {(settings.testType === 'content' || settings.testType === 'both') && (
                  <div className="space-y-2">
                    <Label htmlFor="variant-a-content">
                      Contenu A <span className="text-xs text-muted-foreground">(HTML)</span>
                    </Label>
                    <Textarea
                      id="variant-a-content"
                      value={settings.variantAContent}
                      onChange={(e) => updateSetting('variantAContent', e.target.value)}
                      placeholder="Contenu HTML de la variante A"
                      className="min-h-[120px] font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Modifiez le contenu dans l'éditeur principal, puis collez-le ici
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="B" className="space-y-4 mt-4">
                {(settings.testType === 'subject' || settings.testType === 'both') && (
                  <div className="space-y-2">
                    <Label htmlFor="variant-b-subject">Sujet B</Label>
                    <Input
                      id="variant-b-subject"
                      value={settings.variantBSubject}
                      onChange={(e) => updateSetting('variantBSubject', e.target.value)}
                      placeholder="Sujet de la variante B"
                    />
                  </div>
                )}
                {(settings.testType === 'content' || settings.testType === 'both') && (
                  <div className="space-y-2">
                    <Label htmlFor="variant-b-content">
                      Contenu B <span className="text-xs text-muted-foreground">(HTML)</span>
                    </Label>
                    <Textarea
                      id="variant-b-content"
                      value={settings.variantBContent}
                      onChange={(e) => updateSetting('variantBContent', e.target.value)}
                      placeholder="Contenu HTML de la variante B"
                      className="min-h-[120px] font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Modifiez le contenu dans l'éditeur principal, puis collez-le ici
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Configuration du test */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {/* Pourcentage de test */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                Taille du test
              </Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.testPercentage]}
                  onValueChange={([value]) => updateSetting('testPercentage', value)}
                  min={10}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{settings.testPercentage}% en test</span>
                  <span>{100 - settings.testPercentage}% gagnant</span>
                </div>
              </div>
            </div>

            {/* Critère de victoire */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Critère de victoire
              </Label>
              <Select
                value={settings.winningCriteria}
                onValueChange={(value: 'open_rate' | 'click_rate') =>
                  updateSetting('winningCriteria', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_rate">
                    Meilleur taux d'ouverture
                  </SelectItem>
                  <SelectItem value="click_rate">
                    Meilleur taux de clic
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Durée du test */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Durée du test
              </Label>
              <Select
                value={settings.testDurationHours.toString()}
                onValueChange={(value) =>
                  updateSetting('testDurationHours', parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 heure</SelectItem>
                  <SelectItem value="2">2 heures</SelectItem>
                  <SelectItem value="4">4 heures</SelectItem>
                  <SelectItem value="8">8 heures</SelectItem>
                  <SelectItem value="12">12 heures</SelectItem>
                  <SelectItem value="24">24 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Résumé */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Comment ça fonctionne
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.testPercentage}% de vos contacts ({Math.floor(settings.testPercentage / 2)}% chacun) 
              recevront les variantes A et B. Après {settings.testDurationHours}h, 
              la variante avec le meilleur {settings.winningCriteria === 'open_rate' ? "taux d'ouverture" : "taux de clic"} 
              sera envoyée aux {100 - settings.testPercentage}% restants.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
