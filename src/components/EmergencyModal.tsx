import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertOctagon, Phone, MapPin, ShieldAlert, Heart, Thermometer, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface EmergencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmergencyModal({ open, onOpenChange }: EmergencyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 border-destructive/20 bg-card shadow-2xl">
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-border pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive animate-pulse">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="font-display text-2xl font-bold text-destructive">
              Emergency Support
            </DialogTitle>
            <p className="text-xs text-muted-foreground">Immediate assistance for your companion</p>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Hotline Card */}
          <div className="rounded-2xl bg-destructive/5 border border-destructive/10 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive/80">24/7 Veterinary Hotline</p>
            <a 
              href="tel:18005550911" 
              className="mt-2 inline-flex items-center gap-2 font-display text-2xl font-bold text-destructive hover:scale-105 active:scale-95 transition-transform"
            >
              <Phone className="h-6 w-6 fill-current animate-bounce" /> (800) 555-0911
            </a>
            <p className="mt-1 text-[10px] text-muted-foreground">Free consultation for registered PetPal members</p>
          </div>

          {/* Near Clinics */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Nearest 24/7 Clinics
            </h3>
            <div className="space-y-2">
              <div className="rounded-xl border border-border bg-secondary/30 p-3 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold">PetPal Downtown Emergency Clinic</p>
                  <p className="text-muted-foreground text-[10px]">245 Market St, San Francisco, CA</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg px-2" asChild>
                  <Link to="/map" onClick={() => onOpenChange(false)}>Map</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* First Aid Tips */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> First Aid Quick Guide
            </h3>
            
            <div className="grid gap-2 text-xs">
              <div className="rounded-xl border border-border/50 p-3 space-y-1 bg-card">
                <p className="font-semibold flex items-center gap-1.5 text-orange-600"><Heart className="h-3.5 w-3.5" /> CPR (Dogs & Cats)</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Lay pet on right side. Compress chest 100-120 times/min (30 compressions to 2 rescue breaths).
                </p>
              </div>

              <div className="rounded-xl border border-border/50 p-3 space-y-1 bg-card">
                <p className="font-semibold flex items-center gap-1.5 text-orange-600"><Info className="h-3.5 w-3.5" /> Poisoning & Toxicity</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Do not induce vomiting unless instructed by a vet. Keep package of the substance ingested.
                </p>
              </div>

              <div className="rounded-xl border border-border/50 p-3 space-y-1 bg-card">
                <p className="font-semibold flex items-center gap-1.5 text-orange-600"><Thermometer className="h-3.5 w-3.5" /> Heatstroke</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Move pet to cool area immediately. Apply cool (not ice-cold) wet towels to head, neck, and chest.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button className="flex-1 rounded-xl bg-destructive hover:bg-destructive/95 text-destructive-foreground" asChild>
            <Link to="/map" onClick={() => onOpenChange(false)}>
              Locate Clinic
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
