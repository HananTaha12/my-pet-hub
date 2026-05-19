import { supabase } from "@/integrations/supabase/client";

export async function createNotification(opts: {
  userId: string;
  title: string;
  body?: string;
  type?: "info" | "success" | "warning" | "order" | "appointment" | "reminder";
  link?: string;
}) {
  return supabase.from("notifications").insert({
    user_id: opts.userId,
    title: opts.title,
    body: opts.body ?? null,
    type: opts.type ?? "info",
    link: opts.link ?? null,
  });
}
