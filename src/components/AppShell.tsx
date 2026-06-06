import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { 
  Home, Calendar, ShoppingBag, MessageCircle, User, Bell, PawPrint, ShieldCheck, 
  LogOut, Heart, MapPin, Sparkles, Users, Settings as SettingsIcon, Search, 
  BookOpen, Activity, X, Trash2, Plus, Minus, ShieldAlert, Phone, Eye
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { EmergencyModal } from "@/components/EmergencyModal";
import { Button } from "@/components/ui/button";
import { fetchCart, setCartQuantity, type CartLine } from "@/lib/cart";

const ownerNav = [
  { to: "/home", label: "Dashboard", icon: Home },
  { to: "/book", label: "Book Vet", icon: Calendar },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/book?type=hotel", label: "Pet Hotel", icon: Calendar },
  { to: "/book?type=grooming", label: "Grooming", icon: Calendar },
  { to: "/studio", label: "Design Studio", icon: Sparkles },
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

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isStaff, signOut } = useAuth();
  const navigate = useNavigate();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const location = useLocation();

  const loadCart = async () => {
    if (user) {
      try {
        const items = await fetchCart(user.id);
        setCartItems(items);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    loadCart();

    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      loadCart();
      if (customEvent.detail?.openDrawer) {
        setCartOpen(true);
      }
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [user]);

  const handleUpdateQty = async (productId: string, quantity: number) => {
    if (user) {
      await setCartQuantity(user.id, productId, quantity);
      loadCart();
    }
  };

  // Smart active route check that handles search params (e.g. ?type=hotel)
  const isActive = (to: string) => {
    const [path, query] = to.split("?");
    const pathMatch = location.pathname === path || (path !== "/home" && location.pathname.startsWith(path));
    if (!query) return pathMatch;
    
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const [qKey, qVal] = query.split("=");
      return pathMatch && searchParams.get(qKey) === qVal;
    }
    return pathMatch;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Auto-Scrolling Marquee Promo Announcement Bar */}
      <div className="w-full bg-gradient-to-r from-[#4E1B33] via-[#7C2D55] to-[#4E1B33] text-white py-3 overflow-hidden border-b border-white/10 relative z-50 shadow-lg">
        <div className="animate-marquee whitespace-nowrap flex gap-20 text-xs sm:text-sm font-black uppercase tracking-wider">
          <span className="flex items-center gap-2">🔥 <span className="text-[#EBC4D8]">SUMMER SALE</span> UP TO <span className="text-yellow-300 underline">50% OFF</span> — USE CODE: <strong className="bg-white/20 px-2 py-0.5 rounded-full text-white">SUMMER50</strong></span>
          <span className="text-[#D98CB3]">✦</span>
          <span className="flex items-center gap-2">🚚 FREE SHIPPING OVER <span className="text-yellow-300">$75</span></span>
          <span className="text-[#D98CB3]">✦</span>
          <span className="flex items-center gap-2">🎁 BONUS REWARDS ON EVERY ORDER</span>
          <span className="text-[#D98CB3]">✦</span>
          <span className="flex items-center gap-2">🔥 <span className="text-[#EBC4D8]">SUMMER SALE</span> UP TO <span className="text-yellow-300 underline">50% OFF</span> — USE CODE: <strong className="bg-white/20 px-2 py-0.5 rounded-full text-white">SUMMER50</strong></span>
          <span className="text-[#D98CB3]">✦</span>
          <span className="flex items-center gap-2">🚚 FREE SHIPPING OVER <span className="text-yellow-300">$75</span></span>
          <span className="text-[#D98CB3]">✦</span>
          <span className="flex items-center gap-2">🎁 BONUS REWARDS ON EVERY ORDER</span>
          <span className="text-[#D98CB3]">✦</span>
        </div>
      </div>

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

          {/* Enhanced Search bar */}
          <div className="relative hidden lg:block w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              placeholder="Search products, services, pets..."
              className="w-full bg-[#3D1426] text-white placeholder-white/40 border border-white/10 rounded-full py-2.5 pl-11 pr-5 text-sm focus:outline-none focus:border-white/30 focus:bg-[#4A1F33] transition-all"
            />
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
            {/* Wishlist button */}
            <Link
              to="/favorites"
              className="relative p-2 rounded-full text-[#FFF5F9]/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" />
              <span className="bg-pink-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-[#4E1B33]">3</span>
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FFF5F9] transition-colors border border-white/10"
              title="Open Cart"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="text-xs font-black">
                🛒 {cartItems.reduce((acc, it) => acc + it.quantity, 0) > 0 ? cartItems.reduce((acc, it) => acc + it.quantity, 0) : ""}
              </span>
              {cartItems.reduce((acc, it) => acc + it.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#D98CB3] to-[#B5386B] text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#4E1B33] shadow-lg">
                  {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
                </span>
              )}
            </button>
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
          {/* Mobile Wishlist */}
          <Link to="/favorites" className="relative p-2 rounded-full text-[#FFF5F9]/80 hover:text-white hover:bg-white/10 transition-colors" title="Wishlist">
            <Heart className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-[#4E1B33]">3</span>
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 rounded-full text-[#FFF5F9]/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Open Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItems.reduce((acc, it) => acc + it.quantity, 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#D98CB3] to-[#B5386B] text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-[#4E1B33]">
                {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
              </span>
            )}
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

      {/* Sliding Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setCartOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-[#FFF5F9] dark:bg-[#1A0B13] h-full shadow-2xl flex flex-col z-10 border-l border-border animate-in slide-in-from-right duration-300 text-left">
            <div className="flex items-center justify-between p-5 border-b border-border bg-[#4E1B33] text-white">
              <h3 className="font-display text-lg font-black flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-accent animate-pulse" /> Shopping Cart
              </h3>
              <button 
                onClick={() => setCartOpen(false)}
                className="text-white/80 hover:text-white rounded-full p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/35" />
                  <p className="text-sm font-semibold">Your cart is currently empty.</p>
                  <Button onClick={() => setCartOpen(false)} variant="outline" className="rounded-full text-xs font-bold px-5 py-4 border-border/80 hover:bg-[#4E1B33]/5">
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.product_id} className="flex gap-3 rounded-2xl border border-border bg-card/60 p-3 items-center hover:shadow-md transition-shadow">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-14 w-14 rounded-xl object-cover border border-border/40 shrink-0" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center text-2xl font-bold shrink-0">📦</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] font-black text-primary mt-0.5">${item.unit_price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 border border-border/60 rounded-full px-2 py-0.5 bg-background shrink-0">
                      <button 
                        onClick={() => handleUpdateQty(item.product_id, item.quantity - 1)}
                        className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-black">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQty(item.product_id, item.quantity + 1)}
                        className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleUpdateQty(item.product_id, 0)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-border bg-card/40 space-y-4">
                <div className="flex items-center justify-between text-sm font-bold text-foreground">
                  <span>Subtotal</span>
                  <span className="text-lg font-black text-primary">${cartItems.reduce((acc, it) => acc + it.unit_price * it.quantity, 0).toFixed(2)}</span>
                </div>
                <div className="grid gap-2">
                  <Button 
                    onClick={() => {
                      setCartOpen(false);
                      navigate({ to: "/checkout" });
                    }}
                    className="w-full py-6 font-black uppercase tracking-wider rounded-full shadow-lg bg-[#4E1B33] text-white hover:bg-[#4E1B33]/90 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    Secure Checkout
                  </Button>
                  <Button 
                    onClick={() => setCartOpen(false)} 
                    variant="outline" 
                    className="w-full py-6 font-black uppercase tracking-wider rounded-full border-border/80 hover:bg-[#4E1B33]/5 cursor-pointer"
                  >
                    Keep Shopping
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
