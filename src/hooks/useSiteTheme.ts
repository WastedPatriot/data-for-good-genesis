import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Region-aware gating for holiday themes
// Predicate receives ISO country code (e.g., "US", "GB") and returns whether to allow auto-activation
const THEME_REGIONS: Record<string, (country: string) => boolean> = {
  "independence-day": (country) => country === "US",
  thanksgiving: (country) => country === "US",
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

function getSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get(name);
    return v && v.trim().length ? v.trim() : null;
  } catch {
    return null;
  }
}

function normalizeCountry(input?: string | null): string | null {
  if (!input) return null;
  const v = input.replace(/[^a-zA-Z]/g, "").slice(-2).toUpperCase();
  return v.length === 2 ? v : null;
}

function detectCountry(): string {
  // 1) URL overrides (handy for admin testing): ?region=US or ?country=GB
  const urlCountry = normalizeCountry(getSearchParam("region") || getSearchParam("country"));
  if (urlCountry) return urlCountry;

  // 2) Local storage override (for QA): siteThemeCountryOverride
  try {
    const lsCountry = normalizeCountry(localStorage.getItem("siteThemeCountryOverride"));
    if (lsCountry) return lsCountry;
  } catch {}

  // 3) Navigator language (e.g., en-US)
  const lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const parts = lang.split("-");
  if (parts.length >= 2) return normalizeCountry(parts[1]) || "US";

  // 4) Fallback
  return "US";
}

export function useSiteTheme() {
  const [themes, setThemes] = useState<SiteTheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Local, persistent user override via ThemeSwitcher
  const [override, setOverride] = useState<string | null>(() => {
    try {
      return localStorage.getItem("siteThemeOverride");
    } catch {
      return null;
    }
  });

  // URL override (non-persistent) for admin testing: ?theme=christmas
  const [urlOverride, setUrlOverride] = useState<string | null>(() => getSearchParam("theme"));

  // Watch URL for changes (SPA navigations that change query)
  useEffect(() => {
    const onPopState = () => setUrlOverride(getSearchParam("theme"));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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

  const country = detectCountry();
  const today = new Date();

  const activeTheme = useMemo(() => {
    // URL override takes highest precedence (admin test)
    const forced = urlOverride && themes.find((t) => t.slug === urlOverride);
    if (forced) return forced;

    // User-selected override next
    if (override) {
      const chosen = themes.find((t) => t.slug === override) || null;
      if (chosen) return chosen;
    }

    // Otherwise, compute best match
    const preferred = themes.find((t) => t.is_active) || null;

    const withinDates = themes.filter((t) => {
      const startOk = !t.start_date || new Date(t.start_date) <= today;
      const endOk = !t.end_date || today <= new Date(t.end_date);
      return startOk && endOk;
    });

    const gated = withinDates.filter((t) => {
      const allow = THEME_REGIONS[t.slug] ? THEME_REGIONS[t.slug](country) : true;
      return allow;
    });

    return preferred || gated[0] || null;
  }, [themes, override, urlOverride, country]);

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
