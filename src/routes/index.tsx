import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Calendar, Bell, ShoppingBag, MessageCircle, PawPrint, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PetPal — Smart pet store, all in one place" },
      { name: "description", content: "Book grooming and vet visits, shop premium supplies, get smart reminders, and chat with an AI pet assistant." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/home" });
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative background elements */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-[100px] pointer-events-none" />
      <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      
      <main className="relative z-10 mx-auto max-w-lg px-6 pb-20 pt-10">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-accent">
            <Sparkles className="h-3 w-3 animate-pulse" /> Smart pet care, simplified
          </div>
          <h1 className="mt-4 font-display text-[2.75rem] font-bold leading-[0.95] tracking-tighter text-foreground md:text-6xl">
            Everything your pet needs, <span className="text-accent">in one calm place.</span>
          </h1>
          <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground/80">
            Book appointments, shop premium supplies, and chat with our AI vet — all in one premium app.
          </p>
          
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/signup" className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-3xl bg-foreground px-8 py-4 text-sm font-bold tracking-wide text-background transition-all hover:shadow-2xl hover:shadow-accent/20 active:scale-95">
              <span className="relative z-10">Start your journey</span>
              <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-accent to-accent/80 transition-transform duration-500 group-hover:translate-x-0" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-3xl border-2 border-border glass-card px-8 py-4 text-sm font-bold tracking-wide transition-all hover:bg-background/80">
              Sign in
            </Link>
          </div>
        </section>

        <section className="relative mt-10">
          <div className="absolute -inset-4 rounded-[3rem] bg-accent/5 blur-2xl" />
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2.5rem] border border-white/20 shadow-2xl md:aspect-video">
            <img
              src={heroImg}
              alt="Happy pet"
              className="h-full w-full object-cover object-center transition-transform duration-1000 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />

            <div className="absolute bottom-8 left-8 right-8 rounded-3xl glass-card p-6 text-left">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-secondary" />
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Joined by 2,000+ pet owners</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-20 pb-10 text-center">
          <div className="flex items-center justify-center gap-2 font-display text-lg font-bold opacity-30">
            <PawPrint className="h-5 w-5" /> PetPal
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            © {new Date().getFullYear()} — Designed for happy pets
          </p>
        </footer>
      </main>
    </div>
  );
}

