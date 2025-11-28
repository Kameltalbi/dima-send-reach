import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface Order {
  id: string;
  user_id: string;
  organization_id: string;
  plan_type: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  billing_info: any;
  notes: string;
  created_at: string;
}

export const OrdersTable = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_fkey (
            nom,
            prenom,
            nom_entreprise,
            organization_id
          ),
          organizations!orders_organization_id_fkey (
            nom
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const validateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: "completed" | "cancelled" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: status,
          validated_by: user?.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // If approved, create/update subscription
      if (status === "completed") {
        const order = orders?.find((o: any) => o.id === orderId);
        if (order) {
          await createSubscription(order);
        }
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success(status === "completed" ? "Order validated and subscription activated" : "Order cancelled");
      setShowDialog(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update order");
    },
  });

  const createSubscription = async (order: any) => {
    const emailLimits: Record<string, number> = {
      starter: 10000,
      essential: 50000,
      pro: 200000,
    };

    const { error } = await supabase.from("subscriptions").insert({
      organization_id: order.organization_id,
      plan_type: order.plan_type,
      email_limit: emailLimits[order.plan_type] || 10000,
      statut: "active",
      date_debut: new Date().toISOString(),
      date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      notes: `Activated from order ${order.id}`,
    });

    if (error) throw error;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string) => {
    const labels: Record<string, string> = {
      card: "Card",
      check: "Check",
      transfer: "Transfer",
      cash: "Cash",
    };
    return <Badge variant="outline">{labels[method] || method}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Orders</CardTitle>
          <CardDescription>
            Manage and validate subscription payment orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm">
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.organizations?.nom || "-"}
                      </TableCell>
                      <TableCell>
                        {order.profiles?.prenom} {order.profiles?.nom}
                      </TableCell>
                      <TableCell>
                        <Badge>{order.plan_type}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {order.amount} {order.currency}
                      </TableCell>
                      <TableCell>{getPaymentMethodBadge(order.payment_method)}</TableCell>
                      <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.payment_status === "pending" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  validateOrderMutation.mutate({
                                    orderId: order.id,
                                    status: "completed",
                                  })
                                }
                                disabled={validateOrderMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  validateOrderMutation.mutate({
                                    orderId: order.id,
                                    status: "cancelled",
                                  })
                                }
                                disabled={validateOrderMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Review order information before validation
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                  <p className="text-sm font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOrder.payment_status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <Badge>{selectedOrder.plan_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">
                    {selectedOrder.amount} {selectedOrder.currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  {getPaymentMethodBadge(selectedOrder.payment_method)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>

              {selectedOrder.billing_info && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Billing Information</p>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    {Object.entries(selectedOrder.billing_info).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedOrder?.payment_status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedOrder) {
                      validateOrderMutation.mutate({
                        orderId: selectedOrder.id,
                        status: "cancelled",
                      });
                    }
                  }}
                  disabled={validateOrderMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    if (selectedOrder) {
                      validateOrderMutation.mutate({
                        orderId: selectedOrder.id,
                        status: "completed",
                      });
                    }
                  }}
                  disabled={validateOrderMutation.isPending}
                >
                  {validateOrderMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve & Activate
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
