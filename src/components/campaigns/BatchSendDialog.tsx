import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

interface BatchSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  listId: string | null;
}

const BATCH_VOLUMES = [10000, 15000, 20000, 25000, 30000, 50000];

export const BatchSendDialog = ({
  open,
  onOpenChange,
  campaignId,
  listId,
}: BatchSendDialogProps) => {
  const { t } = useTranslation();
  const [selectedVolume, setSelectedVolume] = useState<number | null>(null);

  // Fetch statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["batchSendStats", campaignId, listId],
    queryFn: async () => {
      if (!listId) {
        return {
          total: 0,
          alreadySent: 0,
          remaining: 0,
        };
      }

      const [totalResult, sentResult, remainingResult] = await Promise.all([
        supabase.rpc("get_total_contacts_in_list" as any, { p_list_id: listId }),
        supabase.rpc("get_sent_contacts_count" as any, {
          p_list_id: listId,
          p_campaign_id: campaignId,
        }),
        supabase.rpc("get_remaining_contacts_count" as any, {
          p_list_id: listId,
          p_campaign_id: campaignId,
        }),
      ]);

      return {
        total: (totalResult.data as number) || 0,
        alreadySent: (sentResult.data as number) || 0,
        remaining: (remainingResult.data as number) || 0,
      };
    },
    enabled: open && !!listId,
  });

  // Batch send mutation
  const batchSendMutation = useMutation({
    mutationFn: async (volume: number) => {
      const { data, error } = await supabase.functions.invoke("send-batch-campaign", {
        body: {
          campaignId,
          listId,
          volume,
        },
      });

      if (error) throw error;
      if (data?.success === false) {
        throw new Error(data.error || "Batch send failed");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(
        t("batchSend.success", {
          count: data.summary.batchSent,
          remaining: data.summary.remaining,
        })
      );
      refetchStats();
      onOpenChange(false);
      setSelectedVolume(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("batchSend.error"));
    },
  });

  const handleSend = () => {
    if (!selectedVolume) {
      toast.error(t("batchSend.selectVolume"));
      return;
    }

    if (!stats || stats.remaining < selectedVolume) {
      toast.error(
        t("batchSend.notEnoughContacts", {
          remaining: stats?.remaining || 0,
          requested: selectedVolume,
        })
      );
      return;
    }

    batchSendMutation.mutate(selectedVolume);
  };

  // Reset selected volume when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedVolume(null);
    }
  }, [open]);

  // Auto-select first available volume
  useEffect(() => {
    if (stats && !selectedVolume && open) {
      const availableVolumes = BATCH_VOLUMES.filter((v) => stats.remaining >= v);
      if (availableVolumes.length > 0) {
        setSelectedVolume(availableVolumes[availableVolumes.length - 1]); // Select largest available
      }
    }
  }, [stats, open]);

  if (!listId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("batchSend.title")}</DialogTitle>
            <DialogDescription>{t("batchSend.noListSelected")}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const availableVolumes = BATCH_VOLUMES.filter(
    (v) => stats && stats.remaining >= v
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t("batchSend.title")}
          </DialogTitle>
          <DialogDescription>{t("batchSend.description")}</DialogDescription>
        </DialogHeader>

        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {stats?.total.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("batchSend.totalContacts")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {stats?.alreadySent.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("batchSend.alreadySent")}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.remaining.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("batchSend.remaining")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Volume Selection */}
            <div className="space-y-3">
              <Label htmlFor="volume">{t("batchSend.selectVolume")}</Label>
              <Select
                value={selectedVolume?.toString() || ""}
                onValueChange={(value) => setSelectedVolume(parseInt(value))}
              >
                <SelectTrigger id="volume">
                  <SelectValue placeholder={t("batchSend.selectVolumePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_VOLUMES.map((volume) => {
                    const isAvailable = stats ? stats.remaining >= volume : false;
                    return (
                      <SelectItem
                        key={volume}
                        value={volume.toString()}
                        disabled={!isAvailable}
                        className={!isAvailable ? "opacity-50" : ""}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{volume.toLocaleString()}</span>
                          {!isAvailable && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({t("batchSend.notAvailable")})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {stats && stats.remaining === 0 && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t("batchSend.allSent")}
                  </span>
                </div>
              )}

              {selectedVolume && stats && stats.remaining < selectedVolume && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-destructive">
                    {t("batchSend.notEnoughContacts", {
                      remaining: stats.remaining,
                      requested: selectedVolume,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Info Message */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">{t("batchSend.infoTitle")}</p>
                <p>{t("batchSend.infoDescription")}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={batchSendMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSend}
                disabled={
                  !selectedVolume ||
                  !stats ||
                  stats.remaining < selectedVolume ||
                  batchSendMutation.isPending ||
                  availableVolumes.length === 0
                }
              >
                {batchSendMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("batchSend.sending")}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("batchSend.sendBatch")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

