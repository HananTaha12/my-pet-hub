import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function ReviewDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSaved,
}: {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("product_reviews")
      .select("rating, comment")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRating(data.rating);
          setComment(data.comment ?? "");
        } else {
          setRating(5);
          setComment("");
        }
      });
  }, [open, user, productId]);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("product_reviews").upsert(
      { user_id: user.id, product_id: productId, rating, comment: comment.trim() || null },
      { onConflict: "user_id,product_id" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Review saved");
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-2">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <p className="text-xs text-muted-foreground">Tap to rate</p>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share what you and your pet thought…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save review"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
