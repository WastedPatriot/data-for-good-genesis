import { useSiteTheme } from "@/hooks/useSiteTheme";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";

export default function ThemeSwitcher() {
  const { themes, activeTheme, override, setThemeOverride } = useSiteTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm" className="shadow">
            <Palette className="mr-2 h-4 w-4" /> Theme
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Website Theme</div>
              <div className="text-muted-foreground">Pick your preference</div>
            </div>
            {activeTheme && <Badge>{activeTheme.name}</Badge>}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Button variant={override ? "outline" : "default"} size="sm" onClick={() => setThemeOverride(null)}>
              Use default
            </Button>
          </div>
          <ScrollArea className="h-56">
            <div className="space-y-2">
              {themes.map((t) => (
                <div key={t.slug} className="flex items-center justify-between rounded-md border p-2">
                  <div className="text-sm">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-muted-foreground">{t.slug}</div>
                  </div>
                  <Button size="sm" variant={override === t.slug ? "default" : "outline"} onClick={() => setThemeOverride(t.slug)}>
                    {override === t.slug ? "Selected" : "Select"}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}