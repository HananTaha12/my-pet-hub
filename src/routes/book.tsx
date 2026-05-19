import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createNotification } from "@/lib/notify";
import { awardPoints } from "@/lib/loyalty";
import { toast } from "sonner";

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [{ title: "Book an appointment — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Book /></AppShell></RequireAuth>),
});

interface Service { id: string; name: string; description: string | null; duration_minutes: number; price: number }
interface Pet { id: string; name: string }

function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [petId, setPetId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<string>("");
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from("services").select("*").eq("active", true),
        supabase.from("pets").select("id, name").eq("owner_id", user.id),
      ]);
      setServices((s ?? []) as Service[]);
      setPets((p ?? []) as Pet[]);
      if (p?.length) setPetId(p[0].id);
      if (s?.length) setServiceId(s[0].id);
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      const start = new Date(`${date}T00:00:00`).toISOString();
      const end = new Date(`${date}T23:59:59`).toISOString();
      const { data } = await supabase.from("appointments").select("scheduled_at").gte("scheduled_at", start).lte("scheduled_at", end).neq("status", "cancelled");
      setTaken(new Set((data ?? []).map((a) => new Date(a.scheduled_at).toISOString())));
    })();
  }, [date]);

  const slots = useMemo(() => {
    const out: { iso: string; label: string }[] = [];
    for (let h = 9; h < 18; h++) {
      for (const m of [0, 30]) {
        const d = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
        out.push({ iso: d.toISOString(), label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
      }
    }
    return out;
  }, [date]);

  const submit = async () => {
    if (!user || !serviceId || !petId || !slot) return toast.error("Pick service, pet and a time slot");
    const { error } = await supabase.from("appointments").insert({
      owner_id: user.id, pet_id: petId, service_id: serviceId, scheduled_at: slot, special_instructions: notes || null,
    });
    if (error) return toast.error(error.message);
    const svc = services.find((s) => s.id === serviceId);
    const pet = pets.find((p) => p.id === petId);
    await Promise.all([
      createNotification({
        userId: user.id,
        title: "Appointment booked",
        body: `${svc?.name ?? "Service"} for ${pet?.name ?? "your pet"} on ${new Date(slot).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}. +50 pts!`,
        type: "appointment",
        link: "/appointments",
      }),
      awardPoints({ userId: user.id, points: 50, reason: `Booked ${svc?.name ?? "appointment"}` }),
    ]);
    toast.success("Appointment booked!");
    navigate({ to: "/appointments" });
  };

  if (pets.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Add a pet first to book an appointment.</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Book an appointment</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Service</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · ${Number(s.price).toFixed(0)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Pet</Label>
          <Select value={petId} onValueChange={setPetId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Date</Label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </div>
      <div>
        <Label>Time slot</Label>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((s) => {
            const isTaken = taken.has(s.iso);
            const active = slot === s.iso;
            return (
              <button key={s.iso} disabled={isTaken} onClick={() => setSlot(s.iso)}
                className={`rounded-lg border px-2 py-2 text-sm transition-colors ${isTaken ? "cursor-not-allowed border-border text-muted-foreground/40 line-through" : active ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-secondary"}`}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div><Label>Special instructions</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know?" /></div>
      <Button onClick={submit} className="w-full sm:w-auto">Confirm booking</Button>
    </div>
  );
}
