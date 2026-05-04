import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PawPrint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — PetPal" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        navigate({ to: "/home" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Login failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-[100px] pointer-events-none" />
      <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="mb-10 flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent p-2 shadow-lg shadow-accent/20">
            <PawPrint className="h-full w-full text-accent-foreground" />
          </div>
          PetPal
        </Link>

        <div className="rounded-[2.5rem] glass-card p-8 md:p-10">
          <h1 className="font-display text-4xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground/70">Sign in to continue your pet's care.</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                placeholder="john@example.com"
                className="rounded-2xl bg-background/50 py-6 px-5 border-border/40 focus:border-accent/40 transition-all"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="rounded-2xl bg-background/50 py-6 px-5 border-border/40 focus:border-accent/40 transition-all"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-2xl py-7 text-sm font-bold tracking-wide shadow-xl shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground/60">
            New here?{" "}
            <Link to="/signup" className="font-bold text-foreground hover:text-accent transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

