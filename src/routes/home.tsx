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
    <div className="space-y-12 transition-all duration-700 animate-in fade-in zoom-in-95">
      
      {/* 1. NIKE/APPLE STYLE HERO SECTION */}
      <section className="relative h-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl hover-lift group border border-white/10 text-left">
        {/* Cover image background */}
        <img 
          src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200" 
          alt="Dog and Cat Hero" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-103"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        
        {/* Decorative lights */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        
        {/* Text and CTAs */}
        <div className="absolute inset-x-6 bottom-8 md:bottom-12 md:left-12 max-w-xl space-y-4 md:space-y-6 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#D98CB3]/20 border border-[#D98CB3]/30 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FFF5F9] animate-pulse">
            🔥 Premium Pet Hub
          </span>
          <div className="space-y-2 md:space-y-3">
            <h1 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
              Everything Your Pet Needs 🐾
            </h1>
            <p className="text-xs sm:text-sm text-[#EBC4D8] leading-relaxed font-semibold">
              Ecosystem connecting pet profiles, veterinary clinical schedulers, premium supply stores, and smart AI wellness diagnostics in one dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button className="bg-[#FFF5F9] text-[#4E1B33] hover:bg-white rounded-full px-6 py-6 font-extrabold shadow-lg hover:scale-105 transition-transform flex items-center gap-2" asChild>
              <Link to="/shop">
                Shop Now <ShoppingBag className="h-4.5 w-4.5 text-primary" />
              </Link>
            </Button>
            <Button variant="outline" className="border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full px-6 py-6 font-extrabold hover:scale-105 transition-transform flex items-center gap-2" asChild>
              <Link to="/pets">
                Explore Pets <ChevronRight className="h-4.5 w-4.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. WELCOME HEADER & LOYALTY GRID */}
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

      {/* 3. HAPPY PET GALLERY */}
      <section className="space-y-4">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
            Visual Highlights 📸
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Happy Pet Gallery
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Moments of pure joy and companionship captured from our family members</p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {[
            { title: "Dog Playing", img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600" },
            { title: "Cat Sleeping", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600" },
            { title: "Milo Rabbit", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600" },
            { title: "Family Pet", img: "https://images.unsplash.com/photo-1522276498395-f4f68f7f8454?auto=format&fit=crop&q=80&w=600" },
            { title: "Sleepy Kitten", img: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=600" },
            { title: "Dog in Park", img: "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=600" }
          ].map((item, idx) => (
            <div key={idx} className="group relative rounded-[2rem] overflow-hidden aspect-[4/3] border border-border/30 shadow-md">
              <img 
                src={item.img} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-4 text-left z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <span className="text-[10px] font-black uppercase text-white bg-primary px-2.5 py-0.5 rounded-full shadow-md">
                  {item.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PETS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
              Meet Companions ❤️
            </span>
            <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
              Featured Pets
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">Meet the newest registered additions to our loving community</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-500 hover:underline cursor-pointer">
            View All
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { name: "Daisy", breed: "Golden Puppy", age: "3 months", health: "100%", status: "Playful", img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80" },
            { name: "Oliver", breed: "British Shorthair", age: "1 year", health: "98%", status: "Napping", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80" },
            { name: "Milo", breed: "Angora Rabbit", age: "6 months", health: "95%", status: "Eating", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&auto=format&fit=crop&q=80" },
            { name: "Bella", breed: "Siberian Husky", age: "2 years", health: "97%", status: "Active", img: "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=600&auto=format&fit=crop&q=80" }
          ].map((pet, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-[2.5rem] bg-card border border-border/40 hover:shadow-2xl transition-all duration-500 flex flex-col justify-between hover-lift">
              
              {/* Pet Info on Top of card */}
              <div className="p-4 flex items-center justify-between border-b border-border/20 text-left bg-[#FFF5F9]/30">
                <div>
                  <h3 className="font-display font-black text-lg text-[#4E1B33]">{pet.name}</h3>
                  <p className="text-[9px] font-bold text-accent uppercase tracking-wider">{pet.breed}</p>
                </div>
                <span className="text-[10px] font-black uppercase bg-[#4E1B33] text-white px-2.5 py-0.5 rounded-full">{pet.age}</span>
              </div>

              <div className="p-4 space-y-4">
                {/* 30% larger Image aspect-square with hover zoom */}
                <div className="relative overflow-hidden rounded-[2rem] aspect-square bg-secondary/30 shadow-inner">
                  <img 
                    src={pet.img} 
                    alt={pet.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[9px] uppercase font-black tracking-wider bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full">
                      {pet.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meet Me bottom action bar */}
              <div className="p-4 pt-0 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/80 px-1">
                  <span>Wellness Index</span>
                  <span className="text-emerald-500 font-extrabold">{pet.health}</span>
                </div>
                <Button className="w-full bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-xl py-5 font-black text-xs transition-all hover:scale-102 flex items-center justify-center gap-1" asChild>
                  <Link to="/community">
                    Meet Me <Heart className="h-3.5 w-3.5 fill-current text-pink-400" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SUMMER PROMO BANNER */}
      <section className="relative h-[220px] rounded-[2.5rem] overflow-hidden shadow-xl border border-white/15 group text-left">
        <img 
          src="https://images.unsplash.com/photo-1513360309081-36f5e878fc9e?auto=format&fit=crop&q=80&w=1200" 
          alt="Summer Collection" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-103"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />
        
        <div className="absolute inset-y-0 left-6 sm:left-12 flex flex-col justify-center text-left space-y-2 max-w-md z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/20 border border-pink-500/30 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#FFF5F9]">
            🌸 Fresh Arrivals
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
            Summer Collection 2026 🌸
          </h2>
          <p className="text-[11px] text-[#EBC4D8] font-semibold leading-relaxed">
            Elevate your best friend's style with our matching coordinates and limited-edition pastel floral pendants.
          </p>
          <div className="pt-2">
            <Button size="sm" className="bg-[#FFF5F9] text-[#4E1B33] hover:bg-white rounded-full font-black text-[10px] px-5 py-3.5 shadow-md" asChild>
              <Link to="/shop">Explore Collection</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. ACCESSORIES SHOP CATALOG */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
            Premium Supplies 🛍️
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Shop Premium Accessories
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Hand-crafted items designed for ultimate pet comfort and luxury</p>
        </div>

        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
          {[
            { name: "Luxury Collar", price: 16.99, img: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=300", id: "d06da0d1-aacc-400d-800d-000000000003" },
            { name: "Leather Leash", price: 14.99, img: "https://images.unsplash.com/photo-1608096299210-db7e38487075?auto=format&fit=crop&q=80&w=300", id: "d06da0d1-aacc-400d-800d-000000000003" },
            { name: "Orthopedic Bed", price: 49.99, img: "https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?auto=format&fit=crop&q=80&w=300", id: "d06da0d1-aacc-400d-800d-000000000001" },
            { name: "Rubber Toy Bone", price: 9.99, img: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=300", id: "d06da0d1-7075-400d-800d-000000000001" },
            { name: "Ceramic Food Bowl", price: 12.99, img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=300", id: "d06da0d1-aacc-400d-800d-000000000003" },
            { name: "Comfort Carrier Bag", price: 39.99, img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=300", id: "d06da0d1-aacc-400d-800d-000000000001" },
            { name: "Winter Cozy Jacket", price: 29.99, img: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=300", id: "d06da0d1-aacc-400d-800d-000000000003" },
            { name: "Home Grooming Kit", price: 24.99, img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=300", id: "d06da0d1-9700-400d-800d-000000000001" }
          ].map((item, idx) => (
            <div key={idx} className="group relative rounded-[2.2rem] overflow-hidden border border-border/30 bg-card p-4 flex flex-col justify-between hover-lift shadow-sm text-left">
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-secondary/35 mb-4 shadow-inner">
                <img 
                  src={item.img} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground truncate">{item.name}</h3>
                  <div className="flex items-center gap-0.5 text-amber-500 text-[10px] mt-0.5">
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/20 text-xs">
                  <span className="font-mono font-black text-[#D98CB3]">${item.price.toFixed(2)}</span>
                  <button 
                    onClick={async () => {
                      if (!user) {
                        toast.error("Please login to shop products");
                        return;
                      }
                      await addToCart(user.id, item.id);
                      toast.success(`Added ${item.name} to your shopping cart!`);
                    }}
                    className="text-[9px] font-black uppercase text-primary hover:text-[#4E1B33] transition-colors cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PET FASHION COLLECTION */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
            Style Catalog 🐕 🐈
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Pet Fashion Collection
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Make heads turn with premium coordinates and winter clothing sets</p>
        </div>

        <div className="grid gap-6 grid-cols-2 lg:grid-cols-5 text-left">
          {[
            { title: "Winter Jacket", label: "Cozy warm padding", img: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=300" },
            { title: "Bandana Kit", label: "Soft cotton print", img: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=300" },
            { title: "Pastel Hoodie", label: "Matching coordinates", img: "https://images.unsplash.com/photo-1522276498395-f4f68f7f8454?auto=format&fit=crop&q=80&w=300" },
            { title: "Winter Clothes", label: "Knitted wool wear", img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=300" },
            { title: "Summer Clothes", label: "Breathable shirts", img: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=300" }
          ].map((item, idx) => (
            <Link 
              key={idx} 
              to="/shop" 
              className="group relative rounded-[2rem] overflow-hidden hover-lift border border-border/30 aspect-[4/5] flex flex-col justify-end p-4 shadow-sm"
            >
              <img 
                src={item.img} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="relative z-10 space-y-1">
                <h3 className="font-display text-sm font-black text-white leading-tight">{item.title}</h3>
                <p className="text-[8px] text-[#EBC4D8] font-semibold leading-relaxed">{item.label}</p>
                <div className="pt-1 text-[8px] font-black text-[#D98CB3] uppercase tracking-wider flex items-center gap-0.5">
                  Shop Outfit <ChevronRight className="h-2.5 w-2.5" />
                </div>
              </div>
            </Link>
          ))}
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

      {/* 8. Boarding, Spa & Subscription Box */}
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

      {/* 9. PERSONALIZED PET JEWELRY SALE */}
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

      {/* 10. INTERACTIVE PHOTO UPLOADER */}
      <section id="studio" className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border/40 p-6 md:p-8 hover-lift shadow-xl text-left">
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

      {/* 11. COMMUNITY PETS INSTAGRAM STYLE FEED */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
            Social Board 🐶 🐱
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Community Pets Instagram Feed
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">See what coordinates and tags our family members are sporting on the board</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80", likes: "1.2k", comments: "148" },
            { img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80", likes: "982", comments: "94" },
            { img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&auto=format&fit=crop&q=80", likes: "740", comments: "62" },
            { img: "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=200&auto=format&fit=crop&q=80", likes: "2.1k", comments: "280" },
            { img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=80", likes: "1.5k", comments: "172" },
            { img: "https://images.unsplash.com/photo-1522856283749-626210a309e1?w=200&auto=format&fit=crop&q=80", likes: "510", comments: "35" },
            { img: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&auto=format&fit=crop&q=80", likes: "390", comments: "21" },
            { img: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&auto=format&fit=crop&q=80", likes: "1.8k", comments: "210" },
            { img: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&auto=format&fit=crop&q=80", likes: "2.4k", comments: "315" },
            { img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&auto=format&fit=crop&q=80", likes: "1.6k", comments: "198" },
            { img: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=200&auto=format&fit=crop&q=80", likes: "2.2k", comments: "294" },
            { img: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=200&auto=format&fit=crop&q=80", likes: "1.9k", comments: "244" }
          ].map((post, idx) => (
            <Link 
              key={idx}
              to="/community"
              className="group relative aspect-square rounded-2xl overflow-hidden border border-border/30 shadow-sm"
            >
              <img src={post.img} alt="Community pet" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 text-white text-[10px] font-black uppercase">
                <span className="flex items-center gap-1">❤️ {post.likes}</span>
                <span className="flex items-center gap-1">💬 {post.comments}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 12. SUCCESS STORIES */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
            Care Journeys ❤️
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Success Stories
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Preventative diagnostics and weight logs driving amazing outcomes</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 text-left">
          {[
            {
              title: "Max's Rescue Journey 🐶",
              desc: "From severe malnourishment and anxiety to an active, glowing companion.",
              before: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=200&auto=format&fit=crop&q=80",
              after: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80",
              tag: "Rescue Match"
            },
            {
              title: "Oliver's Weight Recovery 🐱",
              desc: "Lost 4.2kg of excess weight through our automated caloric deficit recommendations.",
              before: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80",
              after: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&auto=format&fit=crop&q=80",
              tag: "Weight Control"
            },
            {
              title: "Bella's Adoption Story 🐰",
              desc: "Found her forever home and family match through our community board filters.",
              before: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&auto=format&fit=crop&q=80",
              after: "https://images.unsplash.com/photo-1522276498395-f4f68f7f8454?w=200&auto=format&fit=crop&q=80",
              tag: "Adoption"
            }
          ].map((story, idx) => (
            <div key={idx} className="rounded-3xl bg-card border border-border p-5 flex flex-col justify-between hover-lift shadow-sm">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-500/20">
                  {story.tag}
                </span>
                <h3 className="font-display text-base font-bold text-foreground leading-tight">{story.title}</h3>
                
                {/* Before / After side-by-side collage */}
                <div className="grid grid-cols-2 gap-2 relative">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-border/30">
                    <img src={story.before} alt="Before" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-2 bg-black/60 text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">Before</span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-border/30">
                    <img src={story.after} alt="After" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-2 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">After</span>
                  </div>
                </div>
                
                <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                  {story.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 13. CARETAKER ACHIEVEMENTS & TESTIMONIALS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Achievements Card */}
        <section className="space-y-4 text-left">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Caretaker Achievements
          </h2>
          <div className="grid gap-4 grid-cols-2">
            {[
              { title: "Perfect Caretaker", medal: "GOLD MEDAL", desc: "12 months cycle fully registered and booster appointments completed.", color: "text-yellow-500 bg-yellow-500/10" },
              { title: "Wellness Champion", medal: "GOLD MEDAL", desc: "Maintained health index scores above 95% for 3 months.", color: "text-yellow-500 bg-yellow-500/10" }
            ].map((ach, idx) => (
              <div key={idx} className="rounded-3xl bg-card border border-border p-4 flex flex-col justify-between min-h-[140px] hover-lift">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("rounded-xl p-2 shrink-0", ach.color)}>
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xs font-bold text-foreground leading-tight">{ach.title}</h3>
                      <span className="text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground">{ach.medal}</span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-muted-foreground leading-tight">
                    {ach.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Card */}
        <section className="space-y-4 text-left">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            Loved By Pet Parents ❤️
          </h2>
          <div className="rounded-3xl bg-card border border-border p-5 flex flex-col justify-between min-h-[190px] shadow-sm relative">
            <div className="space-y-3">
              <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic font-medium">
                "My dog and I got so many compliments at the park on our matching outfits. The custom vector tag necklace detail is gorgeous and fits perfectly."
              </p>
            </div>
            <div className="flex items-center gap-3 border-t border-border/30 pt-3 mt-4">
              <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop&q=80" alt="Taqwa" className="h-7 w-7 rounded-full object-cover border border-primary/20 shadow-inner" />
              <div>
                <h4 className="text-xs font-bold text-foreground leading-none">Taqwa & Buddy</h4>
                <p className="text-[8px] text-muted-foreground uppercase font-black tracking-wider mt-0.5">Beagle Parent</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 14. ECOSYSTEM STATISTICS & TIMELINE */}
      <div className="grid gap-6 md:grid-cols-2 text-left">
        {/* Statistics Grid */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Ecosystem Statistics
          </h2>
          <div className="grid gap-3 grid-cols-2">
            {[
              { label: "TOTAL PETS", value: `${totalPetsCount} Pet${totalPetsCount > 1 ? "s" : ""} 🐕`, desc: "Registered companions", to: "/pets", bg: "text-pink-600 hover:border-pink-500/30" },
              { label: "VET BOOKINGS", value: `${appointmentsText} 📅`, desc: "Upcoming clinic visits", to: "/book", bg: "text-rose-600 hover:border-rose-500/30" },
              { label: "AVERAGE WELLNESS", value: `${wellnessScore} ❤️`, desc: "License safety status", to: "/pets", bg: "text-amber-600 hover:border-amber-500/30" },
              { label: "MONTHLY SPEND", value: `${monthlySpend} 💳`, desc: "Supplies & clinical services", to: "/shop", bg: "text-rose-500 hover:border-rose-400/30" }
            ].map((stat, idx) => (
              <Link 
                key={idx} 
                to={stat.to} 
                className={cn("group rounded-2xl bg-card border border-border/80 p-4 hover-lift flex flex-col justify-between min-h-[110px]", stat.bg)}
              >
                <div>
                  <span className="text-[8px] uppercase font-bold tracking-wider text-muted-foreground/80 block">{stat.label}</span>
                  <span className="font-display text-base font-bold mt-1 block tracking-tight text-foreground">{stat.value}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-1.5 text-[8.5px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>{stat.desc}</span>
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Timeline Activities */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Upcoming Activities
          </h2>
          <div className="relative pl-6 border-l border-border/80 space-y-4 ml-2">
            {[
              { title: "Rabies Booster Due", date: "In 5 days", desc: "预防接种 compliance cycle.", color: "bg-rose-500" },
              { title: "Annual Vet checkup", date: "In 8 days", desc: "Routine weight and diagnostic logs.", color: "bg-pink-500" }
            ].map((act, idx) => (
              <div key={idx} className="relative group">
                <div className={cn("absolute -left-[30px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-background transition-transform duration-500 group-hover:scale-125 shadow-sm", act.color)} />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-card border border-border/50 rounded-xl p-3.5 hover:shadow-md transition-shadow">
                  <div className="text-left space-y-0.5">
                    <h4 className="font-bold text-xs text-foreground">{act.title}</h4>
                    <p className="text-[9px] text-muted-foreground leading-tight">{act.desc}</p>
                  </div>
                  <span className="text-[8px] font-bold text-accent shrink-0 uppercase">{act.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 15. INFINITE PET CAROUSEL MARQUEE */}
      <section className="w-full overflow-hidden bg-[#4E1B33] text-white py-4 rounded-3xl shadow-lg relative z-10 border border-white/10 mt-8">
        <div className="flex animate-marquee whitespace-nowrap gap-12 font-display text-sm font-extrabold uppercase tracking-widest">
          {[
            "🐶 Dogs", "🐱 Cats", "🐰 Rabbits", "🐠 Fish", "🐦 Birds", "🦎 Reptiles", "🐹 Hamsters",
            "🐶 Dogs", "🐱 Cats", "🐰 Rabbits", "🐠 Fish", "🐦 Birds", "🦎 Reptiles", "🐹 Hamsters"
          ].map((t, idx) => (
            <span key={idx} className="flex items-center gap-2 select-none">
              <span>{t}</span>
              <span className="text-primary">•</span>
            </span>
          ))}
        </div>
      </section>

      {/* Emergency Hotline Dialog Trigger */}
      <EmergencyModal open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog} />

    </div>
  );
}
