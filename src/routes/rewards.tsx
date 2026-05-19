import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { fetchPointsBalance, fetchPointsHistory, tierFor } from "@/lib/loyalty";
import { Sparkles, Gift, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rewards")({
  head: () => ({ meta: [{ title: "Rewards — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Rewards /></AppShell></RequireAuth>),
});

function Rewards() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof fetchPointsHistory>>>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setPoints(await fetchPointsBalance(user.id));
      setHistory(await fetchPointsHistory(user.id));
    })();
  }, [user]);

  const tier = tierFor(points);
  const progress = tier.next ? Math.min(100, (points / tier.next) * 100) : 100;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Rewards</h1>

      <div className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl", tier.color)}>
        <Sparkles className="absolute -right-4 -top-4 h-32 w-32 opacity-10" />
        <p className="text-xs font-bold uppercase tracking-widest opacity-80">{tier.name} member</p>
        <p className="mt-2 font-display text-5xl font-bold">{points.toLocaleString()}</p>
        <p className="text-sm opacity-90">points</p>
        {tier.next && (
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs opacity-90">
              <span>{tier.next - points} pts to next tier</span>
              <span>{tier.next}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { pts: 100, label: "Free treat box", icon: Gift },
          { pts: 250, label: "10% off grooming", icon: Gift },
          { pts: 500, label: "Free vet check-up", icon: Gift },
        ].map((r) => {
          const locked = points < r.pts;
          const Icon = r.icon;
          return (
            <div key={r.pts} className={cn("rounded-2xl border p-4", locked ? "border-border bg-card opacity-60" : "border-accent bg-accent/5")}>
              <Icon className={cn("h-5 w-5", locked ? "text-muted-foreground" : "text-accent")} />
              <p className="mt-2 text-sm font-semibold">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.pts} pts</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className="font-display text-lg font-semibold">Activity</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Book a service or place an order to earn points!</p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{h.reason}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                </div>
                <span className={cn("font-semibold", h.points >= 0 ? "text-green-600" : "text-destructive")}>
                  {h.points >= 0 ? "+" : ""}{h.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
        Earn 1 point per $1 spent, +50 points per appointment booked.
      </p>
    </div>
  );
}
