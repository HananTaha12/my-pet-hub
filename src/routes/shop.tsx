import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShoppingCart, Plus } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Shop — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Shop /></AppShell></RequireAuth>),
});

interface Cat { id: string; name: string; slug: string }
interface Product { id: string; name: string; description: string | null; price: number; image_url: string | null; category_id: string | null; species: string | null }

function Shop() {
  const { user } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("product_categories").select("*").order("display_order"),
        supabase.from("products").select("*").eq("active", true).order("featured", { ascending: false }),
      ]);
      setCats((c ?? []) as Cat[]);
      setProducts((p ?? []) as Product[]);
    })();
  }, []);

  const filtered = products.filter((p: Product) =>
    (!selectedCat || p.category_id === selectedCat) &&
    (!q || p.name.toLowerCase().includes(q.toLowerCase()))
  );

  const add = async (id: string) => {
    if (!user) return;
    await addToCart(user.id, id);
    toast.success("Added to cart");
  };

  return (
    <div className="space-y-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Shop</h1>
          <p className="text-sm text-muted-foreground">Premium supplies for your companions</p>
        </div>
        <Link to="/cart">
          <Button variant="outline" size="lg" className="rounded-2xl border-none bg-secondary/50 hover:bg-foreground hover:text-background transition-all duration-300">
            <ShoppingCart className="mr-2 h-5 w-5" /> 
            <span className="font-semibold">Cart</span>
          </Button>
        </Link>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 -z-10 rounded-full bg-accent/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent" />
        <Input 
          value={q} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} 
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
        {cats.map((c: Cat) => (
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
        {filtered.map((p: Product) => (
          <div key={p.id} className="group relative rounded-[2.5rem] glass-card p-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
            <div className="relative overflow-hidden rounded-[1.8rem]">
              {p.image_url && (
                <img 
                  src={p.image_url} 
                  alt={p.name} 
                  loading="lazy" 
                  width={400} 
                  height={400} 
                  className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
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
        ))}
      </div>
    </div>
  );
}
