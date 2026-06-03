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
    const matchesSearch = !q || 
      p.name.toLowerCase().includes(q.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(q.toLowerCase())) ||
      (p.species && p.species.toLowerCase().includes(q.toLowerCase()));
    return matchesCat && matchesSearch;
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
