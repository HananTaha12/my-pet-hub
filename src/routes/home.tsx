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

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: "02",
    hours: "14",
    minutes: "35",
    seconds: "59"
  });

  // Interactive Photo Uploader State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);

  // Hotel Booking Form State
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [hotelPetType, setHotelPetType] = useState("dog");

  // AI recommendations state
  const [selectedRecs, setSelectedRecs] = useState<string[]>(["hoodie", "jewelry", "spa"]);

  // Custom Jewelry State
  const [selectedJewelryPetId, setSelectedJewelryPetId] = useState("mock-dog");
  const [jewelryEngravingText, setJewelryEngravingText] = useState("Buddy");
  const [jewelryType, setJewelryType] = useState<"silver" | "gold" | "ceramic">("silver");

  const handleJewelryPetChange = (petId: string) => {
    setSelectedJewelryPetId(petId);
    if (petId === "mock-dog") {
      setJewelryEngravingText("Buddy");
      return;
    }
    const petObj = pets.find(x => x.id === petId);
    if (petObj) {
      setJewelryEngravingText(petObj.name);
    }
  };

  // Shop Categories Tabs State
  const [activeShopTab, setActiveShopTab] = useState<"trending" | "best" | "new">("trending");

  // Countdown timer hook
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(targetDate.getHours() + 14);
    targetDate.setMinutes(targetDate.getMinutes() + 35);

    const timer = setInterval(() => {
      const difference = targetDate.getTime() - Date.now();
      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);

        setTimeLeft({
          days: String(d).padStart(2, "0"),
          hours: String(h).padStart(2, "0"),
          minutes: String(m).padStart(2, "0"),
          seconds: String(s).padStart(2, "0")
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadedImage(URL.createObjectURL(file));
    setGeneratedDesign(null);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            // Simulate generating custom hoodie mockup card image
            setGeneratedDesign("https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=400");
            toast.success("Success! Custom hoodie mock design generated successfully!");
          }, 800);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

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
      if (petsData.length > 0) {
        setSelectedJewelryPetId(petsData[0].id);
        setJewelryEngravingText(petsData[0].name);
      } else {
        setSelectedJewelryPetId("mock-dog");
        setJewelryEngravingText("Buddy");
      }

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
      
      {/* 0. WELCOME HEADER & LOYALTY GRID */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Welcome Header */}
        <div className="md:col-span-2 bg-card/45 backdrop-blur-md rounded-[2rem] border border-border/40 p-6 flex flex-col justify-between hover-lift text-left min-h-[140px]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-display text-xl font-bold">
              <span>🐾 Welcome Back, {user?.email ? user.email.split("@")[0] : "Taqwamrowat"}</span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Your Pet's Health Companion</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider text-primary mt-4">
            <span>Track Health</span>
            <span>•</span>
            <span>AI Diagnosis</span>
            <span>•</span>
            <span>Emergency Support</span>
          </div>
        </div>

        {/* Loyalty Program Reward Card */}
        <div className="bg-card/45 backdrop-blur-md rounded-[2rem] border border-border/40 p-5 flex flex-col justify-between hover-lift text-left min-h-[140px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D98CB3] flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> PetPoints Rewards
            </span>
            <span className="bg-[#4E1B33] text-[#FFF5F9] px-2 py-0.5 rounded-full text-[8px] font-bold">VIP Silver</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-display font-black text-[#4E1B33] dark:text-[#FFF5F9]">350 pts</span>
              <span className="text-[9px] text-muted-foreground font-semibold">/ 500 to next reward</span>
            </div>
            <div className="h-1.5 w-full bg-[#4E1B33]/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#D98CB3] rounded-full" style={{ width: "70%" }} />
            </div>
            <p className="text-[8.5px] text-muted-foreground font-medium leading-tight">
              100 pts = $10 discount. Reach 500 for a free custom tag!
            </p>
          </div>
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

      {/* EMERGENCY DIALER CALLOUT PANEL */}
      <div className="w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white rounded-[2rem] p-5 border border-red-400/20 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0 animate-bounce">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight text-white flex items-center gap-1.5">
              🚨 Emergency Veterinary Support (24/7 Hotline)
            </h4>
            <p className="text-[10px] text-red-100 font-medium leading-relaxed">
              If your pet is experiencing distress, loss of consciousness, or physical injury, click below to immediately consult a trauma veterinarian.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowEmergencyDialog(true)}
          className="bg-white text-red-600 hover:bg-red-50 rounded-full font-black text-xs px-6 py-5 shadow-lg shrink-0"
        >
          Dial Trauma Response
        </Button>
      </div>

      {/* NEW SECTION: MATCH WITH YOUR PET & COUNTDOWN */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#4E1B33] to-[#78284e] text-white p-6 md:p-10 shadow-2xl hover-lift flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        
        <div className="flex-1 space-y-6 text-left relative z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#D98CB3]/20 border border-[#D98CB3]/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#D98CB3]">
            🔥 Special Campaign
          </span>
          <div className="space-y-3">
            <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Match With Your Pet! 🐾
            </h2>
            <p className="text-xs sm:text-sm text-[#EBC4D8] leading-relaxed max-w-lg font-medium">
              Create your matching set! Upload a photo of your pet, choose your custom apparel, and we will generate a matching designer set for both of you!
            </p>
          </div>

          {/* Live Countdown Timer */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFF5F9]/60">Sale Ends In:</p>
            <div className="flex items-center gap-3">
              {[
                { label: "Days", val: timeLeft.days },
                { label: "Hours", val: timeLeft.hours },
                { label: "Mins", val: timeLeft.minutes },
                { label: "Secs", val: timeLeft.seconds }
              ].map((t, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="h-14 w-14 rounded-2xl bg-[#3D1426] border border-white/5 flex items-center justify-center text-xl font-black tracking-tight shadow-md text-[#FFF5F9]">
                    {t.val}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-[#EBC4D8] mt-1.5">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button className="bg-[#FFF5F9] text-[#4E1B33] hover:bg-white rounded-full px-6 py-6 font-extrabold shadow-lg hover:scale-105 transition-transform flex items-center gap-2" asChild>
              <Link to="/shop">
                <Sparkles className="h-4.5 w-4.5 text-[#D98CB3]" /> Create Your Matching Set
              </Link>
            </Button>
          </div>
        </div>

        {/* Right side: Image representing matching Owner & Pet outfits */}
        <div className="w-full md:w-[42%] shrink-0 relative group">
          <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-[#D98CB3] to-white/10 opacity-20 blur-lg group-hover:opacity-35 transition-opacity" />
          <img 
            src="https://images.unsplash.com/photo-1522276498395-f4f68f7f8454?auto=format&fit=crop&q=80&w=600" 
            alt="Human and pet matching hoodies" 
            className="relative w-full aspect-[4/3] md:aspect-square object-cover rounded-[2.2rem] border-4 border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-103"
          />
        </div>
      </section>

      {/* NEW SECTION: PERSONALIZED PET JEWELRY SALE */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#EBC4D8]/30 via-white to-[#FFF5F9] text-foreground p-6 md:p-10 shadow-xl border border-border/40 hover-lift flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="flex-1 space-y-6 text-left relative z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#4E1B33]/10 border border-[#4E1B33]/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#4E1B33]">
            🐾 Personalized Pet Jewelry Sale
          </span>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight leading-none text-[#4E1B33]">
                30% OFF
              </h2>
              <span className="text-sm font-extrabold text-[#D98CB3] uppercase tracking-wider">Limited Offer</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg font-semibold">
              Custom Necklaces & Bracelets engraved with your pet's photo. A beautiful heirloom or matching set for you and your companion.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#4E1B33] text-white px-3 py-1.5 rounded-xl font-mono text-xs font-black shadow-sm">
              <span>Use Code:</span>
              <span className="text-[#D98CB3] tracking-widest">PAW30</span>
            </div>
          </div>
          <div className="pt-2">
            <Button className="bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-full px-6 py-6 font-extrabold shadow-lg hover:scale-105 transition-transform flex items-center gap-2" asChild>
              <Link to="/shop">
                <ShoppingBag className="h-4.5 w-4.5" /> Shop Collection
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Right side: Personalized Pet Jewelry Customizer */}
        <div className="w-full md:w-[52%] shrink-0 bg-card/85 backdrop-blur-md border border-border/60 rounded-[2rem] p-5 sm:p-6 shadow-2xl flex flex-col lg:flex-row gap-6 relative overflow-hidden text-left">
          
          {/* Mockup Preview Area */}
          <div className="flex-1 bg-gradient-to-b from-[#4E1B33]/5 to-[#4E1B33]/15 border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[240px] relative overflow-hidden shadow-inner">
            
            {/* The necklace chain hanging down */}
            <div className="absolute top-0 w-0.5 h-20 bg-gradient-to-b from-[#B593A1] to-slate-400 z-10" />
            
            {/* Hanging Ring link */}
            <div className="absolute top-20 w-4 h-4 rounded-full border-2 border-slate-300 bg-transparent z-10" />

            {/* The Pendant */}
            <div className="relative z-20 mt-14 flex items-center justify-center transition-all duration-500 hover:scale-105">
              {jewelryType === "silver" && (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 border-2 border-slate-300 shadow-xl flex flex-col items-center justify-center p-3 text-center">
                  {/* Animal icon or outline */}
                  <PawPrint className="h-8 w-8 text-slate-500 opacity-60 mb-1" />
                  <span className="text-[10px] font-bold font-mono tracking-wider text-slate-700 uppercase max-w-[80px] truncate">
                    {jewelryEngravingText || "Buddy"}
                  </span>
                </div>
              )}
              {jewelryType === "gold" && (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 via-yellow-400 to-amber-600 border-2 border-yellow-300 shadow-xl flex flex-col items-center justify-center p-3 text-center">
                  <PawPrint className="h-8 w-8 text-yellow-800 opacity-60 mb-1" />
                  <span className="text-[10px] font-bold font-mono tracking-wider text-yellow-900 uppercase max-w-[80px] truncate">
                    {jewelryEngravingText || "Buddy"}
                  </span>
                </div>
              )}
              {jewelryType === "ceramic" && (
                <div className="w-24 h-24 rounded-full bg-white border-4 border-[#D98CB3] shadow-2xl flex flex-col items-center justify-center p-2 text-center ring-4 ring-pink-100 relative">
                  {/* Colorful hand-painted circle detail */}
                  <div className="absolute inset-1 rounded-full border border-pink-200 border-dashed pointer-events-none" />
                  <span className="text-xl">🐱</span>
                  <span className="text-[9px] font-black tracking-tight text-[#4E1B33] mt-1 max-w-[75px] truncate font-display">
                    {jewelryEngravingText || "Buddy"}
                  </span>
                </div>
              )}
            </div>

            {/* Pet Photo Inset Badge & connecting pointer line */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 dark:bg-[#1F1216]/95 border border-border/60 px-2 py-1 rounded-full shadow-md z-30">
              <div className="h-7 w-7 rounded-full overflow-hidden border border-[#D98CB3] shadow-inner bg-[#4E1B33]/5 flex items-center justify-center">
                <img 
                  src={
                    selectedJewelryPetId && selectedJewelryPetId !== "mock-dog"
                      ? (PET_IMAGE_MAP[pets.find(x => x.id === selectedJewelryPetId)?.species.toLowerCase() || ""] || DEFAULT_PET_PHOTO)
                      : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100"
                  } 
                  alt="Pet preview" 
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[7.5px] font-black uppercase tracking-wider text-[#4E1B33] dark:text-[#FEE2E2]">
                Your Pet's Portrait
              </span>
            </div>

            {/* SVG Connector pointer line mimicking the design */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
              <path d="M 90 200 L 115 150" stroke="#B593A1" strokeWidth="1.5" strokeDasharray="3" fill="none" />
            </svg>
          </div>

          {/* Form controls */}
          <div className="w-full lg:w-[48%] flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-black uppercase text-[#4E1B33] dark:text-pink-300">Live Jewelry Designer</h4>
                <p className="text-[9px] text-muted-foreground font-semibold mt-0.5 leading-tight">Create an engraved heirloom with your pet's name & details.</p>
              </div>

              {/* Pet selection dropdown */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-muted-foreground block">Select Pet Companion</label>
                <select 
                  value={selectedJewelryPetId}
                  onChange={(e) => handleJewelryPetChange(e.target.value)}
                  className="w-full bg-[#4E1B33]/5 border border-border/50 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground font-semibold"
                >
                  {pets.map(p => (
                    <option key={p.id} value={p.id}>🐾 {p.name}</option>
                  ))}
                  <option value="mock-dog">🐾 Custom Pet Name...</option>
                </select>
              </div>

              {/* Engraving name text input */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-muted-foreground block">Engraved Text / Name</label>
                <input 
                  type="text" 
                  maxLength={12}
                  value={jewelryEngravingText}
                  onChange={(e) => setJewelryEngravingText(e.target.value)}
                  placeholder="e.g. Buddy"
                  className="w-full bg-[#4E1B33]/5 border border-border/50 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground font-semibold"
                />
              </div>

              {/* Style selector */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-muted-foreground block">Style / Material</label>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { id: "silver", label: "Silver Tag", price: "$24.99" },
                    { id: "gold", label: "Gold Charm", price: "$29.99" },
                    { id: "ceramic", label: "3D Ceramic", price: "$34.99" }
                  ].map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setJewelryType(style.id as any)}
                      className={cn(
                        "py-1.5 px-1 rounded-xl text-[8.5px] font-black border transition-all cursor-pointer",
                        jewelryType === style.id
                          ? "border-[#4E1B33] bg-[#4E1B33] text-white shadow-sm"
                          : "border-border/60 hover:bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      <span className="block leading-none">{style.label}</span>
                      <span className="block mt-0.5 text-[7px] opacity-75">{style.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={async () => {
                if (!user) {
                  toast.error("Please login to purchase custom jewelry");
                  return;
                }
                // Add the custom tag collar product to cart
                await addToCart(user.id, "d06da0d1-aacc-400d-800d-000000000003"); // custom collar product id
                toast.success(`Hooray! Added custom ${jewelryType} name tag jewelry engraved for "${jewelryEngravingText}" to your shopping cart!`);
              }}
              className="w-full bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-full py-4 text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Order Engraved Tag
            </Button>
          </div>

        </div>
      </section>

      {/* NEW SECTION: FEATURED COLLECTION & PRODUCT TABS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
              Featured Collection 🎨
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">Hand-crafted matching designs & luxury accessories</p>
          </div>
          
          {/* Tab selectors for Trending / Best / New */}
          <div className="flex items-center bg-[#4E1B33]/5 dark:bg-white/5 border border-border/60 p-1 rounded-full w-fit">
            {[
              { id: "trending", label: "Trending" },
              { id: "best", label: "Best Sellers" },
              { id: "new", label: "New Arrivals" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveShopTab(t.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer",
                  activeShopTab === t.id 
                    ? "bg-[#4E1B33] text-white shadow" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Large Featured Cards */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { 
              title: "Matching Hoodies", 
              desc: "Owner & Pet coordinates", 
              img: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=400",
              price: "$49.99"
            },
            { 
              title: "Pet Necklaces", 
              desc: "Custom brass collars", 
              img: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=400",
              price: "$24.99"
            },
            { 
              title: "Personalized Accessories", 
              desc: "Name tags & bandanas", 
              img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400",
              price: "$14.99"
            },
            { 
              title: "Pet Toys", 
              desc: "Ergonomic play sets", 
              img: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=400",
              price: "$19.99"
            }
          ].map((item, idx) => (
            <Link 
              key={idx} 
              to="/shop" 
              className="group relative rounded-[2.2rem] overflow-hidden hover-lift border border-border/30 aspect-[4/5] flex flex-col justify-end p-5 shadow-sm text-left"
            >
              {/* Card Image Cover */}
              <img 
                src={item.img} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Bottom Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              
              {/* Card Text Content */}
              <div className="relative z-10 space-y-2">
                <div className="space-y-0.5">
                  <h3 className="font-display text-base font-extrabold text-white leading-tight">{item.title}</h3>
                  <p className="text-[10px] text-[#EBC4D8] font-medium leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] font-black text-white">
                  <span className="bg-[#D98CB3] px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">{item.price}</span>
                  <span className="flex items-center gap-0.5 text-[#EBC4D8] group-hover:text-white transition-colors">
                    Shop Now <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* NEW SECTION: INTERACTIVE UPLOADER */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border/40 p-6 md:p-8 hover-lift shadow-xl text-left">
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        
        <div className="grid gap-8 lg:grid-cols-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
              Personalized Studio 🎨
            </span>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-black text-foreground tracking-tight leading-tight">
                Upload Your Pet's Photo! 🐕
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                Upload a photo of your pet and we will generate a matching vector artwork custom design for your cozy hoodie, necklace tag, or sweatshirt collar.
              </p>
            </div>
            
            {/* Steps indicator */}
            <div className="grid grid-cols-3 gap-2 border-t border-border/20 pt-4 text-[9px] font-black text-muted-foreground uppercase">
              <div>
                <span className="text-primary block text-sm font-black mb-1">01</span>
                Upload Image
              </div>
              <div>
                <span className="text-primary block text-sm font-black mb-1">02</span>
                Vectorize Graphic
              </div>
              <div>
                <span className="text-primary block text-sm font-black mb-1">03</span>
                Place Order
              </div>
            </div>
          </div>

          {/* Right interactive Uploader Panel */}
          <div className="lg:col-span-7 bg-[#FFF5F9]/40 border border-border/50 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
            {uploading ? (
              <div className="space-y-4 w-full max-w-xs text-center">
                <div className="flex justify-between text-[10px] font-black text-primary uppercase">
                  <span>Analyzing Photo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground font-medium animate-pulse">Running smart vector edge-detection filters...</p>
              </div>
            ) : generatedDesign ? (
              <div className="grid gap-6 md:grid-cols-2 w-full animate-in fade-in zoom-in-95 text-left">
                {/* Generated Design Mockup */}
                <div className="flex gap-4 items-center border-b md:border-b-0 md:border-r border-border/30 pb-4 md:pb-0 md:pr-4">
                  <div className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md">
                    <img src={uploadedImage!} alt="Original" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[9px] font-bold">Original</div>
                  </div>
                  <div className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md">
                    <img src={generatedDesign!} alt="Mockup" className="w-full h-full object-cover animate-pulse" />
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[9px] font-bold">Vector Design</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="text-xs font-black uppercase text-[#4E1B33]">Design Completed!</h4>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-semibold">Your custom print vector is ready. Code PET20 auto-applied.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" className="bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-full font-bold text-[9px] px-3.5 py-2 shadow" asChild>
                        <Link to="/shop">Order Now</Link>
                      </Button>
                      <button 
                        onClick={() => { setUploadedImage(null); setGeneratedDesign(null); }}
                        className="text-[9px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Upload Another
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations Checklist */}
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">✨ AI Recommended for {petName}</span>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">Based on species & size analysis. Check items to bundle:</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    {[
                      { id: "hoodie", label: `Matching Custom Hoodie for ${petName}`, price: "$49.99" },
                      { id: "jewelry", label: `Engraved Name Collar tag (PAW30)`, price: "$24.99" },
                      { id: "spa", label: "Recommended Spa & Grooming booking", price: "$35.00" }
                    ].map((item) => (
                      <label key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50 hover:bg-[#FFF5F9] cursor-pointer transition-colors text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedRecs.includes(item.id)} 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecs([...selectedRecs, item.id]);
                              } else {
                                setSelectedRecs(selectedRecs.filter(x => x !== item.id));
                              }
                            }}
                            className="rounded text-primary border-border focus:ring-primary w-3.5 h-3.5 accent-[#D98CB3]"
                          />
                          <span className="text-[#4E1B33]">{item.label}</span>
                        </div>
                        <span className="text-xs font-black text-[#D98CB3]">{item.price}</span>
                      </label>
                    ))}
                  </div>

                  <Button 
                    onClick={async () => {
                      if (!user) {
                        toast.error("Please login to add items to your cart");
                        return;
                      }
                      let hasCartItems = false;
                      let hasSpa = false;
                      
                      if (selectedRecs.includes("hoodie")) {
                        await addToCart(user.id, "d06da0d1-aacc-400d-800d-000000000001");
                        hasCartItems = true;
                      }
                      if (selectedRecs.includes("jewelry")) {
                        await addToCart(user.id, "d06da0d1-aacc-400d-800d-000000000003");
                        hasCartItems = true;
                      }
                      if (selectedRecs.includes("spa")) {
                        hasSpa = true;
                      }

                      if (hasCartItems) {
                        toast.success("Successfully added custom matching hoodie and jewelry tag to your cart!");
                      }
                      
                      if (hasSpa) {
                        toast.info("Redirecting you to complete your Spa & Grooming appointment booking...");
                        setTimeout(() => {
                          window.location.href = `/book?type=grooming`;
                        }, 1500);
                      } else if (hasCartItems) {
                        setTimeout(() => {
                          window.location.href = `/cart`;
                        }, 1500);
                      }
                    }}
                    disabled={selectedRecs.length === 0}
                    className="w-full bg-[#D98CB3] hover:bg-[#D98CB3]/90 text-white rounded-full py-4 text-xs font-extrabold shadow-md transition-all hover:scale-102 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Bundle Selected Items
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full h-full py-8 text-center group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                />
                <div className="h-14 w-14 rounded-full bg-[#FFF5F9] border border-border/80 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                  <PawPrint className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#4E1B33]">Drag & drop or click to upload your pet's photo</p>
                  <p className="text-[10px] text-muted-foreground/80 font-medium">Supports PNG, JPG, or HEIC (Up to 10MB)</p>
                </div>
              </label>
            )}
          </div>
        </div>
      </section>

      {/* NEW SECTION: WHY CHOOSE PETPAL? */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Why Choose PetPal? 👑
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Crafted with premium specifications for you and your companion</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { 
              title: "Premium Quality", 
              desc: "Double-stitched organic cotton hoodies & high-grade custom accessories built to last.", 
              icon: PawPrint, 
              color: "bg-pink-500/10 text-pink-500" 
            },
            { 
              title: "Fast Delivery", 
              desc: "Fast express delivery options directly to your doorstep with tracking notifications.", 
              icon: Clock, 
              color: "bg-rose-500/10 text-rose-500" 
            },
            { 
              title: "Personalized Designs", 
              desc: "Upload photos, vectorize custom tag shapes, and configure exact matching prints.", 
              icon: Sparkles, 
              color: "bg-amber-500/10 text-amber-500" 
            },
            { 
              title: "Made For Pet Lovers", 
              desc: "Ergonomically fitted cuffs, collars, and materials that guarantee total pet comfort.", 
              icon: Heart, 
              color: "bg-pink-600/10 text-pink-600" 
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-3xl bg-card border border-border p-5 flex flex-col justify-between hover-lift min-h-[160px] text-left">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("rounded-xl p-2 shrink-0", item.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-sm font-bold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* NEW SECTION: CUSTOMER TESTIMONIALS */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Loved By Pet Parents ❤️
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Check out real reviews from our verified family members</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            { 
              name: "Sarah & Albie", 
              role: "Golden Owner", 
              text: "The hoodie quality is amazing! The cotton feels premium, double-stitching is clean, and my dog is super comfortable. We get so many smiles!", 
              img: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=100&auto=format&fit=crop&q=80" 
            },
            { 
              name: "Taqwa & Buddy", 
              role: "Beagle Parent", 
              text: "My dog and I got so many compliments at the park on our matching outfits. The custom vector tag necklace detail is gorgeous and fits perfectly.", 
              img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop&q=80" 
            },
            { 
              name: "James & Bella", 
              role: "Husky Lover", 
              text: "Fast shipping, beautiful design, and the materials are very soft. Highly recommend matching sets for anyone who loves their best friend!", 
              img: "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=100&auto=format&fit=crop&q=80" 
            }
          ].map((rev, idx) => (
            <div key={idx} className="rounded-3xl bg-card border border-border p-6 flex flex-col justify-between hover-lift shadow-sm text-left relative">
              <div className="space-y-4">
                {/* 5 Stars */}
                <div className="flex items-center gap-0.5 text-amber-500 text-sm">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <Star className="h-3.5 w-3.5 fill-current" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic font-medium">
                  "{rev.text}"
                </p>
              </div>
              <div className="flex items-center gap-3 border-t border-border/30 pt-4 mt-6">
                <img src={rev.img} alt={rev.name} className="h-8 w-8 rounded-full object-cover border border-primary/20 shadow-inner" />
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">{rev.name}</h4>
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">{rev.role}</p>
                </div>
              </div>
            </div>
          ))}
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

      {/* NEW SECTION: PREMIUM PET CARE & HOTEL HUB */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#4E1B33]/10 border border-[#4E1B33]/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#4E1B33]">
            Professional Pet Boarding & Spa Services 🏨 ✂️
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Boarding, Grooming & Subscription Box
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Keep your best friend clean, happy, and cared for while you are away</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 text-left">
          
          {/* CARD 1: PET HOTEL BOARDING */}
          <div className="rounded-[2.2rem] bg-card border border-border p-6 flex flex-col justify-between hover-lift shadow-sm relative overflow-hidden min-h-[350px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl p-2 bg-[#D98CB3]/20 text-[#4E1B33] shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">🏨 Pet Hotel & Boarding</h3>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#D98CB3]">$40 / Night</span>
                </div>
              </div>
              
              <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                Traveling? Leave your pet in our safe, state-of-the-art environment with 24/7 care, daily walks, and live camera updates.
              </p>

              {/* Booking Search Form */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Check-in</label>
                    <input 
                      type="date" 
                      value={hotelCheckIn}
                      onChange={(e) => setHotelCheckIn(e.target.value)}
                      className="w-full bg-[#4E1B33]/5 border border-border/60 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Check-out</label>
                    <input 
                      type="date" 
                      value={hotelCheckOut}
                      onChange={(e) => setHotelCheckOut(e.target.value)}
                      className="w-full bg-[#4E1B33]/5 border border-border/60 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground">Guest Pet Type</label>
                  <select 
                    value={hotelPetType}
                    onChange={(e) => setHotelPetType(e.target.value)}
                    className="w-full bg-[#4E1B33]/5 border border-border/60 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground shadow-sm"
                  >
                    <option value="dog">🐶 Dog Guest</option>
                    <option value="cat">🐱 Cat Guest</option>
                    <option value="bird">🐦 Bird Guest</option>
                    <option value="rabbit">🐰 Rabbit Guest</option>
                    <option value="fish">🐠 Fish Guest</option>
                  </select>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                if (!hotelCheckIn || !hotelCheckOut) {
                  toast.error("Please select check-in and check-out dates");
                  return;
                }
                window.location.href = `/book?type=hotel&checkin=${hotelCheckIn}&checkout=${hotelCheckOut}&pet=${hotelPetType}`;
              }}
              className="w-full bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-full py-5 text-xs font-extrabold shadow-md mt-4 flex items-center justify-center gap-1.5"
            >
              Book Stay Now
            </Button>
          </div>

          {/* CARD 2: GROOMING & SPA CHECKLIST */}
          <div className="rounded-[2.2rem] bg-card border border-border p-6 flex flex-col justify-between hover-lift shadow-sm relative overflow-hidden min-h-[350px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl p-2 bg-[#D98CB3]/20 text-[#4E1B33] shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">✂️ Grooming & Spa</h3>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#D98CB3]">Professional Pet Care</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                Pamper your pet with custom luxury treatments. Select from our menu of professional care packages:
              </p>

              {/* Grooming Checklists */}
              <div className="space-y-1.5 pt-1">
                {[
                  { name: "Bath & Deep Cleaning", desc: "Organic aloe vera cleaning" },
                  { name: "Hair Cut & Styling", desc: "Full styling and sanitary trim" },
                  { name: "Nail Trimming & Filing", desc: "Gentle nail file care" },
                  { name: "Ear Cleaning & Checkup", desc: "Prevents infections" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#FFF5F9] transition-colors">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#D98CB3]/20 flex items-center justify-center text-[10px] text-[#4E1B33] font-black shrink-0">✓</div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-none">{item.name}</p>
                      <p className="text-[8px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => {
                window.location.href = `/book?type=grooming`;
              }}
              className="w-full bg-[#D98CB3] hover:bg-[#D98CB3]/90 text-white rounded-full py-5 text-xs font-extrabold shadow-md mt-4 flex items-center justify-center gap-1.5"
            >
              Book Spa Package
            </Button>
          </div>

          {/* CARD 3: MONTHLY PETPAL BOX */}
          <div className="rounded-[2.2rem] bg-card border border-border p-6 flex flex-col justify-between hover-lift shadow-sm relative overflow-hidden min-h-[350px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl p-2 bg-amber-500/10 text-amber-600 shrink-0">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">📦 Monthly PetPal Box</h3>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#D98CB3]">Only $19.99 / Month</span>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-28 border border-border/30 shadow-inner">
                <img 
                  src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=400" 
                  alt="PetPal Box" 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-2 left-2 bg-[#D98CB3] text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow">Best Seller</div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                A themed subscription box delivered to your door monthly. Filled with healthy treats, premium toys, custom accessories, and grooming samples customized for your pet.
              </p>
            </div>

            <Button 
              onClick={() => {
                toast.success("Hooray! You've successfully subscribed to the Monthly PetPal Box!");
              }}
              className="w-full bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-full py-5 text-xs font-extrabold shadow-md mt-4 flex items-center justify-center gap-1.5"
            >
              Subscribe Now
            </Button>
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
