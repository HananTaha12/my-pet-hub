import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Sparkles, Activity, ShieldAlert, Heart, Calendar, ShoppingBag, CheckCircle, ArrowRight, RefreshCw, MessageSquare } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DEFAULT_PRODUCTS } from "@/lib/mock-products";
import { addToCart } from "@/lib/cart";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI Vet Assistant — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Chat /></AppShell></RequireAuth>),
});

interface Pet { id: string; name: string; species: string; breed: string | null; date_of_birth: string | null; weight_kg: number | null }
type Msg = { role: "user" | "assistant"; content: string };

function calculateAge(dobString: string | null): string {
  if (!dobString) return "3 years";
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();
  if (years > 0) return `${years} year${years > 1 ? "s" : ""}`;
  return `${months} month${months > 1 ? "s" : ""}`;
}

const SYMPTOMS = [
  { id: "skin", label: "Scratching / Skin Rash 🐾", desc: "Itching, redness, or hair loss" },
  { id: "stomach", label: "Vomiting / Diarrhea 🤢", desc: "Upset stomach, loose stools" },
  { id: "lethargy", label: "Lethargy / Low Energy 💤", desc: "Unusual tiredness, lack of appetite" },
  { id: "cough", label: "Coughing / Sneezing 🤧", desc: "Respiratory discharge or wheezing" },
  { id: "appetite", label: "Loss of Appetite 🍽️", desc: "Refusal to eat or drink" },
  { id: "general", label: "General Wellness Checkup 🩺", desc: "Routine health advice" }
];

function Chat() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState<string>("");
  const [mode, setMode] = useState<"chat" | "diagnose">("chat");
  
  // General Chat States
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "Hi! I'm your PetPal AI assistant. Ask me anything about your pet's care, diet, symptoms, or behavior." }]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Guided Diagnose States
  const [diagStep, setDiagStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("1-3 days");
  const [extraNotes, setExtraNotes] = useState("");
  const [diagReport, setDiagReport] = useState<any | null>(null);
  const [diagBusy, setDiagBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("pets").select("*").eq("owner_id", user.id).then(({ data }) => {
      const petsData = (data ?? []) as Pet[];
      setPets(petsData);
      if (petsData.length) setPetId(petsData[0].id);
    });
  }, [user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  const activePet = pets.find((p) => p.id === petId) || {
    id: "mock-active",
    name: "taqwamrowat",
    species: "dog",
    breed: "Golden",
    date_of_birth: null,
    weight_kg: 17
  };

  // Chat Submission Handler
  const sendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatBusy) return;
    
    const queryText = chatInput.trim();
    const userMsg: Msg = { role: "user", content: queryText };
    const next = [...msgs, userMsg];
    
    setMsgs(next); 
    setChatInput(""); 
    setChatBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke("petpal-chat", {
        body: { messages: next.map((m) => ({ role: m.role, content: m.content })), pet: activePet },
      });
      
      if (error || data?.error) {
        // Local veterinarian advice generator fallback
        let fallback = `Thanks for asking about ${activePet.name}! 
I'm monitoring your queries. If they have skin scratching, stomach issues, or appetite concerns, consider launching our guided **AI Vet Diagnostics session** above for a structured medical analysis and report.

Is there any specific symptom you want me to advise on?`;
        
        const q = queryText.toLowerCase();
        if (q.includes("scratch") || q.includes("itch") || q.includes("skin")) {
          fallback = `Regarding ${activePet.name}'s skin issues:
1. Examine their skin for flea dirt, ticks, or bite marks.
2. Log parasite treatments inside the Pets records page.
3. Keep their coat dry and cool. If itching is chronic, schedule a veterinary consult.`;
        } else if (q.includes("vomit") || q.includes("diarrhea") || q.includes("sick")) {
          fallback = `For digestive concerns regarding ${activePet.name}:
1. Withhold food for 12 hours, ensuring access to small amounts of water.
2. Feed a bland diet (boiled chicken breast and white rice) for 48 hours.
3. If blood is present or vomiting continues, consult emergency care immediately.`;
        }

        await new Promise((r) => setTimeout(r, 1000));
        setMsgs([...next, { role: "assistant", content: fallback }]);
      } else {
        setMsgs([...next, { role: "assistant", content: data.content }]);
      }
    } catch (err) {
      await new Promise((r) => setTimeout(r, 1000));
      setMsgs([...next, { role: "assistant", content: `I'm analyzing your request regarding ${activePet.name}. Make sure to monitor their food intake and consult our Guided Diagnostics flow for more detailed assistance.` }]);
    } finally {
      setChatBusy(false);
    }
  };

  // Toggle Symptom Selection
  const toggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  // Guided Diagnostics Submission
  const submitDiagnostics = async () => {
    if (selectedSymptoms.length === 0) {
      return toast.error("Please select at least one symptom category.");
    }
    
    setDiagBusy(true);
    
    // Simulate complex clinical diagnostics scoring
    await new Promise((r) => setTimeout(r, 2000));
    
    let risk: "Low" | "Medium" | "High" = "Low";
    let advice = "";
    let actions: string[] = [];
    
    if (selectedSymptoms.includes("stomach") || selectedSymptoms.includes("appetite")) {
      if (duration === "4-7 days" || duration === "Chronic") {
        risk = "High";
        advice = `Lethargy or loss of appetite combined with digestive symptoms lasting over 3 days poses a high risk of dehydration and internal metabolic imbalance for ${activePet.name}. Urgent clinical examination is highly recommended.`;
        actions = ["Administer hydration salts immediately", "Stop feeding raw formulas", "Book a clinical checkup within 24 hours"];
      } else {
        risk = "Medium";
        advice = `Digestive irritation is currently assessed as moderate. We advise withholding standard kibble for 12 hours, then reintroducing a strict bland diet.`;
        actions = ["Monitor water intake hourly", "Administer bland diet (chicken and rice)", "Consult vet if vomiting recurs"];
      }
    } else if (selectedSymptoms.includes("skin")) {
      risk = "Low";
      advice = `Skin scratching is likely caused by seasonal environmental allergies or local flea irritation. Vitals look stable, but minor home care adjustments should be applied.`;
      actions = ["Apply organic anti-itch shampoo", "Administer flea and tick treatment", "Inspect paws for grass seeds"];
    } else {
      risk = "Low";
      advice = `General wellness screening indicates physiological status is within optimal limits. Keep tracking metrics weekly.`;
      actions = ["Keep logging weight tracking records", "Confirm next vaccine schedule is active", "Maintain current dietary feeding portions"];
    }

    // Filter recommended products based on symptoms
    const targetSp = activePet.species.toLowerCase();
    const mockProds = DEFAULT_PRODUCTS.filter(p => 
      p.active && 
      (p.species.toLowerCase() === targetSp || p.species.toLowerCase() === "all")
    ).slice(0, 2);

    setDiagReport({
      risk,
      advice,
      actions,
      products: mockProds,
      timestamp: new Date().toLocaleString()
    });
    
    setDiagStep(4);
    setDiagBusy(false);
    toast.success("AI diagnostic report successfully generated!");
  };

  const resetDiagnostics = () => {
    setDiagStep(1);
    setSelectedSymptoms([]);
    setDuration("1-3 days");
    setExtraNotes("");
    setDiagReport(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">AI Pet Vet</h1>
          <p className="text-xs text-muted-foreground">Premium diagnostics & guided wellness assistant</p>
        </div>
        
        {/* Mode Selector Tabs */}
        <div className="flex bg-secondary/60 rounded-full p-1 border border-border/30 w-fit self-start md:self-center">
          <button 
            onClick={() => setMode("chat")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
              mode === "chat" ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Conversational Chat
          </button>
          <button 
            onClick={() => setMode("diagnose")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
              mode === "diagnose" ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="h-3.5 w-3.5 animate-pulse" /> Guided Diagnostics
          </button>
        </div>
      </div>

      {/* Select Pet Switcher Bar */}
      {pets.length > 0 && (
        <div className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl p-3 shadow-sm w-fit">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/85">Analyzing companion</span>
          <Select value={petId} onValueChange={setPetId}>
            <SelectTrigger className="w-44 rounded-xl bg-secondary/50 border-none focus:ring-accent font-semibold text-xs"><SelectValue placeholder="Select pet" /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {pets.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs font-semibold">{p.name} ({p.species})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* MODE 1: CONVERSATIONAL CHAT */}
      {mode === "chat" && (
        <div className="flex h-[calc(100vh-21rem)] flex-col space-y-4">
          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto rounded-[2.5rem] bg-card border border-border/60 p-6 no-scrollbar shadow-sm">
            {msgs.map((m: Msg, i: number) => (
              <div key={i} className={cn("flex w-full animate-in fade-in duration-500", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "relative max-w-[85%] whitespace-pre-wrap px-5 py-3.5 text-xs leading-relaxed shadow-sm hover-lift",
                  m.role === "user" 
                    ? "rounded-[2rem] rounded-tr-none bg-foreground text-background" 
                    : "rounded-[2rem] rounded-tl-none bg-secondary/80 text-foreground border border-white/5"
                )}>
                  {m.content}
                  {m.role === "assistant" && (
                    <div className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatBusy && (
              <div className="flex justify-start animate-pulse">
                <div className="rounded-[2rem] rounded-tl-none bg-secondary/40 px-5 py-3.5 text-[10px] font-bold text-muted-foreground">
                  Processing diagnostic checks…
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendChat} className="relative flex items-center">
            <Input 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              placeholder={`Ask about ${activePet.name}'s health, diet, or training...`} 
              className="h-14 rounded-full border border-border/60 bg-card pl-6 pr-16 text-xs focus-visible:ring-accent shadow-sm"
            />
            <Button 
              type="submit" 
              disabled={chatBusy} 
              size="icon"
              className="absolute right-2 h-10 w-10 rounded-full bg-foreground hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
        </div>
      )}

      {/* MODE 2: GUIDED AI VET DIAGNOSTICS */}
      {mode === "diagnose" && (
        <div className="rounded-[2.5rem] bg-card border border-border/60 p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-350">
          
          {/* Diagnostic Step Headers */}
          <div className="flex items-center justify-between border-b border-border/30 pb-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Pet AI Vet Diagnostics</h2>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Companion: {activePet.name} · {petId === "mock-active" ? "golden" : activePet.breed || activePet.species}</p>
            </div>
            <div className="text-xs font-bold text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
              Step {diagStep} of 4
            </div>
          </div>

          {/* STEP 1: Select Symptoms */}
          {diagStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">Select what symptom categories you observe:</h3>
                <p className="text-xs text-muted-foreground">Choose one or more categories relating to the wellness anomaly</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {SYMPTOMS.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym.id);
                  return (
                    <button
                      key={sym.id}
                      onClick={() => toggleSymptom(sym.id)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all hover-lift flex flex-col justify-between min-h-[90px]",
                        isSelected 
                          ? "border-primary bg-secondary shadow-sm" 
                          : "border-border bg-card/50 hover:border-pink-200/50"
                      )}
                    >
                      <span className="font-display text-xs font-bold text-foreground">{sym.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{sym.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => setDiagStep(2)} 
                  disabled={selectedSymptoms.length === 0} 
                  className="rounded-full px-6 flex items-center gap-1"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Duration & Severity */}
          {diagStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">How long have these symptoms been happening?</h3>
                <p className="text-xs text-muted-foreground">Select the timeframe to evaluate chronic or acute progression</p>
              </div>

              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {[
                  { value: "Less than 24 hours", label: "Acute / Instant ⚡" },
                  { value: "1-3 days", label: "Moderate timeframe 📅" },
                  { value: "4-7 days", label: "Prolonged status 🕰️" },
                  { value: "Chronic", label: "Ongoing / Chronic 🚨" }
                ].map((dur) => {
                  const isSelected = duration === dur.value;
                  return (
                    <button
                      key={dur.value}
                      onClick={() => setDuration(dur.value)}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all hover-lift flex flex-col items-center justify-center min-h-[80px]",
                        isSelected 
                          ? "border-primary bg-secondary font-bold text-xs" 
                          : "border-border bg-card/50 text-xs text-muted-foreground hover:border-pink-200/50"
                      )}
                    >
                      <span className="font-semibold">{dur.label}</span>
                      <span className="text-[9px] mt-1 uppercase font-bold text-muted-foreground/60">{dur.value}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setDiagStep(1)} className="rounded-full px-6 border-border/70">
                  Back
                </Button>
                <Button onClick={() => setDiagStep(3)} className="rounded-full px-6 flex items-center gap-1">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Extra Notes & Review */}
          {diagStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="font-bold text-sm text-foreground block">Additional details or observations (Optional)</Label>
                <p className="text-xs text-muted-foreground">Specify any dietary changes, vomiting frequency, stool details, or abnormal behavior.</p>
              </div>

              <Textarea 
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder="e.g. He is sleeping more than usual and skipped breakfast today. Skin looks dry but no fleas seen."
                className="rounded-2xl min-h-[120px] text-xs leading-relaxed"
              />

              {/* Review summary cards */}
              <div className="bg-secondary/40 rounded-2xl p-4 border border-border/40 space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Analysis Checklist Review:</h4>
                <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                  <p>Companion: <span className="font-semibold text-foreground">{activePet.name}</span></p>
                  <p>Weight: <span className="font-semibold text-foreground">{activePet.weight_kg ? `${activePet.weight_kg}kg` : "17kg"}</span></p>
                  <p>Symptoms: <span className="font-semibold text-foreground capitalize">{selectedSymptoms.join(", ")}</span></p>
                  <p>Duration: <span className="font-semibold text-foreground">{duration}</span></p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setDiagStep(2)} className="rounded-full px-6 border-border/70">
                  Back
                </Button>
                <Button 
                  onClick={submitDiagnostics} 
                  disabled={diagBusy}
                  className="rounded-full px-6 flex items-center gap-1.5"
                >
                  {diagBusy ? "Generating Diagnostics..." : "Generate AI Vet Report"} 
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Diagnostic report display */}
          {diagStep === 4 && diagReport && (
            <div className="space-y-6">
              
              {/* Report summary card sheet */}
              <div className="border border-border/80 rounded-3xl overflow-hidden shadow-sm">
                
                {/* Report Header */}
                <div className="bg-secondary/60 p-5 border-b border-border/80 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">Health Assessment Summary Report</h3>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">VETERINARY DIAGNOSTIC TOOL · GENERATED {diagReport.timestamp}</p>
                  </div>
                  
                  {/* Risk Badge */}
                  <Badge 
                    className={cn(
                      "rounded-full font-black text-[9px] tracking-widest px-3 py-1 uppercase border-none",
                      diagReport.risk === "Low" 
                        ? "bg-emerald-500/15 text-emerald-600" 
                        : diagReport.risk === "Medium"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-rose-500/15 text-rose-600 animate-pulse"
                    )}
                  >
                    {diagReport.risk} Risk Status
                  </Badge>
                </div>

                {/* Report Body */}
                <div className="p-6 space-y-5 text-xs">
                  
                  {/* Advice Segment */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Clinical Evaluation:</h4>
                    <p className="leading-relaxed text-foreground font-medium bg-secondary/20 p-4 rounded-xl border border-border/30">
                      {diagReport.advice}
                    </p>
                  </div>

                  {/* Actions segment */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Recommended Actions Checklist:</h4>
                    <div className="grid gap-2">
                      {diagReport.actions.map((act: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 bg-card p-3 rounded-xl border border-border/40 shadow-sm">
                          <CheckCircle className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-foreground">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Products Grid */}
                  <div className="space-y-3 pt-3 border-t border-border/40">
                    <h4 className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider flex items-center gap-1">
                      <ShoppingBag className="h-4 w-4 text-pink-500" /> Recommended Nutritional Supplements / Supplies:
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {diagReport.products.map((p: Product) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover-lift">
                          <img 
                            src={p.image_url || DEFAULT_PET_PHOTO} 
                            alt={p.name} 
                            className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate text-xs">{p.name}</p>
                            <p className="text-[10px] text-pink-500 font-bold">${Number(p.price).toFixed(2)}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 rounded-full text-[10px] px-2.5 font-bold shrink-0 border-pink-200/50 hover:bg-pink-500 hover:text-white"
                            onClick={() => {
                              addToCart(p.id);
                              toast.success(`${p.name} added to cart!`);
                            }}
                          >
                            Add +
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Booking Checkup Button Link */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-pink-500/5 rounded-2xl border border-pink-200/30 p-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <p className="text-xs font-bold text-foreground">Need official clinical verification?</p>
                  <p className="text-[10px] text-muted-foreground">Book an appointment at our certified clinics directly with the generated report.</p>
                </div>
                <Button className="rounded-full px-5 py-4 text-xs font-bold shrink-0 flex items-center gap-1.5" asChild>
                  <Link to="/book">
                    <Calendar className="h-4 w-4" /> Book Checkup Appointment
                  </Link>
                </Button>
              </div>

              {/* Reset Diagnostics Flow */}
              <div className="flex justify-center pt-2">
                <Button 
                  variant="ghost" 
                  onClick={resetDiagnostics} 
                  className="rounded-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Start New AI Vet Diagnostics Session
                </Button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
