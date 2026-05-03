import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

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

  const filtered = products.filter((p) =>
    (!selectedCat || p.category_id === selectedCat) &&
    (!q || p.name.toLowerCase().includes(q.toLowerCase()))
  );

  const add = async (id: string) => {
    if (!user) return;
    await addToCart(user.id, id);
    toast.success("Added to cart");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Shop</h1>
        <Link to="/cart"><Button variant="outline" size="sm"><ShoppingCart className="mr-1 h-4 w-4" /> Cart</Button></Link>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="pl-9" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedCat(null)} className={`rounded-full border px-3 py-1.5 text-sm ${!selectedCat ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"}`}>All</button>
        {cats.map((c) => (
          <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`rounded-full border px-3 py-1.5 text-sm ${selectedCat === c.id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"}`}>{c.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-3">
            {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" width={400} height={400} className="aspect-square w-full rounded-xl object-cover" />}
            <p className="mt-3 line-clamp-1 text-sm font-medium">{p.name}</p>
            <p className="text-sm text-muted-foreground">${Number(p.price).toFixed(2)}</p>
            <Button size="sm" className="mt-2 w-full" onClick={() => add(p.id)}>Add to cart</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
