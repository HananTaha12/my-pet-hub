import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  ShoppingBag, PawPrint, Sparkles, Heart, ChevronRight
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/studio")({
  head: () => ({ meta: [{ title: "Design Studio — PetPal" }] }),
  component: () => (
    <RequireAuth>
      <AppShell><StudioPage /></AppShell>
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

const PET_IMAGE_MAP: Record<string, string> = {
  dog: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
  cat: "/oliver.jpg",
  bird: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&q=80&w=800",
  rabbit: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=800",
  bunny: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=800",
  fish: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&q=80&w=800",
};

const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800";

function calculateAge(dobString: string | null | undefined): string {
  if (!dobString) return "3 years";
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

function StudioPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetIndex, setActivePetIndex] = useState(0);

  // Custom Jewelry State
  const [selectedJewelryPetId, setSelectedJewelryPetId] = useState("mock-dog");
  const [jewelryEngravingText, setJewelryEngravingText] = useState("Buddy");
  const [jewelryType, setJewelryType] = useState<"silver" | "gold" | "ceramic" | "rose_gold">("silver");

  // Smart Pet Size Finder State
  const [sizeSpecies, setSizeSpecies] = useState<"dog" | "cat">("dog");
  const [sizeWeight, setSizeWeight] = useState<number>(8);
  const [sizeBreed, setSizeBreed] = useState<string>("Golden Retriever");

  // Photo Uploader State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);

  // Fetch pets for dropdowns and switcher
  useEffect(() => {
    if (!user) return;
    (async () => {
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
    })();
  }, [user]);

  // Determine pet list (db pets or fallback mock list for switcher)
  const petList = useMemo(() => {
    return pets.length > 0 ? pets : [
      { id: "mock-dog", name: "Buddy", species: "dog", breed: "Golden Retriever", date_of_birth: null, weight_kg: 17 },
      { id: "mock-cat", name: "Oliver", species: "cat", breed: "British Shorthair", date_of_birth: null, weight_kg: 5 },
      { id: "mock-rabbit", name: "Milo", species: "rabbit", breed: "Angora Rabbit", date_of_birth: null, weight_kg: 2 }
    ];
  }, [pets]);

  // Determine active pet
  const activePet = petList[activePetIndex] || petList[0];
  const petSpecies = activePet.species.toLowerCase();

  // Dynamic species themes mapping
  const petTheme = useMemo(() => {
    switch (petSpecies) {
      case "cat":
        return {
          accent: "text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20 dark:border-purple-500/30 ring-purple-500",
          bgTint: "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/15 dark:border-purple-500/25",
          text: "text-purple-600 dark:text-purple-400",
          badgeColor: "bg-purple-500",
          petIcon: "🐱",
          titleColor: "text-purple-900 dark:text-purple-200"
        };
      case "rabbit":
      case "bunny":
        return {
          accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30 ring-emerald-500",
          bgTint: "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/15 dark:border-emerald-500/25",
          text: "text-emerald-600 dark:text-emerald-400",
          badgeColor: "bg-emerald-500",
          petIcon: "🐰",
          titleColor: "text-emerald-900 dark:text-emerald-200"
        };
      case "bird":
        return {
          accent: "text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/20 dark:border-sky-500/30 ring-sky-500",
          bgTint: "bg-sky-500/5 dark:bg-sky-500/10 border-sky-500/15 dark:border-sky-500/25",
          text: "text-sky-600 dark:text-sky-400",
          badgeColor: "bg-sky-500",
          petIcon: "🐦",
          titleColor: "text-sky-900 dark:text-sky-200"
        };
      case "dog":
      default:
        return {
          accent: "text-[#D98CB3] bg-pink-500/10 border-pink-500/20 ring-pink-500",
          bgTint: "bg-[#FFF5F9]/30 border-border/20 dark:border-border/30",
          text: "text-[#D98CB3] dark:text-pink-400",
          badgeColor: "bg-[#4E1B33]",
          petIcon: "🐶",
          titleColor: "text-[#4E1B33] dark:text-pink-200"
        };
    }
  }, [petSpecies]);

  const petWeight = activePet.weight_kg ? `${activePet.weight_kg}kg` : "17kg";
  const petAge = calculateAge(activePet.date_of_birth);

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
            setGeneratedDesign("https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=400");
            toast.success("Success! Custom hoodie mock design generated successfully!");
          }, 800);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  // Dynamic Sizing calculation logic
  const calculatedSizeInfo = useMemo(() => {
    const isDog = sizeSpecies === "dog";
    let size = "M";
    let range = "6 - 12 kg";
    let chest = "45 - 55";
    let neck = "30 - 38";
    let back = "30 - 40";

    if (isDog) {
      if (sizeWeight < 3) {
        size = "XS";
        range = "Under 3 kg";
        chest = "30 - 35";
        neck = "20 - 25";
        back = "20 - 25";
      } else if (sizeWeight < 6) {
        size = "S";
        range = "3 - 6 kg";
        chest = "35 - 45";
        neck = "25 - 30";
        back = "25 - 30";
      } else if (sizeWeight < 12) {
        size = "M";
        range = "6 - 12 kg";
        chest = "45 - 55";
        neck = "30 - 38";
        back = "30 - 40";
      } else if (sizeWeight < 25) {
        size = "L";
        range = "12 - 25 kg";
        chest = "55 - 70";
        neck = "38 - 48";
        back = "40 - 50";
      } else {
        size = "XL";
        range = "Over 25 kg";
        chest = "70 - 90";
        neck = "48 - 60";
        back = "50 - 65";
      }
    } else {
      // Cat sizing
      if (sizeWeight < 2.5) {
        size = "XS";
        range = "Under 2.5 kg";
        chest = "26 - 30";
        neck = "18 - 22";
        back = "20 - 24";
      } else if (sizeWeight < 4.5) {
        size = "S";
        range = "2.5 - 4.5 kg";
        chest = "30 - 36";
        neck = "22 - 26";
        back = "24 - 28";
      } else if (sizeWeight < 7) {
        size = "M";
        range = "4.5 - 7 kg";
        chest = "36 - 42";
        neck = "26 - 30";
        back = "28 - 32";
      } else if (sizeWeight < 10) {
        size = "L";
        range = "7 - 10 kg";
        chest = "42 - 50";
        neck = "30 - 35";
        back = "32 - 38";
      } else {
        size = "XL";
        range = "Over 10 kg";
        chest = "50 - 58";
        neck = "35 - 40";
        back = "38 - 44";
      }
    }

    // Custom breed advice
    let advice = "Standard athletic fit. If your pet falls between sizes or has thick fur, we recommend choosing the larger size.";
    const breedLower = sizeBreed.toLowerCase();
    
    if (breedLower.includes("golden") || breedLower.includes("labrador") || breedLower.includes("shepherd")) {
      advice = "Deep-chested breed. We recommend sizing up if chest is close to the limit. Look for elastic fabrics.";
    } else if (breedLower.includes("bulldog") || breedLower.includes("pug")) {
      advice = "Broad chest & shoulders. Always recommend going up a size to prevent tightness around the chest and neck.";
    } else if (breedLower.includes("chihuahua") || breedLower.includes("yorkshire") || breedLower.includes("terrier")) {
      advice = "Tiny frame, susceptible to cold temperatures. Opt for full-coverage hoodies with soft inner lining.";
    } else if (breedLower.includes("persian") || breedLower.includes("coon")) {
      advice = "Fluffy coat adds significant bulk. Add 2-3 cm to chest measurements to ensure comfort and prevent fur matting.";
    } else if (breedLower.includes("siamese") || breedLower.includes("sphynx")) {
      advice = "Lean, slender profile. Ideal for a snug fit. Excellent for lightweight thermal pajamas.";
    } else if (breedLower.includes("shorthair")) {
      advice = "Sturdy, stocky neck. Choose garments with button-up collars or wide necklines for easy dressing.";
    }

    return { size, range, chest, neck, back, advice };
  }, [sizeSpecies, sizeWeight, sizeBreed]);

  return (
    <div className="space-y-10 transition-all duration-700 animate-in fade-in zoom-in-95">
      
      {/* HEADER */}
      <div className="text-left space-y-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-pink-600">
          🎨 Design & Personalization
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground tracking-tight">
          Personalization Studio
        </h1>
        <p className="text-sm text-muted-foreground font-semibold">
          Design custom-engraved keepsake tags, preview matching coordinates, and find the perfect sizing fit.
        </p>
      </div>

      {/* COMPANION SWITCHER */}
      <div className={cn("bg-card/45 backdrop-blur-md rounded-[2.5rem] border p-5 flex flex-col md:flex-row items-center justify-between gap-4 pet-transition shadow-lg relative z-20", petTheme.bgTint)}>
        <div className="flex items-center gap-3 text-left w-full md:w-auto">
          <div className="h-11 w-11 rounded-2xl bg-[#FFF5F9] dark:bg-[#1F1216] border border-border/80 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            {petTheme.petIcon}
          </div>
          <div>
            <h4 className="font-display font-black text-sm text-[#4E1B33] dark:text-white flex items-center gap-1.5 leading-none">
              Active Companion: {activePet.name}
            </h4>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1 leading-none">
              {activePet.breed || "Coordinated Pet"} • {petWeight} • {petAge}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar w-full md:w-auto py-1 justify-start md:justify-end">
          <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest hidden lg:inline mr-1">Switch Companion:</span>
          {petList.map((p, idx) => {
            const isSelected = idx === activePetIndex;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActivePetIndex(idx);
                  // Sync Customizer pet & name input automatically
                  setSelectedJewelryPetId(p.id);
                  setJewelryEngravingText(p.name);
                  toast.success(`Companion profile switched to ${p.name}!`);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black transition-all duration-300 hover-lift cursor-pointer shrink-0 select-none",
                  isSelected
                    ? "bg-[#4E1B33] text-white border-[#4E1B33] shadow-md scale-102"
                    : "bg-white/90 dark:bg-[#2D1C21]/90 text-muted-foreground border-border/40 hover:text-foreground"
                )}
              >
                <span className="text-sm">{p.species.toLowerCase() === "cat" ? "🐱" : p.species.toLowerCase() === "rabbit" ? "🐰" : p.species.toLowerCase() === "bird" ? "🐦" : "🐶"}</span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* JEWELRY CUSTOMIZER */}
      <section className="bg-card/85 backdrop-blur-md border border-border/60 rounded-[2.5rem] p-5 sm:p-8 shadow-2xl flex flex-col lg:flex-row gap-8 relative overflow-hidden text-left">
        {/* Background decorative elements */}
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />

        {/* Mockup Preview Area */}
        <div className="flex-1 bg-gradient-to-b from-[#4E1B33]/5 to-[#4E1B33]/15 border border-border/40 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-inner">
          
          {/* Chain / Bracelet line */}
          {jewelryType === "rose_gold" ? (
            <div className="absolute inset-x-8 top-1/2 -translate-y-16 h-6 rounded-full border-b-4 border-dashed border-rose-400 opacity-60 z-10" />
          ) : (
            <>
              <div className="absolute top-0 w-0.5 h-24 bg-gradient-to-b from-[#B593A1] to-slate-400 z-10" />
              <div className="absolute top-24 w-4 h-4 rounded-full border-2 border-slate-300 bg-transparent z-10" />
            </>
          )}

          {/* The Pendant */}
          <div className="relative z-20 mt-16 flex items-center justify-center transition-all duration-500 hover:scale-105">
            {jewelryType === "silver" && (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 border-2 border-slate-300 shadow-xl flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
                <PawPrint className="h-8 w-8 text-slate-500 opacity-50 mb-1.5" />
                <span className="text-xs font-black tracking-wider uppercase max-w-[90px] truncate engraved-text-silver font-display">
                  {jewelryEngravingText || "Buddy"}
                </span>
              </div>
            )}
            {jewelryType === "gold" && (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-100 via-yellow-400 to-amber-600 border-2 border-yellow-300 shadow-xl flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
                <PawPrint className="h-8 w-8 text-yellow-850 opacity-50 mb-1.5" />
                <span className="text-xs font-black tracking-wider uppercase max-w-[90px] truncate engraved-text-gold font-display">
                  {jewelryEngravingText || "Buddy"}
                </span>
              </div>
            )}
            {jewelryType === "rose_gold" && (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-100 via-rose-300 to-rose-500 border-2 border-rose-300 shadow-xl flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none" />
                <Heart className="h-8 w-8 text-rose-800 opacity-50 mb-1.5" />
                <span className="text-xs font-black tracking-wider uppercase max-w-[90px] truncate engraved-text-rose font-display">
                  {jewelryEngravingText || "Buddy"}
                </span>
              </div>
            )}
            {jewelryType === "ceramic" && (
              <div className="w-28 h-28 rounded-full bg-white border-4 border-[#D98CB3] shadow-2xl flex flex-col items-center justify-center p-2 text-center ring-4 ring-pink-100 relative">
                <div className="absolute inset-1 rounded-full border border-pink-200 border-dashed pointer-events-none" />
                <span className="text-2xl">🐱</span>
                <span className="text-[10px] font-black tracking-tight text-[#4E1B33] mt-1.5 max-w-[85px] truncate font-display">
                  {jewelryEngravingText || "Buddy"}
                </span>
              </div>
            )}
          </div>

          {/* Pet Photo Inset Badge & connecting pointer line */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/95 dark:bg-[#1F1216]/95 border border-border/60 px-2.5 py-1 rounded-full shadow-md z-30">
            <div className="h-8 w-8 rounded-full overflow-hidden border border-[#D98CB3] shadow-inner bg-[#4E1B33]/5 flex items-center justify-center">
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
            <span className="text-[8px] font-black uppercase tracking-wider text-[#4E1B33] dark:text-[#FEE2E2]">
              Your Pet's Portrait
            </span>
          </div>

          {/* SVG Connector pointer line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
            <path d="M 95 245 L 120 185" stroke="#B593A1" strokeWidth="1.5" strokeDasharray="3" fill="none" />
          </svg>
        </div>

        {/* Form controls */}
        <div className="w-full lg:w-[45%] flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-black text-[#4E1B33] dark:text-pink-300">Live Jewelry Designer</h3>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5 leading-tight">Create an engraved heirloom with your pet's name & details.</p>
            </div>

            {/* Pet selection dropdown */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-muted-foreground block">Select Pet Companion</label>
              <select 
                value={selectedJewelryPetId}
                onChange={(e) => handleJewelryPetChange(e.target.value)}
                className="w-full bg-[#4E1B33]/5 border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground font-semibold"
              >
                {pets.map(p => (
                  <option key={p.id} value={p.id}>🐾 {p.name}</option>
                ))}
                <option value="mock-dog">🐾 Custom Pet Name...</option>
              </select>
            </div>

            {/* Engraving name text input */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-muted-foreground block">Engraved Text / Name</label>
              <input 
                type="text" 
                maxLength={12}
                value={jewelryEngravingText}
                onChange={(e) => setJewelryEngravingText(e.target.value)}
                placeholder="e.g. Buddy"
                className="w-full bg-[#4E1B33]/5 border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground font-semibold"
              />
            </div>

            {/* Style selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-muted-foreground block">Style / Material</label>
              <div className="grid grid-cols-4 gap-1.5 py-0.5 text-center">
                {[
                  { id: "silver", label: "Silver Tag", price: "$24.99" },
                  { id: "gold", label: "Gold Charm", price: "$29.99" },
                  { id: "rose_gold", label: "Rose Gold", price: "$27.99" },
                  { id: "ceramic", label: "3D Ceramic", price: "$34.99" }
                ].map(style => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setJewelryType(style.id as any)}
                    className={cn(
                      "py-2 px-1 rounded-xl text-[9px] font-black border transition-all cursor-pointer select-none",
                      jewelryType === style.id
                        ? "border-[#4E1B33] bg-[#4E1B33] text-white shadow-sm"
                        : "border-border/50 hover:bg-secondary/40 text-muted-foreground"
                    )}
                  >
                    <span className="block leading-none truncate">{style.label}</span>
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
              await addToCart(user.id, "d06da0d1-aacc-400d-800d-000000000003");
              toast.success(`Hooray! Added custom ${jewelryType} name tag jewelry engraved for "${jewelryEngravingText}" to your shopping cart!`);
            }}
            className="w-full bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-full py-5 text-sm font-black shadow-md flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" /> Order Engraved Tag
          </Button>
        </div>
      </section>

      {/* SMART SIZE FINDER */}
      <section className="bg-card/75 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-6 sm:p-8 shadow-xl text-left relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
          {/* Form Side */}
          <div className="flex-1 space-y-6 w-full text-left">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
                📏 Interactive Size Calculator
              </span>
              <h3 className="font-display text-2xl font-black text-foreground tracking-tight">
                Smart Pet Size Finder
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Find the perfect fit for your pet's sweaters, hoodies, and pajamas.
              </p>
            </div>

            {/* Autofill Button if companion is available */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const species = activePet.species.toLowerCase();
                  if (species === "dog" || species === "cat") {
                    setSizeSpecies(species as any);
                  } else {
                    setSizeSpecies("dog");
                  }
                  
                  // Extract weight (numeric)
                  let wt = 8;
                  if (activePet.weight_kg) {
                    wt = activePet.weight_kg;
                  }
                  
                  // Cap/Bound weight to bounds
                  const maxWt = species === "cat" ? 12 : 50;
                  wt = Math.max(1, Math.min(wt, maxWt));
                  setSizeWeight(wt);

                  // Extract breed
                  if (activePet.breed) {
                    setSizeBreed(activePet.breed);
                  } else {
                    setSizeBreed(species === "cat" ? "Domestic Shorthair" : "Golden Retriever");
                  }
                  
                  toast.success(`Loaded profile for ${activePet.name}!`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4E1B33]/5 dark:bg-white/5 hover:bg-pink-500/10 dark:hover:bg-pink-500/20 text-[#4E1B33] dark:text-pink-300 text-[10px] font-black tracking-wide border border-pink-500/10 hover:border-pink-500/20 hover:scale-102 transition-all cursor-pointer"
              >
                🐾 Use Active Companion: {activePet.name}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Species Selection */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Pet Species</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSizeSpecies("dog");
                      setSizeWeight(8);
                      setSizeBreed("Golden Retriever");
                    }}
                    className={cn(
                      "py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer select-none text-center",
                      sizeSpecies === "dog"
                        ? "border-[#4E1B33] bg-[#4E1B33] text-white shadow-sm"
                        : "border-border/50 hover:bg-secondary/40 text-muted-foreground"
                    )}
                  >
                    🐶 Dog
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSizeSpecies("cat");
                      setSizeWeight(4.5);
                      setSizeBreed("Domestic Shorthair");
                    }}
                    className={cn(
                      "py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer select-none text-center",
                      sizeSpecies === "cat"
                        ? "border-[#4E1B33] bg-[#4E1B33] text-white shadow-sm"
                        : "border-border/50 hover:bg-secondary/40 text-muted-foreground"
                    )}
                  >
                    🐱 Cat
                  </button>
                </div>
              </div>

              {/* Breed Selector */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Breed Type</label>
                <select
                  value={sizeBreed}
                  onChange={(e) => setSizeBreed(e.target.value)}
                  className="w-full bg-[#4E1B33]/5 border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground font-semibold"
                >
                  {sizeSpecies === "dog" ? (
                    <>
                      <option value="Golden Retriever">Golden Retriever</option>
                      <option value="Labrador">Labrador Retriever</option>
                      <option value="French Bulldog">French Bulldog</option>
                      <option value="German Shepherd">German Shepherd</option>
                      <option value="Poodle">Poodle</option>
                      <option value="Beagle">Beagle</option>
                      <option value="Pug">Pug</option>
                      <option value="Chihuahua">Chihuahua</option>
                      <option value="Yorkshire Terrier">Yorkshire Terrier</option>
                      <option value="Other / Mixed Breed">Other / Mixed Breed (Dog)</option>
                    </>
                  ) : (
                    <>
                      <option value="Domestic Shorthair">Domestic Shorthair</option>
                      <option value="British Shorthair">British Shorthair</option>
                      <option value="Persian">Persian Cat</option>
                      <option value="Maine Coon">Maine Coon</option>
                      <option value="Siamese">Siamese Cat</option>
                      <option value="Sphynx">Sphynx (Hairless)</option>
                      <option value="Other / Mixed Breed">Other / Mixed Breed (Cat)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Weight Slider */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-baseline">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Pet Weight</label>
                <span className="font-mono text-sm font-black text-[#D98CB3]">{sizeWeight.toFixed(1)} kg</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">1.0 kg</span>
                <input
                  type="range"
                  min="1"
                  max={sizeSpecies === "dog" ? "50" : "12"}
                  step="0.5"
                  value={sizeWeight}
                  onChange={(e) => setSizeWeight(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-[#4E1B33]/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-[#4E1B33] dark:accent-[#D98CB3]"
                />
                <span className="text-[10px] text-muted-foreground">{sizeSpecies === "dog" ? "50.0 kg" : "12.0 kg"}</span>
              </div>
            </div>
          </div>

          {/* Results Side */}
          <div className="w-full lg:w-[42%] bg-gradient-to-b from-[#4E1B33]/5 to-[#4E1B33]/15 border border-[#4E1B33]/15 rounded-3xl p-5 sm:p-6 space-y-4 shadow-inner text-left">
            <h4 className="text-xs font-black uppercase text-[#4E1B33] dark:text-pink-300 tracking-wider">Calculated Fit Details</h4>
            
            {/* Dynamic Result Visualizer Card */}
            <div className="flex items-center justify-between bg-white/70 dark:bg-[#1F1216]/70 border border-border/40 rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all duration-300">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground leading-none">Recommended Size</span>
                <div className="text-4xl font-display font-black text-[#4E1B33] dark:text-white leading-none">
                  {calculatedSizeInfo.size}
                </div>
                <div className="text-[9px] text-[#D98CB3] font-black uppercase tracking-wider leading-none">
                  {calculatedSizeInfo.range}
                </div>
              </div>
              
              <div className="h-16 w-16 bg-[#4E1B33]/10 dark:bg-white/10 rounded-full flex items-center justify-center text-3xl shadow-inner border border-[#4E1B33]/5">
                {sizeSpecies === "dog" ? "🐕" : "🐈"}
              </div>
            </div>

            {/* Estimated Measurements Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/50 dark:bg-black/20 border border-border/20 rounded-xl p-2.5 space-y-0.5">
                <span className="block text-[8px] font-black uppercase text-muted-foreground leading-none">Chest</span>
                <span className="block font-mono font-black text-foreground">{calculatedSizeInfo.chest} cm</span>
              </div>
              <div className="bg-white/50 dark:bg-black/20 border border-border/20 rounded-xl p-2.5 space-y-0.5">
                <span className="block text-[8px] font-black uppercase text-muted-foreground leading-none">Neck</span>
                <span className="block font-mono font-black text-foreground">{calculatedSizeInfo.neck} cm</span>
              </div>
              <div className="bg-white/50 dark:bg-black/20 border border-border/20 rounded-xl p-2.5 space-y-0.5">
                <span className="block text-[8px] font-black uppercase text-muted-foreground leading-none">Back</span>
                <span className="block font-mono font-black text-foreground">{calculatedSizeInfo.back} cm</span>
              </div>
            </div>

            {/* Fitting Advice */}
            <div className="space-y-1.5 text-xs text-left">
              <span className="text-[8px] font-black uppercase text-muted-foreground">Expert Fit Advice for {sizeBreed}</span>
              <p className="bg-white/40 dark:bg-black/10 border border-border/10 rounded-2xl p-3 text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                "{calculatedSizeInfo.advice}"
              </p>
            </div>
            
            {/* CTA inside finder */}
            <div className="pt-2">
              <Button 
                onClick={() => {
                  toast.success(`Perfect size ${calculatedSizeInfo.size} selected! Redirecting to shop coordinates...`);
                }}
                className="w-full bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-full py-4 text-xs font-black shadow-md flex items-center justify-center gap-1.5"
                asChild
              >
                <Link to="/shop">
                  <ShoppingBag className="h-3.5 w-3.5" /> Shop Size {calculatedSizeInfo.size} Outfits
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PHOTO UPLOADER */}
      <section id="studio-uploader" className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border/40 p-6 md:p-8 hover-lift shadow-xl text-left">
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
            
            <div className="grid grid-cols-3 gap-2 border-t border-border/20 pt-4 text-[9px] font-black text-muted-foreground uppercase">
              <div>
                <span className="block text-foreground text-xs font-extrabold">Step 1</span>
                <span className="block mt-0.5">Upload Photo</span>
              </div>
              <div>
                <span className="block text-foreground text-xs font-extrabold">Step 2</span>
                <span className="block mt-0.5">Generate Art</span>
              </div>
              <div>
                <span className="block text-foreground text-xs font-extrabold">Step 3</span>
                <span className="block mt-0.5">Order Mockup</span>
              </div>
            </div>
          </div>

          {/* Right Uploader Interaction */}
          <div className="lg:col-span-7 bg-[#4E1B33]/5 border border-border/60 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 shadow-inner min-h-[220px]">
            
            {/* Input area */}
            <div className="flex-1 w-full space-y-4">
              <div className="border-2 border-dashed border-border/60 rounded-2xl p-6 flex flex-col items-center justify-center bg-card/50 hover:bg-card transition-colors relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <span className="text-2xl group-hover:scale-110 transition-transform">📸</span>
                <p className="text-[10px] font-black text-foreground mt-2">Click or drag photo here</p>
                <p className="text-[8px] text-muted-foreground font-semibold mt-0.5">Supports PNG, JPG up to 10MB</p>
              </div>

              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-black uppercase text-[#4E1B33]">
                    <span>Uploading & Vectorizing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#4E1B33]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Preview Card */}
            <div className="w-full sm:w-[45%] shrink-0 aspect-[4/3] rounded-2xl border border-border/50 bg-card shadow flex flex-col items-center justify-center p-3 relative overflow-hidden text-center min-h-[160px]">
              {generatedDesign ? (
                <>
                  <img src={generatedDesign} alt="Generated Vector Artwork Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-2.5 text-left z-10">
                    <span className="text-[7px] font-black uppercase text-accent tracking-widest leading-none">Design Preview</span>
                    <p className="text-[9px] font-black text-white truncate leading-tight mt-0.5">Custom Hoodie Mockup</p>
                    <button 
                      onClick={() => {
                        toast.success("Added Custom Generated Hoodie to Cart!");
                      }}
                      className="mt-1.5 w-full bg-[#FFF5F9] text-[#4E1B33] hover:bg-white text-[8px] font-black uppercase py-1.5 rounded-lg text-center cursor-pointer shadow-md"
                    >
                      Buy Hoodie ($49.99)
                    </button>
                  </div>
                </>
              ) : uploadedImage ? (
                <div className="space-y-2">
                  <img src={uploadedImage} alt="Uploaded source" className="h-16 w-16 rounded-xl object-cover border border-[#D98CB3] mx-auto shadow-inner" />
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Source Loaded...</p>
                </div>
              ) : (
                <div className="space-y-1.5 text-muted-foreground/60 p-3">
                  <span className="text-3xl block">👕</span>
                  <p className="text-[9px] font-bold uppercase tracking-wider">Preview Card</p>
                  <p className="text-[8px] font-semibold leading-tight">Your custom vector garment design will generate here.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
