import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, DollarSign, Package, Users, TrendingUp, ShoppingBag, PawPrint, Star, Search, FileText, Pill, Syringe, Scale, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Admin Dashboard — PetPal" }] }),
  component: () => (<RequireAuth staffOnly><AppShell><Staff /></AppShell></RequireAuth>),
});

interface Appt {
  id: string;
  scheduled_at: string;
  status: string;
  special_instructions: string | null;
  services: { name: string } | null;
  pets: { id: string; name: string; species: string; breed: string | null; date_of_birth: string | null; notes: string | null } | null;
}
type ApptStatus = "pending" | "confirmed" | "in_progress" | "done" | "cancelled";

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  user_id: string;
}

interface Stats {
  todayAppts: number;
  weekAppts: number;
  totalUsers: number;
  totalPets: number;
  totalProducts: number;
  ordersToday: number;
  revenueToday: number;
  revenueWeek: number;
  pendingOrders: number;
  avgRating: number;
}

interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  date_of_birth: string | null;
  weight_kg: number | null;
  notes: string | null;
}

interface MedicalRecord {
  id: string;
  title: string;
  date: string;
  vetName: string;
  notes: string;
  status: "Completed" | "Follow-up Required" | "Ongoing";
}

const MOCK_REVENUE_DATA = [
  { month: "Jan", clinical: 1200, product: 800 },
  { month: "Feb", clinical: 1500, product: 950 },
  { month: "Mar", clinical: 1800, product: 1100 },
  { month: "Apr", clinical: 2200, product: 1300 },
  { month: "May", clinical: 2600, product: 1550 },
  { month: "Jun", clinical: 3100, product: 1850 },
];

function Staff() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayAppts: 0, weekAppts: 0, totalUsers: 0, totalPets: 0,
    totalProducts: 0, ordersToday: 0, revenueToday: 0, revenueWeek: 0,
    pendingOrders: 0, avgRating: 0,
  });
  const [tab, setTab] = useState<"overview" | "appointments" | "orders" | "patients">("overview");

  // Vets patient logs states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPet, setSelectedPet] = useState<Patient | null>(null);

  // New diagnosis form state
  const [diagTitle, setDiagTitle] = useState("");
  const [diagNotes, setDiagNotes] = useState("");
  const [diagStatus, setDiagStatus] = useState<"Completed" | "Follow-up Required" | "Ongoing">("Completed");
  const [diagDialogOpen, setDiagDialogOpen] = useState(false);

  const load = async () => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAhead = new Date(now); weekAhead.setDate(weekAhead.getDate() + 7);

    const [
      { data: apptData },
      { data: orderData },
      { count: userCount },
      { count: petCount },
      { count: productCount },
      { data: todayOrders },
      { data: weekOrders },
      { count: pendingCount },
      { data: ratings },
      { data: allPets },
    ] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_at, status, special_instructions, services(name), pets(*)")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", weekAhead.toISOString())
        .order("scheduled_at"),
      supabase.from("orders")
        .select("id, total, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("pets").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("orders").select("total").gte("created_at", startOfDay.toISOString()).lte("created_at", endOfDay.toISOString()),
      supabase.from("orders").select("total").gte("created_at", weekAgo.toISOString()),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
      supabase.from("product_reviews").select("rating"),
      supabase.from("pets").select("*").order("name"),
    ]);

    const appointments = (apptData ?? []) as unknown as Appt[];
    setAppts(appointments);
    setRecentOrders((orderData ?? []) as Order[]);
    setPatients((allPets ?? []) as Patient[]);

    const todayAppts = appointments.filter(
      (a) => new Date(a.scheduled_at) <= endOfDay && a.status !== "cancelled"
    ).length;
    const revenueToday = (todayOrders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
    const revenueWeek = (weekOrders ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
    const avgRating = ratings && ratings.length > 0
      ? ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length
      : 0;

    setStats({
      todayAppts,
      weekAppts: appointments.filter((a) => a.status !== "cancelled").length,
      totalUsers: userCount ?? 0,
      totalPets: petCount ?? 0,
      totalProducts: productCount ?? 0,
      ordersToday: (todayOrders ?? []).length,
      revenueToday,
      revenueWeek,
      pendingOrders: pendingCount ?? 0,
      avgRating,
    });
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: ApptStatus) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Appointment status updated");
    load();
  };

  const setOrderStatus = async (id: string, status: "confirmed" | "processing" | "shipped" | "delivered" | "cancelled") => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order status updated");
    load();
  };

  const savePatientNote = async (pet: Patient) => {
    if (!diagTitle.trim() || !diagNotes.trim()) return toast.error("Please fill in diagnosis details");
    
    let existingNotes = [];
    if (pet.notes) {
      try {
        const parsed = JSON.parse(pet.notes);
        if (Array.isArray(parsed)) existingNotes = parsed;
      } catch (e) {
        if (pet.notes.trim()) {
          existingNotes = [{
            id: "legacy",
            title: "General Medical Note",
            date: pet.date_of_birth || new Date().toISOString().slice(0, 10),
            vetName: "Primary Vet",
            notes: pet.notes,
            status: "Completed"
          }];
        }
      }
    }

    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      title: diagTitle,
      date: new Date().toISOString().slice(0, 10),
      vetName: "Dr. Sarah Connor (PetPal Vet)",
      notes: diagNotes,
      status: diagStatus,
    };

    const updated = [newRecord, ...existingNotes];
    const { error } = await supabase.from("pets").update({ notes: JSON.stringify(updated) }).eq("id", pet.id);
    if (error) return toast.error(error.message);
    
    toast.success(`Clinical notes added to ${pet.name}'s medical record! 🏥`);
    setDiagTitle("");
    setDiagNotes("");
    setDiagStatus("Completed");
    setDiagDialogOpen(false);
    setSelectedPet(null);
    load();
  };

  const kpis = [
    { label: "Revenue today", value: `$${stats.revenueToday.toFixed(2)}`, sub: `${stats.ordersToday} orders`, icon: DollarSign, color: "from-emerald-500 to-teal-400" },
    { label: "Revenue (7d)", value: `$${stats.revenueWeek.toFixed(2)}`, sub: "rolling week", icon: TrendingUp, color: "from-violet-500 to-fuchsia-400" },
    { label: "Today's bookings", value: stats.todayAppts, sub: `${stats.weekAppts} this week`, icon: Calendar, color: "from-blue-500 to-cyan-400" },
    { label: "Pending orders", value: stats.pendingOrders, sub: "awaiting action", icon: Package, color: "from-amber-500 to-orange-400" },
    { label: "Customers", value: stats.totalUsers, sub: `${stats.totalPets} pets`, icon: Users, color: "from-pink-500 to-rose-400" },
    { label: "Avg rating", value: stats.avgRating ? stats.avgRating.toFixed(1) : "—", sub: `${stats.totalProducts} products`, icon: Star, color: "from-yellow-500 to-amber-400" },
  ];

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      (p.breed && p.breed.toLowerCase().includes(patientSearch.toLowerCase()))
    );
  }, [patients, patientSearch]);

  return (
    <div className="space-y-8 pb-12 transition-all duration-500 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Vet Clinic ERP</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage clinical checkups, patient histories, and clinic revenue breakdowns.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="rounded-xl">Refresh Logs</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="relative overflow-hidden rounded-[1.8rem] border border-border bg-card p-5">
              <div className={cn("absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br opacity-10", k.color)} />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-3 font-display text-3xl font-bold tracking-tight">{k.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">{k.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 rounded-full border border-border bg-card p-1.5 text-sm max-w-lg">
        {([
          { id: "overview", label: "Overview" },
          { id: "appointments", label: "Today's Clinic" },
          { id: "orders", label: "Supply Orders" },
          { id: "patients", label: "Patient Lookup" }
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all duration-300",
              tab === t.id ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TabContent: Overview with Revenue Graphs */}
      {tab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Revenue Breakdown Recharts Graph */}
          <div className="rounded-[2.5rem] border border-border bg-card p-6 md:col-span-2">
            <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-1.5">
              <TrendingUp className="h-5 w-5 text-accent" /> Revenue Breakdown (Rolling 6 Months)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_REVENUE_DATA} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.75rem",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="clinical" name="Clinical Vet visits" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="product" name="Product sales" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-lg font-bold">Upcoming Appointments</h2>
            {appts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nothing scheduled today.</p>
            ) : (
              <ul className="space-y-2">
                {appts.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/20 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{a.services?.name} · {a.pets?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.scheduled_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-xl text-[9px] uppercase tracking-wider">{a.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-[2.2rem] border border-border bg-card p-5">
            <h2 className="mb-3 font-display text-lg font-bold">Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No orders logged.</p>
            ) : (
              <ul className="space-y-2">
                {recentOrders.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/20 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-foreground/90">${Number(o.total).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="rounded-xl text-[9px] uppercase tracking-wider">{o.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* TabContent: Appointments (Vet Patient consultations) */}
      {tab === "appointments" && (
        <div className="space-y-4">
          {appts.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing scheduled today.</p>}
          {appts.map((a) => (
            <div key={a.id} className="rounded-3xl border border-border/50 bg-card/60 p-5 transition-all hover:bg-card">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground/95">{a.services?.name}</h3>
                    <Badge variant={a.status === "done" ? "secondary" : "outline"} className="rounded-xl uppercase text-[9px] tracking-wider font-black">
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Patient: <span className="font-semibold text-foreground/80">{a.pets?.name} ({a.pets?.species})</span></p>
                  <p className="text-xs text-muted-foreground">Date: {new Date(a.scheduled_at).toLocaleString()}</p>
                  {a.special_instructions && (
                    <p className="text-xs text-muted-foreground/80 bg-muted/40 rounded-xl p-3 border border-border/20 italic">
                      "{a.special_instructions}"
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {a.status !== "in_progress" && a.status !== "done" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "in_progress")} className="rounded-xl">
                      Start Visit
                    </Button>
                  )}
                  {a.status === "in_progress" && a.pets && (
                    <Dialog open={diagDialogOpen} onOpenChange={setDiagDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedPet(a.pets as never)} className="rounded-xl shadow-md">
                          Write Diagnosis Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-display text-xl">Consultation: {a.pets.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          <div className="space-y-1">
                            <Label>Record Title</Label>
                            <Input required value={diagTitle} onChange={(e) => setDiagTitle(e.target.value)} placeholder="e.g. Ear Infection Treatment, Vaccination shot" className="rounded-xl" />
                          </div>
                          <div className="space-y-1">
                            <Label>Visit Status</Label>
                            <Select value={diagStatus} onValueChange={(v) => setDiagStatus(v as never)}>
                              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="Completed">Completed Checkup</SelectItem>
                                <SelectItem value="Follow-up Required">Follow-up Required</SelectItem>
                                <SelectItem value="Ongoing">Ongoing Treatment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label>Clinical Notes & Prescriptions</Label>
                            <textarea 
                              required
                              value={diagNotes}
                              onChange={(e) => setDiagNotes(e.target.value)}
                              placeholder="Clinical diagnoses, prescribed medicine, dosages..."
                              className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            />
                          </div>
                          <Button onClick={() => selectedPet && savePatientNote(selectedPet)} className="w-full rounded-xl py-6 mt-2">
                            Save Clinical Record
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {a.status !== "done" && (
                    <Button size="sm" onClick={() => setStatus(a.id, "done")} className="rounded-xl">
                      Mark Completed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TabContent: Orders */}
      {tab === "orders" && (
        <div className="space-y-4">
          {recentOrders.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No recent orders.</p>}
          {recentOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-3xl border border-border bg-card p-5">
              <div>
                <p className="font-bold text-sm">Order #{o.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">${Number(o.total).toFixed(2)} · {new Date(o.created_at).toLocaleString()}</p>
                <Badge variant="secondary" className="rounded-xl text-[9px] uppercase tracking-wider mt-1">{o.status}</Badge>
              </div>
              <div className="flex gap-2">
                {o.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => setOrderStatus(o.id, "shipped")} className="rounded-xl">Ship Packages</Button>}
                {o.status === "shipped" && <Button size="sm" onClick={() => setOrderStatus(o.id, "delivered")} className="rounded-xl">Deliver Packages</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TabContent: Patient Lookup & History searches */}
      {tab === "patients" && (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search patients by name or breed..."
              className="h-14 rounded-full border-none bg-secondary/50 pl-12 text-sm focus-visible:ring-primary shadow-inner"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((pet) => {
              let parsedRecords: MedicalRecord[] = [];
              if (pet.notes) {
                try {
                  const parsed = JSON.parse(pet.notes);
                  if (Array.isArray(parsed)) parsedRecords = parsed;
                } catch (e) {}
              }
              const isAdult = pet.date_of_birth ? (Date.now() - new Date(pet.date_of_birth).getTime() > 365*24*60*60*1000) : false;
              
              return (
                <div key={pet.id} className="rounded-3xl border border-border/50 bg-card p-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <PawPrint className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground/90">{pet.name}</h3>
                        <p className="text-[10px] text-muted-foreground capitalize">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-muted-foreground/90 space-y-1 pt-1 border-t border-border/10">
                      <p>⚖️ Weight: {pet.weight_kg ? `${pet.weight_kg} kg` : "N/A"}</p>
                      <p>🎂 Age: {pet.date_of_birth ? new Date(pet.date_of_birth).toLocaleDateString() : "N/A"} ({isAdult ? "Adult" : "Puppy/Kitten"})</p>
                      <p>📋 Clinical Records: {parsedRecords.length} files logged</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-border/10 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] font-bold h-9">
                          View History
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="font-display text-xl">{pet.name}'s Diagnosis History</DialogTitle>
                        </DialogHeader>
                        {parsedRecords.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic text-center py-6">No historical clinical records logged yet.</p>
                        ) : (
                          <div className="relative border-l-2 border-primary/20 ml-2 pl-4 space-y-4 mt-2">
                            {parsedRecords.map((r, ri) => (
                              <div key={ri} className="relative rounded-2xl border border-border/40 bg-secondary/20 p-4 text-xs">
                                <span className="absolute -left-[25px] top-4 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground border-2 border-background">
                                  🏥
                                </span>
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-bold text-foreground">{r.title}</h4>
                                  <Badge className="text-[8px] font-black" variant="outline">{r.status}</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(r.date).toLocaleDateString()} · Vet: {r.vetName}</p>
                                {r.notes && <p className="text-[10px] text-muted-foreground bg-card/60 p-2 rounded-lg mt-2 italic">"{r.notes}"</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={diagDialogOpen && selectedPet?.id === pet.id} onOpenChange={(o) => { if (!o) { setDiagDialogOpen(false); setSelectedPet(null); } }}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setSelectedPet(pet); setDiagDialogOpen(true); }} className="w-full rounded-xl text-[10px] font-bold h-9">
                          Add Record
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-display text-xl">Consultation: {pet.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          <div className="space-y-1">
                            <Label>Record Title</Label>
                            <Input required value={diagTitle} onChange={(e) => setDiagTitle(e.target.value)} placeholder="e.g. Skin Rash checkup, Rabies Vaccine" className="rounded-xl" />
                          </div>
                          <div className="space-y-1">
                            <Label>Visit Status</Label>
                            <Select value={diagStatus} onValueChange={(v) => setDiagStatus(v as never)}>
                              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="Completed">Completed Checkup</SelectItem>
                                <SelectItem value="Follow-up Required">Follow-up Required</SelectItem>
                                <SelectItem value="Ongoing">Ongoing Treatment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label>Clinical Notes & Prescriptions</Label>
                            <textarea 
                              required
                              value={diagNotes}
                              onChange={(e) => setDiagNotes(e.target.value)}
                              placeholder="Clinical diagnoses, prescribed medicine, dosages..."
                              className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            />
                          </div>
                          <Button onClick={() => savePatientNote(pet)} className="w-full rounded-xl py-6 mt-2">
                            Save Clinical Record
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
