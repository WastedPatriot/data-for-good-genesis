import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Simple geo/locale gating for auto-activation preferences per theme
const THEME_REGIONS: Record<string, (locale: string) => boolean> = {
  "independence-day": (locale) => locale.toLowerCase().includes("-us"),
  thanksgiving: (locale) => locale.toLowerCase().includes("-us"),
  pride: () => true,
  halloween: () => true,
  christmas: () => true,
  "new-year": () => true,
  "earth-day": () => true,
  valentines: () => true,
};

export type SiteTheme = {
  slug: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  config?: any;
};

export function useSiteTheme() {
  const [themes, setThemes] = useState<SiteTheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Load override from localStorage
  const [override, setOverride] = useState<string | null>(() => {
    try { return localStorage.getItem("siteThemeOverride"); } catch { return null; }
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("site_themes").select("*");
        if (error) throw error;
        setThemes(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const locale = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
  const today = new Date();

  const activeTheme = useMemo(() => {
    if (override) {
      return themes.find((t) => t.slug === override) || null;
    }

    // pick is_active first
    const preferred = themes.find((t) => t.is_active) || null;
    const withinDates = themes.filter((t) => {
      const startOk = !t.start_date || new Date(t.start_date) <= today;
      const endOk = !t.end_date || today <= new Date(t.end_date);
      return startOk && endOk;
    });

    const gated = withinDates.filter((t) => {
      const allow = THEME_REGIONS[t.slug] ? THEME_REGIONS[t.slug](locale) : true;
      return allow;
    });

    return preferred || gated[0] || null;
  }, [themes, override, locale]);

  // Apply attribute for CSS theming (design tokens can react to this)
  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme?.slug) {
      root.setAttribute("data-site-theme", activeTheme.slug);
    } else {
      root.removeAttribute("data-site-theme");
    }
  }, [activeTheme?.slug]);

  const setThemeOverride = (slug: string | null) => {
    setOverride(slug);
    try {
      if (slug) localStorage.setItem("siteThemeOverride", slug);
      else localStorage.removeItem("siteThemeOverride");
    } catch {}
  };

  return { themes, activeTheme, loading, override, setThemeOverride };
}