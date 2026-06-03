import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Calendar, Bell, ShoppingBag, MessageCircle, PawPrint, Plus, Sparkles, Star, 
  TrendingUp, CheckCircle, ShieldAlert, CreditCard, Heart, Award, Trophy, 
  Activity, Scale, Syringe, FileText, PhoneCall, ChevronRight, ThumbsUp, 
  MessageSquare, Clock
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { DEFAULT_PRODUCTS } from "@/lib/mock-products";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmergencyModal } from "@/components/EmergencyModal";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — PetPal" }] }),
  component: () => (
    <RequireAuth>
      <AppShell><HomePage /></AppShell>
    </RequireAuth>
  ),
});

interface Pet { 
  id: string; 
  name: string; 
  species: string; 
  breed: string | null; 
  date_of_birth?: string | null; 
  weight_kg?: number | null;
}
interface Product { id: string; name: string; price: number; image_url: string | null; species: string | null }
interface Appt { id: string; scheduled_at: string; services: { name: string } | null; pets: { name: string } | null }
interface Reminder { id: string; title: string; due_at: string; type: string }

// High-quality pet stock photos map
const PET_IMAGE_MAP: Record<string, string> = {
  dog: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
  cat: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800",
  bird: "https://images.unsplash.com/photo-1522856283749-626210a309e1?auto=format&fit=crop&q=80&w=800",
  rabbit: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=800",
  bunny: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=800",
  fish: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=800",
};

const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800";

function calculateAge(dobString: string | null | undefined): string {
  if (!dobString) return "3 years"; // Default fallback matching the screenshot
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();
  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  }
  return `${months} month${months > 1 ? "s" : ""}`;
}

function HomePage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [recsBySpecies, setRecsBySpecies] = useState<Record<string, Product[]>>({});
  const [appts, setAppts] = useState<Appt[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);

  // Animated Health Score counter states
  const [healthScore, setHealthScore] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const scoreTimer = setTimeout(() => setHealthScore(98), 300);

    let start = 0;
    const end = 98;
    const duration = 1200;
    const stepTime = Math.abs(Math.floor(duration / end));
    
    const countTimer = setInterval(() => {
      start += 1;
      if (start >= end) {
        setCount(end);
        clearInterval(countTimer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => {
      clearTimeout(scoreTimer);
      clearInterval(countTimer);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // 1. Fetch pets with DOB and Weight
      const { data: p } = await supabase
        .from("pets")
        .select("id, name, species, breed, date_of_birth, weight_kg")
        .eq("owner_id", user.id);
      const petsData = (p ?? []) as Pet[];
      setPets(petsData);

      // 2. Fetch recommendations
      const speciesSet = Array.from(new Set(petsData.map((x) => x.species.toLowerCase())));
      if (speciesSet.length) {
        const map: Record<string, Product[]> = {};
        await Promise.all(
          speciesSet.map(async (sp) => {
            const { data: prods } = await supabase
              .from("products")
              .select("id, name, price, image_url, species")
              .eq("active", true)
              .or(`species.ilike.${sp},species.ilike.all`)
              .limit(8);
            
            const dbProds = prods ?? [];
            if (dbProds.length > 0) {
              map[sp] = dbProds as Product[];
            } else {
              // Fallback to local default products matching species
              map[sp] = DEFAULT_PRODUCTS.filter(p => 
                p.active && 
                (p.species.toLowerCase() === sp || p.species.toLowerCase() === "all")
              ).slice(0, 4) as Product[];
            }
          }),
        );
        setRecsBySpecies(map);
      } else {
        // Default recommendations fallback if no pets registered
        const map: Record<string, Product[]> = {};
        map["dog"] = DEFAULT_PRODUCTS.filter(p => p.active && p.species.toLowerCase() === "dog").slice(0, 4) as Product[];
        setRecsBySpecies(map);
      }

      // 3. Fetch appointments
      const { data: a } = await supabase
        .from("appointments")
        .select("id, scheduled_at, services(name), pets(name)")
        .eq("owner_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at")
        .limit(3);
      setAppts((a ?? []) as unknown as Appt[]);

      // 4. Fetch reminders
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

  // Determine active pet (db pet or mockup)
  const activePet = pets[activePetIndex] || {
    id: "mock-active",
    name: "taqwamrowat",
    species: "dog",
    breed: "Golden",
    date_of_birth: null,
    weight_kg: 17
  };

  const petName = activePet.name;
  const petBreed = activePet.breed || "Golden Retriever";
  const petAge = calculateAge(activePet.date_of_birth);
  const petWeight = activePet.weight_kg ? `${activePet.weight_kg}kg` : "17kg";
  const petPhoto = PET_IMAGE_MAP[activePet.species.toLowerCase()] || DEFAULT_PET_PHOTO;

  // Calculate statistics
  const totalPetsCount = pets.length > 0 ? pets.length : 1;
  const appointmentsText = appts.length > 0 ? `${appts.length} Appt${appts.length > 1 ? "s" : ""}` : "No Appointments";
  const wellnessScore = "98% Health";
  const monthlySpend = "$145.00";
  const vaccinesCompletion = "85% Done";
  const activeWeightText = petWeight;
  const shopOrdersCount = "4 Orders";
  const badgesCount = "5 Badges";

  return (
    <div className="space-y-10 transition-all duration-700 animate-in fade-in zoom-in-95">
      
      {/* 0. WELCOME HEADER */}
      <div className="bg-card/45 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover-lift text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground font-display text-xl font-bold">
            <span>🐾 Welcome Back, {user?.email ? user.email.split("@")[0] : "Taqwamrowat"}</span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">Your Pet's Health Companion</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider text-primary">
          <span>Track Health</span>
          <span>•</span>
          <span>AI Diagnosis</span>
          <span>•</span>
          <span>Emergency Support</span>
        </div>
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-card/65 backdrop-blur-md border border-border/40 p-6 md:p-8 text-foreground shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 hover-lift">
        {/* Decorative ambient lights */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid gap-8 lg:grid-cols-12 w-full items-center">
          
          {/* Left Column: Pet Image */}
          <div className="lg:col-span-3 flex justify-center lg:justify-start">
            <div className="relative group">
              <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-primary to-accent opacity-25 blur-lg group-hover:opacity-40 transition-opacity" />
              <img 
                src={petPhoto} 
                alt={petName} 
                className="relative w-48 h-48 rounded-[2.2rem] object-cover border-4 border-card shadow-2xl transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Active Profile
              </div>
            </div>
          </div>

          {/* Center Column: Pet Name, Health Ring, Checkup logs */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                🐕 {petName}
              </h2>
              <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-widest">
                {petBreed} · {petAge}
              </p>
            </div>

            {/* Live Animated Health Score Circle */}
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
              <div className="relative flex items-center justify-center h-20 w-20 shrink-0 bg-primary/10 rounded-full border border-primary/20 p-2 shadow-inner">
                <svg className="h-full w-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="stroke-primary/15 fill-none" strokeWidth="4.5" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="26" 
                    className="stroke-primary fill-none transition-all duration-1000 ease-out" 
                    strokeWidth="4.5" 
                    strokeDasharray="163.3" 
                    strokeDashoffset={163.3 - (163.3 * healthScore) / 100} 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className="absolute text-sm font-black text-foreground">{count}%</span>
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-black text-foreground flex items-center gap-1">
                  ❤️ Health Score Index
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                  Vitals & daily wellness tracking stable. Next vaccine due soon.
                </p>
              </div>
            </div>

            {/* Checkup Details */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30 max-w-sm mx-auto lg:mx-0">
              <div className="text-left">
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest block">Last Checkup</span>
                <span className="text-xs font-bold text-foreground block mt-0.5">2 days ago</span>
              </div>
              <div className="text-left">
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest block">Vaccinations</span>
                <span className="text-xs font-bold text-emerald-500 block mt-0.5">Up To Date</span>
              </div>
              <div className="text-left">
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest block">Active Weight</span>
                <span className="text-xs font-bold text-foreground block mt-0.5">{petWeight}</span>
              </div>
              <div className="text-left">
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest block">Age Index</span>
                <span className="text-xs font-bold text-foreground block mt-0.5">{petAge}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Action Stack */}
          <div className="lg:col-span-4 flex flex-col gap-3 w-full sm:max-w-xs mx-auto lg:ml-auto">
            <Button className="w-full bg-primary hover:bg-primary/95 text-white rounded-full py-6 font-bold shadow-lg shadow-primary/10 hover-lift flex items-center justify-center gap-2" asChild>
              <Link to="/chat">
                <MessageCircle className="h-4.5 w-4.5" /> Consult AI Vet
              </Link>
            </Button>
            <Button variant="outline" className="w-full border-border/70 bg-card hover:bg-secondary/20 rounded-full py-6 font-bold hover-lift flex items-center justify-center gap-2 text-foreground" asChild>
              <Link to="/book">
                <Calendar className="h-4.5 w-4.5 text-primary" /> Book Appointment
              </Link>
            </Button>
            <Button variant="outline" className="w-full border-border/70 bg-card hover:bg-secondary/20 rounded-full py-6 font-bold hover-lift flex items-center justify-center gap-2 text-foreground" asChild>
              <Link to={`/pets?id=${activePet.id}`}>
                <FileText className="h-4.5 w-4.5 text-accent" /> Medical Passport
              </Link>
            </Button>
          </div>

        </div>
      </section>

      {/* 2. ECOSYSTEM STATISTICS SECTION */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Ecosystem Statistics
        </h2>
        
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "TOTAL PETS", value: `${totalPetsCount} Pet${totalPetsCount > 1 ? "s" : ""} 🐕`, desc: "Registered companions", to: "/pets", bg: "text-pink-600 dark:text-pink-400 hover:border-pink-500/30" },
            { label: "VET BOOKINGS", value: `${appointmentsText} 📅`, desc: "Upcoming clinic visits", to: "/book", bg: "text-rose-600 dark:text-rose-400 hover:border-rose-500/30" },
            { label: "AVERAGE WELLNESS", value: `${wellnessScore} ❤️`, desc: "License safety status", to: "/pets", bg: "text-amber-600 dark:text-amber-400 hover:border-amber-500/30" },
            { label: "MONTHLY SPEND", value: `${monthlySpend} 💳`, desc: "Supplies & clinical services", to: "/shop", bg: "text-rose-500 dark:text-rose-300 hover:border-rose-400/30" },
            { label: "VACCINES COMPLETED", value: `${vaccinesCompletion} 💉`, desc: "Immunization checklists", to: "/reminders", bg: "text-pink-500 dark:text-pink-300 hover:border-pink-400/30" },
            { label: "ACTIVE WEIGHT", value: `${activeWeightText} ⚖️`, desc: "Recent weight record", to: "/pets", bg: "text-amber-500 dark:text-amber-300 hover:border-amber-400/30" },
            { label: "SHOP ORDERS", value: `${shopOrdersCount} 🛍️`, desc: "Deliveries this month", to: "/shop", bg: "text-pink-600 dark:text-pink-400 hover:border-pink-500/30" },
            { label: "BADGES UNLOCKED", value: `${badgesCount} 🏆`, desc: "Unlocked achievements", to: "/rewards", bg: "text-rose-600 dark:text-rose-400 hover:border-rose-500/30" }
          ].map((stat, idx) => (
            <Link 
              key={idx} 
              to={stat.to} 
              className={cn("group rounded-[1.8rem] bg-card border border-border/80 p-5 hover-lift flex flex-col justify-between min-h-[140px]", stat.bg)}
            >
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80 block">{stat.label}</span>
                <span className="font-display text-xl font-bold mt-2 block tracking-tight">{stat.value}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                <span>{stat.desc}</span>
                <span className="flex items-center gap-0.5">
                  view details <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. AI WELLNESS DIAGNOSTICS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" /> AI Wellness Diagnostics
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Real-Time Analysis
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          
          {/* Card 1: Health Status Assessment */}
          <div className="rounded-[1.8rem] border border-emerald-200/50 bg-emerald-500/5 p-6 flex flex-col justify-between space-y-4 hover-lift">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl p-2 bg-emerald-500/10 text-emerald-600"><CheckCircle className="h-4.5 w-4.5" /></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Health Status Assessment</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cardiovascular and digestive logs are fully normal. {petName}'s activity level is at 96% optimal capacity.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Vitals sign optimal
            </div>
          </div>

          {/* Card 2: Care Recommendation */}
          <div className="rounded-[1.8rem] border border-amber-200/50 bg-amber-500/5 p-6 flex flex-col justify-between space-y-4 hover-lift">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl p-2 bg-amber-500/10 text-amber-600"><Activity className="h-4.5 w-4.5" /></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Care Recommendation</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {petName} shows a minor calorie deficit. Recommend adding 1.2kg/feeding adjustment or consult on dietary portions.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Provides guidance
            </div>
          </div>

          {/* Card 3: Action Required Alert */}
          <div className="rounded-[1.8rem] border border-rose-200/50 bg-rose-500/5 p-6 flex flex-col justify-between space-y-4 hover-lift">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl p-2 bg-rose-500/10 text-rose-600"><ShieldAlert className="h-4.5 w-4.5" /></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Action Required Alert</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Immunization schedule has pending inputs. Rabies vaccine booster check recommended within 5 days.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> High priority actions
            </div>
          </div>

        </div>
      </section>

      {/* 4. UPCOMING ACTIVITIES TIMELINE */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Upcoming Activities Timeline
        </h2>

        <div className="relative pl-8 border-l border-border/80 space-y-6 ml-4">
          
          {/* Timeline Item 1 */}
          <div className="relative group">
            <div className="absolute -left-[40px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 ring-4 ring-background transition-transform duration-500 group-hover:scale-125 shadow-sm" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/50 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <h4 className="font-bold text-sm tracking-tight text-foreground flex flex-wrap items-center gap-2">
                  💉 Rabies Immunization Booster Due
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase tracking-wider">Action Required</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Critical clinical preventative booster cycle due for active pet profile. Required for municipal license compliance.
                </p>
              </div>
              <div className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1 shrink-0 self-start sm:self-center">
                <Clock className="h-3.5 w-3.5" /> In 5 days (June 7)
              </div>
            </div>
          </div>

          {/* Timeline Item 2 */}
          <div className="relative group">
            <div className="absolute -left-[40px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 ring-4 ring-background transition-transform duration-500 group-hover:scale-125 shadow-sm" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/50 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <h4 className="font-bold text-sm tracking-tight text-foreground flex flex-wrap items-center gap-2">
                  📅 Annual Veterinary General Checkup
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[8px] font-black uppercase tracking-wider">Appointment</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Routine diagnostics, weight tracking updates, dental scaling review, and physical health inspection.
                </p>
              </div>
              <div className="text-[10px] font-bold text-pink-500 uppercase flex items-center gap-1 shrink-0 self-start sm:self-center">
                <Clock className="h-3.5 w-3.5" /> In 8 days (June 10)
              </div>
            </div>
          </div>

          {/* Timeline Item 3 */}
          <div className="relative group">
            <div className="absolute -left-[40px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-4 ring-background transition-transform duration-500 group-hover:scale-125 shadow-sm" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/50 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <h4 className="font-bold text-sm tracking-tight text-foreground flex flex-wrap items-center gap-2">
                  📦 Premium Food Subscription Auto-Ship
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-wider">Subscription</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automatic dispatch renewal for balanced salmon and chicken formula dry foods from PetPal stores.
                </p>
              </div>
              <div className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1 shrink-0 self-start sm:self-center">
                <Clock className="h-3.5 w-3.5" /> In 12 days (June 12)
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE SERVICES GRID */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Interactive Services
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Service 1: Clinical Scheduler */}
          <Link to="/book" className="group flex justify-between rounded-[2rem] bg-card border border-border hover-lift hover:border-pink-500/30 overflow-hidden min-h-[170px] text-left">
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="rounded-full p-2 bg-pink-500/10 text-pink-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">Clinical Scheduler</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">Book vaccine shots, clinical checkups, or wellness reviews at certified animal hospitals.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-pink-500 opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Open Schedule</span> <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="w-[38%] shrink-0 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=300" 
                alt="Scheduler" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>

          {/* Service 2: Supplies Shop */}
          <Link to="/shop" className="group flex justify-between rounded-[2rem] bg-card border border-border hover-lift hover:border-rose-400/30 overflow-hidden min-h-[170px] text-left">
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="rounded-full p-2 bg-rose-400/10 text-rose-400 w-fit group-hover:rotate-12 transition-transform duration-500">
                  <ShoppingBag className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">Supplies Shop</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">Order health food formulas, vitamin boosters, scratching posts, and accessories.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-rose-400 opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Browse Supplies</span> <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="w-[38%] shrink-0 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=300" 
                alt="Shop" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>

          {/* Service 3: AI Chatbot */}
          <Link to="/chat" className="group flex justify-between rounded-[2rem] bg-card border border-border hover-lift hover:border-pink-500/30 overflow-hidden min-h-[170px] text-left">
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="rounded-full p-2 bg-pink-500/10 text-pink-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                  <MessageCircle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">AI Chatbot</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">Consult our smart clinical AI agent regarding symptom charts or daily behaviors.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-pink-500 opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Ask Chatbot</span> <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            {/* Interactive HTML/CSS Mockup Chat widget */}
            <div className="w-[40%] shrink-0 bg-secondary/30 relative p-3 flex flex-col justify-between overflow-hidden border-l border-border/10">
              <div className="space-y-2">
                <div className="flex items-center gap-1 justify-end">
                  <div className="bg-[#FFF5F9] text-[7.5px] p-1.5 rounded-lg rounded-tr-none text-foreground font-bold shadow-sm scale-90 origin-right max-w-[80%] truncate">
                    Healthy dog?
                  </div>
                  <div className="h-3.5 w-3.5 rounded-full bg-accent/20 flex items-center justify-center text-[7px] font-bold">👤</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3.5 w-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[7px]">🤖</div>
                  <div className="bg-emerald-500/10 text-[7.5px] p-1.5 rounded-lg rounded-tl-none text-emerald-800 dark:text-emerald-300 font-bold scale-90 origin-left max-w-[80%] truncate">
                    Vitals stable!
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-card px-1.5 py-0.5 rounded-md text-[6.5px] font-bold shadow-sm flex items-center justify-between mt-1">
                <span>AI Agent</span>
                <span className="text-amber-500">★★★★★</span>
              </div>
            </div>
          </Link>

          {/* Service 4: Social Board */}
          <Link to="/community" className="group flex justify-between rounded-[2rem] bg-card border border-border hover-lift hover:border-amber-400/30 overflow-hidden min-h-[170px] text-left">
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="rounded-full p-2 bg-amber-400/10 text-amber-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">Social Board</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">Engage with pet parents, swap healthy diet reviews, and share funny stories.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-amber-500 opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Visit Community</span> <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="w-[38%] shrink-0 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300" 
                alt="Social" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>

          {/* Service 5: Medical Records */}
          <Link to="/pets" className="group flex justify-between rounded-[2rem] bg-card border border-border hover-lift hover:border-pink-500/30 overflow-hidden min-h-[170px] text-left">
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="rounded-full p-2 bg-pink-500/10 text-pink-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">Medical Records</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">Access full digital files of past checkups, clinical weights, and veterinary hospital.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-pink-500 opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Review Records</span> <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="w-[38%] shrink-0 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=300" 
                alt="Records" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>

          {/* Service 6: Emergency Support */}
          <button 
            onClick={() => setShowEmergencyDialog(true)}
            className="group flex justify-between rounded-[2rem] bg-card border border-border hover-lift hover:border-rose-500/30 overflow-hidden min-h-[170px] text-left w-full cursor-pointer"
          >
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="rounded-full p-2 bg-rose-500/10 text-rose-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                  <PhoneCall className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">Emergency Support</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">Instant 24/7 access details to local trauma centers and veterinary hospitals.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-rose-500 opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Get Urgent Info</span> <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="w-[38%] shrink-0 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1527362950785-f487a7c1fe48?auto=format&fit=crop&q=80&w=300" 
                alt="Emergency" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </button>

        </div>
      </section>

      {/* 6. FEATURED COMPANIONS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            Featured Pets ❤️
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-500 hover:underline cursor-pointer">
            View Community Pets
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Daisy", breed: "Golden Puppy", age: "3 months", health: "100%", status: "Playful", img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop&q=80" },
            { name: "Oliver", breed: "British Shorthair", age: "1 year", health: "98%", status: "Napping", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80" },
            { name: "Milo", breed: "Angora Rabbit", age: "6 months", health: "95%", status: "Eating", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&auto=format&fit=crop&q=80" },
            { name: "Bella", breed: "Siberian Husky", age: "2 years", health: "97%", status: "Active", img: "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=400&auto=format&fit=crop&q=80" }
          ].map((pet, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-[2.2rem] glass-card border border-border/40 hover:shadow-xl transition-all duration-500 bg-card/65 flex flex-col justify-between hover-lift">
              <div className="p-3.5 space-y-3">
                <div className="relative overflow-hidden rounded-[1.6rem] aspect-square bg-secondary/30">
                  <img 
                    src={pet.img} 
                    alt={pet.name} 
                    className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[8px] uppercase font-extrabold tracking-wider bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full">
                      {pet.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 px-1 text-left">
                  <h3 className="font-display font-bold text-base text-foreground leading-tight">{pet.name}</h3>
                  <p className="text-[9px] font-bold text-accent uppercase tracking-wider">{pet.breed} · {pet.age}</p>
                </div>
              </div>
              <div className="p-3.5 pt-0 border-t border-border/20 flex items-center justify-between text-[10px] font-bold text-muted-foreground/80">
                <span>Wellness Score</span>
                <span className="text-emerald-500 font-extrabold">{pet.health}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CARETAKER ACHIEVEMENTS */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" /> Caretaker Achievements
        </h2>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Perfect Caretaker", medal: "GOLD MEDAL", desc: "12 months cycle fully registered and booster appointments completed.", color: "text-yellow-500 bg-yellow-500/10" },
            { title: "Wellness Champion", medal: "GOLD MEDAL", desc: "Maintained diagnostic health index scores above 95% for 3 consecutive months.", color: "text-yellow-500 bg-yellow-500/10" },
            { title: "AI Health Scholar", medal: "SILVER MEDAL", desc: "Addressed 5+ distinct preventative checkups or dietary consultations with AI diagnostics.", color: "text-slate-400 bg-slate-400/10" },
            { title: "VIP Sponsor Patron", medal: "BRONZE MEDAL", desc: "Purchased 3+ premium supply formulas or grooming bundles from the official shop.", color: "text-amber-600 bg-amber-600/10" }
          ].map((ach, idx) => (
            <div key={idx} className="rounded-3xl bg-card border border-border p-5 flex flex-col justify-between min-h-[160px] hover-lift">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn("rounded-xl p-2 shrink-0", ach.color)}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground">{ach.title}</h3>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground">{ach.medal}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {ach.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency Hotline Dialog Trigger */}
      <EmergencyModal open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog} />

    </div>
  );
}
