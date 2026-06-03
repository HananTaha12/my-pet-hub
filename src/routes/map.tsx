import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { MapPin, Phone, Clock, Navigation, Search, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Find us — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><MapPage /></AppShell></RequireAuth>),
});

type Location = {
  id: string;
  name: string;
  type: "Clinic" | "Emergency Vet" | "Store" | "Grooming";
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  isOpenNow: boolean;
  distance: string;
  is24hEmergency: boolean;
};

const LOCATIONS: Location[] = [
  { 
    id: "1", 
    name: "PetPal Downtown 24/7 Emergency Clinic", 
    type: "Emergency Vet", 
    address: "245 Market St, San Francisco, CA", 
    phone: "(415) 555-0142", 
    hours: "Open 24 Hours · 7 Days a week", 
    lat: 37.7897, 
    lng: -122.4000,
    isOpenNow: true,
    distance: "0.4 miles",
    is24hEmergency: true
  },
  { 
    id: "2", 
    name: "PetPal Mission General Clinic", 
    type: "Clinic", 
    address: "1820 Valencia St, San Francisco, CA", 
    phone: "(415) 555-0177", 
    hours: "Mon–Sat 8:00–19:00", 
    lat: 37.7510, 
    lng: -122.4204,
    isOpenNow: true,
    distance: "1.2 miles",
    is24hEmergency: false
  },
  { 
    id: "3", 
    name: "PetPal Marina Grooming & Spa", 
    type: "Grooming", 
    address: "2100 Chestnut St, San Francisco, CA", 
    phone: "(415) 555-0189", 
    hours: "Tue–Sun 10:00–18:00", 
    lat: 37.8003, 
    lng: -122.4378,
    isOpenNow: false,
    distance: "2.5 miles",
    is24hEmergency: false
  },
  { 
    id: "4", 
    name: "Golden Gate Veterinary Trauma Center", 
    type: "Emergency Vet", 
    address: "420 Arguello Blvd, San Francisco, CA", 
    phone: "(415) 555-0199", 
    hours: "Open 24 Hours · 7 Days a week", 
    lat: 37.7865, 
    lng: -122.4590,
    isOpenNow: true,
    distance: "3.1 miles",
    is24hEmergency: true
  }
];

function MapPage() {
  const [active, setActive] = useState<Location>(LOCATIONS[0]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  const filteredLocations = useMemo(() => {
    return LOCATIONS.filter((l) => {
      const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                            l.address.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterType === "All" || 
                            (filterType === "Emergency" && l.is24hEmergency) || 
                            (filterType === l.type);
      return matchesSearch && matchesFilter;
    });
  }, [search, filterType]);

  const bbox = `${active.lng - 0.008},${active.lat - 0.005},${active.lng + 0.008},${active.lat + 0.005}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${active.lat},${active.lng}`;
  const directionsUrl = `https://www.openstreetmap.org/directions?to=${active.lat}%2C${active.lng}`;

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Emergency Clinic & Veterinary Finder</h1>
        <p className="mt-1 text-xs text-muted-foreground">Find nearby animal trauma centers, stores, or general hospitals</p>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by clinic name, address, zip code..." 
            className="pl-10 h-11 rounded-xl bg-card border border-border/80 text-xs shadow-sm"
          />
        </div>
        
        {/* Category Filters */}
        <div className="flex gap-1.5 bg-secondary/50 rounded-xl p-1 border border-border/30 w-fit shrink-0">
          {["All", "Emergency", "Clinic", "Grooming"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                filterType === t ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Split Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left column: Location List */}
        <div className="lg:col-span-1 space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
          {filteredLocations.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8 italic border border-dashed border-border rounded-2xl">
              No matching veterinary locations found.
            </p>
          ) : (
            filteredLocations.map((l) => {
              const isSelected = active.id === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setActive(l)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all hover-lift w-full relative overflow-hidden",
                    isSelected 
                      ? "border-primary bg-secondary shadow-md" 
                      : "border-border bg-card hover:border-pink-200/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-xs text-foreground pr-6 leading-tight">{l.name}</p>
                      
                      {/* Distances and Emergency Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="inline-block rounded-full bg-foreground/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-foreground">
                          {l.distance}
                        </span>
                        
                        {l.is24hEmergency ? (
                          <span className="inline-block rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
                            24/7 Emergency
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-border">
                            {l.type}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Open/Closed status bullet */}
                    <div className="shrink-0 flex items-center gap-1 text-[9px] font-extrabold tracking-wide uppercase">
                      {l.isOpenNow ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> OPEN
                        </span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> CLOSED
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Detailed Addresses */}
                  <div className="mt-4 space-y-1.5 text-[10px] font-medium text-muted-foreground/90 border-t border-border/40 pt-3">
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-pink-500" /> {l.address}</p>
                    <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-pink-500" /> {l.phone}</p>
                    <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-pink-500" /> {l.hours}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right column: Active Location Map Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm hover-lift relative group">
            
            {/* Map Frame iframe */}
            <iframe
              key={active.id}
              title="Map"
              src={mapSrc}
              className="h-[320px] w-full md:h-[380px]"
              loading="lazy"
            />
            
            {/* Active Details overlay sheet */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border/50 p-5 bg-card/90 backdrop-blur-md">
              <div className="space-y-1">
                <p className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
                  {active.is24hEmergency && <ShieldCheck className="h-4.5 w-4.5 text-rose-500" />} {active.name}
                </p>
                <p className="text-xs text-muted-foreground">{active.address}</p>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none rounded-xl text-xs font-bold border-border/70" asChild>
                  <a href={`tel:${active.phone}`}><Phone className="mr-1 h-3.5 w-3.5" /> Call Clinic</a>
                </Button>
                <Button size="sm" className="flex-1 sm:flex-none rounded-xl text-xs font-bold" asChild>
                  <a href={directionsUrl} target="_blank" rel="noreferrer"><Navigation className="mr-1 h-3.5 w-3.5" /> Get Directions</a>
                </Button>
              </div>
            </div>

          </div>

          {/* Emergency Safety Alert Card */}
          {active.is24hEmergency && (
            <div className="rounded-2xl border border-rose-200/50 bg-rose-500/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-950 dark:text-rose-200">Emergency Protocol Check</p>
                <p className="text-[10px] text-rose-900/70 dark:text-rose-200/70 leading-relaxed">
                  Always call the emergency center at <a href={`tel:${active.phone}`} className="underline font-bold">{active.phone}</a> in advance of arriving. This allows clinical triage teams to prepare life-saving procedures before you enter the center.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Need special consultation? <Link to="/book" className="underline font-bold text-pink-500">Book an appointment</Link> directly to schedule specialists.
      </p>
    </div>
  );
}
