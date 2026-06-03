import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { 
  ArrowRight, 
  Calendar, 
  Bell, 
  ShoppingBag, 
  MessageCircle, 
  PawPrint, 
  Sparkles, 
  Star, 
  Shield, 
  ShieldAlert, 
  Award, 
  Phone, 
  Users, 
  Check, 
  Send, 
  Download, 
  Activity, 
  Heart, 
  Brain, 
  PhoneCall,
  MessageSquare,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PetPal — Smart pet care, all in one place" },
      { name: "description", content: "Because every pet deserves exceptional care. Book visits, track health, consult AI diagnostics, and get emergency support." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Carousel & Contact states
  const [slide, setSlide] = useState(0);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [sending, setSending] = useState(false);

  const SLIDES = [
    {
      badge: "Healthcare 🩺",
      title: "Track Your Pet's Health",
      subtitle: "All-in-one digital medical passport, automatic vaccine cycle notifications, and active weight tracking.",
      img: "https://images.unsplash.com/photo-1581888227599-779811939961?w=1200&auto=format&fit=crop&q=80"
    },
    {
      badge: "Diagnostics 🤖",
      title: "AI Veterinary Assistant",
      subtitle: "Consult our advanced guided symptom checker wizard regarding active physiological wellness levels instantly.",
      img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=80"
    },
    {
      badge: "Emergency 🚨",
      title: "Emergency Care 24/7",
      subtitle: "Locate near clinics, verify open hours, check distances, and review acute trauma protocols.",
      img: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&auto=format&fit=crop&q=80"
    },
    {
      badge: "Community ❤️",
      title: "Recent Pet Adoptions",
      subtitle: "Browse local shelter profiles and adopt a new companion directly through verified channels.",
      img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop&q=80"
    },
    {
      badge: "Premium ✨",
      title: "Grooming & Supplies Shop",
      subtitle: "Buy organic salmon recipe foods, interactive chewing toys, and cozy orthopedic beds.",
      img: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=1200&auto=format&fit=crop&q=80"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(prev => (prev + 1) % 5);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/home" });
  }, [user, loading, navigate]);

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return toast.error("Please fill in all fields.");
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    toast.success("Thank you! Your message was sent successfully. We'll be in touch! 🐾");
    setContactName("");
    setContactEmail("");
    setContactMsg("");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-accent selection:text-accent-foreground font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary p-2 shadow-lg shadow-primary/25">
              <PawPrint className="h-full w-full text-primary-foreground" />
            </div>
            <span className="text-foreground">PetPal</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#download" className="hover:text-foreground transition-colors">Mobile App</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/home" className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 hover:scale-105 active:scale-95 transition-all">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex text-sm font-bold text-muted-foreground hover:text-foreground px-4 py-2 transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 hover:scale-105 active:scale-95 transition-all">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SLIDER SECTION (Under Navbar directly) */}
      <section className="mx-auto max-w-7xl px-6 pt-6">
        <div className="relative h-64 md:h-[400px] w-full overflow-hidden rounded-[2.5rem] bg-muted shadow-2xl group/carousel">
          {SLIDES.map((s, idx) => (
            <div 
              key={idx}
              className={cn(
                "absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out flex flex-col justify-end p-6 md:p-12 text-white text-left",
                slide === idx ? "opacity-100 scale-100 z-10 animate-in fade-in zoom-in-95 duration-500" : "opacity-0 scale-95 pointer-events-none z-0"
              )}
            >
              <img 
                src={s.img} 
                alt={s.title} 
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[5500ms] ease-linear scale-105 group-hover/carousel:scale-100" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
              <div className="relative z-10 space-y-2 md:space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="inline-flex rounded-full bg-primary/25 backdrop-blur-md px-3 py-1 text-[9px] font-black uppercase tracking-wider text-primary border border-primary/30 w-max">
                  {s.badge}
                </span>
                <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  {s.title}
                </h2>
                <p className="text-white/80 text-xs md:text-sm font-semibold leading-relaxed max-w-lg">
                  {s.subtitle}
                </p>
                <Button asChild size="lg" className="rounded-full bg-primary text-white font-bold hover:scale-105 transition-transform w-max px-6 py-6 text-xs uppercase tracking-wider shadow-lg shadow-primary/20">
                  <Link to="/signup">Start Free Journey</Link>
                </Button>
              </div>
            </div>
          ))}
          
          {/* Slider Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlide(idx)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  slide === idx ? "w-8 bg-primary" : "w-2.5 bg-white/45 hover:bg-white/70"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION (Circular Categories Row) */}
      <section className="mx-auto max-w-7xl px-6 py-10 text-center space-y-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Discover PetPal</span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">Explore Categories</h2>
        </div>
        
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
          {[
            { label: "Dogs", emoji: "🐶", img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=60" },
            { label: "Cats", emoji: "🐱", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=60" },
            { label: "Birds", emoji: "🐦", img: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=150&auto=format&fit=crop&q=60" },
            { label: "Rabbits", emoji: "🐰", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150&auto=format&fit=crop&q=60" },
            { label: "Fish", emoji: "🐠", img: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=150&auto=format&fit=crop&q=60" },
            { label: "Reptiles", emoji: "🦎", img: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=150&auto=format&fit=crop&q=60" }
          ].map((cat) => (
            <Link 
              key={cat.label} 
              to="/signup" 
              className="flex flex-col items-center gap-2 group transition-all duration-300"
            >
              <div className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-full border-2 border-border/60 hover:border-primary shadow-md group-hover:shadow-xl group-hover:scale-115 transition-all duration-500">
                <img 
                  src={cat.img} 
                  alt={cat.label} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
              <span className="text-xs font-black tracking-wide text-muted-foreground group-hover:text-primary transition-colors">
                {cat.emoji} {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Core Tagline Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-10 pb-16 grid gap-12 lg:grid-cols-2 items-center">
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Smart pet care, simplified
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tighter text-foreground">
            Because Every Pet <span className="text-primary block">Deserves Exceptional Care ❤️</span>
          </h1>
          <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg font-medium leading-relaxed text-muted-foreground/90">
            A comprehensive, luxury pet healthcare platform. Track your companion's vitals, book veterinarian appointments, chat with our advanced AI diagnostic assistant, and access instant emergency support.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
            <Link to="/signup" className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-4 text-sm font-black tracking-wide text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.03] active:scale-95">
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-full border-2 border-border/70 bg-card/65 backdrop-blur-sm px-8 py-4 text-sm font-bold tracking-wide transition-all hover:scale-[1.03] active:scale-95">
              Sign In to Account
            </Link>
          </div>
        </div>

        <div className="relative mx-auto lg:mr-0 max-w-lg lg:max-w-none w-full grid grid-cols-2 gap-4">
          {[
            { label: "Track Health", icon: Activity, desc: "Interactive charts & timeline Logs", img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400" },
            { label: "Book Appointments", icon: Calendar, desc: "Easy schedule & direct invoice", img: "https://images.unsplash.com/photo-1581888227599-779811939961?w=400" },
            { label: "AI Diagnostics", icon: Brain, desc: "Symptom checker chat wizard", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400" },
            { label: "Emergency Support", icon: ShieldAlert, desc: "24/7 clinics finder map & triage", img: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400" }
          ].map((item, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-3xl border border-white/20 shadow-xl bg-card hover-lift group aspect-square">
              <img
                src={item.img}
                alt={item.label}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end p-4 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 backdrop-blur-md text-white mb-2 border border-primary/20">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-xs font-black text-white">{item.label}</h4>
                <p className="text-[9px] text-white/70 font-semibold leading-tight mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ADOPTION SPOTLIGHT SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-16 space-y-8 text-center bg-secondary/20 rounded-[3rem] border border-border/30">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Find a companion</span>
          <h2 className="font-display text-3xl font-extrabold text-foreground flex items-center justify-center gap-1.5">
            Adoption Spotlight 🏡❤️
          </h2>
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">Give these rescued companions a loving, warm home. Explore their profiles.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
          {[
            { name: "Bella", breed: "Husky Puppy", age: "2 months", img: "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=500&auto=format&fit=crop&q=80" },
            { name: "Oliver", breed: "British Shorthair", age: "1 year", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80" },
            { name: "Milo", breed: "Angora Rabbit", age: "6 months", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500&auto=format&fit=crop&q=80" }
          ].map((pet, idx) => (
            <div key={idx} className="group overflow-hidden rounded-[2.2rem] bg-card border border-border hover:shadow-xl transition-all duration-500 flex flex-col justify-between hover-lift">
              <div className="p-3.5 space-y-4">
                <div className="relative overflow-hidden rounded-[1.6rem] bg-secondary/50 aspect-square">
                  <img src={pet.img} alt={pet.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] uppercase font-extrabold tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-full">
                      {pet.age}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 px-1 text-left">
                  <h3 className="font-display font-bold text-xl text-foreground/90">{pet.name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{pet.breed}</p>
                </div>
              </div>
              <div className="p-3.5 pt-0">
                <Button asChild className="w-full rounded-xl text-xs font-bold py-5 mt-1 bg-primary text-white shadow-md shadow-primary/10">
                  <Link to="/signup">Adopt Me ❤️</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. RECENT COMMUNITY POSTS (Instagram Style) */}
      <section className="mx-auto max-w-7xl px-6 py-16 space-y-8 text-center">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Instagram for Pets</span>
          <h2 className="font-display text-3xl font-extrabold text-foreground">Recent Community Feed</h2>
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">See how members are caring for their animal companions on our social boards.</p>
        </div>

        <div className="grid gap-6 grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto">
          {[
            { img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop&q=80", likes: 142, comments: 24, tag: "🐶 Playtime" },
            { img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80", likes: 98, comments: 16, tag: "🐱 Napping" },
            { img: "https://images.unsplash.com/photo-1522856283749-626210a309e1?w=500&auto=format&fit=crop&q=80", likes: 74, comments: 10, tag: "🐦 Singing" },
            { img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500&auto=format&fit=crop&q=80", likes: 110, comments: 18, tag: "🐰 Eating" }
          ].map((post, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-[2.2rem] aspect-[4/5] bg-muted shadow-sm hover:shadow-xl transition-all duration-500 hover-lift border border-border/40">
              <img 
                src={post.img} 
                alt={`Community Post ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
                loading="lazy"
              />
              {/* Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className="text-[8px] font-extrabold uppercase bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full">
                  {post.tag}
                </span>
              </div>
              {/* Overlay likes / comments */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6 text-white">
                <div className="flex items-center gap-6 text-xs font-black">
                  <div className="flex items-center gap-1.5 hover:scale-110 transition-transform cursor-pointer">
                    <Heart className="h-4.5 w-4.5 fill-white text-white" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:scale-110 transition-transform cursor-pointer">
                    <MessageSquare className="h-4.5 w-4.5 fill-white text-white" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TIPS & ARTICLES SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-16 space-y-8 text-center bg-secondary/20 rounded-[3rem] border border-border/30">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Preventative Care</span>
          <h2 className="font-display text-3xl font-extrabold text-foreground">Tips & Health Articles</h2>
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">Expert guides, medical checklists, and nutritional instructions from certified veterinarians.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
          {[
            { title: "5 Signs Your Dog Needs A Vet 🩺", desc: "Recognize warning indicators of dehydration, severe digestion issues, or joints pains early.", img: "https://images.unsplash.com/photo-1581888227599-779811939961?w=500", label: "Dogs" },
            { title: "Optimal Cat Nutrition Guide 🐈", desc: "How balanced protein ratios affect joint mobility, metabolic recovery, and coat hydration.", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500", label: "Cats" },
            { title: "Small Pet Enrichment Tips 🐹", desc: "Keep your rabbits, hamsters, and birds active with chewing logs, nesting materials, and tunnels.", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500", label: "Rabbits" }
          ].map((art, idx) => (
            <div key={idx} className="group overflow-hidden rounded-[2.2rem] bg-card border border-border hover:shadow-xl transition-all duration-500 flex flex-col justify-between hover-lift text-left">
              <div className="p-3.5 space-y-4">
                <div className="relative overflow-hidden rounded-[1.6rem] bg-secondary/50 aspect-video">
                  <img src={art.img} alt={art.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] uppercase font-extrabold tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-full">
                      {art.label}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 px-1">
                  <h3 className="font-display font-bold text-base text-foreground/90 leading-tight group-hover:text-primary transition-colors">
                    {art.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {art.desc}
                  </p>
                </div>
              </div>
              <div className="p-3.5 pt-0 border-t border-border/10">
                <Button asChild variant="ghost" className="w-full text-xs font-black py-4 hover:bg-secondary/10 flex items-center justify-center gap-1 text-primary">
                  <Link to="/signup">Read Article <BookOpen className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="bg-secondary/40 py-20 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Our Ecosystem</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">Supercharged features for daily wellness</h2>
            <p className="text-sm sm:text-base text-muted-foreground/80 leading-relaxed">
              We connect pet profile records, smart diagnostic modules, calendar scheduler visits, and commerce checkout points in one responsive application.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Vet Scheduling Wizard", desc: "4-step wizard checkout supporting specialist profiles, time slots, and invoice billing receipts.", icon: Calendar, color: "bg-pink-500/10 text-pink-500 border-pink-500/10" },
              { title: "Premium Supplies Shop", desc: "Instantly buy food, treats, scratching posts, and cozy orthopedic beds with dynamic category filtering.", icon: ShoppingBag, color: "bg-rose-400/10 text-rose-400 border-rose-400/10" },
              { title: "AI Veterinarian Chat", desc: "Guided diagnostic wizard wizard query details and recommending supplement formulas.", icon: MessageCircle, color: "bg-amber-500/10 text-amber-500 border-amber-500/10" },
              { title: "Lost & Found Board", desc: "Help reuniting lost companions using interactive OSM maps marking last seen locations.", icon: ShieldAlert, color: "bg-pink-600/10 text-pink-600 border-pink-600/10" },
              { title: "Gamification & Loyalty", desc: "Earn achievement badges like 🏆 First Vaccination, stack points, and unlock cash-back supplies.", icon: Award, color: "bg-rose-500/10 text-rose-500 border-rose-500/10" },
              { title: "Unified Health Records", desc: "Log immunization cycles, treatment dosages, bodyweight progressions, and clinic diagnoses.", icon: Bell, color: "bg-amber-600/10 text-amber-600 border-amber-600/10" }
            ].map((f, i) => {
              const I = f.icon;
              return (
                <div key={i} className="group relative rounded-3xl border border-border bg-card p-6 hover-lift">
                  <div className={cn("inline-flex rounded-2xl p-3.5 mb-4 transition-transform duration-500 group-hover:rotate-6", f.color)}>
                    <I className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground/90">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Testimonials</span>
            <h2 className="font-display text-4xl font-extrabold tracking-tight">Loved by Pet Parents</h2>
            <p className="text-xs sm:text-sm text-muted-foreground/70">Here is what our community of veterinarians and pet owners are saying.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "Hanan Taha", role: "Cat Mother", rating: 5, quote: "Whiskers absolutely loves the salmon kibble from PetPal shop! The ordering is super fast, and I get loyalty points to unlock treats." },
              { name: "Dr. Sarah Connor", role: "Veterinarian Doctor", rating: 5, quote: "As a clinician, PetPal's health records make consulting patients a breeze. Owners have vaccination schedules logged, making checkups safe and quick." },
              { name: "Tareq Jibril", role: "Retriever Owner", rating: 5, quote: "The 4-step Vet scheduler is incredibly smooth. I book slots, verify the pricing, and simulate checkouts with receipts instantly. Truly graduation-level project!" }
            ].map((t, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card/60 p-6 space-y-4 hover-lift">
                <div className="flex text-amber-400 gap-0.5">
                  {Array.from({ length: t.rating }).map((_, r) => (
                    <Star key={r} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/90 leading-relaxed italic">"{t.quote}"</p>
                <div className="border-t border-border/40 pt-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                    {t.name.split(" ")[0][0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground/90">{t.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-secondary/40 py-20 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Pricing Plans</span>
            <h2 className="font-display text-4xl font-extrabold tracking-tight">Simple plans for every pet size</h2>
            <p className="text-xs sm:text-sm text-muted-foreground/75">Choose the level of veterinary coverage and shopping discounts that fit your companion.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {/* Free plan */}
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover-lift">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Standard Care</span>
                <h3 className="font-display text-2xl font-bold">Free Basic</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">$0</span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Register up to 1 pet profile</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Manual vaccination tracking</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Catalog shopping checkout</li>
                </ul>
              </div>
              <Button asChild className="rounded-xl w-full mt-8" variant="outline">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Plus plan */}
            <div className="rounded-3xl border-2 border-primary bg-card p-6 flex flex-col justify-between relative shadow-xl transform scale-[1.03] hover-lift">
              <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
                Popular
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Advanced Wellness</span>
                <h3 className="font-display text-2xl font-bold">PetPal Plus</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">$9.99</span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Register up to 3 pet profiles</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 24/7 AI diagnostics assistant</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Automatic immunization alerts</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 5% cashback on store products</li>
                </ul>
              </div>
              <Button asChild className="rounded-xl w-full mt-8 shadow-lg shadow-primary/20">
                <Link to="/signup">Start Free Trial</Link>
              </Button>
            </div>

            {/* Premium plan */}
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover-lift">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ultimate Security</span>
                <h3 className="font-display text-2xl font-bold">Premium Hospital</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">$29.99</span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited pet profile registries</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Free annual vet consultation</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority scheduler clinic slots</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Monthly free supply treat boxes</li>
                </ul>
              </div>
              <Button asChild className="rounded-xl w-full mt-8" variant="outline">
                <Link to="/signup">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* App Download Banner */}
      <section id="download" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 text-center space-y-6 relative z-10">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3"><Download className="h-6 w-6 text-primary" /></div>
          </div>
          <h2 className="font-display text-4xl font-extrabold tracking-tight">PetPal in your pocket</h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-muted-foreground animate-pulse">
            Get instant push notifications for vaccines, chat with vet AI on-the-go, and purchase products from our mobile-optimized app. Available for iOS and Android.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" className="rounded-full font-bold bg-foreground hover:bg-neutral-800 text-background px-6">
              🍏 App Store
            </Button>
            <Button size="lg" className="rounded-full font-bold bg-foreground hover:bg-neutral-800 text-background px-6">
              🤖 Google Play
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 border-t border-border/40 max-w-2xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-black text-primary uppercase tracking-widest">Get In Touch</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Questions? Contact support</h2>
          <p className="text-xs text-muted-foreground/80">Send us details and our veterinary care team will respond within 24 hours.</p>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-4 bg-card/65 p-6 rounded-[2.5rem] border border-border/40 shadow-sm">
          <div className="space-y-1">
            <Label>Your Name</Label>
            <Input required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Buddy Parent" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label>Email Address</Label>
            <Input required type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="name@domain.com" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label>Message Details</Label>
            <textarea 
              required
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              placeholder="How can we assist you and your pet?"
              className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Button type="submit" disabled={sending} className="w-full rounded-xl py-6 flex items-center justify-center gap-1.5 shadow-md shadow-primary/10">
            {sending ? "Sending Details..." : <>Send Message <Send className="h-4 w-4" /></>}
          </Button>
        </form>
      </section>

      {/* Startup Footer (10. Footer عالمي + 11. Footer pages) */}
      <footer className="border-t border-border/30 bg-card/30 py-16 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          
          {/* Logo Column */}
          <div className="sm:col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary p-1.5 text-primary-foreground shadow-md">
                <PawPrint className="h-full w-full" />
              </div>
              <span>PetPal</span>
            </div>
            <p className="text-[11px] leading-relaxed max-w-xs text-muted-foreground/80 font-medium">
              Because every companion deserves exceptional care. A high-end ecosystem offering smart veterinary records, local diagnostics, and priority scheduling.
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider pt-2">
              Designed for happy, healthy pets 🐾
            </p>
          </div>

          {/* Platform Column */}
          <div className="space-y-3 text-left">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground">Platform</h4>
            <ul className="space-y-2 font-semibold">
              <li><Link to="/signup" className="hover:text-primary transition-colors">Track Health</Link></li>
              <li><Link to="/signup" className="hover:text-primary transition-colors">Book Appointments</Link></li>
              <li><Link to="/signup" className="hover:text-primary transition-colors">AI Diagnostics</Link></li>
              <li><Link to="/signup" className="hover:text-primary transition-colors">Emergency Support</Link></li>
              <li><Link to="/signup" className="hover:text-primary transition-colors">Premium Supplies</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-3 text-left">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground">Company</h4>
            <ul className="space-y-2 font-semibold">
              <li><a href="#features" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#testimonials" className="hover:text-primary transition-colors">Reviews & Press</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing Plans</a></li>
              <li><a href="#download" className="hover:text-primary transition-colors">Careers (We're hiring!)</a></li>
            </ul>
          </div>

          {/* Resources & Support Column */}
          <div className="space-y-3 text-left">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground">Support & Legal</h4>
            <ul className="space-y-2 font-semibold">
              <li><a href="#contact" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact Support</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Banner */}
        <div className="mx-auto max-w-7xl px-6 mt-12 pt-8 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/75">
            © {new Date().getFullYear()} PetPal Healthcare Inc. All rights reserved.
          </p>
          <div className="flex gap-4 text-[10px] uppercase tracking-widest text-muted-foreground/75">
            <a href="#" className="hover:underline">Security Security</a>
            <span>•</span>
            <a href="#" className="hover:underline">System Status</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
