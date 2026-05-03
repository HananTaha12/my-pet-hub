import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { fetchCart, setCartQuantity, type CartLine } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Cart /></AppShell></RequireAuth>),
});

function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<CartLine[]>([]);
  const load = async () => { if (user) setLines(await fetchCart(user.id)); };
  useEffect(() => { load(); }, [user]);

  const update = async (pid: string, q: number) => { if (user) { await setCartQuantity(user.id, pid, q); load(); } };
  const total = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Cart</h1>
      {lines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Your cart is empty. <Link to="/shop" className="font-medium text-foreground underline-offset-4 hover:underline">Shop now</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {lines.map((l) => (
              <div key={l.product_id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                {l.image_url && <img src={l.image_url} alt={l.name} loading="lazy" width={80} height={80} className="h-16 w-16 rounded-lg object-cover" />}
                <div className="flex-1">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-sm text-muted-foreground">${l.unit_price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => update(l.product_id, l.quantity - 1)}>-</Button>
                  <span className="w-6 text-center text-sm">{l.quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => update(l.product_id, l.quantity + 1)}>+</Button>
                  <button onClick={() => update(l.product_id, 0)} className="ml-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-xl font-semibold">${total.toFixed(2)}</span>
          </div>
          <Button onClick={() => navigate({ to: "/checkout" })} className="w-full">Checkout</Button>
        </>
      )}
    </div>
  );
}
