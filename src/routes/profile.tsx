import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Profile /></AppShell></RequireAuth>),
});

function Profile() {
  const { user, signOut, isStaff } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.full_name ?? ""); setPhone(data?.phone ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Profile</h1>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary"><UserIcon className="h-5 w-5 text-accent" /></div>
        <div>
          <p className="font-medium">{user?.email}</p>
          <p className="text-xs text-muted-foreground">{isStaff ? "Staff" : "Pet owner"}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <Button onClick={save}>Save changes</Button>
      </div>
      <Button variant="outline" className="w-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}
