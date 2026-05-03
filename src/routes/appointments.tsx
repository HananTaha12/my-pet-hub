import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: "Appointments — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Appts /></AppShell></RequireAuth>),
});

interface Appt { id: string; scheduled_at: string; status: string; special_instructions: string | null; services: { name: string } | null; pets: { name: string } | null }

function Appts() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appt[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("appointments").select("id, scheduled_at, status, special_instructions, services(name), pets(name)").eq("owner_id", user.id).order("scheduled_at", { ascending: false });
    setItems((data ?? []) as unknown as Appt[]);
  };
  useEffect(() => { load(); }, [user]);

  const cancel = async (id: string, when: string) => {
    if (new Date(when).getTime() - Date.now() < 4 * 60 * 60 * 1000) return toast.error("Can only cancel ≥ 4 hours before");
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    toast.success("Cancelled");
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Appointments</h1>
      {items.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No appointments yet.</p>}
      {items.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="font-medium">{a.services?.name}</p>
            <p className="text-xs text-muted-foreground">{a.pets?.name} · {new Date(a.scheduled_at).toLocaleString()}</p>
            {a.special_instructions && <p className="mt-1 text-xs text-muted-foreground">"{a.special_instructions}"</p>}
            <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{a.status}</span>
          </div>
          {a.status !== "cancelled" && a.status !== "done" && (
            <Button variant="outline" size="sm" onClick={() => cancel(a.id, a.scheduled_at)}>Cancel</Button>
          )}
        </div>
      ))}
    </div>
  );
}
