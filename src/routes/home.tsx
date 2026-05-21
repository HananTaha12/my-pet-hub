import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Bell, ShoppingBag, MessageCircle, PawPrint, Plus, Sparkles } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — PetPal" }] }),
  component: () => (
    <RequireAuth>
      <AppShell><HomePage /></AppShell>
    </RequireAuth>
  ),
});

interface Pet { id: string; name: string; species: string; breed: string | null }
interface Product { id: string; name: string; price: number; image_url: string | null; species: string | null }
interface Appt { id: string; scheduled_at: string; services: { name: string } | null; pets: { name: string } | null }
interface Reminder { id: string; title: string; due_at: string; type: string }

function HomePage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [recsBySpecies, setRecsBySpecies] = useState<Record<string, Product[]>>({});
  const [appts, setAppts] = useState<Appt[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("pets").select("id, name, species, breed").eq("owner_id", user.id);
      const petsData = (p ?? []) as Pet[];
      setPets(petsData);

      const speciesSet = Array.from(new Set(petsData.map((x) => x.species.toLowerCase())));
      if (speciesSet.length) {
        const map: Record<string, Product[]> = {};
        await Promise.all(
          speciesSet.map(async (sp) => {
            const { data: prods } = await supabase
              .from("products")
              .select("id, name, price, image_url, species")
              .eq("active", true)
              .ilike("species", sp)
              .limit(8);
            map[sp] = (prods ?? []) as Product[];
          }),
        );
        setRecsBySpecies(map);
      }

      const { data: a } = await supabase
        .from("appointments")
        .select("id, scheduled_at, services(name), pets(name)")
        .eq("owner_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at")
        .limit(3);
      setAppts((a ?? []) as unknown as Appt[]);
      const { data: r } = await supabase
        .from("reminders")
        .select("id, title, due_at, type")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("due_at")
        .limit(5);
      setReminders((r ?? []) as Reminder[]);
    })();
  }, [user]);

  const activePet = pets[0];
  const seenSpecies = new Set<string>();
  const petsForRecs = pets.filter((p) => {
    const sp = p.species.toLowerCase();
    if (seenSpecies.has(sp)) return false;
    seenSpecies.add(sp);
    return true;
  });

  return (    <div className="space-y-10 transition-all duration-700 animate-in fade-in zoom-in-95">
      <section className="relative overflow-hidden rounded-3xl bg-foreground p-8 text-background shadow-2xl">
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Hello{activePet ? `, ${activePet.name}'s human` : ""} 👋
          </h1>
          <p className="mt-2 text-background/70 font-medium tracking-wide uppercase text-[10px]">Your daily summary · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
      </section>

      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { to: "/book", label: "Book", icon: Calendar, color: "bg-blue-500/10 text-blue-500" },
          { to: "/shop", label: "Shop", icon: ShoppingBag, color: "bg-emerald-500/10 text-emerald-500" },
          { to: "/reminders", label: "Care", icon: Bell, color: "bg-orange-500/10 text-orange-500" },
          { to: "/chat", label: "Ask AI", icon: MessageCircle, color: "bg-purple-500/10 text-purple-500" },
        ].map((q) => {
          const I = q.icon;
          return (
            <Link key={q.to} to={q.to} className="group flex flex-col items-center gap-2 rounded-[2rem] glass-card p-6 transition-all duration-500 hover:scale-105 hover:bg-background/80 hover:shadow-xl">
              <div className={cn("rounded-2xl p-3 transition-transform duration-500 group-hover:rotate-12", q.color)}>
                <I className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">{q.label}</span>
            </Link>
          );
        })}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between px-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Your pets</h2>
          <Link to="/pets" className="rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground hover:text-background">Manage</Link>
        </div>
        {pets.length === 0 ? (
          <Link to="/onboarding" className="flex h-48 flex-col items-center justify-center gap-3 rounded-[2.5rem] border-2 border-dashed border-border p-8 text-sm text-muted-foreground transition-all hover:bg-secondary hover:border-accent/40">
            <div className="rounded-full bg-secondary p-4"><Plus className="h-6 w-6 text-accent" /></div>
            Add your first pet
          </Link>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {pets.map((p: Pet) => (
              <div key={p.id} className="group relative min-w-[200px] overflow-hidden rounded-[2.5rem] glass-card p-6 transition-all duration-500 hover:shadow-2xl">
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/5 transition-all duration-700 group-hover:scale-150" />
                <div className="relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <PawPrint className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{p.name}</h3>
                  <p className="text-xs font-medium text-muted-foreground/80">{p.species}{p.breed ? ` · ${p.breed}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {petsForRecs.map((pet) => {
        const sp = pet.species.toLowerCase();
        const list = recsBySpecies[sp] ?? [];
        return (
          <section key={pet.id}>
            <div className="mb-4 flex items-center gap-2 px-2">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
              <h2 className="font-display text-2xl font-semibold tracking-tight text-glow">
                Recommended for {pet.name} <span className="text-sm font-normal text-muted-foreground/70">· {pet.species}</span>
              </h2>
            </div>
            {list.length === 0 ? (
              <p className="rounded-[2rem] glass-card p-8 text-center text-sm text-muted-foreground/60 italic">
                No {pet.species} products available yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {list.map((p: Product) => {
                  let displayImage = p.image_url;
                  if (!displayImage) {
                    const name = p.name.toLowerCase();
                    if (name.includes("dog food")) displayImage = "/products/dog-food.png";
                    else if (name.includes("cat food")) displayImage = "/products/cat-food.png";
                    else if (name.includes("bed")) displayImage = "/products/bed.png";
                    else if (name.includes("shampoo")) displayImage = "/products/shampoo.png";
                    else if (name.includes("biscuit")) displayImage = "/products/dog-food.png";
                    else if (name.includes("collar") || name.includes("scratching") || name.includes("ball")) displayImage = "/products/bed.png";
                  }
                  return (
                    <Link key={p.id} to="/shop" className="group rounded-[2rem] glass-card p-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
                      <div className="relative overflow-hidden rounded-[1.5rem] bg-secondary/50">
                        {displayImage ? (
                          <img src={displayImage} alt={p.name} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="flex aspect-square w-full items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      </div>
                      <div className="px-1">
                        <p className="mt-4 line-clamp-1 text-sm font-semibold tracking-tight">{p.name}</p>
                        <p className="text-sm font-bold text-accent">${Number(p.price).toFixed(2)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Schedule</h2>
            <Link to="/appointments" className="text-xs font-bold uppercase tracking-widest text-accent hover:opacity-80">View Calendar</Link>
          </div>
          <div className="space-y-3">
            {appts.length === 0 && <p className="rounded-[2rem] glass-card p-12 text-center text-sm text-muted-foreground/60 italic">No upcoming appointments.</p>}
            {appts.map((a: Appt) => (
              <div key={a.id} className="group flex items-center justify-between rounded-[1.5rem] glass-card p-5 transition-all duration-300 hover:bg-background/80 hover:translate-x-1">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500"><Calendar className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold tracking-tight">{a.services?.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{a.pets?.name} · {new Date(a.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Health Care</h2>
            <Link to="/reminders" className="text-xs font-bold uppercase tracking-widest text-accent hover:opacity-80">Check All</Link>
          </div>
          <div className="space-y-3">
            {reminders.length === 0 && <p className="rounded-[2rem] glass-card p-12 text-center text-sm text-muted-foreground/60 italic">All caught up.</p>}
            {reminders.map((r: Reminder) => (
              <div key={r.id} className="group flex items-center justify-between rounded-[1.5rem] glass-card p-5 transition-all duration-300 hover:bg-background/80 hover:translate-x-1">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500"><Bell className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold tracking-tight">{r.title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Due {new Date(r.due_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-accent" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
