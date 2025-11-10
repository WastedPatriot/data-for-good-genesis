import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Shield, Zap, MapPin, Power, ChevronRight, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

const virtualLocations = [
  { id: 1, country: "United States", flag: "🇺🇸", city: "New York", ping: 45, region: "Americas" },
  { id: 2, country: "United Kingdom", flag: "🇬🇧", city: "London", ping: 32, region: "Europe" },
  { id: 3, country: "Germany", flag: "🇩🇪", city: "Frankfurt", ping: 28, region: "Europe" },
  { id: 4, country: "Japan", flag: "🇯🇵", city: "Tokyo", ping: 89, region: "Asia" },
  { id: 5, country: "Singapore", flag: "🇸🇬", city: "Singapore", ping: 95, region: "Asia" },
  { id: 6, country: "Australia", flag: "🇦🇺", city: "Sydney", ping: 112, region: "Oceania" },
  { id: 7, country: "Canada", flag: "🇨🇦", city: "Toronto", ping: 52, region: "Americas" },
  { id: 8, country: "France", flag: "🇫🇷", city: "Paris", ping: 35, region: "Europe" },
  { id: 9, country: "Netherlands", flag: "🇳🇱", city: "Amsterdam", ping: 30, region: "Europe" },
];

const VirtualLocation = () => {
  const [isActive, setIsActive] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLocations = virtualLocations.filter(loc =>
    loc.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = () => {
    if (!selectedLocation) {
      return;
    }
    setIsActive(!isActive);
  };

  const handleSelectLocation = (location: any) => {
    setSelectedLocation(location);
    if (!isActive) {
      setIsActive(true);
    }
  };

  const getPingColor = (ping: number) => {
    if (ping < 50) return "text-green-500";
    if (ping < 100) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 via-primary/10 to-background pt-8 pb-12 px-4"
      >
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Virtual Location</h1>
          <p className="text-muted-foreground">
            Access content from anywhere. Appear online from a country of your choice.
          </p>
        </div>
      </motion.div>

      <div className="container mx-auto max-w-4xl px-4 mt-8">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur overflow-hidden">
            <div className={`h-1 ${isActive ? 'bg-green-500' : 'bg-muted'} transition-colors`}></div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${isActive ? 'bg-green-500/20' : 'bg-muted'}`}>
                    <Globe className={`w-6 h-6 ${isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <CardTitle>
                      {isActive ? 'Connected' : 'Disconnected'}
                    </CardTitle>
                    <CardDescription>
                      {isActive && selectedLocation
                        ? `Appearing from ${selectedLocation.city}, ${selectedLocation.country}`
                        : 'Select a location to get started'}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggle}
                  disabled={!selectedLocation}
                />
              </div>
            </CardHeader>

            {isActive && selectedLocation && (
              <CardContent>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{selectedLocation.city}</p>
                  </div>
                  <div className="text-center">
                    <Zap className={`w-5 h-5 mx-auto mb-1 ${getPingColor(selectedLocation.ping)}`} />
                    <p className="text-xs text-muted-foreground">Latency</p>
                    <p className="text-sm font-medium">{selectedLocation.ping}ms</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium">Active</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Info Alert */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Virtual Location masks your IP address but is not a full VPN. Use for accessing region-locked content and basic privacy.
          </AlertDescription>
        </Alert>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Globe,
              title: "Access Content",
              description: "Stream services from your home country"
            },
            {
              icon: Shield,
              title: "Basic Privacy",
              description: "Browse more privately on public WiFi"
            },
            {
              icon: Zap,
              title: "Fast Speeds",
              description: "Optimized for streaming and browsing"
            }
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <benefit.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Location Selection */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>Choose where you want to appear online</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLocations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                    selectedLocation?.id === location.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50'
                  }`}
                  onClick={() => handleSelectLocation(location)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{location.flag}</span>
                      <div>
                        <p className="font-medium">{location.country}</p>
                        <p className="text-sm text-muted-foreground">{location.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={getPingColor(location.ping)}>
                        {location.ping}ms
                      </Badge>
                      {selectedLocation?.id === location.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VirtualLocation;
