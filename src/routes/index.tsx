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
  PhoneCall 
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

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [sending, setSending] = useState(false);

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

  const bentoImages = [
    {
      url: "https://images.openai.com/static-rsc-4/7JJfQnKjP0k3p6RegJgYCOrDbVF-MdA9xdJDsBunKaiaTsdazFN7wpUxrJ3jLkR5U2PLJFaao5bVsOpkkJghG4TvDjHIJOhog1pp0lRgltm6UEKKyfc_gmgdUkQ6MmLHahPmhR8f5FW6_yujOB7dnFRe1DWibyfS2kM1acP-8aCRwAxtckl9FKz_P0gWLv4L?purpose=fullsize",
      title: "Cozy Companions",
      tag: "Wellness"
    },
    {
      url: "https://images.openai.com/static-rsc-4/fFGXIBWTg5zZV-s05oJizCC-xrxJmLKJ_dknB3kAddFbv0yINhkcliTi-qzy4TgQMce7z4QpRXSPkyVqLNqpc9fhdAwKU06m0uUJBJzj9UYrLzibsSDZ82J6_LZqcaVwIXch1T5H44MfH_QAbNCA0VgZlxKOqjoG0SbhkFBHLGn1BodGwhYM72oiarP5Mqo5?purpose=fullsize",
      title: "Active Playtime",
      tag: "Exercise"
    },
    {
      url: "https://images.openai.com/static-rsc-4/jCTRA8ep0i0VStPjxBZBbpgk2O2fzE3FDDun5QQn2a20Qjbbl37o7vikJp8rWbq9adrYoZQl61kFSWSiTfQqWK1mcj3b0PSff22He8Gbu7AQf0I754E_OWPY-XojW6a1BksVXbHL2kuJfXnQyIqHcEuu57Qf_PDe2kveDFPDOexIuOqhm0an1Bpgt4dLpbPG?purpose=fullsize",
      title: "Nutrition Guides",
      tag: "Health"
    },
    {
      url: "https://images.openai.com/static-rsc-4/qj6KemkTRch6D4T0gd46O1cd47AkRdSAh56PHmmqn6efX-y-4T6u8EKHdNmWDaoQAKWj2Zu-4vFGi1Cnttd_VxN4jgGOVZuJlGihlH3PCAQ6n9-5Y-rY7ZYcRJqrmF6Jq2u-vFcH9wAdYVPDRCLlwTKHw2ihQF9A1fQuN3yxgRWHulC9oM8pH8oFvQTkSIBz?purpose=fullsize",
      title: "Expert Clinical Care",
      tag: "Veterinarian"
    }
  ];

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

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-32 grid gap-12 lg:grid-cols-12 items-center">
        <div className="space-y-8 text-center lg:text-left lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Smart pet care, simplified
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tighter text-foreground">
            Because Every Pet <span className="block text-primary">Deserves Exceptional Care ❤️</span>
          </h1>
          
          <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg font-medium leading-relaxed text-muted-foreground/90">
            A comprehensive, luxury pet healthcare platform. Track your companion's vitals, book veterinarian appointments, chat with our advanced AI diagnostic assistant, and access instant emergency support.
          </p>

          {/* Quick Stats list requested */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0 pt-2">
            {[
              { label: "Track Health", icon: Activity, desc: "Interactive charts & timeline Logs" },
              { label: "Book Appointments", icon: Calendar, desc: "Easy schedule & direct invoice" },
              { label: "AI Diagnostics", icon: Brain, desc: "Symptom checker chat wizard" },
              { label: "Emergency Support", icon: ShieldAlert, desc: "24/7 clinics finder map & triage" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-2xl glass-card border border-border/40 hover-lift">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black text-foreground">{item.label}</h4>
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
            <Link to="/signup" className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-4 text-sm font-black tracking-wide text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.03] active:scale-95">
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-full border-2 border-border/70 bg-card/65 backdrop-blur-sm px-8 py-4 text-sm font-bold tracking-wide transition-all hover:bg-background/80 hover:border-foreground/35 hover:scale-[1.03] active:scale-95">
              Sign In to Account
            </Link>
          </div>
          
          <div className="flex items-center justify-center lg:justify-start gap-6 pt-6 border-t border-border/30 max-w-md mx-auto lg:mx-0">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-secondary/80 flex items-center justify-center font-bold text-xs">
                  {i === 4 ? "🐾" : "🐕"}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Join 2,500+ happy pets</p>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Trusted by veterinary clinics</p>
            </div>
          </div>
        </div>

        {/* Bento Grid / Multi-image Premium Gallery requested */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4 relative">
          <div className="absolute -inset-4 rounded-[3.5rem] bg-primary/5 blur-3xl pointer-events-none" />
          
          {/* Column 1 */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-xl bg-card hover-lift group aspect-[4/5]">
              <img
                src={bentoImages[0].url}
                alt={bentoImages[0].title}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 text-left">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-primary bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full w-max mb-1">
                  {bentoImages[0].tag}
                </span>
                <h4 className="text-xs font-black text-white">{bentoImages[0].title}</h4>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-xl bg-card hover-lift group aspect-square">
              <img
                src={bentoImages[1].url}
                alt={bentoImages[1].title}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 text-left">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-primary bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full w-max mb-1">
                  {bentoImages[1].tag}
                </span>
                <h4 className="text-xs font-black text-white">{bentoImages[1].title}</h4>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4 pt-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-xl bg-card hover-lift group aspect-square">
              <img
                src={bentoImages[2].url}
                alt={bentoImages[2].title}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 text-left">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-primary bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full w-max mb-1">
                  {bentoImages[2].tag}
                </span>
                <h4 className="text-xs font-black text-white">{bentoImages[2].title}</h4>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-xl bg-card hover-lift group aspect-[4/5]">
              <img
                src={bentoImages[3].url}
                alt={bentoImages[3].title}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 text-left">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-primary bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full w-max mb-1">
                  {bentoImages[3].tag}
                </span>
                <h4 className="text-xs font-black text-white">{bentoImages[3].title}</h4>
              </div>
            </div>
          </div>
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
              className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
