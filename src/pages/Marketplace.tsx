import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Database, Download } from "lucide-react";

const datasets = [
  {
    id: 1,
    title: "EV Drivers in the UK — 2025 Insights",
    description: "Comprehensive data on electric vehicle ownership patterns, charging habits, and preferences across the UK.",
    price: 499,
    impact: "Funds 50kg of CO₂ offset projects",
    fileType: "CSV/JSON",
  },
  {
    id: 2,
    title: "Tech Habits 2025",
    description: "Consumer technology usage patterns, device preferences, and digital behavior trends.",
    price: 349,
    impact: "Funds 35kg of CO₂ offset projects",
    fileType: "CSV/JSON",
  },
  {
    id: 3,
    title: "Green Consumers",
    description: "Sustainability-conscious consumer behavior, purchasing decisions, and environmental preferences.",
    price: 599,
    impact: "Funds 60kg of CO₂ offset projects",
    fileType: "CSV/JSON",
  },
  {
    id: 4,
    title: "Sustainable Fashion Trends",
    description: "Fashion industry consumer insights focused on sustainable and ethical clothing choices.",
    price: 399,
    impact: "Funds 40kg of CO₂ offset projects",
    fileType: "CSV/JSON",
  },
];

const Marketplace = () => {
  const handlePurchase = (datasetId: number) => {
    // Stripe integration will be added here
    console.log("Purchase dataset:", datasetId);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-4 text-center">
            Ethical Data Marketplace
          </h1>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            Purchase ethically-sourced datasets that fund environmental initiatives. 
            Every purchase comes with an Ethical Data Badge.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {datasets.map((dataset, index) => (
              <motion.div
                key={dataset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(71,229,139,0.2)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <Database className="w-10 h-10 text-primary" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ${dataset.price}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dataset.fileType}
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3">{dataset.title}</h3>
                <p className="text-muted-foreground mb-4 min-h-[60px]">
                  {dataset.description}
                </p>

                <div className="flex items-center gap-2 mb-4 text-sm text-primary">
                  <Download className="w-4 h-4" />
                  <span>{dataset.impact}</span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handlePurchase(dataset.id)}
                >
                  Purchase Dataset
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 bg-card/50 border border-border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Available on Partnered Platforms</h2>
            <p className="text-muted-foreground mb-6">
              Purchase our datasets directly through these verified data marketplaces — 
              each purchase comes with an Ethical Data Badge code for verification.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {["Kaggle", "DataHub", "Snowflake Marketplace"].map((platform) => (
                <Button key={platform} variant="outline">
                  {platform}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Marketplace;