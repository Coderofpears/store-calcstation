import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Simple protected route gate using Supabase auth session
// - Sets up onAuthStateChange FIRST, then checks existing session
// - Avoids async work in the callback to prevent deadlocks
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
      setIsReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session?.user);
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isReady) {
    return (
      <main className="container py-24 text-center">
        <p className="text-sm text-muted-foreground">Checking authentication…</p>
      </main>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
