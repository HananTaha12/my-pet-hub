import { Link, useLocation } from "@tanstack/react-router";
import { Home, Calendar, ShoppingBag, MessageCircle, User, Bell, PawPrint, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
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
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/reminders", label: "Reminders", icon: Bell },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { isStaff } = useAuth();
  const location = useLocation();
  const isActive = (to: string) =>
    location.pathname === to || (to !== "/home" && location.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 hidden border-b border-border/60 bg-background/80 backdrop-blur-md md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/home" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
            <PawPrint className="h-5 w-5 text-accent" />
            PetPal
          </Link>
          <nav className="flex items-center gap-1">
            {ownerNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive(n.to) ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
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
                  isActive("/staff") && "bg-foreground text-background"
                )}
              >
                <ShieldCheck className="h-4 w-4" /> Staff
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 glass px-4 md:hidden">
        <Link to="/home" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <PawPrint className="h-5 w-5 text-accent animate-pulse" /> PetPal
        </Link>
        <Link to="/reminders" className="relative rounded-full p-2 text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 md:px-6 md:pb-12">
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
    </div>
  );
}
