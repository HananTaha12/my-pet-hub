import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero.jpg";
import { Search, ShoppingCart, Plus, Heart } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { ReviewDialog } from "@/components/ReviewDialog";
import { addToCart } from "@/lib/cart";
import { listFavoriteIds, toggleFavorite } from "@/lib/favorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from "@/lib/mock-products";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Shop — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Shop /></AppShell></RequireAuth>),
});

interface Cat { id: string; name: string; slug: string }
interface Product { id: string; name: string; description: string | null; price: number; image_url: string | null; category_id: string | null; species: string | null }
interface RatingAgg { product_id: string; avg: number; count: number }

function Shop() {
  const { user } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Map<string, RatingAgg>>(new Map());
  const [reviewing, setReviewing] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // Carousel & Species Filter states
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  const BANNERS = [
    {
      badge: "Campaign 💉",
      title: "Vaccination Campaign",
      subtitle: "Protect your companion! Book now to get 15% discount on all active immunization boosters.",
      btnText: "Book Appointment",
      to: "/book",
      img: "https://images.unsplash.com/photo-1581888227599-779811939961?w=800&auto=format&fit=crop&q=80"
    },
    {
      badge: "Seasonal ☀️",
      title: "Summer Pet Care",
      subtitle: "Keep cool and hydrated! Explore premium pools, cooling mats, and travel crates.",
      btnText: "Explore Shop",
      to: "/shop",
      img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=80"
    },
    {
      badge: "Triage 🚨",
      title: "Emergency Tips & Support",
      subtitle: "Be prepared. Access 24/7 maps of open vet clinics and diagnostic triage.",
      btnText: "Open Emergency Map",
      to: "/map",
      img: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&auto=format&fit=crop&q=80"
    },
    {
      badge: "New Arrival ✨",
      title: "Cozy Premium Arrivals",
      subtitle: "Browse the latest arrival of organic salmon recipes and luxury velvet beds.",
      btnText: "Browse Supplies",
      to: "/shop",
      img: "https://images.unsplash.com/photo-1535268647977-a403b69fc756?w=800&auto=format&fit=crop&q=80"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(prev => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const loadRatings = async () => {
    const { data } = await supabase.from("product_reviews").select("product_id, rating");
    const map = new Map<string, { sum: number; count: number }>();
    (data ?? []).forEach((r) => {
      const m = map.get(r.product_id) ?? { sum: 0, count: 0 };
      m.sum += r.rating; m.count += 1;
      map.set(r.product_id, m);
    });
    const agg = new Map<string, RatingAgg>();
    map.forEach((v, k) => agg.set(k, { product_id: k, avg: v.sum / v.count, count: v.count }));
    setRatings(agg);
  };

  const loadCartCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    setCartCount(count ?? 0);
  };

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("product_categories").select("*").order("display_order"),
        supabase.from("products").select("*").eq("active", true).order("featured", { ascending: false }),
      ]);
      
      const catsList = (c && c.length > 0) ? c : DEFAULT_CATEGORIES;
      
      const categorySlugToIdMap: Record<string, string> = {};
      catsList.forEach(cat => {
        categorySlugToIdMap[cat.slug.toLowerCase()] = cat.id;
      });

      const dbProducts = p ?? [];
      const mergedProducts = [...dbProducts];
      
      DEFAULT_PRODUCTS.forEach(mockProd => {
        const exists = dbProducts.some(dbProd => 
          dbProd.name.toLowerCase() === mockProd.name.toLowerCase() ||
          dbProd.id === mockProd.id
        );
        if (!exists) {
          const mockCat = DEFAULT_CATEGORIES.find(cat => cat.id === mockProd.category_id);
          const activeCategoryId = mockCat ? (categorySlugToIdMap[mockCat.slug.toLowerCase()] || categorySlugToIdMap[mockCat.name.toLowerCase()]) : null;

          mergedProducts.push({
            ...mockProd,
            category_id: activeCategoryId || mockProd.category_id
          });
        }
      });

      setCats(catsList as Cat[]);
      setProducts(mergedProducts as Product[]);
      loadRatings();
    })();
  }, []);

  useEffect(() => {
    if (user) {
      listFavoriteIds(user.id).then(setFavs);
      loadCartCount();
    }
  }, [user]);

  const filtered = products.filter((p) => {
    const matchesCat = !selectedCat || p.category_id === selectedCat;
    const matchesSpecies = !selectedSpecies || 
      (p.species && (p.species.toLowerCase() === selectedSpecies.toLowerCase() || p.species.toLowerCase() === "all"));
    const matchesSearch = !q || 
      p.name.toLowerCase().includes(q.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(q.toLowerCase()));
    return matchesCat && matchesSpecies && matchesSearch;
  });

  const add = async (id: string) => {
    if (!user) return;
    await addToCart(user.id, id);
    toast.success("Added to cart");
    loadCartCount();
  };

  const fav = async (id: string) => {
    if (!user) return;
    const isFav = favs.has(id);
    await toggleFavorite(user.id, id, isFav);
    const next = new Set(favs);
    if (isFav) next.delete(id); else next.add(id);
    setFavs(next);
  };

  return (
    <div className="space-y-8 pb-12 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Premium supplies for your companions</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/favorites">
            <Button variant="outline" size="lg" className="rounded-2xl border-none bg-secondary/50 hover:bg-foreground hover:text-background px-4 py-2">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/cart">
            <Button variant="outline" size="lg" className="rounded-2xl border-none bg-secondary/50 hover:bg-foreground hover:text-background transition-all duration-300">
              <ShoppingCart className="mr-2 h-5 w-5" />
              <span className="font-semibold">Cart</span>
              {cartCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow animate-pulse">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. LARGE PROMOTIONAL CAROUSEL BANNER */}
      <div className="relative h-56 md:h-72 w-full overflow-hidden rounded-[2.5rem] bg-muted shadow-lg group/carousel">
        {BANNERS.map((b, idx) => (
          <div 
            key={idx}
            className={cn(
              "absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out flex flex-col justify-end p-6 md:p-10 text-white text-left",
              slide === idx ? "opacity-100 scale-100 z-10 animate-in fade-in zoom-in-95 duration-500" : "opacity-0 scale-95 pointer-events-none z-0"
            )}
          >
            <img 
              src={b.img} 
              alt={b.title} 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-linear scale-105 group-hover/carousel:scale-100" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 space-y-2 md:space-y-3 max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-700">
              <span className="inline-flex rounded-full bg-primary/20 backdrop-blur-md px-3 py-1 text-[9px] font-black uppercase tracking-wider text-primary border border-primary/30 w-max">
                {b.badge}
              </span>
              <h2 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                {b.title}
              </h2>
              <p className="text-white/80 text-[10px] md:text-xs font-semibold leading-relaxed">
                {b.subtitle}
              </p>
              <Button asChild size="sm" className="rounded-full bg-primary text-white font-bold hover:scale-105 transition-transform w-max">
                <Link to={b.to}>{b.btnText}</Link>
              </Button>
            </div>
          </div>
        ))}
        
        {/* Dots navigation indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                slide === idx ? "w-6 bg-primary" : "w-2 bg-white/40 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2. SHOP BY PET (Circular Categories) */}
      <div className="space-y-3 text-left animate-in fade-in duration-500">
        <h3 className="font-display text-lg font-bold text-foreground">Shop by Pet</h3>
        <div className="flex flex-wrap gap-4 items-center justify-start">
          {[
            { id: null, label: "All Pets", emoji: "🐾", img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=120&auto=format&fit=crop&q=60" },
            { id: "dog", label: "Dogs", emoji: "🐶", img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=120&auto=format&fit=crop&q=60" },
            { id: "cat", label: "Cats", emoji: "🐱", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120&auto=format&fit=crop&q=60" },
            { id: "bird", label: "Birds", emoji: "🐦", img: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=120&auto=format&fit=crop&q=60" },
            { id: "rabbit", label: "Rabbits", emoji: "🐰", img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=120&auto=format&fit=crop&q=60" },
            { id: "fish", label: "Fish", emoji: "🐠", img: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=120&auto=format&fit=crop&q=60" }
          ].map((pet) => (
            <button
              key={pet.label}
              onClick={() => setSelectedSpecies(pet.id)}
              className={cn(
                "flex flex-col items-center gap-2 group transition-all duration-300",
                selectedSpecies === pet.id ? "scale-105" : "opacity-80 hover:opacity-100"
              )}
            >
              <div className={cn(
                "relative h-16 w-16 md:h-20 md:w-20 overflow-hidden rounded-full border-2 transition-all duration-500 shadow-md group-hover:shadow-lg group-hover:scale-110",
                selectedSpecies === pet.id 
                  ? "border-primary ring-2 ring-primary/20 scale-105" 
                  : "border-border/60 hover:border-primary/50"
              )}>
                <img 
                  src={pet.img} 
                  alt={pet.label} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
              <span className={cn(
                "text-[10px] md:text-xs font-black tracking-wide",
                selectedSpecies === pet.id ? "text-primary font-black" : "text-muted-foreground"
              )}>
                {pet.emoji} {pet.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 -z-10 rounded-full bg-accent/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for food, toys, accessories…"
          className="h-14 rounded-full border-none bg-secondary/50 pl-12 text-sm focus-visible:ring-accent shadow-inner"
        />
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        <button
          onClick={() => setSelectedCat(null)}
          className={cn(
            "rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300",
            !selectedCat ? "bg-foreground text-background shadow-lg" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
          )}
        >
          All
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={cn(
              "rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300",
              selectedCat === c.id ? "bg-foreground text-background shadow-lg" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => {
          const isFav = favs.has(p.id);
          const r = ratings.get(p.id);
          return (
            <div key={p.id} className="group relative rounded-[2.5rem] glass-card p-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl flex flex-col justify-between">
              <div>
                <button
                  onClick={() => fav(p.id)}
                  aria-label="Toggle favorite"
                  className="absolute top-6 right-6 z-10 rounded-full bg-background/80 p-2 backdrop-blur transition-all hover:scale-110"
                >
                  <Heart className={cn("h-4 w-4 transition-colors", isFav ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                </button>
                <div className="relative overflow-hidden rounded-[1.8rem]">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      width={400}
                      height={400}
                      className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex aspect-square w-full h-full items-center justify-center bg-secondary/50 text-7xl">
                      {(() => {
                        const name = p.name.toLowerCase();
                        if (name.includes("cat")) return "🐱";
                        if (name.includes("dog")) return "🐶";
                        if (name.includes("bird")) return "🐦";
                        if (name.includes("rabbit")) return "🐰";
                        if (name.includes("fish")) return "🐟";
                        if (name.includes("reptile")) return "🦎";
                        if (name.includes("hamster")) return "🐹";
                        if (name.includes("bedding")) return "🛏️";
                        if (name.includes("food")) return "🍽️";
                        if (name.includes("toy")) return "🧸";
                        return <img src={heroImg} alt="product" className="w-2/3 h-2/3 object-contain opacity-60" />;
                      })()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <button
                    onClick={() => add(p.id)}
                    className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-white text-black shadow-xl opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-90"
                  >
                    <Plus className="m-auto h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 px-1">
                  <p className="line-clamp-1 text-sm font-bold tracking-tight">{p.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm font-bold text-accent">${Number(p.price).toFixed(2)}</p>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">{p.species === 'all' ? 'Universal' : p.species}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 px-1 border-t border-border/20 pt-2">
                <button
                  onClick={() => setReviewing(p)}
                  className="flex items-center gap-1.5 text-left w-full"
                  aria-label="Reviews"
                >
                  <StarRating value={r?.avg ?? 0} size="xs" />
                  <span className="text-[10px] text-muted-foreground">
                    {r ? `${r.avg.toFixed(1)} (${r.count})` : "Review Product"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {reviewing && (
        <ReviewDialog
          productId={reviewing.id}
          productName={reviewing.name}
          open={!!reviewing}
          onOpenChange={(o) => !o && setReviewing(null)}
          onSaved={loadRatings}
        />
      )}
    </div>
  );
}
