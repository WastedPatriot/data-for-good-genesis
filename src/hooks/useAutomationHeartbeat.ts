import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useAutomationHeartbeat
 * Silently triggers the backend automation on an interval for admins.
 * Runs only when an admin is logged in. No UI impact.
 */
export function useAutomationHeartbeat(intervalMs: number = 120000) {
  const runningRef = useRef(false);

  useEffect(() => {
    let intervalId: number | undefined;
    let isAdmin = false;

    const init = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) return;
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        isAdmin = !!role;
        if (!isAdmin) return;

        const tick = async () => {
          if (runningRef.current) return;
          runningRef.current = true;
          try {
            // Run AI curation and dataset building
            // Note: external-ingest is called by external scrapers with HMAC auth, not here
            await supabase.functions.invoke("run-automation");
          } catch (e) {
            // Silent
          } finally {
            runningRef.current = false;
          }
        };

        // initial tick
        tick();
        // schedule
        intervalId = window.setInterval(tick, intervalMs);
      } catch (e) {
        // Silent
      }
    };

    init();
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [intervalMs]);
}
