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
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1E1145] via-[#10072B] to-[#090214] p-6 md:p-8 text-white shadow-2xl min-h-[350px] flex flex-col justify-between">
        
        {/* Decorative ambient lights */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        
        {/* Top Header & Content Grid */}
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8 w-full">
          
          {/* Left Column: Greeting, Badge, Grid Widgets, Actions */}
          <div className="flex-1 space-y-6">
            
            {/* Widescreen dashboard badge */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-yellow-300 animate-spin" style={{ animationDuration: "4s" }} /> Widescreen Dashboard
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Keep {petName} Healthy & Happy! 🐾
              </h1>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
              </p>
            </div>

            {/* Sub-widgets Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              
              {/* Widget 1: Health Score */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">Health Score</span>
                  <span className="text-sm font-bold text-emerald-400 block mt-1">96% Score</span>
                </div>
                <span className="text-[10px] text-white/40 mt-1.5 block leading-tight">Daily vitals stable</span>
              </div>

              {/* Widget 2: Next Vet Visit */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">Next Vet Visit</span>
                  <span className="text-sm font-bold text-primary block mt-1">June 10</span>
                </div>
                <span className="text-[10px] text-white/40 mt-1.5 block leading-tight">Clinical checkup scheduled</span>
              </div>

              {/* Widget 3: Food Stock */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">Food Stock</span>
                  <span className="text-sm font-bold text-amber-400 block mt-1">30% remaining</span>
                </div>
                <span className="text-[10px] text-white/40 mt-1.5 block leading-tight">Salmon & chicken recipe</span>
              </div>

              {/* Widget 4: Vaccination Status */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">Vaccination Status</span>
                  <span className="text-sm font-bold text-rose-400 block mt-1">Rabies (5d left)</span>
                </div>
                <span className="text-[10px] text-white/40 mt-1.5 block leading-tight">Booster notification active</span>
              </div>

            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/15 rounded-full px-5 py-5 text-xs font-bold flex items-center gap-2" asChild>
                <Link to="/book">
                  <Calendar className="h-4 w-4" /> Book Appointment
                </Link>
              </Button>
              <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/15 rounded-full px-5 py-5 text-xs font-bold flex items-center gap-2" asChild>
                <Link to="/chat">
                  <MessageCircle className="h-4 w-4" /> Consult AI Assistant
                </Link>
              </Button>
              <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/15 rounded-full px-5 py-5 text-xs font-bold flex items-center gap-2" asChild>
                <Link to="/pets">
                  <FileText className="h-4 w-4" /> Medical History
                </Link>
              </Button>
            </div>

          </div>

          {/* Right Column: Floating glassmorphic active pet profile card */}
          <div className="flex items-center justify-center lg:justify-end w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/15 flex flex-col gap-4 w-full sm:w-[380px] shadow-2xl relative">
              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <img 
                  src={petPhoto} 
                  alt={petName} 
                  className="w-24 h-24 rounded-2xl object-cover border border-white/20 shadow-md flex-shrink-0"
                />
                <div>
                  <h3 className="font-display text-2xl font-bold text-white leading-none">{petName}</h3>
                  <p className="text-[10px] text-white/60 font-semibold uppercase mt-1.5 tracking-wider">{petBreed}</p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Active Profile
                  </div>
                </div>
              </div>

              {/* Progress Ring and Health details */}
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center h-14 w-14 shrink-0">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" className="stroke-white/10 fill-none" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" className="stroke-primary fill-none" strokeWidth="4" strokeDasharray="150" strokeDashoffset="3" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-[10px] font-black text-white">98%</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white">Health Score Index</p>
                  <p className="text-[9px] text-white/60">Excellent physiological status</p>
                </div>
              </div>

              {/* Vital Statistics Details List */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-white/10 pt-4 text-[10px] font-bold text-white/90">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/45 font-semibold">AGE</span>
                  <span>{petAge}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/45 font-semibold">WEIGHT</span>
                  <span>{petWeight}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/45 font-semibold">VACCINES</span>
                  <span className="text-emerald-400 font-extrabold">UP TO DATE</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/45 font-semibold">CHECKUP</span>
                  <span>2 days ago</span>
                </div>
              </div>
            </div>
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

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          
          {/* Service 1: Clinical Scheduler */}
          <Link to="/book" className="group flex flex-col justify-between rounded-[2rem] bg-card border border-border p-6 hover-lift hover:border-pink-500/30">
            <div className="space-y-4">
              <div className="rounded-2xl p-3 bg-pink-500/10 text-pink-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Clinical Scheduler</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Book vaccine shots, clinical checkups, or wellness reviews at certified animal hospitals.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-pink-500 opacity-80 group-hover:opacity-100">
              Open Schedule <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Service 2: Supplies Shop */}
          <Link to="/shop" className="group flex flex-col justify-between rounded-[2rem] bg-card border border-border p-6 hover-lift hover:border-rose-400/30">
            <div className="space-y-4">
              <div className="rounded-2xl p-3 bg-rose-400/10 text-rose-400 w-fit group-hover:rotate-12 transition-transform duration-500">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Supplies Shop</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Order health food formulas, vitamin boosters, scratching posts, and accessories.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-rose-400 opacity-80 group-hover:opacity-100">
              Browse Supplies <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Service 3: AI Diagnostics */}
          <Link to="/chat" className="group flex flex-col justify-between rounded-[2rem] bg-card border border-border p-6 hover-lift hover:border-pink-500/30">
            <div className="space-y-4">
              <div className="rounded-2xl p-3 bg-pink-500/10 text-pink-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">AI Diagnostics</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Consult our smart clinical AI agent regarding symptom charts or daily behaviors.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-pink-500 opacity-80 group-hover:opacity-100">
              Start AI Chat <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Service 4: Social Board */}
          <Link to="/community" className="group flex flex-col justify-between rounded-[2rem] bg-card border border-border p-6 hover-lift hover:border-amber-400/30">
            <div className="space-y-4">
              <div className="rounded-2xl p-3 bg-amber-400/10 text-amber-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Social Board</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Engage with pet parents, swap healthy diet reviews, and share funny stories.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-amber-500 opacity-80 group-hover:opacity-100">
              Visit Community <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Service 5: Medical Records */}
          <Link to="/pets" className="group flex flex-col justify-between rounded-[2rem] bg-card border border-border p-6 hover-lift hover:border-pink-500/30">
            <div className="space-y-4">
              <div className="rounded-2xl p-3 bg-pink-500/10 text-pink-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Medical Records</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Access full digital files of past checkups, clinical weights, and veterinary hospital.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-pink-500 opacity-80 group-hover:opacity-100">
              Review Records <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Service 6: Emergency Support */}
          <button 
            onClick={() => setShowEmergencyDialog(true)}
            className="group flex flex-col justify-between text-left rounded-[2rem] bg-card border border-border p-6 hover-lift hover:border-rose-500/30 w-full"
          >
            <div className="space-y-4">
              <div className="rounded-2xl p-3 bg-rose-500/10 text-rose-500 w-fit group-hover:rotate-12 transition-transform duration-500">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Emergency Support</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Instant 24/7 access details to local trauma centers and veterinary hospitals.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-rose-500 opacity-80 group-hover:opacity-100">
              Get Urgent Info <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>
      </section>

      {/* 6. RECENT MEMORIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Recent Memories
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-500 hover:opacity-80 cursor-pointer">
            Gallery Feed
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400", // dog
            "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400", // cat with glasses
            "https://images.unsplash.com/photo-1522856283749-626210a309e1?auto=format&fit=crop&q=80&w=400", // parrot
            "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400"  // dog wash
          ].map((imgUrl, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-[1.8rem] aspect-square bg-muted shadow-sm hover:shadow-md transition-shadow">
              <img 
                src={imgUrl} 
                alt={`Pet Memory ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <Heart className="h-5 w-5 text-white fill-white cursor-pointer hover:scale-110 transition-transform" />
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
