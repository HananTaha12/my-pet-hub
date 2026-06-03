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

function generateLocalAIResponse(query: string, petName: string, petSpecies: string): string {
  const q = query.toLowerCase();
  
  if (q.includes("scratch") || q.includes("itch") || q.includes("flea") || q.includes("tick") || q.includes("skin") || q.includes("rash")) {
    return `Regarding ${petName}'s scratching/skin concern: 
1. Check their coat thoroughly for tiny dark spots (flea dirt) or actual insects, especially around the lower back and neck.
2. Consider applying a vet-approved flea and tick treatment. (You can log these in the Treatments tab of your Care page!).
3. Keep skin clean and cool. If you see open sores or localized redness, it could be a hot spot or environmental allergy.
4. Schedule a vet visit if the itching persists or you notice hair loss.`;
  }
  
  if (q.includes("vomit") || q.includes("throw up") || q.includes("puke") || q.includes("diarrhea") || q.includes("stomach") || q.includes("sick")) {
    return `I'm sorry to hear ${petName} is feeling unwell. For digestive upset (vomiting or diarrhea):
1. **Withhold food for 12 hours** to let their stomach settle, but ensure they have access to small amounts of fresh water to avoid dehydration.
2. When reintroducing food, offer a bland diet such as boiled skinless chicken breast with white rice (no seasonings) for 24-48 hours.
3. **Red flags**: If you see blood in the stool or vomit, if ${petName} is extremely lethargic, or if they continue to vomit water, please contact our Emergency Vet line immediately (available via the footer!).`;
  }
  
  if (q.includes("eat") || q.includes("food") || q.includes("diet") || q.includes("feed") || q.includes("kibble") || q.includes("nutrition")) {
    const defaultAdvice = petSpecies === "dog" 
      ? `For dogs like ${petName}, premium protein-focused dry kibble with appropriate portion controls is key. Ensure they get moderate omega-3 fatty acids for joint and skin health.`
      : petSpecies === "cat"
      ? `Cats like ${petName} are obligate carnivores. Ensure their diet is high in animal protein and includes moisture (wet canned food) to support kidney and urinary tract health.`
      : `Provide fresh species-appropriate food (e.g. seeds/veggies/pellets) daily. Always ensure they have unlimited access to clean drinking water.`;
    return `Nutrition Guide for ${petName} (${petSpecies}):
${defaultAdvice}
- Avoid giving toxic foods like chocolate, onions, garlic, grapes, raisins, or anything containing xylitol.
- Restock high-quality food options directly from our Shop!`;
  }
  
  if (q.includes("active") || q.includes("letharg") || q.includes("lazy") || q.includes("sleep") || q.includes("depress") || q.includes("exercise") || q.includes("energy")) {
    return `Regarding ${petName}'s activity levels:
1. Normal sleep patterns vary, but a sudden onset of lethargy can indicate underlying pain, fever, or illness.
2. Check for other symptoms: Are they eating and drinking normally? Are their gums healthy and pink?
3. If they are just low-energy after a busy day, give them a comfortable quiet place to rest (like our luxury beds!). If the low energy persists for more than 24 hours, consulting a vet is recommended.`;
  }

  if (q.includes("vaccin") || q.includes("shot") || q.includes("needle") || q.includes("prevent")) {
    return `For ${petName}'s vaccination requirements:
1. Keeping up with core vaccinations (like Rabies, DHPP for dogs, or FVRCP for cats) protects them from highly contagious and fatal illnesses.
2. Check the Care status reminders on your dashboard to see if any shots are upcoming.
3. Consult with Dr. Sarah Connor or any of our Specialists using the Vet Scheduler (Book page) to set up a vaccination plan.`;
  }

  return `Thanks for asking about ${petName}! I'm analyzing your question. 
To give you the best advice, make sure to:
- Monitor their daily water intake and appetite.
- Keep track of their weight trends in the Pets dashboard.
- Reach out to our veterinary specialists on the Booking page if you need an official clinical diagnosis.

Is there a specific symptom (like skin itching, vomiting, or diet changes) you'd like me to review?`;
}

function Chat() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState<string>("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "Hi! I'm your PetPal AI assistant. Ask me anything about your pet's care, diet, symptoms, or behavior." }]);
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
    
    const queryText = input.trim();
    const userMsg: Msg = { role: "user", content: queryText };
    const next = [...msgs, userMsg];
    
    setMsgs(next); 
    setInput(""); 
    setBusy(true);
    
    const pet = pets.find((p) => p.id === petId);
    
    try {
      const { data, error } = await supabase.functions.invoke("petpal-chat", {
        body: { messages: next.map((m) => ({ role: m.role, content: m.content })), pet },
      });
      
      if (error || data?.error) {
        // Fallback to local response if Supabase function is unavailable
        console.warn("Supabase function failed, falling back to local veterinarian parser.", error || data?.error);
        const fallbackText = generateLocalAIResponse(queryText, pet?.name ?? "your pet", pet?.species ?? "dog");
        
        // Add a slight delay for realistic AI feel
        await new Promise((r) => setTimeout(r, 1200));
        setMsgs([...next, { role: "assistant", content: fallbackText }]);
        setBusy(false);
        return;
      }
      
      setMsgs([...next, { role: "assistant", content: data.content }]);
    } catch (err) {
      console.warn("Supabase function invocation threw an error, falling back to local veterinarian parser.", err);
      const fallbackText = generateLocalAIResponse(queryText, pet?.name ?? "your pet", pet?.species ?? "dog");
      await new Promise((r) => setTimeout(r, 1200));
      setMsgs([...next, { role: "assistant", content: fallbackText }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] max-w-4xl flex-col transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">Expert clinical advice for your pet's well-being</p>
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
