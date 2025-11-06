/**
 * Shared Authentication & Authorization Utilities
 * 
 * Centralized admin role checking to prevent code duplication
 * and ensure consistent authorization across all edge functions.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Verify if a user has admin role
 * 
 * @throws Error if user is not an admin
 * @returns true if user is admin
 */
export async function requireAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: roleData, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("[requireAdmin] Database error:", error);
    throw new Error("UNAUTHORIZED: Failed to verify admin status");
  }

  if (!roleData) {
    throw new Error("UNAUTHORIZED: Admin access required");
  }

  return true;
}

/**
 * Check if user has admin role (non-throwing version)
 * 
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    return !!roleData;
  } catch (error) {
    console.error("[isAdmin] Error checking admin status:", error);
    return false;
  }
}
