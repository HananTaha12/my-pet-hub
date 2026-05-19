import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><CalendarPage /></AppShell></RequireAuth>),
});

type EventItem = {
  id: string;
  kind: "appointment" | "reminder";
  title: string;
  at: Date;
  href: string;
  subtitle?: string;
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

function CalendarPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;
    const from = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1).toISOString();
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0).toISOString();
    (async () => {
      const [{ data: appts }, { data: rems }] = await Promise.all([
        supabase.from("appointments").select("id, scheduled_at, status, services(name), pets(name)").eq("owner_id", user.id).gte("scheduled_at", from).lte("scheduled_at", to),
        supabase.from("reminders").select("id, title, due_at, status").eq("user_id", user.id).gte("due_at", from).lte("due_at", to),
      ]);
      const a: EventItem[] = ((appts ?? []) as any[]).map((x) => ({
        id: `a-${x.id}`,
        kind: "appointment",
        title: x.services?.name ?? "Appointment",
        subtitle: x.pets?.name ?? undefined,
        at: new Date(x.scheduled_at),
        href: "/appointments",
      }));
      const r: EventItem[] = ((rems ?? []) as any[]).map((x) => ({
        id: `r-${x.id}`,
        kind: "reminder",
        title: x.title,
        at: new Date(x.due_at),
        href: "/reminders",
      }));
      setEvents([...a, ...r]);
    })();
  }, [user, cursor]);

  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = first.getDay(); // 0 = Sun
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [cursor]);

  const eventsOn = (d: Date) => events.filter((e) => sameDay(e.at, d));
  const dayEvents = eventsOn(selected).sort((a, b) => a.at.getTime() - b.at.getTime());
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Calendar</h1>
        <Button asChild size="sm"><Link to="/book">+ Book</Link></Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setCursor(addMonths(cursor, -1))} className="rounded-full p-2 hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
          <p className="font-display text-lg font-semibold">{cursor.toLocaleString([], { month: "long", year: "numeric" })}</p>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="rounded-full p-2 hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (!d) return <div key={i} />;
            const evs = eventsOn(d);
            const isToday = sameDay(d, today);
            const isSel = sameDay(d, selected);
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={cn(
                  "relative aspect-square rounded-lg border text-sm transition-colors",
                  isSel ? "border-accent bg-accent/10" : "border-transparent hover:bg-secondary",
                  isToday && !isSel && "border-border"
                )}
              >
                <span className={cn("absolute left-1.5 top-1 text-xs", isToday && "font-bold text-accent")}>{d.getDate()}</span>
                {evs.length > 0 && (
                  <div className="absolute inset-x-1 bottom-1 flex justify-center gap-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn("h-1 w-1 rounded-full", e.kind === "appointment" ? "bg-accent" : "bg-primary")} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">{selected.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</h2>
        {dayEvents.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing scheduled.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {dayEvents.map((e) => (
              <li key={e.id}>
                <Link to={e.href} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/50">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", e.kind === "appointment" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary")}>
                    {e.kind === "appointment" ? <CalendarIcon className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{e.subtitle ? ` · ${e.subtitle}` : ""}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
