import { Link, useLocation } from "@tanstack/react-router";
import { Home, Calendar, ShoppingBag, MessageCircle, User, Bell, PawPrint, ShieldCheck, LogOut, Heart, MapPin, Sparkles, Users, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";
import type { ReactNode } from "react";

const ownerNav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/book", label: "Book", icon: Calendar },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const sideExtra = [
  { to: "/pets", label: "My Pets", icon: PawPrint },
  { to: "/appointments", label: "Appointments", icon: Calendar },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/community", label: "Community", icon: Users },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/rewards", label: "Rewards", icon: Sparkles },
  { to: "/map", label: "Locations", icon: MapPin },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

import { useState } from "react";
import { EmergencyModal } from "@/components/EmergencyModal";

export function AppShell({ children }: { children: ReactNode }) {
  const { isStaff, signOut } = useAuth();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const location = useLocation();
  const isActive = (to: string) =>
    location.pathname === to || (to !== "/home" && location.pathname.startsWith(to));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 hidden border-b border-border/60 bg-background/80 backdrop-blur-md md:block">
        <div className="mx-auto flex h-16 max-w-[1600px] w-[95%] items-center justify-between px-6">
          <Link to="/home" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent p-1.5 shadow-lg shadow-accent/20">
              <PawPrint className="h-full w-full text-accent-foreground" />
            </div>
            PetPal
          </Link>
          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {ownerNav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                    isActive(n.to) ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {n.label}
                </Link>
              ))}
              {isStaff && (
                <Link
                  to="/staff"
                  className={cn(
                    "ml-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium",
                    isActive("/staff") && "bg-foreground text-background shadow-lg"
                  )}
                >
                  <ShieldCheck className="h-4 w-4" /> Staff
                </Link>
              )}
            </div>
            <NotificationsBell />
            <ThemeToggle />
            <button
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 px-3.5 py-1.5 text-xs font-bold tracking-wide text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm animate-pulse"
            >
              🚨 Emergency
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-full border border-border/50 px-4 py-2 text-sm font-bold tracking-wide text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 glass px-4 md:hidden">
        <Link to="/home" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <PawPrint className="h-5 w-5 text-accent animate-pulse" /> PetPal
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEmergencyOpen(true)}
            className="flex items-center h-8 rounded-full bg-destructive/10 border border-destructive/20 px-2.5 text-[10px] font-black text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
          >
            🚨 Emergency
          </button>
          <NotificationsBell />
          <ThemeToggle />
          <button
            onClick={() => signOut()}
            className="rounded-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] w-[95%] px-4 pb-24 pt-6 md:px-6 md:pb-12 flex-1">
        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <aside className="hidden md:block">
            <nav className="sticky top-24 flex flex-col gap-1.5">
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Management</p>
              {sideExtra.map((n) => {
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300",
                      isActive(n.to)
                        ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive(n.to) && "text-accent")} /> {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="min-w-0 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2">{children}</div>
        </div>
      </main>

      {/* Huge Footer */}
      <footer className="border-t border-border/40 py-16 bg-card/25 backdrop-blur-sm mt-auto mb-16 md:mb-0">
        <div className="mx-auto max-w-[1600px] w-[95%] px-6 grid gap-8 grid-cols-2 md:grid-cols-5 text-xs text-muted-foreground">
          <div className="space-y-4 col-span-2">
            <Link to="/home" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary p-1">
                <PawPrint className="h-full w-full text-primary-foreground" />
              </div>
              PetPal
            </Link>
            <p className="max-w-xs text-muted-foreground/80 leading-relaxed">
              Startup-grade ecosystem connecting pet profiles, veterinary clinical schedulers, premium supply stores, and smart AI wellness centers in one unified dashboard workspace.
            </p>
            <p className="text-[11px]">&copy; {new Date().getFullYear()} PetPal Inc. All rights reserved.</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-widest text-[10px]">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline hover:text-foreground">About Us</a></li>
              <li><a href="#" className="hover:underline hover:text-foreground">Our Vet Board</a></li>
              <li><a href="#" className="hover:underline hover:text-foreground">Careers</a></li>
              <li><a href="#" className="hover:underline hover:text-foreground">Press Kit</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-widest text-[10px]">Ecosystem</h4>
            <ul className="space-y-2">
              <li><Link to="/book" className="hover:underline hover:text-foreground">Clinical Scheduler</Link></li>
              <li><Link to="/shop" className="hover:underline hover:text-foreground">Supplies Shop</Link></li>
              <li><Link to="/chat" className="hover:underline hover:text-foreground">AI Diagnostics</Link></li>
              <li><Link to="/community" className="hover:underline hover:text-foreground">Social Board</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-foreground uppercase tracking-widest text-[10px]">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline hover:text-foreground">Help Center</a></li>
              <li><a href="#" className="hover:underline hover:text-foreground">Safety Rules</a></li>
              <li><a href="#" className="hover:underline hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="hover:underline hover:text-foreground">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-white/10 glass shadow-2xl md:hidden">
        <div className="grid grid-cols-5">
          {ownerNav.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all duration-300",
                  active ? "text-foreground" : "text-muted-foreground/80"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform", active ? "text-accent scale-110" : "group-hover:scale-105")} />
                <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-70")}>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Emergency Dialog */}
      <EmergencyModal open={emergencyOpen} onOpenChange={setEmergencyOpen} />
    </div>
  );
}
