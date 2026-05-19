import { supabase } from "@/integrations/supabase/client";

export async function awardPoints(opts: {
  userId: string;
  points: number;
  reason: string;
  orderId?: string;
  appointmentId?: string;
}) {
  await supabase.from("loyalty_transactions").insert({
    user_id: opts.userId,
    points: opts.points,
    reason: opts.reason,
    order_id: opts.orderId ?? null,
    appointment_id: opts.appointmentId ?? null,
  });
}

export async function fetchPointsBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from("loyalty_transactions")
    .select("points")
    .eq("user_id", userId);
  return (data ?? []).reduce((s, r) => s + (r.points ?? 0), 0);
}

export async function fetchPointsHistory(userId: string) {
  const { data } = await supabase
    .from("loyalty_transactions")
    .select("id, points, reason, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export function tierFor(points: number) {
  if (points >= 1000) return { name: "Platinum", next: null, color: "from-zinc-400 to-zinc-200" };
  if (points >= 500) return { name: "Gold", next: 1000, color: "from-amber-500 to-yellow-300" };
  if (points >= 200) return { name: "Silver", next: 500, color: "from-slate-400 to-slate-200" };
  return { name: "Bronze", next: 200, color: "from-orange-700 to-amber-500" };
}
