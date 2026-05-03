import { supabase } from "@/integrations/supabase/client";

export interface CartLine {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  image_url: string | null;
  stock: number;
}

export async function fetchCart(userId: string): Promise<CartLine[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity, products(name, price, image_url, stock)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    // products is a single relation
    const p = row.products as unknown as { name: string; price: number; image_url: string | null; stock: number } | null;
    return {
      product_id: row.product_id,
      name: p?.name ?? "",
      unit_price: Number(p?.price ?? 0),
      image_url: p?.image_url ?? null,
      stock: Number(p?.stock ?? 0),
      quantity: row.quantity,
    };
  });
}

export async function addToCart(userId: string, productId: string, qty = 1) {
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({ user_id: userId, product_id: productId, quantity: qty });
  }
}

export async function setCartQuantity(userId: string, productId: string, quantity: number) {
  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
  } else {
    await supabase.from("cart_items").update({ quantity }).eq("user_id", userId).eq("product_id", productId);
  }
}
