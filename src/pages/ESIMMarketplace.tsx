import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Globe, Wifi, MapPin, Filter, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock eSIM plans data - will be replaced with API integration
const mockPlans = [
  {
    id: 1,
    country: "United States",
    flag: "🇺🇸",
    region: "North America",
    data: "5GB",
    validity: "30 days",
    price: 12.99,
    speed: "4G/5G",
    coverage: "Nationwide",
    popular: true
  },
  {
    id: 2,
    country: "United Kingdom",
    flag: "🇬🇧",
    region: "Europe",
    data: "3GB",
    validity: "30 days",
    price: 8.99,
    speed: "4G/5G",
    coverage: "Nationwide"
  },
  {
    id: 3,
    country: "Japan",
    flag: "🇯🇵",
    region: "Asia",
    data: "10GB",
    validity: "15 days",
    price: 15.99,
    speed: "4G/5G",
    coverage: "Major cities",
    popular: true
  },
  {
    id: 4,
    country: "France",
    flag: "🇫🇷",
    region: "Europe",
    data: "5GB",
    validity: "30 days",
    price: 9.99,
    speed: "4G/5G",
    coverage: "Nationwide"
  },
  {
    id: 5,
    country: "Australia",
    flag: "🇦🇺",
    region: "Oceania",
    data: "8GB",
    validity: "30 days",
    price: 14.99,
    speed: "4G/5G",
    coverage: "Nationwide"
  },
  {
    id: 6,
    country: "Global",
    flag: "🌍",
    region: "Worldwide",
    data: "20GB",
    validity: "30 days",
    price: 49.99,
    speed: "4G/5G",
    coverage: "150+ countries",
    popular: true
  }
];

const ESIMMarketplace = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const filteredPlans = mockPlans.filter(plan => {
    const matchesSearch = plan.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === "all" || plan.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handlePurchase = (planId: number) => {
    navigate(`/esim/purchase/${planId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background pt-8 pb-16 px-4"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">200+ Countries Covered</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Stay Connected Anywhere
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Instant eSIM data plans for travelers. No physical SIM needed. 
              <span className="text-primary font-medium"> Connect globally, give back locally.</span>
            </p>

            {/* Environmental Impact Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground">
              <span className="text-sm">🌱 Every purchase plants trees & offsets carbon</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background/80 backdrop-blur"
              />
            </div>
            
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full md:w-48 h-12 bg-background/80 backdrop-blur">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Asia">Asia</SelectItem>
                <SelectItem value="North America">North America</SelectItem>
                <SelectItem value="Oceania">Oceania</SelectItem>
                <SelectItem value="Worldwide">Worldwide</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 h-12 bg-background/80 backdrop-blur">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="data">Data Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className="container mx-auto max-w-6xl px-4 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Available Plans</h2>
          <span className="text-sm text-muted-foreground">{filteredPlans.length} plans found</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur">
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{plan.flag}</span>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{plan.country}</CardTitle>
                      <CardDescription className="text-xs">{plan.region}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Wifi className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{plan.data}</span>
                    <span className="text-muted-foreground">• {plan.validity}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{plan.coverage}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {plan.speed}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">${plan.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      🌍 Includes carbon offset
                    </p>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase(plan.id)}
                  >
                    Get This Plan
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredPlans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No plans found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ESIMMarketplace;
