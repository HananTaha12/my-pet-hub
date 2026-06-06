import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Calendar, Bell, ShoppingBag, MessageCircle, PawPrint, Plus, Sparkles, Star, 
  TrendingUp, CheckCircle, ShieldAlert, CreditCard, Heart, Award, Trophy, 
  Activity, Scale, Syringe, FileText, PhoneCall, ChevronRight, ThumbsUp, 
  MessageSquare, Clock, CloudSun, ListTodo, History, Send, Bot, X, CheckSquare, 
  Square
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
  cat: "/oliver.jpg",
  bird: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&q=80&w=800",
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

const DEFAULT_TASKS_BY_SPECIES: Record<string, string[]> = {
  dog: [
    "Morning outdoor walk & potty time",
    "Pour fresh kibble & clean water bowl",
    "Brush coat & clean paws",
    "Administer vitamins or flea preventive",
    "Evening playtime or obedience training"
  ],
  cat: [
    "Scoop & clean the litter box",
    "Refill water fountain & serve wet food",
    "Interactive playtime (feather wand/laser)",
    "Grooming/brushing fur session",
    "Check ears and eyes for cleaning"
  ],
  rabbit: [
    "Replenish high-quality fresh timothy hay",
    "Serve leafy green vegetables",
    "Refill fresh water bottle/bowl",
    "Clean litter tray & change bedding",
    "Supervised free-roam exercise time"
  ],
  other: [
    "Provide fresh food & clean water",
    "Inspect habitat temperature & hygiene",
    "Gentle interaction or handling",
    "Perform quick health & alertness check"
  ]
};

function HomePage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [recsBySpecies, setRecsBySpecies] = useState<Record<string, Product[]>>({});
  const [appts, setAppts] = useState<Appt[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);

  // Determine pet list (db pets or fallback mock list for full switcher experience)
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
          badge: "bg-purple-600 text-white",
          badgeColor: "bg-purple-500",
          primaryButton: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white",
          secondaryButton: "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300",
          petIcon: "🐱",
          titleColor: "text-purple-900 dark:text-purple-200"
        };
      case "rabbit":
      case "bunny":
        return {
          accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30 ring-emerald-500",
          bgTint: "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/15 dark:border-emerald-500/25",
          text: "text-emerald-600 dark:text-emerald-400",
          badge: "bg-emerald-600 text-white",
          badgeColor: "bg-emerald-500",
          primaryButton: "bg-[#059669] hover:bg-[#047857] text-white",
          secondaryButton: "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
          petIcon: "🐰",
          titleColor: "text-emerald-900 dark:text-emerald-200"
        };
      case "bird":
        return {
          accent: "text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/20 dark:border-sky-500/30 ring-sky-500",
          bgTint: "bg-sky-500/5 dark:bg-sky-500/10 border-sky-500/15 dark:border-sky-500/25",
          text: "text-sky-600 dark:text-sky-400",
          badge: "bg-sky-600 text-white",
          badgeColor: "bg-sky-500",
          primaryButton: "bg-[#0284C7] hover:bg-[#0369A1] text-white",
          secondaryButton: "border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300",
          petIcon: "🐦",
          titleColor: "text-sky-900 dark:text-sky-200"
        };
      case "dog":
      default:
        return {
          accent: "text-[#D98CB3] bg-pink-500/10 border-pink-500/20 ring-pink-500",
          bgTint: "bg-[#FFF5F9]/30 border-border/20 dark:border-border/30",
          text: "text-[#D98CB3] dark:text-pink-400",
          badge: "bg-[#4E1B33] text-[#FFF5F9] dark:bg-[#FCE8F3] dark:text-[#4E1B33]",
          badgeColor: "bg-[#4E1B33]",
          primaryButton: "bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white",
          secondaryButton: "border-white/30 bg-white/10 text-white hover:bg-white/20",
          petIcon: "🐶",
          titleColor: "text-[#4E1B33] dark:text-pink-200"
        };
    }
  }, [petSpecies]);

  const petName = activePet.name;
  const petBreed = activePet.breed || "Golden Retriever";
  const petAge = calculateAge(activePet.date_of_birth);
  const petWeight = activePet.weight_kg ? `${activePet.weight_kg}kg` : "17kg";
  const petPhoto = PET_IMAGE_MAP[activePet.species.toLowerCase()] || DEFAULT_PET_PHOTO;

  // Hero Carousel State & Timer
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

  // Hotel Booking Form State
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [hotelPetType, setHotelPetType] = useState("dog");

  // Grooming Booking Form State
  const [groomingDate, setGroomingDate] = useState("");
  const [groomingPackage, setGroomingPackage] = useState("full");
  const [groomingPetType, setGroomingPetType] = useState("dog");

  // Shop Categories Tabs State
  const [activeShopTab, setActiveShopTab] = useState<"trending" | "best" | "new">("trending");

  // Checklist State keyed by petId
  const [taskChecks, setTaskChecks] = useState<Record<string, Record<string, boolean>>>({});

  // Floating AI Assistant State
  const [showMiniChat, setShowMiniChat] = useState(false);
  const [miniChatInput, setMiniChatInput] = useState("");
  const [miniChatMessages, setMiniChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; timestamp: Date }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize greeting message when active pet changes
  useEffect(() => {
    setMiniChatMessages([
      {
        sender: "ai",
        text: `Hi! I'm your PetPal AI Coach. Ask me anything about taking care of ${activePet.name}, their diet, or scheduling appointments! 🐾`,
        timestamp: new Date()
      }
    ]);
  }, [activePet.name]);

  const activePetTasks = useMemo(() => {
    return DEFAULT_TASKS_BY_SPECIES[petSpecies] || DEFAULT_TASKS_BY_SPECIES.other;
  }, [petSpecies]);

  // Checked map for the active pet
  const activeCheckedMap = useMemo(() => {
    return taskChecks[activePet.id] || {};
  }, [taskChecks, activePet.id]);

  // Calculate completion percentage
  const checklistCompletionPercentage = useMemo(() => {
    if (!activePetTasks.length) return 0;
    const checkedCount = activePetTasks.filter(task => activeCheckedMap[task]).length;
    return Math.round((checkedCount / activePetTasks.length) * 100);
  }, [activePetTasks, activeCheckedMap]);

  // Handle toggle function
  const handleToggleTask = (task: string) => {
    setTaskChecks(prev => {
      const petMap = prev[activePet.id] || {};
      const newPetMap = { ...petMap, [task]: !petMap[task] };
      return { ...prev, [activePet.id]: newPetMap };
    });
  };

  const weatherData = useMemo(() => {
    return {
      temp: 24,
      condition: "Sunny & Warm",
      location: "Local Area"
    };
  }, []);

  const walkRecommendation = useMemo(() => {
    switch (petSpecies) {
      case "dog":
        return {
          status: "Perfect Walk Conditions",
          advice: "Temperature is ideal. A 30-min walk in the park is highly recommended today! Avoid hot asphalt in midday sun.",
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30",
        };
      case "cat":
        return {
          status: "Indoor Play Day",
          advice: "Cats prefer cozy indoors today. Position a sunny perch near the window for bird watching and mental stimulation.",
          color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20 dark:border-purple-500/30",
        };
      case "rabbit":
      case "bunny":
        return {
          status: "Supervised Cool Exercise",
          advice: "Rabbits are sensitive to warm sun. Keep exercise indoors or in shaded grassy pens under 25°C with fresh cold water.",
          color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20 dark:border-indigo-500/30",
        };
      default:
        return {
          status: "Habitual Environment Control",
          advice: "Ensure the enclosure is kept within standard comfortable temperatures. Avoid direct drafts or strong sun exposure.",
          color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/20 dark:border-sky-500/30",
        };
    }
  }, [petSpecies]);

  const petActivities = useMemo(() => {
    switch (petSpecies) {
      case "cat":
        return [
          { title: "Rabies Booster Administered", date: "Feb 18, 2026", desc: "Immunization completed by Dr. Sarah Jenkins.", tag: "Clinic Visit", color: "bg-purple-500" },
          { title: "FVRCP Vaccination", date: "Jan 12, 2026", desc: "Annual core vaccine dose given.", tag: "Vaccine", color: "bg-purple-500" },
          { title: "Weight Check - 5.0 kg", date: "Dec 05, 2025", desc: "Weight check during general health checkup.", tag: "Weight Log", color: "bg-purple-500" }
        ];
      case "rabbit":
      case "bunny":
        return [
          { title: "RVHD1 Booster Administered", date: "Dec 10, 2025", desc: "Core protection booster administered.", tag: "Clinic Visit", color: "bg-emerald-500" },
          { title: "Myxomatosis Vaccination", date: "Nov 02, 2025", desc: "Annual core vaccine dose given.", tag: "Vaccine", color: "bg-emerald-500" },
          { title: "Dental Checkup", date: "Oct 15, 2025", desc: "Incisor and molar checkup. Everything looks clean.", tag: "Dental", color: "bg-emerald-500" }
        ];
      case "dog":
      default:
        return [
          { title: "DHPP Vaccine Administered", date: "Nov 22, 2025", desc: "Core vaccine booster completed.", tag: "Vaccine", color: "bg-red-500" },
          { title: "Rabies Booster Administered", date: "Oct 10, 2025", desc: "3-Year booster given by Dr. Alan Miller.", tag: "Clinic Visit", color: "bg-red-500" },
          { title: "Annual Dental Scaling", date: "Sep 14, 2025", desc: "Routine cleaning under general anesthesia.", tag: "Dental Check", color: "bg-red-500" }
        ];
    }
  }, [petSpecies]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniChatInput.trim()) return;

    const userText = miniChatInput.trim();
    setMiniChatInput("");

    // Add user message
    const newMsg = { sender: "user" as const, text: userText, timestamp: new Date() };
    setMiniChatMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    try {
      // Attempt to invoke the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("petpal-chat", {
        body: {
          message: userText,
          petContext: {
            name: activePet.name,
            species: petSpecies,
            breed: petBreed,
            weight: petWeight,
            age: petAge
          }
        }
      });

      if (error) throw error;

      const replyText = data?.reply || data?.message || "I'm processing your query.";
      setMiniChatMessages(prev => [
        ...prev,
        { sender: "ai", text: replyText, timestamp: new Date() }
      ]);
    } catch (err) {
      console.warn("Edge function invocation failed, falling back to simulated chat response", err);
      
      // Smart offline fallback logic
      setTimeout(() => {
        let replyText = `I heard you! As your PetPal Assistant, here is some advice for ${activePet.name}: `;
        const lower = userText.toLowerCase();

        if (lower.includes("food") || lower.includes("diet") || lower.includes("eat")) {
          if (petSpecies === "dog") {
            replyText += `Adult dogs like ${activePet.name} thrive on a high-protein diet with balanced vitamins. Make sure to feed them according to their weight (${petWeight}).`;
          } else if (petSpecies === "cat") {
            replyText += `For cats like ${activePet.name}, a mix of high-moisture wet food and premium kibble helps prevent urinary tract issues. Keep water fresh!`;
          } else if (petSpecies === "rabbit") {
            replyText += `Rabbits need 85% fresh Timothy hay, a handful of leafy greens, and limited pellets. Avoid starchy treats like carrots in large quantities!`;
          } else {
            replyText += `Make sure to provide fresh species-appropriate food and clean water daily!`;
          }
        } else if (lower.includes("walk") || lower.includes("exercise") || lower.includes("play")) {
          if (petSpecies === "dog") {
            replyText += `${activePet.name} benefits from at least 30-60 minutes of daily physical exercise. Standard outdoor walks are great, especially when the weather is around 24°C!`;
          } else if (petSpecies === "cat") {
            replyText += `Cats prefer interactive play sessions. Try using a feather wand or laser pointer for 10-15 minutes twice a day to keep them stimulated.`;
          } else if (petSpecies === "rabbit") {
            replyText += `Rabbits need safe free-roaming exercise areas. Let them stretch their hind legs for at least 3-4 hours daily under supervision.`;
          } else {
            replyText += `Provide active daily engagement or habitat enrichment suitable for their breed.`;
          }
        } else if (lower.includes("vaccine") || lower.includes("booster") || lower.includes("vet") || lower.includes("doctor")) {
          replyText += `According to ${activePet.name}'s profile, they are due for their next booster soon. You can schedule a visit at our clinic directly using the 'Book Vet Visit' button on your dashboard!`;
        } else if (lower.includes("groom") || lower.includes("bath") || lower.includes("haircut") || lower.includes("nails")) {
          replyText += `You can book a premium Spa package (bath, haircut, and nail trimming) for ${activePet.name} under our 'Spa Treatment Package' service in the booking portal.`;
        } else {
          replyText += `That sounds interesting! I highly recommend checking in with our veterinary team or scheduling a routine wellness consultation for personalized guidance on ${activePet.name}'s health.`;
        }

        setMiniChatMessages(prev => [
          ...prev,
          { sender: "ai", text: replyText, timestamp: new Date() }
        ]);
      }, 1000);
    } finally {
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

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



  // Calculate statistics
  const totalPetsCount = pets.length > 0 ? pets.length : petList.length;
  const appointmentsText = appts.length > 0 ? `${appts.length} Appt${appts.length > 1 ? "s" : ""}` : "No Appointments";
  const wellnessScore = petSpecies === "cat" ? "98% Health" : petSpecies === "rabbit" ? "95% Health" : "96% Health";
  const monthlySpend = petSpecies === "cat" ? "$95.00" : petSpecies === "rabbit" ? "$45.00" : "$145.00";
  const vaccinesCompletion = petSpecies === "cat" ? "90% Done" : petSpecies === "rabbit" ? "75% Done" : "85% Done";
  const activeWeightText = petWeight;
  const shopOrdersCount = "4 Orders";
  // Vet Scheduling Form State
  const [vetService, setVetService] = useState("general");
  const [vetDate, setVetDate] = useState("");
  const [vetTime, setVetTime] = useState("10:00");

  // Dynamic vaccine checklist based on active pet species
  const activePetVaccines = useMemo(() => {
    switch (petSpecies) {
      case "cat":
        return [
          { name: "FVRCP (Feline Distemper)", status: "completed", date: "Administered: Jan 2026", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
          { name: "Rabies Vaccine Booster", status: "completed", date: "Administered: Feb 2026", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
          { name: "FeLV (Feline Leukemia)", status: "due", date: "Next due: In 12 Days", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
        ];
      case "rabbit":
      case "bunny":
        return [
          { name: "Myxomatosis Vaccine", status: "completed", date: "Administered: Nov 2025", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
          { name: "RVHD1 Booster Shot", status: "completed", date: "Administered: Dec 2025", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
          { name: "RVHD2 Booster Shot", status: "due", date: "Next due: In 15 Days", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
        ];
      case "dog":
      default:
        return [
          { name: "Rabies Booster Shot", status: "completed", date: "Administered: Oct 2025", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
          { name: "DHPP (Distemper & Parvo)", status: "completed", date: "Administered: Nov 2025", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
          { name: "Bordetella (Kennel Cough)", status: "due", date: "Next due: In 5 Days", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
        ];
    }
  }, [petSpecies]);

  return (
    <div className="space-y-12 transition-all duration-700 animate-in fade-in zoom-in-95">

      {/* 1. HERO SECTION: LIFESTYLE IMAGE CAROUSEL */}
      <section className="relative h-[560px] rounded-[3rem] overflow-hidden shadow-2xl hover-lift group border border-white/10 text-left">
        {[
          {
            title: "Match With Your Pet 🐾",
            desc: "Celebrate your unique bond. Browse our handcrafted matching outfits, custom photo-engraved jewelry, and premium pet boarding services.",
            img: "/matching_trio_outfit.png",
            badge: "✨ Premium Pet Fashion & Lifestyle",
            btnPrimary: { text: "Shop Collection", to: "/shop", icon: <ShoppingBag className="h-5 w-5 text-[#4E1B33]" /> },
            btnSecondary: { text: "Explore Pets", to: "/pets", icon: <ChevronRight className="h-5 w-5" /> },
            position: "center 82%"
          },
          {
            title: "Personalized Jewelry ✨",
            desc: "Keep your best friend close to your heart with our custom hand-engraved silver, gold, and ceramic photo pendant necklaces.",
            img: "/custom_cat_necklaces.png",
            badge: "💎 Crafted Hand-Engraved Keepsakes",
            btnPrimary: { text: "Design Jewelry", to: "/studio", icon: <Sparkles className="h-5 w-5 text-[#4E1B33]" /> },
            btnSecondary: { text: "Book Pet Hotel", to: "/book?type=hotel", icon: <ChevronRight className="h-5 w-5" /> }
          },
          {
            title: "Luxury Lifestyle For You & Your Pet 👑",
            desc: "Complete the perfect look for your family portrait sessions. Soft coordinate sets designed for adults, kids, and pets of all shapes and sizes.",
            img: "/family_matching_outfit.png",
            badge: "🏡 Matching Styles For Every Family Member",
            btnPrimary: { text: "Browse Lookbook", to: "/shop", icon: <ShoppingBag className="h-5 w-5 text-[#4E1B33]" /> },
            btnSecondary: { text: "Schedule Grooming", to: "/book?type=grooming", icon: <ChevronRight className="h-5 w-5" /> }
          }
        ].map((slide, idx) => {
          const isActive = idx === currentHeroSlide;
          return (
            <div 
              key={idx}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
            >
              {/* Cover image background */}
              <img 
                src={slide.img} 
                alt={slide.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 scale-100"
                style={{ objectPosition: slide.position || "center" }}
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              
              {/* Decorative lights */}
              <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
              
              {/* Text and CTAs */}
              <div className="absolute inset-x-6 bottom-16 md:bottom-20 md:left-16 max-w-xl space-y-5 md:space-y-7 z-20">
                <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/20 border border-pink-500/30 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-[#FFF5F9] animate-pulse">
                  {slide.badge}
                </span>
                <div className="space-y-3">
                  <h1 className="font-display text-5xl sm:text-7xl font-black text-white tracking-tight leading-none">
                    {slide.title}
                  </h1>
                  <p className="text-sm sm:text-base text-[#EBC4D8] leading-relaxed font-semibold">
                    {slide.desc}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button className="bg-gradient-to-r from-[#D98CB3] to-[#4E1B33] hover:from-[#E8A0C5] hover:to-[#6E2A4A] text-white rounded-full px-8 py-7 font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm border border-white/20" asChild>
                    <Link to={slide.btnPrimary.to}>
                      {slide.btnPrimary.text} {slide.btnPrimary.icon}
                    </Link>
                  </Button>
                  <Button variant="outline" className="border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full px-8 py-7 font-black hover:scale-105 transition-transform flex items-center gap-2 text-sm" asChild>
                    <Link to={slide.btnSecondary.to}>
                      {slide.btnSecondary.text} {slide.btnSecondary.icon}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Carousel Indicators (Dots) */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-30">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentHeroSlide(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer",
                idx === currentHeroSlide ? "w-6 bg-pink-500" : "w-2 bg-white/40 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* WELCOME HEADER & Guided Journeys Decision Screen */}
      <section className="space-y-6">
        <div className={cn("relative overflow-hidden backdrop-blur-md rounded-[2.5rem] border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left transition-all duration-500", petTheme.bgTint)}>
          {/* Floating background elements for motion */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-35 dark:opacity-20 z-0">
            <span className="absolute bottom-[-30px] left-[12%] text-lg animate-float-up-1">🐾</span>
            <span className="absolute bottom-[-30px] left-[32%] text-base animate-float-up-2">✨</span>
            <span className="absolute bottom-[-30px] left-[55%] text-sm animate-float-up-3">🐾</span>
            <span className="absolute bottom-[-30px] left-[76%] text-base animate-float-up-4">🦴</span>
            <span className="absolute bottom-[-30px] left-[90%] text-lg animate-float-up-5">✨</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10 w-full md:w-auto">
            {/* Mascot Image */}
            <div className="relative h-20 w-24 sm:h-24 sm:w-28 shrink-0 select-none pointer-events-none -my-4 animate-float">
              <img 
                src="/welcome_pets.png" 
                alt="Welcome Mascot" 
                className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(78,27,51,0.12)]"
              />
            </div>
            
            <div className="space-y-1">
              <h1 className="flex items-center gap-2 text-[#4E1B33] dark:text-pink-200 font-display text-3xl font-black tracking-tight leading-none">
                🐾 Welcome Back, {user?.email ? user.email.split("@")[0] : "Taqwamrowat"}
              </h1>
              <p className="text-xs text-muted-foreground font-semibold">
                Select an option below to guide your companion's journey today.
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setShowEmergencyDialog(true)} 
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-full font-black text-xs px-6 py-5 shadow-lg animate-pulse shrink-0 relative z-10"
          >
            🚨 Emergency Vet Support
          </Button>
        </div>

        {/* CHOOSE YOUR JOURNEY: 3 LARGE DECISION CARDS */}
        <div className="grid gap-6 md:grid-cols-3 text-left">
          {[
            {
              title: "Manage My Pets",
              desc: "Update health records, track weights, and manage companion profiles.",
              btn: "Go to Profiles 🐶",
              link: "/pets",
              icon: <PawPrint className="h-7 w-7 text-[#4E1B33] animate-bounce-hover" />,
              bg: "bg-[#FFF5F9]/40 border-pink-500/10",
              glowClass: "card-glow-pink",
            },
            {
              title: "Shop & Accessories",
              desc: "Buy premium outfits, matching hoodies, customized collars, and beds.",
              btn: "Go to Shop 🛍",
              link: "/shop",
              icon: <ShoppingBag className="h-7 w-7 text-[#4E1B33] animate-wiggle-hover" />,
              bg: "bg-amber-500/5 border-amber-500/10",
              glowClass: "card-glow-amber",
            },
            {
              title: "Book a Service",
              desc: "Schedule vet checkups, luxury hotel stays, or grooming packages.",
              btn: "Book Service 📅",
              link: "/book",
              icon: <Calendar className="h-7 w-7 text-[#4E1B33] animate-rotate-hover" />,
              bg: "bg-emerald-500/5 border-emerald-500/10",
              glowClass: "card-glow-emerald",
            }
          ].map((journey, idx) => (
            <Link 
              key={idx}
              to={journey.link}
              className={cn(
                "group relative rounded-[2.2rem] border p-6 flex flex-col justify-between min-h-[190px] shadow-sm transition-all duration-300 hover-lift backdrop-blur-sm",
                journey.bg,
                journey.glowClass
              )}
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-card border border-border/40 flex items-center justify-center shadow-inner">
                  {journey.icon}
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-[#4E1B33] dark:text-pink-200">{journey.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-1 leading-relaxed">{journey.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#4E1B33] dark:text-pink-300 group-hover:translate-x-1 transition-transform">
                {journey.btn} <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Countdown Timer Block — Full Bold Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] shadow-2xl min-h-[280px] md:min-h-[320px] flex items-center">
        <img 
          src="/happy_playing_cats.png" 
          alt="Happy playing cats" 
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#4E1B33]/55 via-[#7C2D55]/30 to-transparent" />
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-10 md:py-12">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-widest text-white/90">
              🔥 Limited Time Offer
            </div>
            <h3 className="font-display text-3xl sm:text-4xl font-black text-white leading-none tracking-tight">
              🔥 Summer Sale Ends In
            </h3>
            <p className="text-sm text-white/70 font-semibold">Special 50% discount on coordinated outfits and spa bookings.</p>
          </div>
          <div className="flex items-center gap-3 md:gap-5 justify-center">
            <div className="flex flex-col items-center">
              <div className="bg-white/15 backdrop-blur-md border border-white/25 text-white font-mono text-4xl sm:text-5xl font-black rounded-2xl h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center shadow-2xl">{timeLeft.days}</div>
              <span className="text-[11px] font-bold text-white/70 mt-2 uppercase tracking-wider">Days</span>
            </div>
            <span className="text-4xl font-black text-white/60 animate-pulse mb-5">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-white/15 backdrop-blur-md border border-white/25 text-white font-mono text-4xl sm:text-5xl font-black rounded-2xl h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center shadow-2xl">{timeLeft.hours}</div>
              <span className="text-[11px] font-bold text-white/70 mt-2 uppercase tracking-wider">Hours</span>
            </div>
            <span className="text-4xl font-black text-white/60 animate-pulse mb-5">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-white/15 backdrop-blur-md border border-white/25 text-white font-mono text-4xl sm:text-5xl font-black rounded-2xl h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center shadow-2xl">{timeLeft.minutes}</div>
              <span className="text-[11px] font-bold text-white/70 mt-2 uppercase tracking-wider">Mins</span>
            </div>
            <span className="text-4xl font-black text-white/60 animate-pulse mb-5">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-b from-[#D98CB3] to-[#B5386B] text-white font-mono text-4xl sm:text-5xl font-black rounded-2xl h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center shadow-2xl border border-white/20">{timeLeft.seconds}</div>
              <span className="text-[11px] font-bold text-white/70 mt-2 uppercase tracking-wider">Secs</span>
            </div>
          </div>
          <div className="hidden xl:flex flex-col items-center gap-3">
            <div className="text-5xl font-display font-black text-white">50%</div>
            <div className="text-xs font-black text-white/70 uppercase tracking-widest">OFF Everything</div>
            <Button className="bg-white text-[#4E1B33] hover:bg-white/90 rounded-full font-black px-6 py-5 text-xs shadow-xl" asChild>
              <Link to="/shop">Shop Now 🛍️</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PET SWITCHER TAB BAR */}
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
        
        {/* Horizontal scrollable Pet Avatars tab selector */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar w-full md:w-auto py-1 justify-start md:justify-end">
          <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest hidden lg:inline mr-1">Switch Companion:</span>
          {petList.map((p, idx) => {
            const isSelected = idx === activePetIndex;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActivePetIndex(idx);
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

      {/* 3-COLUMN COMPANION HEALTH & CARE HUB */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-600">
            Health & Care Hub 🩺
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Companion Care Center
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Track daily routines, walk recommendations, and medical logs for {petName}.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Column 1: Health Summary & Vitals */}
          <div className={cn("rounded-[2.5rem] border p-6 flex flex-col justify-between text-left transition-all duration-500 shadow-sm relative overflow-hidden", petTheme.bgTint)}>
            <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-black text-foreground">{petName}'s Vitals</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Stable
                </span>
              </div>

              {/* Circular wellness percentage ring */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-muted dark:stroke-black/20"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={cn("pet-transition", petSpecies === "dog" ? "stroke-red-500" : petSpecies === "cat" ? "stroke-purple-500" : "stroke-emerald-500")}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (petSpecies === "cat" ? 98 : petSpecies === "rabbit" ? 95 : 96)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-display font-black text-foreground">{petSpecies === "cat" ? "98%" : petSpecies === "rabbit" ? "95%" : "96%"}</span>
                    <span className="text-[7.5px] text-muted-foreground font-bold uppercase tracking-wider">Health</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-red-500/70" />
                    <span>Heart Rate: <strong className="text-foreground">94 bpm</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-amber-500/70" />
                    <span>Weight: <strong className="text-foreground">{activeWeightText}</strong></span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-1">
                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block">Next Vaccine</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <Syringe className="h-3.5 w-3.5 text-pink-500/70 animate-pulse shrink-0" />
                  <span className="truncate font-semibold text-foreground">
                    {activePetVaccines.find(v => v.status === "due")?.name || "None scheduled"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium block">
                  {activePetVaccines.find(v => v.status === "due")?.date || "up-to-date"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-5">
              <Button
                className="w-full bg-[#4E1B33] hover:bg-[#4E1B33]/90 text-white rounded-full py-5 text-xs font-black shadow-sm flex items-center justify-center gap-1.5"
                onClick={() => {
                  toast.info(`Standard veterinary medical record for ${petName} downloaded successfully!`);
                }}
              >
                Medical Passport 📄
              </Button>
              <Button
                className={cn("w-full text-white rounded-full py-5 text-xs font-black shadow-md flex items-center justify-center gap-1.5", petTheme.primaryButton)}
                asChild
              >
                <Link to="/book">
                  Book Vet Visit <Calendar className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Column 2: Daily Care Routine Checklist */}
          <div className={cn("rounded-[2.5rem] border p-6 flex flex-col justify-between text-left transition-all duration-500 shadow-sm relative overflow-hidden", petTheme.bgTint)}>
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-black text-foreground">Daily Routine</h3>
                </div>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest", petTheme.badge)}>
                  {petSpecies}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                Complete daily tasks to maintain {petName}'s optimal health index.
              </p>

              {/* Checklist completion progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs font-bold text-foreground">
                  <span>Completion Rate</span>
                  <span className={petTheme.text}>{checklistCompletionPercentage}%</span>
                </div>
                <div className="w-full bg-muted dark:bg-black/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500 ease-out", 
                      petSpecies === "dog" ? "bg-red-500" : petSpecies === "cat" ? "bg-purple-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${checklistCompletionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Checklist list */}
              <div className="space-y-2 pt-3">
                {activePetTasks.map((task) => {
                  const isChecked = activeCheckedMap[task] || false;
                  return (
                    <button
                      key={task}
                      onClick={() => handleToggleTask(task)}
                      className={cn(
                        "w-full flex items-start gap-3 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer",
                        isChecked 
                          ? "bg-white/60 dark:bg-card/60 border-border/80 text-muted-foreground line-through" 
                          : "bg-white/30 dark:bg-card/30 border-transparent text-foreground"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckSquare className={cn("h-4 w-4", petTheme.text)} />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/60" />
                        )}
                      </div>
                      <span className="leading-tight">{task}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 text-center">
              <span className="text-[9.5px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                {checklistCompletionPercentage === 100 ? "🎉 All tasks done! Good job!" : "Keep up the great care!"}
              </span>
            </div>
          </div>

          {/* Column 3: Weather & Activity Timeline */}
          <div className={cn("rounded-[2.5rem] border p-6 flex flex-col justify-between text-left transition-all duration-500 shadow-sm relative overflow-hidden", petTheme.bgTint)}>
            <div className="space-y-5">
              {/* Weather Widget */}
              <div className="bg-white/40 dark:bg-card/40 border border-border/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudSun className="h-5 w-5 text-amber-500" />
                    <div>
                      <h4 className="text-xs font-black text-foreground">Outdoor Conditions</h4>
                      <p className="text-[9px] text-muted-foreground/80 font-bold leading-none">{weatherData.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-black text-foreground">{weatherData.temp}°C</span>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-wider leading-none">{weatherData.condition}</p>
                  </div>
                </div>

                <div className={cn("rounded-xl p-2.5 text-[10.5px] font-semibold leading-relaxed border border-transparent", walkRecommendation.color)}>
                  <span className="font-bold block mb-0.5 uppercase text-[9px] tracking-wider">{walkRecommendation.status}</span>
                  {walkRecommendation.advice}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-display text-base font-black text-foreground">Recent Activity Logs</h3>
                </div>

                <div className="relative pl-4 border-l border-border/80 space-y-3.5 ml-1.5">
                  {petActivities.map((act, idx) => (
                    <div key={idx} className="relative group">
                      <div className={cn("absolute -left-[22px] top-1 flex h-2 w-2 items-center justify-center rounded-full ring-4 ring-background transition-transform duration-500 group-hover:scale-125 shadow-sm", act.color)} />
                      <div className="text-left space-y-0.5">
                        <div className="flex justify-between items-center gap-1.5">
                          <h4 className="font-bold text-xs text-foreground leading-none">{act.title}</h4>
                          <span className="text-[7.5px] font-bold text-muted-foreground uppercase shrink-0">{act.date}</span>
                        </div>
                        <p className="text-[9.5px] text-muted-foreground leading-tight">{act.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Link to="/pets" className="text-[9px] font-black uppercase tracking-widest text-[#4E1B33] dark:text-pink-300 hover:underline flex items-center gap-0.5">
                View Full Log <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PET FASHION COLLECTION (COUPLE EXPERIENCE LIFESTYLE) */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
            Style Catalog 🐕 🐈
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Coordinated Couple Experiences
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Celebrate your bond with coordinated matching sets designed for you and your companion</p>
        </div>

        <div className="grid gap-6 grid-cols-2 lg:grid-cols-5 text-left">
          {[
            { title: "Matching Owner & Dog Cozy Hoodies", label: "Matching soft hoodies for couple portraits", img: "/matching_hoodies.png", badge: "Matching Set" },
            { title: "Coordinated Cat & Owner Bandanas", label: "Elegant silk coordinates styled together", img: "/matching_bandanas.png", badge: "Coordinated Accents" },
            { title: "Snuggly Matching Pajamas", label: "Cozy nighttime sleepwear for couples & family", img: "/matching_pajamas.png", badge: "Matching Pajamas" },
            { title: "Couple Weekend T-Shirts", label: "Breathable coordinates for outdoor walking", img: "/matching_coordinates.png", badge: "Coordinated Outfits" },
            { title: "Luxury Knitwear Sweaters", label: "Cozy couple knits for chilly days", img: "/matching_knitwear.png", badge: "Matching Knits" }
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
              <span className="absolute top-3 left-3 bg-[#4E1B33]/85 backdrop-blur-md text-[#FFF5F9] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full z-20">
                {item.badge}
              </span>
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


      {/* 4. ACCESSORIES CATALOG (WEAR IT ON PET CONCEPT) */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
            Premium Supplies 🛍️
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Shop Premium Wearable Accessories
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Hand-crafted collars, name tags, and necklaces pictured in-use on pets</p>
        </div>

        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { name: "Paw Pendant on Dog", price: 24.99, oldPrice: 39.99, discount: 37, img: "/paw_print_necklace.png", id: "d06da0d1-aacc-400d-800d-000000000003", label: "Worn by Dog 🐶" },
            { name: "Engraved Leather Collar", price: 14.99, oldPrice: 24.99, discount: 40, img: "/personalized_collar.png", id: "d06da0d1-aacc-400d-800d-000000000003", label: "Worn by Dog 🐶" },
            { name: "Gold Engraved Name Tag", price: 12.99, oldPrice: 19.99, discount: 35, img: "/custom_name_tag.png", id: "d06da0d1-aacc-400d-800d-000000000003", label: "Tag on Neck 🐾" },
            { name: "Luxury Memory-Foam Bed", price: 49.99, oldPrice: 89.99, discount: 44, img: "/luxury_pet_bed.png", id: "d06da0d1-aacc-400d-800d-000000000001", label: "Bed in Use 🏡" },
            { name: "Crystal Minimalist Food Bowl", price: 19.99, oldPrice: 34.99, discount: 42, img: "/crystal_cat_bowl.png", id: "d06da0d1-aacc-400d-800d-000000000003", label: "Bowl in Studio 💎" }
          ].map((item, idx) => (
            <div key={idx} className="group relative rounded-[2.2rem] overflow-hidden border border-border/30 bg-card flex flex-col justify-between hover-lift shadow-sm text-left transition-all duration-300">
              <div className="relative overflow-hidden aspect-[4/5] bg-secondary/35 shadow-inner">
                <img 
                  src={item.img} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
                {/* Discount badge */}
                <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-10">-{item.discount}%</span>
                <span className="absolute top-2.5 right-2.5 bg-black/60 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10">{item.label}</span>
                {/* Hover overlay with Quick View + Add to Cart */}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 z-20 px-3">
                  <button className="w-full bg-white text-[#4E1B33] hover:bg-white/90 text-[9px] font-black uppercase tracking-wide rounded-full py-1.5 transition-all shadow-lg cursor-pointer">
                    👁️ Quick View
                  </button>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!user) { toast.error("Please login to shop products"); return; }
                      await addToCart(user.id, item.id);
                      toast.success(`Added ${item.name} to your cart!`);
                    }}
                    className="w-full bg-gradient-to-r from-[#D98CB3] to-[#4E1B33] text-white text-[9px] font-black uppercase tracking-wide rounded-full py-1.5 transition-all shadow-lg cursor-pointer hover:from-[#E8A0C5] hover:to-[#6E2A4A]"
                  >
                    🛒 Add To Cart
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="font-display text-xs font-bold text-foreground truncate">{item.name}</h3>
                <div className="flex items-center gap-0.5 text-amber-500 text-[9px]">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <Star className="h-2.5 w-2.5 fill-current" />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="font-mono font-black text-[#D98CB3] text-sm">${item.price.toFixed(2)}</span>
                  <span className="font-mono text-muted-foreground text-[10px] line-through">${item.oldPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 3-COLUMN FEATURE CARDS (Outfits, Accessories, Pet Hotel) */}
      <section className="grid gap-6 md:grid-cols-3 text-left">
        {[
          {
            title: "Matching Outfits",
            desc: "Discover coordinated hoodies and pajama sets matching you and your pet.",
            img: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=400",
            btnText: "Shop Outfits",
            link: "/shop"
          },
          {
            title: "Custom Accessories",
            desc: "Engrave your pet's photo and name onto beautiful custom tags and necklaces.",
            img: "/custom_name_tag.png",
            btnText: "Design Jewelry",
            link: "/studio"
          },
          {
            title: "Pet Hotel Boarding",
            desc: "Leave your pets in our state-of-the-art boarding suite with active play tracking.",
            img: "/pet_hotel.png",
            btnText: "Book Hotel",
            link: "/book?type=hotel"
          }
        ].map((feat, idx) => (
          <div key={idx} className="group relative rounded-[2.5rem] overflow-hidden aspect-[4/3] border border-border/30 hover-lift shadow-lg flex flex-col justify-end p-6">
            <img 
              src={feat.img} 
              alt={feat.title} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="relative z-10 space-y-2">
              <h3 className="font-display text-xl font-black text-white">{feat.title}</h3>
              <p className="text-[10px] text-[#EBC4D8] font-semibold leading-relaxed">{feat.desc}</p>
              <div className="pt-2">
                <Button size="sm" className="bg-[#FFF5F9] text-[#4E1B33] hover:bg-white rounded-full font-black text-[9px] px-4 py-2" asChild>
                  <Link to={feat.link}>{feat.btnText}</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 6. LOYALTY CARD SECTION */}
      <div className={cn("backdrop-blur-md rounded-[2.5rem] border p-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-left transition-all duration-500", petTheme.bgTint)}>
        <div className="space-y-2 max-w-md">
          <span className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 pet-transition", petTheme.text)}>
            <Sparkles className="h-4 w-4" /> PetPoints Rewards Loyalty
          </span>
          <h3 className="font-display text-xl font-black text-[#4E1B33] dark:text-pink-200">Earn with every booking!</h3>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Accumulate 500 PetPoints to unlock VIP status, free custom engravings in the Design Studio, and premium shop discounts.
          </p>
        </div>
        
        {/* Progress bar container */}
        <div className="w-full sm:w-80 bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-border/40 shadow-sm space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-display font-black text-[#4E1B33] dark:text-[#FFF5F9]">350 pts</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Silver Tier</span>
          </div>
          <div className="h-2 w-full bg-[#4E1B33]/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full pet-transition", petSpecies === "dog" ? "bg-[#D98CB3]" : petTheme.badgeColor)} style={{ width: "70%" }} />
          </div>
          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-semibold">
            <span>Progress: 70%</span>
            <span>150 pts left to VIP Gold</span>
          </div>
        </div>
      </div>

      {/* 8. HAPPY PET GALLERY (DIVERSE SPECIES INSTEAD OF DUPLICATIONS) */}
      <section className="space-y-4">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
            Visual Highlights 📸
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Happy Pet Gallery
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Meet the happy species of our active dashboard community</p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {[
            { title: "Husky the Dog", img: "/gallery_husky.png" },
            { title: "Persian Cat", img: "/gallery_persian.png" },
            { title: "Milo the Rabbit", img: "/gallery_rabbit.png" },
            { title: "Lovebirds", img: "/gallery_lovebirds.png" },
            { title: "Lucky Goldfish", img: "/gallery_goldfish.png" },
            { title: "Pip the Hamster", img: "/gallery_hamster.png" }
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

      {/* 9. FEATURED PETS (DIVERSIFIED CARDS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-pink-600">
              Meet Companions ❤️
            </span>
            <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
              Featured Pets
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">Adoring, playful registered animals ready to connect</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-500 hover:underline cursor-pointer">
            View All
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { name: "Daisy", breed: "Golden Puppy 🐶", age: "3 months", health: "100%", status: "Playful", img: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80" },
            { name: "Oliver", breed: "British Shorthair 🐱", age: "1 year", health: "98%", status: "Napping", img: "/oliver.jpg" },
            { name: "Milo", breed: "Angora Rabbit 🐰", age: "6 months", health: "95%", status: "Eating", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&auto=format&fit=crop&q=80" },
            { name: "Bubbles", breed: "Budgie Parakeet 🐦", age: "8 months", health: "97%", status: "Singing", img: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&auto=format&fit=crop&q=80" }
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
                <div className="relative overflow-hidden rounded-[2rem] aspect-square bg-secondary/35 shadow-inner">
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



      {/* 11. HUGE FULL-WIDTH MIDDLE FAMILY BANNER (🐶❤️👨 VIBE) */}
      <section className="relative h-[360px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/15 group text-left">
        <img 
          src="/family_cat_banner.png" 
          alt="More Than A Pet, Family" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-103"
          style={{ objectPosition: "center" }}
        />
        {/* Soft berry dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4E1B33]/95 via-black/45 to-transparent" />
        
        <div className="absolute inset-y-0 left-8 sm:left-16 flex flex-col justify-center text-left space-y-4 max-w-lg z-10 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/20 border border-pink-500/30 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FFF5F9]">
            ❤️ The PetPal Promise
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
            More Than A Pet, Family.
          </h2>
          <p className="text-xs sm:text-sm text-[#EBC4D8] font-semibold leading-relaxed">
            Celebrate the absolute center of your home. Get coordinates customized for the perfect family photoshoot, matching tag collars, and check-ups to keep them happy forever.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button className="bg-[#FFF5F9] text-[#4E1B33] hover:bg-white rounded-full px-6 py-5 font-black text-[10px] shadow-lg" onClick={() => handleJewelryPetChange("mock-dog")}>
              Design Custom Tag
            </Button>
            <Button variant="outline" className="border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-full px-6 py-5 font-black text-[10px]" asChild>
              <Link to="/shop">View Lookbook</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WHY PETPAL? EMOTIONAL LAYER */}
      <section className="relative rounded-[3rem] overflow-hidden border border-border/30 bg-[#FFF5F9]/30 dark:bg-card/25 p-8 sm:p-12 text-left space-y-6">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-pink-600">
            ❤️ Why PetPal?
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-[#4E1B33] dark:text-pink-200 tracking-tight leading-tight">
            We don’t just manage pets… we care for family.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
            Every wag of a tail, every purr, and every playful hop is a reminder of the unconditional love that binds us. At PetPal, we believe that our companions deserve the very best—from premium coordinated styling and state-of-the-art boarding, to personalized care and diagnostic tracking. Because they aren’t just pets. They are family.
          </p>
        </div>
        
        {/* Gallery of Emotional/Bonding Moments */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3 pt-4">
          {[
            { img: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=600", title: "Unconditional Bond", desc: "A shoulder to lean on, every single day." },
            { img: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&q=80&w=600", title: "Joyful Playtime", desc: "Creating memories that last a lifetime." },
            { img: "https://images.unsplash.com/photo-1472491235688-bdc81a63246e?auto=format&fit=crop&q=80&w=600", title: "Quiet Comfort", desc: "Safe, warm, and loved in every corner." }
          ].map((item, idx) => (
            <div key={idx} className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-border/20 shadow-md">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-left space-y-0.5">
                <h4 className="text-xs font-black">{item.title}</h4>
                <p className="text-[9px] text-pink-200 font-semibold">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 13. COMMUNITY PETS INSTAGRAM STYLE FEED */}
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

        {/* Instagram Story-like Highlights */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3 justify-start">
          {[
            { name: "Buddy", img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop&q=80", active: true },
            { name: "Oliver", img: "/oliver.jpg", active: true },
            { name: "Milo", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=100&auto=format&fit=crop&q=80", active: true },
            { name: "Sunny", img: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=100&auto=format&fit=crop&q=80", active: false },
            { name: "Daisy", img: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=100&auto=format&fit=crop&q=80", active: true },
            { name: "Bubbles", img: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=100&auto=format&fit=crop&q=80", active: false },
            { name: "Finny", img: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&auto=format&fit=crop&q=80", active: true },
            { name: "Pip", img: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=100&auto=format&fit=crop&q=80", active: false }
          ].map((story, idx) => (
            <Link key={idx} to="/community" className="flex flex-col items-center gap-1.5 shrink-0 group select-none cursor-pointer">
              <div className={cn(
                "h-16 w-16 rounded-full p-[3px] transition-transform duration-300 group-hover:scale-105",
                story.active 
                  ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" 
                  : "bg-muted border border-border"
              )}>
                <div className="h-full w-full rounded-full border-2 border-background overflow-hidden bg-secondary">
                  <img src={story.img} alt={story.name} className="h-full w-full object-cover" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{story.name}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&auto=format&fit=crop&q=80", likes: "1.2k", comments: "148", animal: "🐕 Golden Retriever" },
            { img: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&auto=format&fit=crop&q=80", likes: "982", comments: "94", animal: "🐱 Orange Cat" },
            { img: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&auto=format&fit=crop&q=80", likes: "740", comments: "62", animal: "🐰 White Rabbit" },
            { img: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&auto=format&fit=crop&q=80", likes: "2.1k", comments: "280", animal: "🐦 Budgie" },
            { img: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&auto=format&fit=crop&q=80", likes: "1.5k", comments: "172", animal: "🐠 Tropical Fish" },
            { img: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&auto=format&fit=crop&q=80", likes: "510", comments: "35", animal: "🐹 Hamster" },
            { img: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&auto=format&fit=crop&q=80", likes: "390", comments: "21", animal: "🐕 Playful Puppy" },
            { img: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=400&auto=format&fit=crop&q=80", likes: "1.8k", comments: "210", animal: "🐱 Black Cat" },
            { img: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&auto=format&fit=crop&q=80", likes: "2.4k", comments: "315", animal: "🐕 Labrador Puppy" },
            { img: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&auto=format&fit=crop&q=80", likes: "1.6k", comments: "198", animal: "🐕 Running Dog" },
            { img: "https://images.unsplash.com/photo-1591160690555-5debfba289f0?w=400&auto=format&fit=crop&q=80", likes: "2.2k", comments: "294", animal: "🐕 Labrador" },
            { img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80", likes: "1.9k", comments: "244", animal: "🐱 Cat Face" }
          ].map((post, idx) => (
            <Link 
              key={idx}
              to="/community"
              className="group relative aspect-square rounded-2xl overflow-hidden border border-border/30 shadow-sm"
            >
              <img src={post.img} alt={post.animal} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 text-white">
                <span className="text-[9px] font-black uppercase tracking-wide text-white/80">{post.animal}</span>
                <div className="flex items-center gap-3 text-[10px] font-black">
                  <span className="flex items-center gap-1">❤️ {post.likes}</span>
                  <span className="flex items-center gap-1">💬 {post.comments}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED COLLECTIONS — Big Images Section */}
      <section className="space-y-6">
        <div className="text-left space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-600">
            Curated For You ✨
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            Featured Collections
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Handpicked luxury experiences for you and your companion</p>
        </div>

        <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Matching Outfits", desc: "Coordinate looks for the whole family", img: "/matching_trio_outfit.png", badge: "👕 New Arrivals", link: "/shop" },
            { title: "Luxury Jewelry", desc: "Custom engraved pendants & tags", img: "/custom_cat_necklaces.png", badge: "💎 Best Seller", link: "/studio" },
            { title: "Pet Hotel", desc: "5-star boarding & live camera suite", img: "/pet_hotel.png", badge: "🏨 Book Now", link: "/book?type=hotel" },
            { title: "Grooming Spa", desc: "Full pamper packages for your pet", img: "/pet_grooming.png", badge: "✂️ Premium Spa", link: "/book?type=grooming" }
          ].map((col, idx) => (
            <Link key={idx} to={col.link} className="group relative overflow-hidden rounded-[2.5rem] aspect-[3/4] border border-border/20 hover-lift shadow-lg flex flex-col justify-end">
              <img src={col.img} alt={col.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-108" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <span className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[9px] font-black uppercase tracking-wide px-3 py-1 rounded-full z-10">{col.badge}</span>
              <div className="relative z-10 p-5 space-y-1">
                <h3 className="font-display text-xl font-black text-white leading-tight">{col.title}</h3>
                <p className="text-[11px] text-white/70 font-semibold">{col.desc}</p>
                <div className="pt-2 flex items-center gap-1 text-[10px] font-black text-[#D98CB3] uppercase tracking-wider">
                  Explore <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CUSTOMER REVIEWS SECTION */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-600">
            ⭐ Customer Reviews
          </span>
          <h2 className="font-display text-3xl font-black text-foreground tracking-tight">
            What Our Customers Say
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">Join thousands of happy pet parents who love PetPal</p>
        </div>

        {/* Star summary bar */}
        <div className="bg-gradient-to-r from-[#4E1B33]/5 via-[#D98CB3]/10 to-[#4E1B33]/5 border border-[#D98CB3]/20 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
          <div className="space-y-1">
            <div className="font-display text-6xl font-black text-[#4E1B33]">4.9</div>
            <div className="flex items-center justify-center gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
            <div className="text-xs font-semibold text-muted-foreground">Based on 3,284 reviews</div>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {[{stars: 5, pct: 88}, {stars: 4, pct: 8}, {stars: 3, pct: 3}, {stars: 2, pct: 1}].map(r => (
              <div key={r.stars} className="flex items-center gap-2 text-[10px]">
                <span className="text-amber-500 font-black w-3">{r.stars}</span>
                <Star className="h-2.5 w-2.5 text-amber-500 fill-current shrink-0" />
                <div className="flex-1 h-2 bg-border/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-muted-foreground font-semibold w-6 text-right">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              stars: 5,
              text: "Best pet store I've ever used! The matching outfits are absolutely adorable and the quality is outstanding. My dog got so many compliments at the park!",
              name: "Sarah M.",
              role: "Golden Retriever Parent",
              avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&auto=format&fit=crop&q=80",
              tag: "Verified Purchase ✓",
              product: "Matching Hoodies Set"
            },
            {
              stars: 5,
              text: "My dog loves the grooming service! The staff is so gentle and professional. He came back looking like a show dog and smelling amazing for days.",
              name: "Ahmed K.",
              role: "Poodle Parent",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
              tag: "Verified Purchase ✓",
              product: "Grooming Spa Package"
            },
            {
              stars: 5,
              text: "The custom jewelry is breathtaking! I ordered a pendant with my cat's photo and it arrived perfectly engraved. It feels so premium and unique. Absolutely love it!",
              name: "Layla A.",
              role: "Cat Mom of 2",
              avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
              tag: "Verified Purchase ✓",
              product: "Custom Photo Pendant"
            },
            {
              stars: 5,
              text: "The Pet Hotel is absolutely 5-star! The live camera feature gave me peace of mind the whole trip. My rabbit was so happy and well-cared for.",
              name: "Omar R.",
              role: "Rabbit Owner",
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
              tag: "Verified Stay ✓",
              product: "Pet Hotel Boarding"
            },
            {
              stars: 5,
              text: "Incredible platform! The health tracking and vet booking system is seamless. I can manage all three of my pets in one place. Game changer for pet parents!",
              name: "Fatima H.",
              role: "Multi-Pet Parent",
              avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
              tag: "Verified Purchase ✓",
              product: "Full Platform"
            },
            {
              stars: 5,
              text: "The subscription box is the highlight of my month! Every box is thoughtfully curated with treats my cat actually loves. Totally worth every penny!",
              name: "Nora S.",
              role: "Persian Cat Parent",
              avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&auto=format&fit=crop&q=80",
              tag: "Subscriber ✓",
              product: "Monthly PetPal Box"
            }
          ].map((review, idx) => (
            <div key={idx} className="group rounded-[2rem] bg-card border border-border/50 p-5 flex flex-col justify-between hover-lift shadow-sm hover:shadow-xl transition-all duration-300 hover:border-[#D98CB3]/30">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(review.stars)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">{review.tag}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">&ldquo;{review.text}&rdquo;</p>
                <div className="text-[9px] font-black text-[#D98CB3] uppercase tracking-wider">📦 {review.product}</div>
              </div>
              <div className="flex items-center gap-3 border-t border-border/30 pt-3 mt-4">
                <img src={review.avatar} alt={review.name} className="h-9 w-9 rounded-full object-cover border-2 border-[#D98CB3]/30 shadow-inner" />
                <div>
                  <h4 className="text-xs font-bold text-foreground leading-none">{review.name}</h4>
                  <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">{review.role}</p>
                </div>
              </div>
            </div>
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
              before: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=200&auto=format&fit=crop&q=80",
              after: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80",
              tag: "Rescue Match"
            },
            {
              title: "Oliver's Weight Recovery 🐱",
              desc: "Lost 4.2kg of excess weight through our automated caloric deficit recommendations.",
              before: "https://images.unsplash.com/photo-1511275539165-cc46b1ee8960?w=200&auto=format&fit=crop&q=80",
              after: "https://images.unsplash.com/photo-1526336024430-6fbb6e361c30?w=200&auto=format&fit=crop&q=80",
              tag: "Weight Control"
            },
            {
              title: "Bella's Adoption Story 🐰",
              desc: "Found her forever home and family match through our community board filters.",
              before: "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=200&auto=format&fit=crop&q=80",
              after: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=200&auto=format&fit=crop&q=80",
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

      {/* Brand Directory */}
      <section className="mx-auto max-w-7xl px-6 py-10 border-t border-border/25 mt-10">
        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 text-center mb-6">Featured Partners & Brands</p>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all">
          {["ROYAL CANIN", "PURINA", "HILL'S", "WHISKAS", "PEDIGREE"].map((brand) => (
            <span key={brand} className="font-display text-lg sm:text-2xl font-black tracking-widest text-[#4E1B33] dark:text-[#EBC4D8] pointer-events-none">
              {brand}
            </span>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-gradient-to-b from-background to-secondary/30 py-16 border-t border-border/25 text-center mt-10 rounded-[3rem]">
        <div className="mx-auto max-w-4xl px-6 space-y-6">
          <span className="text-xs font-black text-primary uppercase tracking-widest">Newsletter</span>
          <h2 className="font-display text-4xl font-extrabold text-[#4E1B33]">Join The PetPal Family</h2>
          <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-md mx-auto">Get exclusive discounts, styling tips, and advanced veterinary alerts straight to your inbox.</p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Thank you for subscribing! Check your inbox for your 15% discount code! 📩🐾");
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2"
          >
            <input 
              required 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-1 bg-background border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus-visible:ring-offset-2" 
            />
            <Button type="submit" className="rounded-full bg-[#4E1B33] text-white hover:bg-[#4E1B33]/90 font-black py-4 px-8 uppercase tracking-wider text-xs cursor-pointer">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* Emergency Hotline Dialog Trigger */}
      <EmergencyModal open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog} />

      {/* FLOATING AI ASSISTANT CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat Bubble Button */}
        {!showMiniChat && (
          <button
            onClick={() => setShowMiniChat(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#D98CB3] to-[#4E1B33] text-white shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer animate-bounce-slow border border-white/20"
            title="Ask PetPal AI Coach"
          >
            <Bot className="h-7 w-7 text-white" />
          </button>
        )}

        {/* Chat Drawer Popup */}
        {showMiniChat && (
          <div className="w-80 sm:w-96 h-[450px] bg-card/95 backdrop-blur-md border border-border/80 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#D98CB3] to-[#4E1B33] px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                  <Bot className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black leading-none">PetPal AI Coach</h4>
                  <p className="text-[8px] text-white/80 font-bold uppercase tracking-wider mt-0.5">Active helper for {activePet.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMiniChat(false)}
                className="text-white/80 hover:text-white hover:scale-110 transition-all cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {miniChatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[80%] rounded-2xl px-3.5 py-2 text-xs font-medium leading-relaxed shadow-sm",
                    msg.sender === "user"
                      ? "ml-auto bg-gradient-to-r from-[#D98CB3] to-[#4E1B33] text-white rounded-br-none"
                      : "mr-auto bg-muted dark:bg-black/30 border border-border/50 text-foreground rounded-bl-none"
                  )}
                >
                  <p>{msg.text}</p>
                  <span className={cn(
                    "text-[7px] mt-1 text-right block font-semibold",
                    msg.sender === "user" ? "text-white/70" : "text-muted-foreground/80"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              
              {isTyping && (
                <div className="mr-auto bg-muted dark:bg-black/30 border border-border/50 rounded-2xl rounded-bl-none px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-1.5 shadow-sm">
                  <Bot className="h-3.5 w-3.5 animate-bounce text-muted-foreground animate-pulse" />
                  <span className="flex items-center gap-0.5">
                    Typing<span className="animate-pulse">.</span><span className="animate-pulse delay-75">.</span><span className="animate-pulse delay-150">.</span>
                  </span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border/50 bg-background/50 flex gap-2">
              <input
                type="text"
                value={miniChatInput}
                onChange={(e) => setMiniChatInput(e.target.value)}
                placeholder={`Ask about ${activePet.name}...`}
                className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus-visible:ring-offset-1"
              />
              <button
                type="submit"
                className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-r from-[#D98CB3] to-[#4E1B33] hover:from-[#E8A0C5] hover:to-[#6E2A4A] text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
