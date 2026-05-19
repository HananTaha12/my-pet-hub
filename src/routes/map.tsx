import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Find us — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><MapPage /></AppShell></RequireAuth>),
});

type Location = {
  id: string;
  name: string;
  type: "Clinic" | "Store" | "Grooming";
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
};

const LOCATIONS: Location[] = [
  { id: "1", name: "PetPal Downtown Clinic", type: "Clinic", address: "245 Market St, San Francisco, CA", phone: "(415) 555-0142", hours: "Mon–Sat 8:00–19:00", lat: 37.7897, lng: -122.4000 },
  { id: "2", name: "PetPal Mission Store", type: "Store", address: "1820 Valencia St, San Francisco, CA", phone: "(415) 555-0177", hours: "Daily 9:00–21:00", lat: 37.7510, lng: -122.4204 },
  { id: "3", name: "PetPal Marina Grooming", type: "Grooming", address: "2100 Chestnut St, San Francisco, CA", phone: "(415) 555-0189", hours: "Tue–Sun 10:00–18:00", lat: 37.8003, lng: -122.4378 },
];

function MapPage() {
  const [active, setActive] = useState<Location>(LOCATIONS[0]);
  const bbox = `${active.lng - 0.008},${active.lat - 0.005},${active.lng + 0.008},${active.lat + 0.005}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${active.lat},${active.lng}`;
  const directionsUrl = `https://www.openstreetmap.org/directions?to=${active.lat}%2C${active.lng}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Find a location</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visit one of our clinics, stores, or grooming salons.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <iframe
          key={active.id}
          title="Map"
          src={mapSrc}
          className="h-[320px] w-full md:h-[420px]"
          loading="lazy"
        />
        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <div>
            <p className="font-semibold">{active.name}</p>
            <p className="text-xs text-muted-foreground">{active.address}</p>
          </div>
          <Button asChild size="sm">
            <a href={directionsUrl} target="_blank" rel="noreferrer"><Navigation className="mr-1 h-4 w-4" /> Directions</a>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LOCATIONS.map((l) => (
          <button
            key={l.id}
            onClick={() => setActive(l)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all",
              active.id === l.id ? "border-accent bg-accent/5 shadow-md" : "border-border bg-card hover:border-foreground/20"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold">{l.name}</p>
                <span className="mt-0.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">{l.type}</span>
              </div>
              <MapPin className={cn("h-4 w-4", active.id === l.id ? "text-accent" : "text-muted-foreground")} />
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {l.address}</p>
              <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {l.phone}</p>
              <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {l.hours}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Need help choosing? <Link to="/book" className="underline">Book an appointment</Link> and we'll suggest the closest location.
      </p>
    </div>
  );
}
