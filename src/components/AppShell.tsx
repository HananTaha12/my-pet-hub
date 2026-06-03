import { Link, useLocation } from "@tanstack/react-router";
import { Home, Calendar, ShoppingBag, MessageCircle, User, Bell, PawPrint, ShieldCheck, LogOut, Heart, MapPin, Sparkles, Users, Settings as SettingsIcon, Search, BookOpen, Activity } from "lucide-react";
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
      <header className="sticky top-0 z-40 hidden border-b border-white/10 bg-[#4E1B33] text-[#FFF5F9] md:block shadow-md">
        <div className="mx-auto flex h-16 max-w-[1600px] w-[95%] items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/home" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white hover:opacity-95 transition-opacity">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent p-1.5 shadow-lg shadow-accent/20 animate-pulse">
                <PawPrint className="h-full w-full text-accent-foreground" />
              </div>
              PetPal
            </Link>
            
            {/* Campus Portal Badge */}
            <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-[#3D1426] border border-white/10 px-3 py-1 text-[10px] font-bold text-[#EBC4D8]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              Campus Portal
            </div>
          </div>

          {/* Search bar matching mockup */}
          <div className="relative hidden lg:block w-72">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#3D1426] text-white placeholder-white/40 border border-white/10 rounded-full py-1.5 pl-4 pr-10 text-xs focus:outline-none focus:border-white/20"
            />
            <Search className="absolute right-3.5 top-2.5 h-3.5 w-3.5 text-white/40" />
          </div>

          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {ownerNav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                    isActive(n.to) 
                      ? "bg-[#FFF5F9] text-[#4E1B33] font-bold shadow-lg" 
                      : "text-[#FFF5F9]/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  {n.label}
                </Link>
              ))}
              {isStaff && (
                <Link
                  to="/staff"
                  className={cn(
                    "ml-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-300",
                    isActive("/staff") 
                      ? "bg-[#FFF5F9] text-[#4E1B33] font-bold shadow-lg border-transparent" 
                      : "text-[#FFF5F9]/80 border-white/20 hover:text-white hover:bg-white/10"
                  )}
                >
                  <ShieldCheck className="h-4 w-4" /> Staff
                </Link>
              )}
            </div>
            <NotificationsBell className="text-[#FFF5F9]/80 hover:text-white hover:bg-white/10" />
            <ThemeToggle className="text-[#FFF5F9]/80 hover:text-white hover:bg-white/10" />
            <button
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center gap-1 rounded-full bg-red-500/25 border border-red-500/30 px-3.5 py-1.5 text-xs font-bold tracking-wide text-red-200 hover:bg-red-500 hover:text-white transition-all shadow-sm animate-pulse"
            >
              🚨 Emergency
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold tracking-wide text-[#EBC4D8] transition-all hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/30"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#4E1B33] text-[#FFF5F9] px-4 md:hidden">
        <Link to="/home" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white hover:opacity-95 transition-opacity">
          <PawPrint className="h-5 w-5 text-accent animate-pulse" /> PetPal
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEmergencyOpen(true)}
            className="flex items-center h-8 rounded-full bg-red-500/25 border border-red-500/30 px-2.5 text-[10px] font-black text-red-200 hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
            🚨 Emergency
          </button>
          <NotificationsBell className="text-[#FFF5F9]/80 hover:text-white hover:bg-white/10" />
          <ThemeToggle className="text-[#FFF5F9]/80 hover:text-white hover:bg-white/10" />
          <button
            onClick={() => signOut()}
            className="rounded-full p-2 text-[#FFF5F9]/80 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] w-[95%] px-4 pb-24 pt-6 md:px-6 md:pb-12 flex-1">
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <aside className="hidden md:block">
            <div className="sticky top-24 flex gap-3 h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
              
              {/* Left Mini-Icon Strip matching mockup */}
              <div className="flex flex-col gap-5 items-center bg-[#3D1426] border border-white/5 rounded-2xl py-6 px-1.5 w-16 shrink-0 shadow-xl">
                <Link 
                  to="/home" 
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all duration-300 w-12 py-2 rounded-xl",
                    isActive("/home") 
                      ? "bg-[#FFF5F9] text-[#4E1B33] shadow-md" 
                      : "text-[#EBC4D8] hover:bg-[#6E2A4A] hover:text-white"
                  )}
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-center scale-90">Aconitum</span>
                </Link>
                
                <Link 
                  to="/pets" 
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all duration-300 w-12 py-2 rounded-xl",
                    isActive("/pets") 
                      ? "bg-[#FFF5F9] text-[#4E1B33] shadow-md" 
                      : "text-[#EBC4D8] hover:bg-[#6E2A4A] hover:text-white"
                  )}
                >
                  <Activity className="h-5 w-5" />
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-center scale-90">Vitals</span>
                </Link>

                <Link 
                  to="/community" 
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all duration-300 w-12 py-2 rounded-xl",
                    isActive("/community") 
                      ? "bg-[#FFF5F9] text-[#4E1B33] shadow-md" 
                      : "text-[#EBC4D8] hover:bg-[#6E2A4A] hover:text-white"
                  )}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-center scale-90">Clients</span>
                </Link>
              </div>

              {/* Right Menu List */}
              <div className="flex-1 bg-[#4E1B33] text-white p-4 rounded-2xl border border-white/10 shadow-2xl">
                <nav className="flex flex-col gap-1.5">
                  <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-widest text-[#EBC4D8]/60">Management</p>
                  {sideExtra.map((n) => {
                    const Icon = n.icon;
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className={cn(
                          "group flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-all duration-300 font-medium",
                          isActive(n.to)
                            ? "bg-[#FFF5F9] text-[#4E1B33] font-bold shadow-md"
                            : "text-[#EBC4D8] hover:bg-[#6E2A4A] hover:text-[#FFF5F9]"
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5 transition-transform group-hover:scale-110", isActive(n.to) ? "text-[#4E1B33]" : "text-[#EBC4D8]")} /> 
                        <span>{n.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

            </div>
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
      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-white/10 bg-[#4E1B33]/95 text-white backdrop-blur-md shadow-2xl md:hidden">
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
                  active ? "text-white" : "text-[#EBC4D8]/85"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform", active ? "text-[#FFF5F9] scale-110" : "group-hover:scale-105")} />
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
