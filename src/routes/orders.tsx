import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Orders /></AppShell></RequireAuth>),
});

interface Order { id: string; total: number; status: string; created_at: string; payment_method: string }

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders((data ?? []) as Order[]));
  }, [user]);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Orders</h1>
      {orders.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.payment_method.replace("_", " ")}</p>
            <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{o.status}</span>
          </div>
          <p className="text-lg font-semibold">${Number(o.total).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
