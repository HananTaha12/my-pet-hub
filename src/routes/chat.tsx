import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI Pet Assistant — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Chat /></AppShell></RequireAuth>),
});

interface Pet { id: string; name: string; species: string; breed: string | null; date_of_birth: string | null }
type Msg = { role: "user" | "assistant"; content: string };

function Chat() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState<string>("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "Hi! I'm your PetPal AI assistant. Ask me anything about your pet's care." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("pets").select("*").eq("owner_id", user.id).then(({ data }) => {
      setPets((data ?? []) as Pet[]);
      if (data?.length) setPetId(data[0].id);
    });
  }, [user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...msgs, userMsg];
    setMsgs(next); setInput(""); setBusy(true);
    const pet = pets.find((p) => p.id === petId);
    const { data, error } = await supabase.functions.invoke("petpal-chat", {
      body: { messages: next.map((m) => ({ role: m.role, content: m.content })), pet },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Chat failed");
      return;
    }
    setMsgs([...next, { role: "assistant", content: data.content }]);
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] max-w-4xl flex-col transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Expert advice for your pet's well-being</p>
        </div>
        {pets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Chatting about</span>
            <Select value={petId} onValueChange={setPetId}>
              <SelectTrigger className="w-40 rounded-xl bg-secondary/50 border-none focus:ring-accent"><SelectValue placeholder="Active pet" /></SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">{pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto rounded-[2.5rem] glass-card p-6 no-scrollbar">
        {msgs.map((m: Msg, i: number) => (
          <div key={i} className={cn("flex w-full animate-in fade-in duration-500", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "relative max-w-[85%] whitespace-pre-wrap px-5 py-3.5 text-sm leading-relaxed shadow-sm",
              m.role === "user" 
                ? "rounded-[2rem] rounded-tr-none bg-foreground text-background" 
                : "rounded-[2rem] rounded-tl-none bg-secondary/80 text-foreground border border-white/5"
            )}>
              {m.content}
              {m.role === "assistant" && (
                <div className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                  <Sparkles className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start animate-pulse">
            <div className="rounded-[2rem] rounded-tl-none bg-secondary/40 px-5 py-3 text-xs font-medium text-muted-foreground">
              Processing insights…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={send} className="mt-6 relative flex items-center">
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ask about health, behavior, or nutrition…" 
          className="h-14 rounded-full border-none bg-secondary/50 pl-6 pr-16 text-sm focus-visible:ring-accent shadow-inner"
        />
        <Button 
          type="submit" 
          disabled={busy} 
          size="icon"
          className="absolute right-1.5 h-11 w-11 rounded-full bg-foreground hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
