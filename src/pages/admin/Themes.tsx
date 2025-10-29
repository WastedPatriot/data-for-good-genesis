import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CalendarDays, PaintBucket } from "lucide-react";

interface ThemeRecord {
  id?: string;
  slug: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  config?: any;
}

const PRESET_THEMES: Array<Pick<ThemeRecord, "slug" | "name"> & { emoji: string }> = [
  { slug: "christmas", name: "Christmas", emoji: "🎄" },
  { slug: "new-year", name: "New Year", emoji: "🎆" },
  { slug: "valentines", name: "Valentine's Day", emoji: "💝" },
  { slug: "earth-day", name: "Earth Day", emoji: "🌍" },
  { slug: "halloween", name: "Halloween", emoji: "🎃" },
  { slug: "thanksgiving", name: "Thanksgiving", emoji: "🦃" },
  { slug: "pride", name: "Pride", emoji: "🏳️‍🌈" },
  { slug: "independence-day", name: "Independence Day", emoji: "🗽" },
];

export default function AdminThemes() {
  const { toast } = useToast();
  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string>("christmas");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activateNow, setActivateNow] = useState<boolean>(true);

  const activeTheme = useMemo(() => themes.find(t => t.is_active), [themes]);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_themes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setThemes(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load themes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveTheme = async () => {
    try {
      const preset = PRESET_THEMES.find(p => p.slug === selectedSlug)!;
      // Optionally deactivate all when activating now
      if (activateNow) {
        await supabase.from("site_themes").update({ is_active: false }).neq("slug", selectedSlug);
      }

      const upsertRecord: ThemeRecord = {
        slug: selectedSlug,
        name: preset.name,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: activateNow,
        config: {
          // Place for design tokens or artwork references if needed later
          badge: preset.emoji,
        },
      };

      const { error } = await supabase.from("site_themes").upsert(upsertRecord, { onConflict: "slug" });
      if (error) throw error;

      toast({ title: "Theme saved", description: `${preset.emoji} ${preset.name}` });
      loadThemes();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Unable to save theme", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <PaintBucket className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold">Website Themes</h1>
          <p className="text-muted-foreground">Schedule and activate seasonal/holiday themes</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Theme</CardTitle>
            <CardDescription>Choose a preset and schedule dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Preset</Label>
              <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_THEMES.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>
                      {t.emoji} {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2"><CalendarDays className="w-4 h-4" />Start date</Label>
                <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-2"><CalendarDays className="w-4 h-4" />End date</Label>
                <Input type="date" className="mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Activate now
                </Label>
                <p className="text-sm text-muted-foreground">Immediately set this theme live</p>
              </div>
              <Switch checked={activateNow} onCheckedChange={setActivateNow} />
            </div>

            <Button className="w-full" onClick={saveTheme}>
              Save Theme
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current & Scheduled</CardTitle>
            <CardDescription>Overview of all configured themes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading themes…</p>
            ) : themes.length === 0 ? (
              <p className="text-muted-foreground">No themes yet. Create one on the left.</p>
            ) : (
              <div className="space-y-3">
                {themes.map((t) => {
                  const preset = PRESET_THEMES.find(p => p.slug === t.slug);
                  return (
                    <div key={t.slug} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{preset?.emoji}</span>
                          <span className="font-medium">{t.name}</span>
                          {t.is_active && <Badge>Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.start_date || "—"} → {t.end_date || "—"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={async () => {
                          await supabase.from("site_themes").update({ is_active: false });
                          await supabase.from("site_themes").update({ is_active: true }).eq("slug", t.slug);
                          toast({ title: `Activated ${t.name}` });
                          loadThemes();
                        }}>Activate</Button>
                        <Button variant="destructive" size="sm" onClick={async () => {
                          await supabase.from("site_themes").delete().eq("slug", t.slug);
                          toast({ title: `Deleted ${t.name}` });
                          loadThemes();
                        }}>Delete</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
