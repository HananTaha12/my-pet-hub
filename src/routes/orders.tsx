import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { ReviewDialog } from "@/components/ReviewDialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Orders /></AppShell></RequireAuth>),
});

interface Order { id: string; total: number; status: string; created_at: string; payment_method: string }
interface OrderItem { id: string; order_id: string; product_id: string; product_name: string; quantity: number }

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [reviewing, setReviewing] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setOrders((o ?? []) as Order[]);
      const ids = (o ?? []).map((x) => x.id);
      if (ids.length) {
        const { data: oi } = await supabase.from("order_items").select("*").in("order_id", ids);
        setItems((oi ?? []) as OrderItem[]);
      }
    })();
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Orders</h1>
      {orders.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No orders yet.</p>}
      {orders.map((o) => {
        const its = items.filter((i) => i.order_id === o.id);
        return (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.payment_method.replace("_", " ")}</p>
                <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{o.status}</span>
              </div>
              <p className="text-lg font-semibold">${Number(o.total).toFixed(2)}</p>
            </div>
            {its.length > 0 && (
              <div className="space-y-1.5 border-t border-border pt-3">
                {its.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{i.quantity}× {i.product_name}</span>
                    <button
                      onClick={() => setReviewing({ id: i.product_id, name: i.product_name })}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      <Star className="h-3 w-3" /> Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {reviewing && (
        <ReviewDialog
          productId={reviewing.id}
          productName={reviewing.name}
          open={!!reviewing}
          onOpenChange={(o) => !o && setReviewing(null)}
        />
      )}
    </div>
  );
}
