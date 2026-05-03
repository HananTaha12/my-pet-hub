import { supabase } from "@/integrations/supabase/client";

export async function generateRemindersForPet(userId: string, petId: string) {
  const [{ data: vacc }, { data: treat }] = await Promise.all([
    supabase.from("vaccination_records").select("id, vaccine_name, next_due_on").eq("pet_id", petId).not("next_due_on", "is", null),
    supabase.from("treatment_records").select("id, treatment_type, next_due_on").eq("pet_id", petId).not("next_due_on", "is", null),
  ]);

  const rows: Array<{ user_id: string; pet_id: string; type: "vaccination" | "treatment"; title: string; due_at: string }> = [];
  for (const v of vacc ?? []) {
    if (v.next_due_on) rows.push({ user_id: userId, pet_id: petId, type: "vaccination", title: `${v.vaccine_name} due`, due_at: new Date(v.next_due_on).toISOString() });
  }
  for (const t of treat ?? []) {
    if (t.next_due_on) rows.push({ user_id: userId, pet_id: petId, type: "treatment", title: `${t.treatment_type} due`, due_at: new Date(t.next_due_on).toISOString() });
  }

  if (rows.length === 0) return;

  // Avoid duplicates: delete existing pending generated reminders for this pet, then re-insert
  await supabase.from("reminders").delete().eq("pet_id", petId).in("type", ["vaccination", "treatment"]).eq("status", "pending");
  await supabase.from("reminders").insert(rows);
}
