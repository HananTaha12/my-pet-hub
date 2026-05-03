import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Bell, ShoppingBag, MessageCircle, PawPrint, Plus, Sparkles } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

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
  const [recs, setRecs] = useState<Product[]>([]);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("pets").select("id, name, species, breed").eq("owner_id", user.id);
      setPets((p ?? []) as Pet[]);
      const speciesList = (p ?? []).map((x) => x.species);
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price, image_url, species, featured")
        .eq("active", true)
        .or(speciesList.length ? `species.in.(${speciesList.join(",")}),species.eq.all,featured.eq.true` : "featured.eq.true")
        .limit(8);
      setRecs((prods ?? []) as Product[]);
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

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Hello{activePet ? `, ${activePet.name}'s human` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening today.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          { to: "/book", label: "Book", icon: Calendar },
          { to: "/shop", label: "Shop", icon: ShoppingBag },
          { to: "/reminders", label: "Reminders", icon: Bell },
          { to: "/chat", label: "Ask AI", icon: MessageCircle },
        ].map((q) => {
          const I = q.icon;
          return (
            <Link key={q.to} to={q.to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary">
              <div className="rounded-xl bg-secondary p-2"><I className="h-5 w-5 text-accent" /></div>
              <span className="font-medium">{q.label}</span>
            </Link>
          );
        })}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Your pets</h2>
          <Link to="/pets" className="text-sm text-muted-foreground hover:text-foreground">Manage</Link>
        </div>
        {pets.length === 0 ? (
          <Link to="/onboarding" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-sm text-muted-foreground hover:bg-secondary">
            <Plus className="h-4 w-4" /> Add your first pet
          </Link>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pets.map((p) => (
              <div key={p.id} className="min-w-[160px] rounded-2xl border border-border bg-card p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <PawPrint className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.species}{p.breed ? ` · ${p.breed}` : ""}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {activePet && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="font-display text-xl font-semibold">Recommended for {activePet.name}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recs.map((p) => (
              <Link key={p.id} to="/shop" className="group rounded-2xl border border-border bg-card p-3 hover:shadow-sm">
                {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" width={400} height={400} className="aspect-square w-full rounded-xl object-cover" />}
                <p className="mt-2 line-clamp-1 text-sm font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">${Number(p.price).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Upcoming appointments</h2>
            <Link to="/appointments" className="text-sm text-muted-foreground hover:text-foreground">All</Link>
          </div>
          <div className="space-y-2">
            {appts.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No upcoming appointments.</p>}
            {appts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{a.services?.name}</p>
                  <p className="text-xs text-muted-foreground">{a.pets?.name} · {new Date(a.scheduled_at).toLocaleString()}</p>
                </div>
                <Calendar className="h-4 w-4 text-accent" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Reminders</h2>
            <Link to="/reminders" className="text-sm text-muted-foreground hover:text-foreground">All</Link>
          </div>
          <div className="space-y-2">
            {reminders.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">All caught up.</p>}
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">Due {new Date(r.due_at).toLocaleDateString()}</p>
                </div>
                <Bell className="h-4 w-4 text-accent" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
