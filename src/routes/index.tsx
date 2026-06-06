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
  BookOpen,
  X,
  Minus,
  Plus,
  Trash2,
  Eye
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { EmergencyModal } from "@/components/EmergencyModal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  // Emergency & Cart Drawer States
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<{ id: string; name: string; price: number; quantity: number; img: string }[]>([]);

  // Contact States
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [sending, setSending] = useState(false);

  // Countdown timer states
  const [days, setDays] = useState(3);
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(44);
  const [seconds, setSeconds] = useState(59);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 0) return prev - 1;
        setMinutes((m) => {
          if (m > 0) return m - 1;
          setHours((h) => {
            if (h > 0) return h - 1;
            setDays((d) => {
              if (d > 0) return d - 1;
              clearInterval(timer);
              return 0;
            });
            return 23;
          });
          return 59;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (id: string, name: string, price: number, img: string) => {
    setCartItems((prev) => {
      const existing = prev.find((x) => x.id === id);
      if (existing) {
        return prev.map((x) => x.id === id ? { ...x, quantity: x.quantity + 1 } : x);
      }
      return [...prev, { id, name, price, quantity: 1, img }];
    });
    setCartOpen(true);
    toast.success(`${name} added to cart! 🐾`);
  };

  const handleUpdateQty = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((x) => x.id !== id));
    } else {
      setCartItems((prev) => prev.map((x) => x.id === id ? { ...x, quantity } : x));
    }
  };

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
    <div className="relative min-h-screen overflow-x-hidden selection:bg-[#4E1B33] selection:text-white font-sans bg-background">
      
      {/* Auto-Scrolling Marquee Promo Announcement Bar */}
      <div className="w-full bg-[#4E1B33] text-white py-2.5 overflow-hidden border-b border-white/10 relative z-50 shadow-md">
        <div className="animate-marquee whitespace-nowrap flex gap-16 text-[10px] sm:text-xs font-black uppercase tracking-wider">
          <span>🔥 SUMMER SALE - UP TO 50% OFF! USE CODE: <strong className="underline">SUMMER50</strong></span>
          <span>🚚 FREE SHIPPING ON ALL ORDERS OVER $75!</span>
          <span>🎁 GET 200 BONUS LOYALTY POINTS ON YOUR NEXT BOOKING!</span>
          <span>🔥 SUMMER SALE - UP TO 50% OFF! USE CODE: <strong className="underline">SUMMER50</strong></span>
          <span>🚚 FREE SHIPPING ON ALL ORDERS OVER $75!</span>
          <span>🎁 GET 200 BONUS LOYALTY POINTS ON YOUR NEXT BOOKING!</span>
        </div>
      </div>

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
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Open Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItems.reduce((acc, it) => acc + it.quantity, 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#4E1B33] text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-background">
                  {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
                </span>
              )}
            </button>
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

      {/* 1. IMMERSIVE HERO SECTION (Carousel) */}
      <section className="relative w-full h-[580px] md:h-[650px] overflow-hidden border-b border-border/20">
        <Carousel opts={{ loop: true }} className="w-full h-full">
          <CarouselContent className="h-full">
            {/* Slide 1 */}
            <CarouselItem className="relative w-full h-[580px] md:h-[650px] flex items-center justify-center text-center px-6">
              <img 
                src="/hero_cat.png" 
                alt="Luxury Cat" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[15000ms] hover:scale-110"
                style={{ objectPosition: "center 40%" }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#4E1B33]/80 via-[#4E1B33]/40 to-background/95 backdrop-blur-[2px]" />
              <div className="relative z-10 max-w-4xl space-y-6 animate-in fade-in zoom-in-95 duration-1000">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 shadow-lg border border-[#D4AF37]/20">
                  ✨ The Royal Treatment
                </span>
                <h1 className="font-display text-4xl sm:text-7xl font-black text-white tracking-tight leading-none">
                  Luxury Care <span className="block text-[#D4AF37]">For Felines</span>
                </h1>
                <p className="text-xs sm:text-base text-[#F5F5DC]/90 max-w-xl mx-auto font-semibold leading-relaxed">
                  Pamper your cat with our premium selection of velvet beds, diamond-studded collars, and organic treats.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <Link to="/signup" className="rounded-full bg-[#D4AF37] text-black hover:bg-[#F5F5DC] px-8 py-4 text-xs font-black uppercase tracking-wider shadow-2xl hover:scale-105 transition-all">
                    Shop Collection 🛍️
                  </Link>
                </div>
              </div>
            </CarouselItem>



            {/* Slide 3 */}
            <CarouselItem className="relative w-full h-[580px] md:h-[650px] flex items-center justify-center text-center px-6">
              <img 
                src="/matching_trio_outfit.png" 
                alt="Matching Outfits" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[15000ms] hover:scale-110"
                style={{ objectPosition: "center 82%" }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#4E1B33]/85 via-[#4E1B33]/40 to-background/95 backdrop-blur-[2px]" />
              <div className="relative z-10 max-w-4xl space-y-6 animate-in fade-in zoom-in-95 duration-1000">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#4E1B33] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 shadow-lg border border-white/20">
                  💖 Exclusive Coordinations
                </span>
                <h1 className="font-display text-4xl sm:text-7xl font-black text-white tracking-tight leading-none">
                  Matching <span className="block text-[#F5F5DC]">Elegance</span>
                </h1>
                <p className="text-xs sm:text-base text-[#FFF5F9]/90 max-w-xl mx-auto font-semibold leading-relaxed">
                  Step out in style with perfectly coordinated premium outfits for you and your best friend.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <Link to="/signup" className="rounded-full bg-[#4E1B33] text-white border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-8 py-4 text-xs font-black uppercase tracking-wider shadow-2xl hover:scale-105 transition-all">
                    Explore Looks ✨
                  </Link>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="left-4 bg-black/20 text-white border-white/20 hover:bg-black/50 hidden md:flex" />
          <CarouselNext className="right-4 bg-black/20 text-white border-white/20 hover:bg-black/50 hidden md:flex" />
        </Carousel>
      </section>

      {/* 2. ELEGANT DISCOUNT & COUNTDOWN TIMER BLOCK */}
      <section className="relative z-20 -mt-16 max-w-5xl mx-auto px-6">
        <div className="bg-card/95 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch">
          <div className="w-full md:w-5/12 h-56 md:h-auto relative overflow-hidden bg-primary/5">
             <img src="/scottish_fold.png" alt="Smiling Scottish Fold" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105" />
             <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-card/95" />
          </div>
          <div className="w-full md:w-7/12 flex flex-col md:flex-row items-center justify-between gap-6 p-8 text-center md:text-left relative z-10">
            <div className="space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 shadow-sm border border-accent/20">
                🔥 Special Offer
              </span>
              <h3 className="font-display text-4xl font-black text-[#4E1B33] dark:text-white leading-none">
                50% OFF <span className="block text-[#D4AF37]">Everything</span>
              </h3>
              <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto md:mx-0">
                Give your companion the luxury they deserve before the timer runs out!
              </p>
            </div>
            
            <div className="flex items-center gap-3.5 text-[#D4AF37] bg-secondary/30 p-4 rounded-3xl border border-border/50 shadow-inner">
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-light">{days < 10 ? `0${days}` : days}</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Days</span>
              </div>
              <span className="text-xl font-light mb-4 opacity-50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-light">{hours < 10 ? `0${hours}` : hours}</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Hours</span>
              </div>
              <span className="text-xl font-light mb-4 opacity-50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-light">{minutes < 10 ? `0${minutes}` : minutes}</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Mins</span>
              </div>
              <span className="text-xl font-light mb-4 opacity-50">:</span>
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-light text-primary">{seconds < 10 ? `0${seconds}` : seconds}</span>
                <span className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1">Secs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Stats */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Happy Pets", value: "10,000+", icon: "🐶", desc: "Registered companions" },
            { label: "Vet Rating", value: "4.9 ★", icon: "⭐", desc: "Top-tier healthcare" },
            { label: "Completed Orders", value: "5,000+", icon: "🛍️", desc: "Delivered fashion" },
            { label: "Partner Clinics", value: "250+", icon: "🏥", desc: "Trauma emergency network" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-card/40 border border-border/40 rounded-[2rem] p-5 shadow-sm hover-lift text-center backdrop-blur-sm">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <h3 className="text-2xl font-black text-[#4E1B33] dark:text-white leading-none">{stat.value}</h3>
              <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-wider">{stat.label}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-semibold">{stat.desc}</p>
            </div>
          ))}
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

      {/* Best Sellers Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 text-center space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">⚡ Hot Deals</span>
          <h2 className="font-display text-3xl font-extrabold text-foreground flex items-center justify-center gap-2">
            🔥 Best Sellers
          </h2>
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">
            High-converting luxury coordinates and hand-engraved jewelry tags.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto pt-4 text-left">
          {[
            {
              id: "best-1",
              name: "Pearl Neck Charm on Cat",
              desc: "Premium pearls worn by Oliver",
              price: 39.99,
              oldPrice: 79.99,
              discount: "50% OFF",
              img: "/cat_luxury_necklace.png"
            },
            {
              id: "best-2",
              name: "Matching Owner & Dog Cozy Hoodies",
              desc: "100% cotton coordinate set",
              price: 59.99,
              oldPrice: 119.99,
              discount: "50% OFF",
              img: "/matching_hoodies.png"
            },
            {
              id: "best-3",
              name: "Coordinated Cat & Owner Bandanas",
              desc: "Soft linen neckwear matching set",
              price: 24.99,
              oldPrice: 49.99,
              discount: "50% OFF",
              img: "/matching_bandanas.png"
            },
            {
              id: "best-4",
              name: "Luxury Soft Velvet Bed",
              desc: "Orthopedic memory foam mattress",
              price: 49.99,
              oldPrice: 99.99,
              discount: "50% OFF",
              img: "/luxury_pet_bed.png"
            }
          ].map((prod) => (
            <div key={prod.id} className="group overflow-hidden rounded-[2.2rem] bg-card border border-border/40 hover:border-[#D4AF37]/50 hover:shadow-2xl transition-all duration-700 flex flex-col justify-between hover:-translate-y-2">
              <div className="p-3.5 space-y-4">
                <div className="relative overflow-hidden rounded-[1.6rem] bg-neutral-100 dark:bg-neutral-900 aspect-square flex items-center justify-center">
                  <img 
                    src={prod.img} 
                    alt={prod.name} 
                    className="w-[85%] h-[85%] object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-xl" 
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="text-[9px] uppercase font-black tracking-widest bg-accent text-accent-foreground px-2.5 py-1 rounded-full shadow-md">
                      {prod.discount}
                    </span>
                  </div>
                  {/* Quick View Button */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-black p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#D4AF37] hover:text-white cursor-pointer z-10">
                        <Eye className="h-4 w-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="font-display text-2xl">{prod.name}</DialogTitle>
                        <DialogDescription>
                          {prod.desc}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4 py-4">
                        <img src={prod.img} alt={prod.name} className="w-48 h-48 object-contain drop-shadow-2xl" />
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-primary">${prod.price.toFixed(2)}</span>
                          <span className="text-lg font-semibold text-muted-foreground line-through">${prod.oldPrice.toFixed(2)}</span>
                        </div>
                        <Button 
                          onClick={() => handleAddToCart(prod.id, prod.name, prod.price, prod.img)}
                          className="w-full bg-[#4E1B33] text-white hover:bg-[#D4AF37] hover:text-black font-bold py-6 text-lg rounded-xl transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="mr-2 h-5 w-5" /> Add To Cart
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-1.5 px-1 text-center">
                  <h3 className="font-display font-bold text-lg text-foreground leading-tight group-hover:text-[#D4AF37] transition-colors truncate">
                    {prod.name}
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{prod.desc}</p>
                  <div className="flex items-baseline justify-center gap-2 pt-1">
                    <span className="text-xl font-black text-primary">${prod.price.toFixed(2)}</span>
                    <span className="text-xs font-semibold text-muted-foreground line-through">${prod.oldPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="p-3.5 pt-0 space-y-2">
                <button 
                  onClick={() => handleAddToCart(prod.id, prod.name, prod.price, prod.img)}
                  className="w-full rounded-2xl py-4 font-black uppercase tracking-wider text-[10px] bg-[#4E1B33] text-white hover:bg-[#D4AF37] hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" /> Quick Add
                </button>
                <div className="flex items-center justify-center gap-3 pt-1 text-[8px] font-bold text-muted-foreground uppercase">
                  <span className="flex items-center gap-0.5"><Shield className="h-3 w-3 text-[#D4AF37]"/> Secure</span>
                  <span className="flex items-center gap-0.5"><Check className="h-3 w-3 text-[#D4AF37]"/> Free Ship</span>
                </div>
              </div>
            </div>
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
            { name: "Oliver", breed: "British Shorthair", age: "1 year", img: "/oliver.jpg" },
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

      {/* 4. RECENT COMMUNITY POSTS (#PetPalCommunity Feed) */}
      <section className="mx-auto max-w-7xl px-6 py-16 space-y-8 text-center">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Instagram for Pets</span>
          <h2 className="font-display text-3xl font-extrabold text-foreground">#PetPalCommunity</h2>
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">See how members are styling and caring for their animal companions on our social boards.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            "/matching_coordinates.png",
            "/matching_knitwear.png",
            "/matching_pajamas.png",
            "/custom_name_tag.png",
            "/personalized_collar.png",
            "/crystal_cat_bowl.png",
            "/pet_hotel.png",
            "/pet_grooming.png"
          ].map((img, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-3xl border border-border/40 bg-muted hover-lift shadow-sm">
              <img src={img} alt={`Community Feed ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[#4E1B33]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5 pointer-events-none">
                ❤️ Like & Share
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Directory */}
      <section className="mx-auto max-w-7xl px-6 py-10 border-t border-border/25">
        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 text-center mb-6">Featured Partners & Brands</p>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all">
          {["ROYAL CANIN", "PURINA", "HILL'S", "WHISKAS", "PEDIGREE"].map((brand) => (
            <span key={brand} className="font-display text-lg sm:text-2xl font-black tracking-widest text-[#4E1B33] dark:text-[#EBC4D8] pointer-events-none">
              {brand}
            </span>
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
            <p className="text-xs sm:text-sm text-muted-foreground/70">Read what members of the PetPal family say about our products and care services.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                role: "Dog Mom (Buddy's Owner)",
                rating: 5,
                avatar: "👩",
                petAvatar: "🐶",
                quote: "PetPal changed my life. My dog Buddy absolutely loves the grooming service. Every coordinate set we bought fits perfectly and looks incredible in photos!"
              },
              {
                name: "Michael Adams",
                role: "Cat Dad (Oliver's Owner)",
                rating: 5,
                avatar: "👨",
                petAvatar: "🐱",
                quote: "Best pet products I've ever purchased. The luxury cat necklaces and engraved tags are premium grade, and the AI Vet chat helped us sort out diet issues instantly."
              }
            ].map((t, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card/60 p-6 space-y-4 hover-lift">
                <div className="flex text-amber-400 gap-0.5">
                  {Array.from({ length: t.rating }).map((_, r) => (
                    <Star key={r} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/95 leading-relaxed italic">"{t.quote}"</p>
                <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg border border-primary/20">
                      {t.avatar}
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-[#4E1B33] dark:text-[#FFF5F9]">{t.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <span className="text-xl">{t.petAvatar}</span>
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

      {/* Newsletter Signup */}
      <section className="bg-gradient-to-b from-background to-secondary/30 py-20 border-t border-border/25 text-center">
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
            <Input required type="email" placeholder="Enter your email address" className="rounded-full py-6 px-5" />
            <Button type="submit" className="rounded-full bg-[#4E1B33] text-white hover:bg-[#4E1B33]/90 font-black py-6 px-8 uppercase tracking-wider text-xs cursor-pointer">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* Sliding Cart Drawer (Logged Out experience) */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setCartOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-[#FFF5F9] dark:bg-[#1A0B13] h-full shadow-2xl flex flex-col z-10 border-l border-border animate-in slide-in-from-right duration-300 text-left">
            <div className="flex items-center justify-between p-5 border-b border-border bg-[#4E1B33] text-white">
              <h3 className="font-display text-lg font-black flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-accent animate-pulse" /> Shopping Cart
              </h3>
              <button 
                onClick={() => setCartOpen(false)}
                className="text-white/80 hover:text-white rounded-full p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/35" />
                  <p className="text-sm font-semibold">Your cart is currently empty.</p>
                  <Button onClick={() => setCartOpen(false)} variant="outline" className="rounded-full text-xs font-bold px-5 py-4 border-border/80 hover:bg-[#4E1B33]/5">
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-2xl border border-border bg-card/60 p-3 items-center hover:shadow-md transition-shadow">
                    <img src={item.img} alt={item.name} className="h-14 w-14 rounded-xl object-cover border border-border/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] font-black text-primary mt-0.5">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 border border-border/60 rounded-full px-2 py-0.5 bg-background shrink-0">
                      <button 
                        onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                        className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-black">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleUpdateQty(item.id, 0)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-border bg-card/40 space-y-4">
                <div className="flex items-center justify-between text-sm font-bold text-foreground">
                  <span>Subtotal</span>
                  <span className="text-lg font-black text-primary">${cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0).toFixed(2)}</span>
                </div>
                <div className="grid gap-2">
                  <Button 
                    onClick={() => {
                      setCartOpen(false);
                      navigate({ to: "/signup" });
                    }}
                    className="w-full py-6 font-black uppercase tracking-wider rounded-full shadow-lg bg-[#4E1B33] text-white hover:bg-[#4E1B33]/90 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    Register to Checkout
                  </Button>
                  <Button 
                    onClick={() => setCartOpen(false)} 
                    variant="outline" 
                    className="w-full py-6 font-black uppercase tracking-wider rounded-full border-border/80 hover:bg-[#4E1B33]/5 cursor-pointer"
                  >
                    Keep Shopping
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Emergency Dialog */}
      <EmergencyModal open={emergencyOpen} onOpenChange={setEmergencyOpen} />

    </div>
  );
}
