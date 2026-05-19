import { supabase } from "@/integrations/supabase/client";

export async function listFavoriteIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("favorites").select("product_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.product_id as string));
}

export async function toggleFavorite(userId: string, productId: string, isFav: boolean) {
  if (isFav) {
    return supabase.from("favorites").delete().eq("user_id", userId).eq("product_id", productId);
  }
  return supabase.from("favorites").insert({ user_id: userId, product_id: productId });
}
