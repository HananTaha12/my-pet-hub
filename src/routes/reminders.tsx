import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reminders")({
  head: () => ({ meta: [{ title: "Reminders — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Reminders /></AppShell></RequireAuth>),
});

interface Reminder { id: string; title: string; description: string | null; due_at: string; status: string; type: string }

function Reminders() {
  const { user } = useAuth();
  const [items, setItems] = useState<Reminder[]>([]);
  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("reminders").select("*").eq("user_id", user.id).order("due_at");
    setItems((data ?? []) as Reminder[]);
  };
  useEffect(() => { load(); }, [user]);

  const mark = async (id: string, status: "done" | "snoozed" | "dismissed") => {
    await supabase.from("reminders").update({ status }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Reminders</h1>
      {items.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">All caught up — add vaccination or treatment records to generate reminders.</p>}
      {items.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-secondary p-2"><Bell className="h-4 w-4 text-accent" /></div>
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">Due {new Date(r.due_at).toLocaleDateString()} · {r.status}</p>
            </div>
          </div>
          {r.status === "pending" && (
            <Button size="sm" variant="outline" onClick={() => mark(r.id, "done")}><Check className="mr-1 h-4 w-4" /> Done</Button>
          )}
        </div>
      ))}
    </div>
  );
}
