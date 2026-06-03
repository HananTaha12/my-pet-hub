import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createNotification } from "@/lib/notify";
import { awardPoints } from "@/lib/loyalty";
import { toast } from "sonner";
import { Star, Shield, ArrowRight, ArrowLeft, CreditCard, CheckCircle2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [{ title: "Book Appointment — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Book /></AppShell></RequireAuth>),
});

interface Service { id: string; name: string; description: string | null; duration_minutes: number; price: number }
interface Pet { id: string; name: string }

interface Specialist {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
}

const SPECIALISTS: Specialist[] = [
  { id: "1", name: "Dr. Sarah Connor", role: "Senior General Veterinarian", avatar: "👩‍⚕️", rating: 4.9 },
  { id: "2", name: "Dr. Alan Grant", role: "Exotic & Bird Specialist", avatar: "👨‍⚕️", rating: 4.8 },
  { id: "3", name: "Dr. Ellie Sattler", role: "Feline & Canine Therapist", avatar: "👩‍⚕️", rating: 5.0 },
];

function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Form selections
  const [specialistId, setSpecialistId] = useState<string>("1");
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [petId, setPetId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<string>("");
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");

  // Payment states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Confirmation state
  const [invoice, setInvoice] = useState<{ id: string; date: string; amount: number } | null>(null);

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

  const activeSpecialist = useMemo(() => {
    return SPECIALISTS.find((s) => s.id === specialistId) ?? SPECIALISTS[0];
  }, [specialistId]);

  const activeService = useMemo(() => {
    return services.find((s) => s.id === serviceId);
  }, [services, serviceId]);

  const activePet = useMemo(() => {
    return pets.find((p) => p.id === petId);
  }, [pets, petId]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value).slice(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/[^0-9]/g, "");
    if (clean.length > 2) {
      clean = clean.slice(0, 2) + "/" + clean.slice(2, 4);
    }
    setCardExpiry(clean.slice(0, 5));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/[^0-9]/g, "").slice(0, 3));
  };

  const validateStep2 = () => {
    if (!serviceId) { toast.error("Please pick a service"); return false; }
    if (!petId) { toast.error("Please select a pet"); return false; }
    if (!slot) { toast.error("Please choose a time slot"); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (!cardName.trim()) { toast.error("Card holder name is required"); return false; }
    if (cardNumber.replace(/\s+/g, "").length !== 16) { toast.error("Invalid card number length"); return false; }
    if (cardExpiry.length !== 5) { toast.error("Invalid expiry format (MM/YY)"); return false; }
    if (cardCvv.length !== 3) { toast.error("Invalid CVV length"); return false; }
    return true;
  };

  const submitBooking = async () => {
    if (!validateStep3()) return;
    if (!user || !serviceId || !petId || !slot) return;
    
    setLoading(true);
    // Simulate payment gateway delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const { error } = await supabase.from("appointments").insert({
      owner_id: user.id, pet_id: petId, service_id: serviceId, scheduled_at: slot, special_instructions: notes || null,
    });
    
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    const svc = services.find((s) => s.id === serviceId);
    const pet = pets.find((p) => p.id === petId);

    await Promise.all([
      createNotification({
        userId: user.id,
        title: "Appointment booked & paid",
        body: `${svc?.name ?? "Service"} with ${activeSpecialist.name} for ${pet?.name ?? "your pet"} on ${new Date(slot).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}. +50 pts!`,
        type: "appointment",
        link: "/appointments",
      }),
      awardPoints({ userId: user.id, points: 50, reason: `Booked ${svc?.name ?? "appointment"}` }),
    ]);

    setInvoice({
      id: "INV-" + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleDateString(),
      amount: Number(svc?.price ?? 0),
    });

    setLoading(false);
    toast.success("Appointment booked and paid successfully!");
    setStep(4);
  };

  if (pets.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-dashed border-border p-8 text-center glass-card transition-all duration-500 animate-in fade-in">
        <div className="rounded-2xl bg-accent/10 p-4"><CreditCard className="h-8 w-8 text-accent" /></div>
        <h2 className="font-display text-xl font-semibold">No Pets Registered</h2>
        <p className="max-w-xs text-xs text-muted-foreground">You must add a pet profile before booking vet appointments or services.</p>
        <Button onClick={() => navigate({ to: "/pets" })} className="rounded-xl mt-2">Manage Pets</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 transition-all duration-500 animate-in fade-in">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-accent uppercase tracking-widest">Appointment Booking</span>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Vet Scheduler & Checkout</h1>
      </div>

      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-between max-w-md mx-auto px-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-all duration-500 ${
              step === s 
                ? "bg-accent text-accent-foreground ring-4 ring-accent/20" 
                : step > s 
                  ? "bg-emerald-500 text-white" 
                  : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? "✓" : s}
            </div>
            {s < 4 && (
              <div className={`h-1 w-12 sm:w-16 mx-2 rounded-full transition-all duration-500 ${
                step > s ? "bg-emerald-500" : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 border-border/40 shadow-2xl bg-card/60">
        
        {/* Step 1: Specialist Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight">Select a Specialist</h2>
              <p className="text-xs text-muted-foreground">Select from our certified board of pet healthcare professionals.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {SPECIALISTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSpecialistId(s.id)}
                  className={`group relative text-left p-5 rounded-2xl border transition-all duration-300 ${
                    specialistId === s.id 
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20" 
                      : "border-border bg-card hover:bg-secondary/40"
                  }`}
                >
                  <div className="text-4xl">{s.avatar}</div>
                  <h3 className="mt-4 font-bold text-sm text-foreground/90">{s.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">{s.role}</p>
                  <div className="mt-3 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-bold text-muted-foreground">{s.rating}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-border/30">
              <Button onClick={() => setStep(2)} className="rounded-xl px-6">
                Next Step <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Appointment Details */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight">Configure Visit Details</h2>
              <p className="text-xs text-muted-foreground">Select pet companion, service category, date, and availability slots.</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Pet Companion</Label>
                <Select value={petId} onValueChange={setPetId}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Clinical Service</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · ${Number(s.price).toFixed(0)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Appointment Date</Label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            </div>

            <div className="space-y-2">
              <Label>Available Time Slots</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {slots.map((s) => {
                  const isTaken = taken.has(s.iso);
                  const active = slot === s.iso;
                  return (
                    <button 
                      type="button"
                      key={s.iso} 
                      disabled={isTaken} 
                      onClick={() => setSlot(s.iso)}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-all duration-300 ${
                        isTaken 
                          ? "cursor-not-allowed border-border text-muted-foreground/30 line-through bg-muted/10" 
                          : active 
                            ? "border-accent bg-accent text-accent-foreground shadow-md shadow-accent/20" 
                            : "border-border hover:bg-secondary bg-card"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Special Instructions / Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe symptoms, requirements, allergies..." className="rounded-xl min-h-[80px]" />
            </div>

            <div className="flex justify-between pt-4 border-t border-border/30">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl px-6">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => validateStep2() && setStep(3)} className="rounded-xl px-6">
                Continue to Payment <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Secure Checkout Simulation */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="font-display text-2xl font-bold tracking-tight">Secure Payment Checkout</h2>
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                <Shield className="h-3.5 w-3.5 text-emerald-500" /> Fully simulated sandbox credit card payment gateway.
              </p>
            </div>

            {/* Visual Credit Card Preview */}
            <div className="relative h-44 w-72 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 text-white p-5 shadow-2xl flex flex-col justify-between overflow-hidden mx-auto mb-2 border border-white/10">
              <div className="flex items-start justify-between z-10">
                <span className="text-[10px] font-black tracking-widest text-accent/80">PETPAL SECURE</span>
                <CreditCard className="h-5 w-5 text-neutral-400" />
              </div>
              <div className="space-y-4 z-10">
                <p className="text-lg tracking-widest font-mono">
                  {cardNumber || "•••• •••• •••• ••••"}
                </p>
                <div className="flex items-center justify-between text-[10px]">
                  <div className="max-w-[150px]">
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400">Card Holder</span>
                    <p className="font-semibold uppercase truncate mt-0.5">{cardName || "Cardholder Name"}</p>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400">Expires</span>
                    <p className="font-semibold mt-0.5">{cardExpiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-accent/15 blur-2xl animate-pulse" />
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
            </div>

            {/* Payment Fields */}
            <div className="space-y-3 max-w-md mx-auto">
              <div className="space-y-1">
                <Label>Cardholder Name</Label>
                <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="e.g. John Doe" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Card Number</Label>
                <Input value={cardNumber} onChange={handleCardNumberChange} placeholder="4000 1234 5678 9010" className="rounded-xl font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Expiration Date</Label>
                  <Input value={cardExpiry} onChange={handleExpiryChange} placeholder="MM/YY" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label>CVV</Label>
                  <Input type="password" value={cardCvv} onChange={handleCvvChange} placeholder="•••" className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-secondary/30 space-y-2 border border-border/30 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Service Fee:</span>
                <span className="font-bold">${Number(activeService?.price ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">VAT & Taxes (Simulated):</span>
                <span className="font-bold">$0.00</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <span className="font-bold">Total Amount:</span>
                <span className="font-bold text-accent">${Number(activeService?.price ?? 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border/30">
              <Button variant="outline" disabled={loading} onClick={() => setStep(2)} className="rounded-xl px-6">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={submitBooking} disabled={loading} className="rounded-xl px-6 shadow-lg shadow-accent/20">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" /> Processing Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Pay & Book <CreditCard className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Invoice & Confirmation */}
        {step === 4 && invoice && (
          <div className="space-y-6 text-center animate-in scale-in duration-500">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-500/10 p-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-bold tracking-tight">Booking Confirmed!</h2>
              <p className="text-xs text-muted-foreground">Your appointment with {activeSpecialist.name} is scheduled successfully.</p>
            </div>

            {/* Receipt Invoice block */}
            <div className="max-w-md mx-auto border border-border/50 rounded-3xl overflow-hidden shadow-md text-left text-xs bg-card">
              <div className="bg-foreground text-background p-5 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-sm tracking-wider">PETPAL RECEIPT</h3>
                  <p className="text-[10px] opacity-70">Payment Confirmed · Visa simulated</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">{invoice.id}</p>
                  <p className="text-[10px] opacity-70">{invoice.date}</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Specialist</span>
                    <p className="font-semibold text-foreground/90 mt-0.5">{activeSpecialist.name}</p>
                    <p className="text-[10px] text-muted-foreground">{activeSpecialist.role}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Pet Companion</span>
                    <p className="font-semibold text-foreground/90 mt-0.5">{activePet?.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Scheduled Time</span>
                    <p className="font-semibold text-foreground/90 mt-0.5">{new Date(slot).toLocaleDateString()}</p>
                    <p className="text-[10px] text-accent font-bold mt-0.5">{new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Transaction Status</span>
                    <p className="font-bold text-emerald-500 mt-0.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> PAID
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between font-semibold text-foreground/75">
                    <span>{activeService?.name}</span>
                    <span>${Number(activeService?.price ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm border-t border-border pt-2 text-foreground">
                    <span>Total Amount Charged:</span>
                    <span className="text-accent">${invoice.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4 border-t border-border/30">
              <Button variant="outline" onClick={() => navigate({ to: "/home" })} className="rounded-xl px-5">
                Dashboard
              </Button>
              <Button onClick={() => navigate({ to: "/appointments" })} className="rounded-xl px-5 shadow-lg shadow-accent/15">
                My Calendar
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
