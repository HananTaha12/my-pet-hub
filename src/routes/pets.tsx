import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PawPrint, Plus, Trash2, Syringe, Pill, FileText, Calendar, Scale, Clock } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { generateRemindersForPet } from "@/lib/reminders";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/pets")({
  head: () => ({ meta: [{ title: "My Pets — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Pets /></AppShell></RequireAuth>),
});

interface Pet { 
  id: string; 
  name: string; 
  species: string; 
  breed: string | null; 
  date_of_birth: string | null; 
  weight_kg: number | null; 
  notes?: string | null;
}
interface Vacc { id: string; vaccine_name: string; administered_on: string; next_due_on: string | null }
interface Treat { id: string; treatment_type: string; administered_on: string; next_due_on: string | null }

interface MedicalRecord {
  id: string;
  title: string;
  date: string;
  vetName: string;
  notes: string;
  status: "Completed" | "Follow-up Required" | "Ongoing";
}

const PET_IMAGE_MAP: Record<string, string> = {
  dog: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
  cat: "/oliver.jpg",
  bird: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&q=80&w=600",
  rabbit: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600",
  fish: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=600",
};

const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";

function calculateAge(dobString: string | null): string {
  if (!dobString) return "Unknown age";
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();
  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""} ${months > 0 ? `${months} month${months > 1 ? "s" : ""}` : ""}`;
  }
  return `${months} month${months > 1 ? "s" : ""}`;
}

function Pets() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [vaccs, setVaccs] = useState<Vacc[]>([]);
  const [treats, setTreats] = useState<Treat[]>([]);

  const loadPets = async () => {
    if (!user) return;
    const { data } = await supabase.from("pets").select("*").eq("owner_id", user.id).order("created_at");
    const petsData = (data ?? []) as Pet[];
    setPets(petsData);
    if (!selected && petsData.length) setSelected(petsData[0].id);
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

  // Deep linking logic from URL query parameter
  useEffect(() => {
    if (pets.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const petId = params.get("id");
      if (petId) {
        const found = pets.find(p => p.id === petId);
        if (found) {
          setSelected(petId);
        }
      }
    }
  }, [pets]);

  const deletePet = async (id: string) => {
    if (!confirm("Delete this pet?")) return;
    await supabase.from("pets").delete().eq("id", id);
    setSelected(null);
    loadPets();
  };

  const activePet = pets.find(p => p.id === selected);

  // Mock clinical diagnoses matching the caretakers records
  const mockMedicalHistory: MedicalRecord[] = [
    {
      id: "med-1",
      title: "Annual Wellness Checkup",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      vetName: "Dr. Sarah Jenkins",
      notes: "Heartrate and joints are normal. Prescribed preventative deworming. Nutrition optimal.",
      status: "Completed"
    },
    {
      id: "med-2",
      title: "Vaccination Booster Shot",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      vetName: "Dr. Alan Mercer",
      notes: "Administered DHPP core booster vaccine. Mild drowsiness expected for 24 hours.",
      status: "Completed"
    },
    {
      id: "med-3",
      title: "Dental Prophylaxis & Scaling",
      date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      vetName: "Dr. Sarah Jenkins",
      notes: "Removed plaque buildup. Gums healthy. Recommend dry food dental formula helper.",
      status: "Completed"
    }
  ];

  const exportPassport = () => {
    if (!activePet) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Pop-up blocked. Please enable pop-ups to export.");

    const vaccRows = vaccs.map(v => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${v.vaccine_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(v.administered_on).toLocaleDateString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${v.next_due_on ? new Date(v.next_due_on).toLocaleDateString() : '—'}</td>
      </tr>
    `).join("");

    const treatRows = treats.map(t => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${t.treatment_type}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(t.administered_on).toLocaleDateString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${t.next_due_on ? new Date(t.next_due_on).toLocaleDateString() : '—'}</td>
      </tr>
    `).join("");

    const diagRows = mockMedicalHistory.map(h => `
      <div style="margin-bottom: 15px; padding: 12px; border: 1px solid #eee; border-left: 4px solid #8B3A62; border-radius: 8px; background: #fafafa;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
          <span>${h.title}</span>
          <span style="color: #8B3A62; font-size: 11px;">${h.status}</span>
        </div>
        <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Vet: ${h.vetName} · Date: ${h.date}</div>
        <p style="margin: 0; font-size: 11px; line-height: 1.4;">${h.notes}</p>
      </div>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${activePet.name} - Health Passport</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #4D2C34; padding: 40px; background: #FFF; }
            .header { border-bottom: 2px solid #8B3A62; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 28px; font-weight: bold; color: #8B3A62; margin: 0; }
            .subtitle { font-size: 12px; color: #8B3A62; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-top: 5px; }
            .pet-profile { display: flex; gap: 20px; margin-bottom: 30px; }
            .pet-image { width: 100px; height: 100px; border-radius: 12px; object-fit: cover; border: 2px solid #EBC4D8; }
            .pet-info { display: grid; grid-template-cols: 250px 250px; gap: 10px; font-size: 13px; }
            .pet-info div span { font-weight: bold; color: #8B3A62; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #8B3A62; border-bottom: 1px solid #EBC4D8; padding-bottom: 8px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
            th { padding: 10px; background: #F5E1EC; font-weight: bold; color: #8B3A62; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">PETPAL HEALTH PASSPORT</h1>
              <div class="subtitle">Official Medical Care Record Certification</div>
            </div>
            <div style="font-size: 12px; font-weight: bold; text-align: right;">
              Companion Security ID<br/>
              <span style="color:#8B3A62; font-size:14px;">#PET-${activePet.id.substring(0,8).toUpperCase()}</span>
            </div>
          </div>

          <div class="pet-profile">
            <img src="${PET_IMAGE_MAP[activePet.species.toLowerCase()] || DEFAULT_PET_PHOTO}" class="pet-image" />
            <div class="pet-info">
              <div><span>Name:</span> ${activePet.name}</div>
              <div><span>Breed / Species:</span> ${activePet.breed || activePet.species}</div>
              <div><span>Calculated Age:</span> ${calculateAge(activePet.date_of_birth)}</div>
              <div><span>Recorded Weight:</span> ${activePet.weight_kg ? activePet.weight_kg + ' kg' : '—'}</div>
              <div><span>Date of Birth:</span> ${activePet.date_of_birth ? new Date(activePet.date_of_birth).toLocaleDateString() : '—'}</div>
              <div><span>Health Status:</span> Active (Verified Vitals)</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Immunization Records (Vaccinations)</h2>
            ${vaccRows.length > 0 ? `
              <table>
                <thead>
                  <tr><th>Vaccine Name</th><th>Administered On</th><th>Next Due Date</th></tr>
                </thead>
                <tbody>${vaccRows}</tbody>
              </table>
            ` : '<p style="font-size:12px; color:#666; font-style:italic;">No recorded immunizations.</p>'}
          </div>

          <div class="section">
            <h2 class="section-title">Parasite Control & Treatments</h2>
            ${treatRows.length > 0 ? `
              <table>
                <thead>
                  <tr><th>Treatment Type</th><th>Administered On</th><th>Next Due Date</th></tr>
                </thead>
                <tbody>${treatRows}</tbody>
              </table>
            ` : '<p style="font-size:12px; color:#666; font-style:italic;">No recorded treatment controls.</p>'}
          </div>

          <div class="section">
            <h2 class="section-title">Clinical Diagnostic Logs</h2>
            ${diagRows.length > 0 ? diagRows : '<p style="font-size:12px; color:#666; font-style:italic;">No logged diagnoses.</p>'}
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
            This document is generated by the PetPal Veterinary Health System on behalf of the registered caretaker.
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const careTimeline = [
    ...vaccs.map(v => ({
      date: new Date(v.administered_on),
      title: "Vaccinated 💉",
      desc: `Administered core vaccine: ${v.vaccine_name}.${v.next_due_on ? ` Next booster due: ${new Date(v.next_due_on).toLocaleDateString()}` : ""}`,
      icon: Syringe,
      color: "bg-pink-500"
    })),
    ...treats.map(t => ({
      date: new Date(t.administered_on),
      title: "Medication Administered 💊",
      desc: `Parasite treatment control: ${t.treatment_type}.${t.next_due_on ? ` Next dose due: ${new Date(t.next_due_on).toLocaleDateString()}` : ""}`,
      icon: Pill,
      color: "bg-rose-500"
    })),
    ...mockMedicalHistory.map(h => ({
      date: new Date(h.date),
      title: `Vet Visit Checkup 🩺`,
      desc: `${h.title} by ${h.vetName}. Notes: ${h.notes}`,
      icon: Calendar,
      color: "bg-amber-500"
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight">My Pets</h1>
        <AddPetDialog onSaved={loadPets} />
      </div>

      {/* Pet Quick Switcher Cards */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {pets.map((p) => {
          const isSelected = selected === p.id;
          const photo = PET_IMAGE_MAP[p.species.toLowerCase()] || DEFAULT_PET_PHOTO;

          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={cn(
                "group rounded-2xl border p-4 text-left hover-lift relative overflow-hidden flex items-center gap-4",
                isSelected 
                  ? "border-primary bg-secondary shadow-md" 
                  : "border-border bg-card hover:bg-secondary/40 hover:border-pink-200/50"
              )}
            >
              <img 
                src={photo} 
                alt={p.name} 
                className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-bold text-foreground truncate">{p.name}</h3>
                <p className="text-[11px] text-muted-foreground truncate uppercase font-semibold tracking-wider">
                  {p.breed || p.species}
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deletePet(p.id); }} 
                className="text-muted-foreground hover:text-destructive absolute right-3 top-3 p-1 rounded-full hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          );
        })}
      </div>

      {/* Active Pet Unified Record details */}
      {selected && activePet && (
        <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-md">
          
          {/* Cover Photo: colorful mesh gradient */}
          <div className="h-40 w-full bg-gradient-to-r from-primary/30 via-accent/30 to-rose-400/20 relative">
            <Button 
              size="sm" 
              onClick={exportPassport}
              className="absolute right-4 top-4 rounded-full bg-white/20 hover:bg-white/35 text-white border border-white/25 backdrop-blur-md text-[10px] font-black uppercase tracking-wider"
            >
              Export Passport (PDF)
            </Button>
            <div className="absolute -bottom-12 left-6 flex items-end gap-4">
              <img 
                src={PET_IMAGE_MAP[activePet.species.toLowerCase()] || DEFAULT_PET_PHOTO}
                alt={activePet.name}
                className="h-20 w-20 rounded-2xl object-cover border-4 border-card shadow-md bg-secondary"
              />
              <div className="mb-2">
                <h2 className="font-display text-xl font-bold text-foreground leading-none">{activePet.name}</h2>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-1">{activePet.breed || activePet.species}</p>
              </div>
            </div>
          </div>

          {/* Details Row */}
          <div className="pt-16 pb-6 px-6 border-b border-border/50 grid grid-cols-3 gap-4 text-center sm:text-left sm:flex sm:items-center sm:gap-12">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">AGE</span>
              <span className="text-sm font-semibold text-foreground">{calculateAge(activePet.date_of_birth)}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">WEIGHT</span>
              <span className="text-sm font-semibold text-foreground">{activePet.weight_kg ? `${activePet.weight_kg} kg` : "—"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">SPECIES</span>
              <span className="text-sm font-semibold text-foreground capitalize">{activePet.species}</span>
            </div>
          </div>

          {/* Medical Tabs Area */}
          <div className="p-6">
            <Tabs defaultValue="vaccinations" className="w-full">
              <TabsList className="w-full justify-start rounded-2xl bg-secondary/60 p-1 border border-border/30 mb-6 flex overflow-x-auto no-scrollbar">
                <TabsTrigger value="vaccinations" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5 shrink-0">
                  <Syringe className="h-3.5 w-3.5" /> Vaccinations
                </TabsTrigger>
                <TabsTrigger value="treatments" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5 shrink-0">
                  <Pill className="h-3.5 w-3.5" /> Treatments
                </TabsTrigger>
                <TabsTrigger value="weight" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5 shrink-0">
                  <Scale className="h-3.5 w-3.5" /> Weight History
                </TabsTrigger>
                <TabsTrigger value="diagnoses" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5 shrink-0">
                  <FileText className="h-3.5 w-3.5" /> Diagnoses Log
                </TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5 shrink-0">
                  <Clock className="h-3.5 w-3.5 animate-pulse" /> Pet Timeline
                </TabsTrigger>
              </TabsList>

              {/* Vaccinations Tab */}
              <TabsContent value="vaccinations" className="mt-0 focus-visible:outline-none">
                <RecordsSection 
                  title="Vaccinations" 
                  icon={Syringe} 
                  petId={selected} 
                  userId={user!.id} 
                  table="vaccination_records" 
                  nameField="vaccine_name" 
                  records={vaccs} 
                  reload={() => loadRecords(selected)} 
                />
              </TabsContent>

              {/* Treatments Tab */}
              <TabsContent value="treatments" className="mt-0 focus-visible:outline-none">
                <RecordsSection 
                  title="Parasite Treatments" 
                  icon={Pill} 
                  petId={selected} 
                  userId={user!.id} 
                  table="treatment_records" 
                  nameField="treatment_type" 
                  records={treats} 
                  reload={() => loadRecords(selected)} 
                />
              </TabsContent>

              {/* Weight Tab */}
              <TabsContent value="weight" className="mt-0 focus-visible:outline-none">
                <WeightSection petId={selected} petName={activePet.name} />
              </TabsContent>

              {/* Clinical Diagnoses Tab */}
              <TabsContent value="diagnoses" className="mt-0 focus-visible:outline-none space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <FileText className="h-5 w-5 text-accent" /> Clinical Diagnostics
                  </h2>
                </div>
                <div className="space-y-3">
                  {mockMedicalHistory.map((rec) => (
                    <div key={rec.id} className="rounded-2xl border border-border bg-card p-5 hover-lift space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{rec.title}</h4>
                          <span className="text-[10px] text-muted-foreground/80 font-medium">Vet: {rec.vetName} · {rec.date}</span>
                        </div>
                        <Badge variant="secondary" className="rounded-full bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px] tracking-wide uppercase px-2.5 py-0.5">
                          {rec.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1.5 border-t border-border/30">
                        {rec.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Pet Timeline Tab */}
              <TabsContent value="timeline" className="mt-0 focus-visible:outline-none space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <Clock className="h-5 w-5 text-accent" /> Care Timeline Feed
                  </h2>
                </div>
                {careTimeline.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    No timeline events recorded yet.
                  </p>
                ) : (
                  <div className="relative pl-8 border-l border-border/85 space-y-6 ml-4 mt-6">
                    {careTimeline.map((item, idx) => {
                      const I = item.icon;
                      return (
                        <div key={idx} className="relative group">
                          <div className={cn("absolute -left-[40px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background transition-transform duration-500 group-hover:scale-125 shadow-sm", item.color)} />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/50 rounded-2xl p-4 hover-lift">
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm tracking-tight text-foreground flex items-center gap-2">
                                <I className="h-4 w-4 text-pink-500 shrink-0" /> {item.title}
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                            <div className="text-[10px] font-bold text-pink-500 uppercase flex items-center gap-1 shrink-0 self-start sm:self-center bg-pink-500/5 px-2 py-0.5 rounded">
                              {item.date.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

            </Tabs>
          </div>

        </div>
      )}

    </div>
  );
}

function AddPetDialog({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); 
  const [species, setSpecies] = useState("dog"); 
  const [breed, setBreed] = useState(""); 
  const [dob, setDob] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full"><Plus className="mr-1 h-4 w-4" /> Add pet</Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Add a pet</DialogTitle>
        </DialogHeader>
        <form onSubmit={async (e: FormEvent) => {
          e.preventDefault();
          if (!user) return;
          const { error } = await supabase.from("pets").insert({ 
            owner_id: user.id, name, species, breed: breed || null, date_of_birth: dob || null 
          });
          if (error) return toast.error(error.message);
          setOpen(false); setName(""); setBreed(""); setDob(""); onSaved();
          toast.success("Pet successfully added!");
        }} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Name</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Species</Label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="rabbit">Rabbit</SelectItem>
                <SelectItem value="bird">Bird</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Breed</Label>
            <Input value={breed} onChange={(e) => setBreed(e.target.value)} className="rounded-xl" placeholder="e.g. Golden Retriever" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Date of birth</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-full py-5 font-bold mt-2">Save Pet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordsSection({ title, icon: Icon, petId, userId, table, nameField, records, reload }: {
  title: string; icon: typeof Syringe; petId: string; userId: string; table: "vaccination_records" | "treatment_records"; nameField: "vaccine_name" | "treatment_type"; records: Array<Vacc | Treat>; reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); 
  const [date, setDate] = useState(""); 
  const [next, setNext] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Icon className="h-5 w-5 text-accent" /> {title}
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full px-3"><Plus className="mr-1 h-3.5 w-3.5" /> Add Record</Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Add clinical record</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              const row: Record<string, unknown> = { pet_id: petId, [nameField]: name, administered_on: date, next_due_on: next || null };
              const { error } = await supabase.from(table).insert(row as never);
              if (error) return toast.error(error.message);
              setOpen(false); setName(""); setDate(""); setNext("");
              reload();
              await generateRemindersForPet(userId, petId);
              toast.success("Saved & reminders updated");
            }} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold font-display">Record Name</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="e.g. Rabies vaccine" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold font-display">Administered on</Label>
                <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold font-display">Next due (optional)</Label>
                <Input type="date" value={next} onChange={(e) => setNext(e.target.value)} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-full py-5 mt-2 font-bold">Save Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {records.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No recorded checkups or clinical entries.
        </p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const n = (r as Vacc).vaccine_name ?? (r as Treat).treatment_type;
            const nextDueStr = r.next_due_on ? ` · next due ${new Date(r.next_due_on).toLocaleDateString()}` : "";
            return (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-xs">
                <div>
                  <p className="font-semibold text-foreground">{n}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                    Given {new Date(r.administered_on).toLocaleDateString()}{nextDueStr}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
