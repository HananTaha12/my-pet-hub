import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Calendar, Bell, ShoppingBag, MessageCircle, PawPrint, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
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
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <PawPrint className="h-5 w-5 text-accent" /> PetPal
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link to="/signup" className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-2 md:items-center md:py-20">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" /> Smart pet care, simplified
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Everything your pet needs, in one calm place.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Book grooming and vet appointments, shop premium supplies, never miss a vaccination, and ask our AI vet anything — all from one app.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-secondary">
              I already have one
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-accent/20 blur-3xl" />
          <img
            src={heroImg}
            alt="A golden retriever and orange tabby cat sitting peacefully together"
            width={1600}
            height={1024}
            className="rounded-[1.5rem] object-cover shadow-xl"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-4">
        {[
          { icon: Calendar, title: "Book in seconds", body: "Real-time availability for grooming, vet checks and training." },
          { icon: ShoppingBag, title: "Shop smarter", body: "Curated food, treats and accessories, delivered or in-store pickup." },
          { icon: Bell, title: "Smart reminders", body: "Vaccinations, treatments and food restocks — automatic." },
          { icon: MessageCircle, title: "AI pet assistant", body: "Ask anything. Knows your pet's profile and history." },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-5 w-5 text-accent" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          );
        })}
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PetPal — Smart pet care.
      </footer>
    </div>
  );
}
