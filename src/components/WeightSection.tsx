import { useEffect, useState, type FormEvent } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface WeightRow { id: string; weight_kg: number; recorded_on: string; notes: string | null }

export function WeightSection({ petId, petName }: { petId: string; petName: string }) {
  const [rows, setRows] = useState<WeightRow[]>([]);
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("weight_records")
      .select("*")
      .eq("pet_id", petId)
      .order("recorded_on", { ascending: true });
    setRows((data ?? []) as WeightRow[]);
  };

  useEffect(() => { load(); }, [petId]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0) return toast.error("Enter a valid weight");
    const { error } = await supabase.from("weight_records").insert({
      pet_id: petId, weight_kg: w, recorded_on: date, notes: notes || null,
    });
    if (error) return toast.error(error.message);
    await supabase.from("pets").update({ weight_kg: w }).eq("id", petId);
    setOpen(false); setWeight(""); setNotes("");
    load();
    toast.success("Weight saved");
  };

  const data = rows.map((r) => ({
    date: new Date(r.recorded_on).toLocaleDateString([], { month: "short", day: "numeric" }),
    weight: Number(r.weight_kg),
  }));

  const current = rows[rows.length - 1]?.weight_kg;
  const prev = rows[rows.length - 2]?.weight_kg;
  const diff = current && prev ? Number(current) - Number(prev) : 0;
  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = diff > 0 ? "text-orange-500" : diff < 0 ? "text-blue-500" : "text-muted-foreground";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Scale className="h-5 w-5 text-accent" /> Weight
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record weight for {petName}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div><Label>Weight (kg)</Label><Input type="number" step="0.1" min="0" required value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
              <div><Label>Date</Label><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label>Notes (optional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. after meal" /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No weight records yet.</p>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Current</p>
              <p className="font-display text-3xl font-semibold">{Number(current).toFixed(1)} kg</p>
            </div>
            {prev && (
              <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                {diff > 0 ? "+" : ""}{diff.toFixed(1)} kg
              </div>
            )}
          </div>
          {data.length >= 2 && (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.75rem",
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-accent)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
