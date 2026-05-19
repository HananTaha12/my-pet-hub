import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Bell, Check, Plus, Pill, Syringe, Calendar as CalIcon, Utensils, Sparkles, X } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reminders")({
  head: () => ({ meta: [{ title: "Reminders — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Reminders /></AppShell></RequireAuth>),
});

interface Reminder { id: string; title: string; description: string | null; due_at: string; status: string; type: string }
interface Pet { id: string; name: string }

type ReminderType = "medication" | "vaccination" | "treatment" | "appointment" | "food_restock" | "other";

const TYPE_META: Record<ReminderType, { icon: typeof Bell; label: string; color: string }> = {
  medication: { icon: Pill, label: "Medication", color: "bg-rose-500/10 text-rose-500" },
  vaccination: { icon: Syringe, label: "Vaccination", color: "bg-emerald-500/10 text-emerald-500" },
  treatment: { icon: Sparkles, label: "Treatment", color: "bg-purple-500/10 text-purple-500" },
  appointment: { icon: CalIcon, label: "Appointment", color: "bg-blue-500/10 text-blue-500" },
  food_restock: { icon: Utensils, label: "Food", color: "bg-amber-500/10 text-amber-500" },
  other: { icon: Bell, label: "Reminder", color: "bg-muted text-muted-foreground" },
};

function Reminders() {
  const { user } = useAuth();
  const [items, setItems] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<"pending" | "done" | "all">("pending");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("reminders").select("*").eq("user_id", user.id).order("due_at");
    setItems((data ?? []) as Reminder[]);
  };
  useEffect(() => { load(); }, [user]);

  const mark = async (id: string, status: "done" | "snoozed" | "dismissed" | "pending") => {
    await supabase.from("reminders").update({ status }).eq("id", id);
    load();
  };

  const filtered = items.filter((r) => filter === "all" ? true : r.status === filter);
  const pending = items.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Reminders</h1>
          <p className="text-sm text-muted-foreground">{pending} pending</p>
        </div>
        <AddReminderDialog onSaved={load} />
      </div>

      <div className="flex gap-2">
        {(["pending", "done", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all",
              filter === f ? "bg-foreground text-background" : "bg-secondary/50 text-muted-foreground hover:bg-secondary",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing here. Tap "Add reminder" to schedule medication, food refills, or anything else.
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((r) => {
          const meta = TYPE_META[(r.type as ReminderType)] ?? TYPE_META.other;
          const Icon = meta.icon;
          const overdue = r.status === "pending" && new Date(r.due_at) < new Date();
          return (
            <div key={r.id} className={cn(
              "flex items-center justify-between rounded-2xl border bg-card p-4 transition-all",
              overdue ? "border-destructive/30 bg-destructive/5" : "border-border",
              r.status !== "pending" && "opacity-60",
            )}>
              <div className="flex items-start gap-3 min-w-0">
                <div className={cn("rounded-xl p-2.5 shrink-0", meta.color)}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-0.5">
                    {overdue && "⚠ Overdue · "}Due {new Date(r.due_at).toLocaleDateString()} · {meta.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {r.status === "pending" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => mark(r.id, "done")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => mark(r.id, "dismissed")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => mark(r.id, "pending")}>Undo</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddReminderDialog({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReminderType>("medication");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueTime, setDueTime] = useState("09:00");
  const [petId, setPetId] = useState<string>("");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">("none");

  useEffect(() => {
    if (!user || !open) return;
    supabase.from("pets").select("id, name").eq("owner_id", user.id).then(({ data }) => {
      setPets((data ?? []) as Pet[]);
    });
  }, [user, open]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const baseDue = new Date(`${dueDate}T${dueTime}:00`);
    const rows: Array<{ user_id: string; pet_id: string | null; title: string; description: string | null; type: ReminderType; due_at: string }> = [];
    const occurrences = repeat === "none" ? 1 : 12;
    for (let i = 0; i < occurrences; i++) {
      const d = new Date(baseDue);
      if (repeat === "daily") d.setDate(d.getDate() + i);
      else if (repeat === "weekly") d.setDate(d.getDate() + i * 7);
      else if (repeat === "monthly") d.setMonth(d.getMonth() + i);
      rows.push({
        user_id: user.id,
        pet_id: petId || null,
        title: title.trim(),
        description: description.trim() || null,
        type,
        due_at: d.toISOString(),
      });
    }
    const { error } = await supabase.from("reminders").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(repeat === "none" ? "Reminder added" : `${occurrences} reminders scheduled`);
    setOpen(false);
    setTitle(""); setDescription(""); setPetId(""); setRepeat("none");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> Add reminder</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New reminder</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Give Bella heart pill" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_META) as ReminderType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_META[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pet (optional)</Label>
              <Select value={petId || "_none"} onValueChange={(v) => setPetId(v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="No pet" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No pet</SelectItem>
                  {pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div><Label>Time</Label><Input type="time" required value={dueTime} onChange={(e) => setDueTime(e.target.value)} /></div>
          </div>
          <div>
            <Label>Repeat</Label>
            <Select value={repeat} onValueChange={(v) => setRepeat(v as typeof repeat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Once</SelectItem>
                <SelectItem value="daily">Daily (next 12 days)</SelectItem>
                <SelectItem value="weekly">Weekly (next 12 weeks)</SelectItem>
                <SelectItem value="monthly">Monthly (next 12 months)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Dosage, instructions, etc." />
          </div>
          <Button type="submit" className="w-full">Save reminder</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
