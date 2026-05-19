import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PawPrint, Plus, Trash2, Syringe, Pill } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { WeightSection } from "@/components/WeightSection";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateRemindersForPet } from "@/lib/reminders";
import { toast } from "sonner";

export const Route = createFileRoute("/pets")({
  head: () => ({ meta: [{ title: "My Pets — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Pets /></AppShell></RequireAuth>),
});

interface Pet { id: string; name: string; species: string; breed: string | null; date_of_birth: string | null; weight_kg: number | null }
interface Vacc { id: string; vaccine_name: string; administered_on: string; next_due_on: string | null }
interface Treat { id: string; treatment_type: string; administered_on: string; next_due_on: string | null }

function Pets() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [vaccs, setVaccs] = useState<Vacc[]>([]);
  const [treats, setTreats] = useState<Treat[]>([]);

  const loadPets = async () => {
    if (!user) return;
    const { data } = await supabase.from("pets").select("*").eq("owner_id", user.id).order("created_at");
    setPets((data ?? []) as Pet[]);
    if (!selected && data && data.length) setSelected(data[0].id);
  };

  const loadRecords = async (petId: string) => {
    const [{ data: v }, { data: t }] = await Promise.all([
      supabase.from("vaccination_records").select("*").eq("pet_id", petId).order("administered_on", { ascending: false }),
      supabase.from("treatment_records").select("*").eq("pet_id", petId).order("administered_on", { ascending: false }),
    ]);
    setVaccs((v ?? []) as Vacc[]);
    setTreats((t ?? []) as Treat[]);
  };

  useEffect(() => { loadPets(); }, [user]);
  useEffect(() => { if (selected) loadRecords(selected); }, [selected]);

  const deletePet = async (id: string) => {
    if (!confirm("Delete this pet?")) return;
    await supabase.from("pets").delete().eq("id", id);
    setSelected(null);
    loadPets();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight">My Pets</h1>
        <AddPetDialog onSaved={loadPets} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {pets.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`rounded-2xl border p-4 text-left transition-colors ${selected === p.id ? "border-accent bg-secondary" : "border-border bg-card hover:bg-secondary/50"}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background"><PawPrint className="h-5 w-5 text-accent" /></div>
              <button onClick={(e) => { e.stopPropagation(); deletePet(p.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{p.name}</h3>
            <p className="text-xs text-muted-foreground">{p.species}{p.breed ? ` · ${p.breed}` : ""}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-6">
          <WeightSection petId={selected} petName={pets.find((p) => p.id === selected)?.name ?? "pet"} />
          <RecordsSection title="Vaccinations" icon={Syringe} petId={selected} userId={user!.id} table="vaccination_records" nameField="vaccine_name" records={vaccs} reload={() => loadRecords(selected)} />
          <RecordsSection title="Treatments (flea, tick, deworming)" icon={Pill} petId={selected} userId={user!.id} table="treatment_records" nameField="treatment_type" records={treats} reload={() => loadRecords(selected)} />
        </div>
      )}
    </div>
  );
}

function AddPetDialog({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [species, setSpecies] = useState("dog"); const [breed, setBreed] = useState(""); const [dob, setDob] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add pet</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a pet</DialogTitle></DialogHeader>
        <form onSubmit={async (e: FormEvent) => {
          e.preventDefault();
          if (!user) return;
          const { error } = await supabase.from("pets").insert({ owner_id: user.id, name, species, breed: breed || null, date_of_birth: dob || null });
          if (error) return toast.error(error.message);
          setOpen(false); setName(""); setBreed(""); setDob(""); onSaved();
        }} className="space-y-3">
          <div><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Species</Label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem><SelectItem value="cat">Cat</SelectItem><SelectItem value="rabbit">Rabbit</SelectItem><SelectItem value="bird">Bird</SelectItem><SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Breed</Label><Input value={breed} onChange={(e) => setBreed(e.target.value)} /></div>
          <div><Label>Date of birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordsSection({ title, icon: Icon, petId, userId, table, nameField, records, reload }: {
  title: string; icon: typeof Syringe; petId: string; userId: string; table: "vaccination_records" | "treatment_records"; nameField: "vaccine_name" | "treatment_type"; records: Array<Vacc | Treat>; reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [date, setDate] = useState(""); const [next, setNext] = useState("");
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Icon className="h-5 w-5 text-accent" /> {title}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" /> Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add record</DialogTitle></DialogHeader>
            <form onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              const row: Record<string, unknown> = { pet_id: petId, [nameField]: name, administered_on: date, next_due_on: next || null };
              const { error } = await supabase.from(table).insert(row as never);
              if (error) return toast.error(error.message);
              setOpen(false); setName(""); setDate(""); setNext("");
              reload();
              await generateRemindersForPet(userId, petId);
              toast.success("Saved & reminders updated");
            }} className="space-y-3">
              <div><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Administered on</Label><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label>Next due (optional)</Label><Input type="date" value={next} onChange={(e) => setNext(e.target.value)} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {records.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No records yet.</p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const n = (r as Vacc).vaccine_name ?? (r as Treat).treatment_type;
            return (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{n}</p>
                  <p className="text-xs text-muted-foreground">Given {new Date(r.administered_on).toLocaleDateString()}{r.next_due_on ? ` · next ${new Date(r.next_due_on).toLocaleDateString()}` : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
