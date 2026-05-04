import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PawPrint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — PetPal" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm!");
        navigate({ to: "/onboarding" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-full w-full items-center justify-center bg-background px-4 py-12">
      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="mb-10 flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent p-2 shadow-lg shadow-accent/20">
            <PawPrint className="h-full w-full text-accent-foreground" />
          </div>
          PetPal
        </Link>

        <div className="rounded-[2.5rem] bg-card border border-border/50 p-8 shadow-2xl md:p-10">
          <h1 className="font-display text-4xl font-bold tracking-tight">Create account</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground/70">Join the PetPal community today.</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Full name</Label>
              <Input 
                id="name" 
                required 
                placeholder="John Doe"
                className="rounded-2xl bg-muted/30 py-6 px-5 border-border/40 focus:ring-2 focus:ring-accent/20"
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                placeholder="john@example.com"
                className="rounded-2xl bg-muted/30 py-6 px-5 border-border/40 focus:ring-2 focus:ring-accent/20"
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
                minLength={6} 
                className="rounded-2xl bg-muted/30 py-6 px-5 border-border/40 focus:ring-2 focus:ring-accent/20"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-2xl py-7 text-sm font-bold tracking-wide shadow-xl shadow-accent/20">
              {loading ? "Creating…" : "Sign up"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground/60">
            Already have one?{" "}
            <Link to="/login" className="font-bold text-foreground hover:text-accent">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


