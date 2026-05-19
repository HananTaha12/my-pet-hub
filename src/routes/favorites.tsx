import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { addToCart } from "@/lib/cart";
import { toggleFavorite } from "@/lib/favorites";
import { toast } from "sonner";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Favorites /></AppShell></RequireAuth>),
});

interface Product { id: string; name: string; price: number; image_url: string | null; species: string | null }

function Favorites() {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("product:product_id(id, name, price, image_url, species)")
      .eq("user_id", user.id);
    setItems((data ?? []).map((r: { product: Product | null }) => r.product).filter(Boolean) as Product[]);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    if (!user) return;
    await toggleFavorite(user.id, id, true);
    toast.success("Removed from favorites");
    load();
  };

  const add = async (id: string) => {
    if (!user) return;
    await addToCart(user.id, id);
    toast.success("Added to cart");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-sm text-muted-foreground">Products you've saved for later</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-[2rem] glass-card p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">No favorites yet.</p>
          <Link to="/shop" className="mt-4 inline-block rounded-full bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-widest text-background">
            Browse shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p.id} className="group relative rounded-[2rem] glass-card p-4 transition-all hover:shadow-xl">
              <button
                onClick={() => remove(p.id)}
                aria-label="Remove favorite"
                className="absolute top-6 right-6 z-10 rounded-full bg-background/80 p-2 backdrop-blur"
              >
                <Heart className="h-4 w-4 fill-destructive text-destructive" />
              </button>
              <div className="overflow-hidden rounded-[1.5rem] bg-secondary/50">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}
              </div>
              <p className="mt-3 line-clamp-1 text-sm font-bold">{p.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm font-bold text-accent">${Number(p.price).toFixed(2)}</p>
                <button onClick={() => add(p.id)} className="rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background hover:opacity-90">
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
