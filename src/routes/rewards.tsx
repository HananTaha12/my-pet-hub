import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { fetchPointsBalance, fetchPointsHistory, tierFor } from "@/lib/loyalty";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Gift, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/rewards")({
  head: () => ({ meta: [{ title: "Rewards — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Rewards /></AppShell></RequireAuth>),
});

function Rewards() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof fetchPointsHistory>>>([]);

  // Achievements state based on DB records
  const [hasVaccines, setHasVaccines] = useState(false);
  const [hasMultiplePets, setHasMultiplePets] = useState(false);
  const [hasAdultPet, setHasAdultPet] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setPoints(await fetchPointsBalance(user.id));
      setHistory(await fetchPointsHistory(user.id));

      try {
        // Fetch pets to check achievements
        const { data: p } = await supabase.from("pets").select("id, date_of_birth").eq("owner_id", user.id);
        const petsList = p ?? [];
        setHasMultiplePets(petsList.length >= 2);
        
        const hasAdult = petsList.some(pet => {
          if (!pet.date_of_birth) return false;
          const diff = Date.now() - new Date(pet.date_of_birth).getTime();
          return diff > 365 * 24 * 60 * 60 * 1000;
        });
        setHasAdultPet(hasAdult);

        // Check if any pet has vaccination records
        if (petsList.length > 0) {
          const petIds = petsList.map(pet => pet.id);
          const { count } = await supabase
            .from("vaccination_records")
            .select("*", { count: "exact", head: true })
            .in("pet_id", petIds);
          setHasVaccines((count ?? 0) > 0);
        }
      } catch (err) {
        console.error("Error loading achievement metrics:", err);
      }
    })();
  }, [user]);

  const tier = tierFor(points);
  const progress = tier.next ? Math.min(100, (points / tier.next) * 100) : 100;

  return (
    <div className="space-y-8 pb-12 transition-all duration-500 animate-in fade-in">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Rewards & Achievements</h1>
        <p className="text-sm text-muted-foreground mt-1">Earn loyalty points, lock accomplishments, and unlock treat benefits.</p>
      </div>

      <div className={cn("relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br p-8 text-white shadow-xl border border-white/10", tier.color)}>
        <Sparkles className="absolute -right-4 -top-4 h-32 w-32 opacity-10" />
        <p className="text-xs font-black uppercase tracking-widest opacity-80">{tier.name} member</p>
        <p className="mt-2 font-display text-6xl font-bold tracking-tighter">{points.toLocaleString()}</p>
        <p className="text-sm font-semibold opacity-90">Total Balance Points</p>
        {tier.next && (
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs font-bold opacity-90">
              <span>{tier.next - points} pts to next tier ({tier.next})</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Upgraded Achievements Section */}
      <div className="rounded-[2rem] border border-border/50 bg-card/60 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent animate-pulse" />
          <h2 className="font-display text-xl font-bold">Loyalty Badges & Achievements</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { id: "vax", title: "First Vaccination 🏆", desc: "Log your pet's first core vaccine injection to activate protection status.", unlocked: hasVaccines },
            { id: "parent", title: "Active Pet Parent 🎖️", desc: "Register at least 2 companion pet profiles in your account workspace.", unlocked: hasMultiplePets },
            { id: "health", title: "One Year Healthy ⭐", desc: "Log daily weight and reminder logs for a mature adult pet (> 1 year).", unlocked: hasAdultPet }
          ].map((ach) => (
            <div 
              key={ach.id} 
              className={cn(
                "relative p-5 rounded-2xl border transition-all duration-500 flex flex-col items-center text-center space-y-2 hover:scale-[1.02]",
                ach.unlocked 
                  ? "border-amber-400/40 bg-amber-400/5 shadow-md shadow-amber-400/5" 
                  : "border-border bg-muted/10 opacity-60"
              )}
            >
              <h3 className="font-bold text-sm text-foreground/95">{ach.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{ach.desc}</p>
              <Badge variant={ach.unlocked ? "default" : "secondary"} className="rounded-xl text-[9px] font-black uppercase tracking-wider mt-1 px-2.5">
                {ach.unlocked ? "UNLOCKED 🎉" : "LOCKED 🔒"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards items */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Available Benefits</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { pts: 100, label: "Free treat box", icon: Gift },
            { pts: 250, label: "10% off grooming", icon: Gift },
            { pts: 500, label: "Free vet check-up", icon: Gift },
          ].map((r) => {
            const locked = points < r.pts;
            const Icon = r.icon;
            return (
              <div key={r.pts} className={cn("rounded-2xl border p-5 transition-all hover:shadow-md", locked ? "border-border bg-card opacity-60" : "border-primary bg-primary/5")}>
                <Icon className={cn("h-6 w-6", locked ? "text-muted-foreground" : "text-primary")} />
                <p className="mt-3 text-sm font-bold text-foreground/90">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.pts} points required</p>
                <Badge variant={locked ? "secondary" : "default"} className="rounded-xl text-[9px] font-black uppercase mt-3">
                  {locked ? "Locked" : "Claimable"}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loyalty history */}
      <div className="rounded-[2rem] border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-bold">Activity Logs</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-6">No points accumulated yet. Schedule vet visits or buy supplies to earn! 🍖</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-3 text-sm transition-colors hover:bg-secondary/10 px-2 rounded-lg">
                <div>
                  <p className="font-semibold text-foreground/90">{h.reason}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(h.created_at).toLocaleDateString()}</p>
                </div>
                <span className={cn("font-bold text-base", h.points >= 0 ? "text-emerald-500" : "text-destructive")}>
                  {h.points >= 0 ? "+" : ""}{h.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="rounded-xl bg-secondary/50 p-4 text-xs text-muted-foreground border border-border/40">
        📌 **Loyalty Rules:** Earn 1 points for every $1 spent in our Shop, and +50 points for every scheduling appointment booked successfully.
      </p>
    </div>
  );
}
