import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Staff Dashboard — PetPal" }] }),
  component: () => (<RequireAuth staffOnly><AppShell><Staff /></AppShell></RequireAuth>),
});

interface Appt { id: string; scheduled_at: string; status: string; special_instructions: string | null; services: { name: string } | null; pets: { name: string } | null; profiles: { full_name: string | null } | null }

function Staff() {
  const [items, setItems] = useState<Appt[]>([]);
  const load = async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setDate(end.getDate() + 7);
    const { data } = await supabase.from("appointments").select("id, scheduled_at, status, special_instructions, services(name), pets(name), profiles!appointments_owner_id_fkey(full_name)").gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString()).order("scheduled_at");
    // profiles join may not be set — fall back to plain query
    if (!data) {
      const { data: d2 } = await supabase.from("appointments").select("id, scheduled_at, status, special_instructions, services(name), pets(name)").gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString()).order("scheduled_at");
      setItems((d2 ?? []) as unknown as Appt[]);
    } else {
      setItems(data as unknown as Appt[]);
    }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Staff dashboard</h1>
      <p className="text-sm text-muted-foreground">Appointments — next 7 days</p>
      {items.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing scheduled.</p>}
      {items.map((a) => (
        <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
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
  );
}
