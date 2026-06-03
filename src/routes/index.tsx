import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Calendar, Bell, ShoppingBag, MessageCircle, PawPrint, Sparkles, Star, Shield, ShieldAlert, Award, Phone, Users, Check, Send, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero.jpg";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PetPal — Smart pet care, all in one place" },
      { name: "description", content: "Book grooming and vet visits, shop premium supplies, get smart reminders, and chat with an AI pet assistant." },
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

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden selection:bg-accent selection:text-accent-foreground font-sans">
      
      {/* Decorative background glows */}
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[130px] pointer-events-none" />
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary p-2 shadow-lg shadow-primary/25">
              <PawPrint className="h-full w-full text-primary-foreground" />
            </div>
            PetPal
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
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-32 grid gap-12 lg:grid-cols-2 items-center">
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Smart pet care, simplified
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tighter text-foreground">
            Everything your pet needs, <span className="text-primary">in one calm place.</span>
          </h1>
          <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg font-medium leading-relaxed text-muted-foreground/90">
            Scheduler vet visits, restock premium food and toys, track medical alerts, and consult our AI diagnostics assistant — all within a single unified workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
            <Link to="/signup" className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-4.5 text-sm font-black tracking-wide text-primary-foreground transition-all hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.03] active:scale-95">
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-full border-2 border-border/70 bg-card/65 backdrop-blur-sm px-8 py-4.5 text-sm font-bold tracking-wide transition-all hover:bg-background/80 hover:border-foreground/35 hover:scale-[1.03] active:scale-95">
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

        <div className="relative mx-auto lg:mr-0 max-w-lg lg:max-w-none w-full">
          <div className="absolute -inset-4 rounded-[3.5rem] bg-primary/5 blur-2xl pointer-events-none" />
          <div className="relative aspect-video lg:aspect-square overflow-hidden rounded-[2.5rem] border border-white/20 shadow-2xl bg-card">
            <img
              src={heroImg}
              alt="Happy dog and kitten"
              className="h-full w-full object-cover object-center transition-transform duration-1000 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 rounded-3xl glass-card p-5 text-left border border-white/30 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-primary">Fully Certified Care</p>
                <p className="text-[10px] text-foreground/80 font-medium">All our clinics and veterinarians are board-licensed professionals.</p>
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
              { title: "AI Veterinarian Chat", desc: "Graceful rule-based local parser analyzing skin concerns, indigestion, and activity levels offline.", icon: MessageCircle, color: "bg-amber-500/10 text-amber-500 border-amber-500/10" },
              { title: "Lost & Found Board", desc: "Help reuniting lost companions using interactive OSM maps marking last seen locations.", icon: ShieldAlert, color: "bg-pink-600/10 text-pink-600 border-pink-600/10" },
              { title: "Gamification & Loyalty", desc: "Earn achievement badges like 🏆 First Vaccination, stack points, and unlock cash-back supplies.", icon: Award, color: "bg-rose-500/10 text-rose-500 border-rose-500/10" },
              { title: "Unified Health Records", desc: "Log immunization cycles, treatment dosages, bodyweight progressions, and clinic diagnoses.", icon: Bell, color: "bg-amber-600/10 text-amber-600 border-amber-600/10" }
            ].map((f, i) => {
              const I = f.icon;
              return (
                <div key={i} className="group relative rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
              <div key={i} className="rounded-3xl border border-border bg-card/60 p-6 space-y-4">
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
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between">
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
            <div className="rounded-3xl border-2 border-primary bg-card p-6 flex flex-col justify-between relative shadow-xl transform scale-[1.03]">
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
            <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between">
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
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-muted-foreground">
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

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/20 py-12 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-foreground/80">
            <PawPrint className="h-5 w-5 text-primary" /> PetPal Inc.
          </div>
          <div className="flex gap-5 font-semibold">
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Clinics</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
          <p className="text-[11px] font-medium tracking-wider uppercase">© {new Date().getFullYear()} — Designed for happy companions 🐾</p>
        </div>
      </footer>

    </div>
  );
}
