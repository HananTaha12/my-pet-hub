import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
    <div className="flex h-[calc(100vh-12rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">AI Assistant</h1>
        {pets.length > 0 && (
          <Select value={petId} onValueChange={setPetId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Active pet" /></SelectTrigger>
            <SelectContent>{pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-foreground text-background" : "bg-secondary"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-muted-foreground">Thinking…</div>}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about food, behaviour, health…" />
        <Button type="submit" disabled={busy}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
