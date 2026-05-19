import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchCart, type CartLine } from "@/lib/cart";
import { createNotification } from "@/lib/notify";
import { awardPoints } from "@/lib/loyalty";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Checkout /></AppShell></RequireAuth>),
});

function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [recipient, setRecipient] = useState(""); const [street, setStreet] = useState(""); const [city, setCity] = useState(""); const [postal, setPostal] = useState(""); const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"card" | "apple_pay" | "google_pay" | "cod">("card");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) fetchCart(user.id).then(setLines); }, [user]);
  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5;
  const total = subtotal + shipping;

  const place = async () => {
    if (!user || lines.length === 0) return;
    setLoading(true);
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id, payment_method: method, subtotal, shipping, total,
      shipping_address: { recipient, street, city, postal_code: postal, phone, country: "US" },
    }).select("id").single();
    if (error || !order) { setLoading(false); return toast.error(error?.message ?? "Failed"); }
    const items = lines.map((l) => ({ order_id: order.id, product_id: l.product_id, product_name: l.name, unit_price: l.unit_price, quantity: l.quantity }));
    await supabase.from("order_items").insert(items);
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    const earned = Math.floor(total);
    await Promise.all([
      createNotification({
        userId: user.id,
        title: "Order confirmed",
        body: `Your order of $${total.toFixed(2)} is being prepared. +${earned} pts earned!`,
        type: "order",
        link: "/orders",
      }),
      earned > 0
        ? awardPoints({ userId: user.id, points: earned, reason: `Order #${order.id.slice(0, 8)}`, orderId: order.id })
        : Promise.resolve(),
    ]);
    setLoading(false);
    toast.success("Order placed!");
    navigate({ to: "/orders" });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Checkout</h1>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Shipping address</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Recipient</Label><Input required value={recipient} onChange={(e) => setRecipient(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Street</Label><Input required value={street} onChange={(e) => setStreet(e.target.value)} /></div>
          <div><Label>City</Label><Input required value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div><Label>Postal code</Label><Input value={postal} onChange={(e) => setPostal(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </div>
      </section>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Payment method</h2>
        <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Credit / Debit card</SelectItem>
            <SelectItem value="apple_pay">Apple Pay</SelectItem>
            <SelectItem value="google_pay">Google Pay</SelectItem>
            <SelectItem value="cod">Cash on Delivery</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Demo flow — no real payment processed.</p>
      </section>
      <section className="space-y-2 rounded-2xl border border-border bg-card p-5 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
      </section>
      <Button className="w-full" disabled={loading || lines.length === 0} onClick={place}>{loading ? "Placing…" : `Place order · $${total.toFixed(2)}`}</Button>
    </div>
  );
}
