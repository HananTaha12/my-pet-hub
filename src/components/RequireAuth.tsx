import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children, staffOnly = false }: { children: ReactNode; staffOnly?: boolean }) {
  const { user, loading, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (staffOnly && !isStaff) {
      navigate({ to: "/home" });
    }
  }, [user, loading, isStaff, staffOnly, navigate]);

  if (loading || !user || (staffOnly && !isStaff)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
