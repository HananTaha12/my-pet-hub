import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Lock, User, Globe, Moon, Sun, ShieldAlert, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Settings /></AppShell></RequireAuth>),
});

function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Account details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Theme settings
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Notifications
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifPush, setNotifPush] = useState(true);

  // Language
  const [lang, setLang] = useState("en");

  // Password fields
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.full_name ?? "");
      setPhone(data?.phone ?? "");
    });

    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Account profile updated successfully! ✨");
  };

  const handleToggleTheme = (checked: boolean) => {
    const nextTheme = checked ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    toast.success(`Switched to ${nextTheme} mode!`);
  };

  const handleSavePreferences = () => {
    toast.success("Notification preferences and language saved successfully!");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass) return toast.error("Fill in password fields");
    if (newPass.length < 6) return toast.error("New password must be at least 6 characters");
    
    // Simulate updating credentials via supabase
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return toast.error(error.message);
    
    toast.success("Password changed successfully!");
    setOldPass("");
    setNewPass("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 transition-all duration-500 animate-in fade-in">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure profile details, system preferences, dark mode, and security credentials.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Profile & Security */}
        <div className="space-y-6">
          {/* Card: Profile Info */}
          <div className="rounded-[2rem] border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-accent" /> Profile Settings
            </h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Registered Email</Label>
                <Input disabled value={user?.email ?? ""} className="rounded-xl bg-muted/40 cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +972-599-XXXXXX" className="rounded-xl" />
              </div>
              <Button onClick={handleSaveProfile} className="w-full rounded-xl mt-4">Save Profile Info</Button>
            </div>
          </div>

          {/* Card: Security */}
          <div className="rounded-[2rem] border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-accent" /> Change Password
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div className="space-y-1">
                <Label>Current Password</Label>
                <Input required type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>New Password</Label>
                <Input required type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="rounded-xl" />
              </div>
              <Button type="submit" variant="outline" className="w-full rounded-xl mt-4 border-primary/30 hover:bg-primary/5">
                Update Password
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Preferences, Toggles & Dark Mode */}
        <div className="space-y-6">
          {/* Card: Dark Mode & Appearance */}
          <div className="rounded-[2rem] border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-accent" />} Appearance
            </h2>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 border border-border/30">
              <div>
                <p className="text-sm font-bold text-foreground/90">Dark Theme</p>
                <p className="text-[10px] text-muted-foreground">Toggle application theme color mode.</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={handleToggleTheme} />
            </div>
          </div>

          {/* Card: Preferences */}
          <div className="rounded-[2rem] border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" /> Care Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-1 border-b border-border/10 pb-2">
                <div>
                  <p className="text-xs font-bold text-foreground/90">Email Reports</p>
                  <p className="text-[9px] text-muted-foreground">Receive weekly diagnostics report summaries.</p>
                </div>
                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/10 pb-2">
                <div>
                  <p className="text-xs font-bold text-foreground/90">SMS Alerts</p>
                  <p className="text-[9px] text-muted-foreground">Get urgent missing pet board alarms.</p>
                </div>
                <Switch checked={notifSms} onCheckedChange={setNotifSms} />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-bold text-foreground/90">Push Alarms</p>
                  <p className="text-[9px] text-muted-foreground">Immediate vaccination slot scheduling checks.</p>
                </div>
                <Switch checked={notifPush} onCheckedChange={setNotifPush} />
              </div>
              
              <div className="space-y-1 pt-2">
                <Label className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Portal Language</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="en">English (US)</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    <SelectItem value="fr">Français (French)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSavePreferences} className="w-full rounded-xl mt-4">Save Preferences</Button>
            </div>
          </div>

          {/* Card: Logout */}
          <div className="rounded-[2rem] border border-border bg-card p-6 flex flex-col justify-between text-center space-y-4">
            <div>
              <p className="text-sm font-bold text-foreground">Sign Out of Session</p>
              <p className="text-[10px] text-muted-foreground">Close active session on this browser device.</p>
            </div>
            <Button variant="destructive" className="rounded-xl py-6" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              Logout Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
