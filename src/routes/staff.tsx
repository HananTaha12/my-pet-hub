import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, DollarSign, Package, Users, TrendingUp, ShoppingBag, PawPrint, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Admin Dashboard — PetPal" }] }),
  component: () => (<RequireAuth staffOnly><AppShell><Staff /></AppShell></RequireAuth>),
});

interface Appt {
  id: string;
  scheduled_at: string;
  status: string;
  special_instructions: string | null;
  services: { name: string } | null;
  pets: { name: string } | null;
}
type ApptStatus = "pending" | "confirmed" | "in_progress" | "done" | "cancelled";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  user_id: string;
}

interface Stats {
  todayAppts: number;
  weekAppts: number;
  totalUsers: number;
  totalPets: number;
  totalProducts: number;
  ordersToday: number;
  revenueToday: number;
  revenueWeek: number;
  pendingOrders: number;
  avgRating: number;
}

function Staff() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayAppts: 0, weekAppts: 0, totalUsers: 0, totalPets: 0,
    totalProducts: 0, ordersToday: 0, revenueToday: 0, revenueWeek: 0,
    pendingOrders: 0, avgRating: 0,
  });
  const [tab, setTab] = useState<"overview" | "appointments" | "orders">("overview");

  const load = async () => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAhead = new Date(now); weekAhead.setDate(weekAhead.getDate() + 7);

    const [
      { data: apptData },
      { data: orderData },
      { count: userCount },
      { count: petCount },
      { count: productCount },
      { data: todayOrders },
      { data: weekOrders },
      { count: pendingCount },
      { data: ratings },
    ] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, special_instructions, services(name), pets(name)")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", weekAhead.toISOString())
        .order("scheduled_at"),
      supabase.from("orders")
        .select("id, total, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("pets").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("orders").select("total").gte("created_at", startOfDay.toISOString()).lte("created_at", endOfDay.toISOString()),
      supabase.from("orders").select("total").gte("created_at", weekAgo.toISOString()),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
      supabase.from("product_reviews").select("rating"),
    ]);

    const appointments = (apptData ?? []) as unknown as Appt[];
    setAppts(appointments);
    setRecentOrders((orderData ?? []) as Order[]);

    const todayAppts = appointments.filter(
      (a) => new Date(a.scheduled_at) <= endOfDay && a.status !== "cancelled"
    ).length;
    const revenueToday = (todayOrders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
    const revenueWeek = (weekOrders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
    const avgRating = ratings && ratings.length > 0
      ? ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length
      : 0;

    setStats({
      todayAppts,
      weekAppts: appointments.filter((a) => a.status !== "cancelled").length,
      totalUsers: userCount ?? 0,
      totalPets: petCount ?? 0,
      totalProducts: productCount ?? 0,
      ordersToday: (todayOrders ?? []).length,
      revenueToday,
      revenueWeek,
      pendingOrders: pendingCount ?? 0,
      avgRating,
    });
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: ApptStatus) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  const setOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    load();
  };

  const kpis = [
    { label: "Revenue today", value: `$${stats.revenueToday.toFixed(2)}`, sub: `${stats.ordersToday} orders`, icon: DollarSign, color: "from-emerald-500 to-teal-400" },
    { label: "Revenue (7d)", value: `$${stats.revenueWeek.toFixed(2)}`, sub: "rolling week", icon: TrendingUp, color: "from-violet-500 to-fuchsia-400" },
    { label: "Today's bookings", value: stats.todayAppts, sub: `${stats.weekAppts} this week`, icon: Calendar, color: "from-blue-500 to-cyan-400" },
    { label: "Pending orders", value: stats.pendingOrders, sub: "awaiting action", icon: Package, color: "from-amber-500 to-orange-400" },
    { label: "Customers", value: stats.totalUsers, sub: `${stats.totalPets} pets`, icon: Users, color: "from-pink-500 to-rose-400" },
    { label: "Avg rating", value: stats.avgRating ? stats.avgRating.toFixed(1) : "—", sub: `${stats.totalProducts} products`, icon: Star, color: "from-yellow-500 to-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Snapshot of operations</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
              <div className={cn("absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br opacity-15", k.color)} />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-2 font-display text-2xl font-bold">{k.value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-full border border-border bg-card p-1 text-sm">
        {(["overview", "appointments", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-medium capitalize transition-all",
              tab === t ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Upcoming appointments</h2>
            {appts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <ul className="space-y-2">
                {appts.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.services?.name} · {a.pets?.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider">{a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Recent orders</h2>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentOrders.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                    <div>
                      <p className="font-medium">${Number(o.total).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider">{o.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
            <h2 className="mb-3 font-display text-lg font-semibold">Quick links</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Link to="/shop" className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs hover:bg-secondary"><ShoppingBag className="h-5 w-5" />Shop</Link>
              <Link to="/calendar" className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs hover:bg-secondary"><Calendar className="h-5 w-5" />Calendar</Link>
              <Link to="/pets" className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs hover:bg-secondary"><PawPrint className="h-5 w-5" />Pets</Link>
              <Link to="/orders" className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs hover:bg-secondary"><Package className="h-5 w-5" />Orders</Link>
            </div>
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div className="space-y-3">
          {appts.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing scheduled.</p>}
          {appts.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{a.services?.name} · {a.pets?.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString()}</p>
                  {a.special_instructions && <p className="mt-1 text-xs text-muted-foreground">"{a.special_instructions}"</p>}
                  <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{a.status}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status !== "in_progress" && a.status !== "done" && <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "in_progress")}>Start</Button>}
                  {a.status !== "done" && <Button size="sm" onClick={() => setStatus(a.id, "done")}>Mark done</Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {recentOrders.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No recent orders.</p>}
          {recentOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">${Number(o.total).toFixed(2)} · {new Date(o.created_at).toLocaleString()}</p>
                <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{o.status}</span>
              </div>
              <div className="flex gap-2">
                {o.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => setOrderStatus(o.id, "shipped")}>Ship</Button>}
                {o.status === "shipped" && <Button size="sm" onClick={() => setOrderStatus(o.id, "delivered")}>Deliver</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
