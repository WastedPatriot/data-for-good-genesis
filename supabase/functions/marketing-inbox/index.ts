import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InboxRequest {
  account?: string; // "all" | specific email
  filter?: "all" | "inbox" | "sent";
  search?: string;
  page?: number;
  pageSize?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Auth
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const { data: userData } = token
      ? await supabase.auth.getUser(token)
      : ({ data: { user: null } } as any);
    const user = userData?.user || null;

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, code: "UNAUTHORIZED", error: "Sign in required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Admin check
    const { data: roleData, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleErr) {
      console.error("[marketing-inbox] role check error", roleErr);
    }

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, code: "FORBIDDEN", error: "Admin access required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const body = (await req.json()) as InboxRequest;
    const account = body.account && body.account !== "all" ? body.account : null;
    const filter = body.filter ?? "all";
    const search = (body.search || "").trim();
    const page = Math.max(1, body.page || 1);
    const pageSize = Math.min(100, Math.max(5, body.pageSize || 25));

    const items: any[] = [];

    // Contacts (inbound only)
    if (filter !== "sent") {
      let q = supabase
        .from("contact_submissions")
        .select("id, email, subject, message, name, created_at, status")
        .order("created_at", { ascending: false })
        .limit(500);

      if (search) {
        q = q.or(
          `email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
        );
      }

      const { data: contacts, error: contactsErr } = await q;
      if (contactsErr) console.error("[marketing-inbox] contacts error", contactsErr);

      (contacts || []).forEach((c: any) => {
        // Map to unified model
        items.push({
          id: c.id,
          type: "contact",
          direction: "inbound",
          from_email: c.email,
          to_email: "contact@dataforearth.org",
          subject: c.subject ?? "(no subject)",
          message: c.message ?? "",
          sent_at: c.created_at,
          status: c.status ?? "received",
          contact_name: c.name ?? undefined,
        });
      });
    }

    // Conversation threads (inbound/outbound)
    let q2 = supabase
      .from("conversation_threads")
      .select("id, direction, from_email, to_email, subject, message, sent_at, status")
      .order("sent_at", { ascending: false })
      .limit(500);

    if (account) {
      q2 = q2.or(`from_email.eq.${account},to_email.eq.${account}`);
    }
    if (filter === "inbox") {
      q2 = q2.eq("direction", "inbound");
    } else if (filter === "sent") {
      q2 = q2.eq("direction", "outbound");
    }
    if (search) {
      q2 = q2.or(
        `from_email.ilike.%${search}%,to_email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    const { data: threads, error: threadsErr } = await q2;
    if (threadsErr) console.error("[marketing-inbox] threads error", threadsErr);

    (threads || []).forEach((t: any) => {
      items.push({
        id: t.id,
        type: "conversation",
        direction: t.direction,
        from_email: t.from_email,
        to_email: t.to_email,
        subject: t.subject ?? "(no subject)",
        message: t.message ?? "",
        sent_at: t.sent_at ?? new Date().toISOString(),
        status: t.status ?? "",
      });
    });

    // Optional account filter for contacts (apply after mapping)
    const filtered = items.filter((it) => {
      if (account) {
        if (it.type === "contact") {
          // Contacts go to our inbound address; show only if account matches recipient
          return it.to_email === account;
        }
        return it.from_email === account || it.to_email === account;
      }
      return true;
    });

    // Sort and paginate
    filtered.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    const totalItems = filtered.length;
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, totalItems);
    const pageItems = filtered.slice(start, end);

    const counts = {
      total: filtered.length,
      inbox: filtered.filter((e) => e.direction === "inbound").length,
      sent: filtered.filter((e) => e.direction === "outbound").length,
    };

    return new Response(
      JSON.stringify({ success: true, items: pageItems, counts, page, pageSize, totalItems }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[marketing-inbox] error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, code: "SERVER_ERROR", error: msg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});