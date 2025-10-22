import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Database, Leaf, TrendingUp } from "lucide-react";
import EarthLogo from "@/components/EarthLogo";

const Home = () => {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Content */}
        <div className="container mx-auto px-4 z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-block mb-8 p-4 rounded-full bg-background/30 backdrop-blur-sm"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 30, 
                repeat: Infinity, 
                ease: "linear",
              }}
            >
              <div className="w-24 h-24 mx-auto">
                <EarthLogo size={96} />
              </div>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Your data already gets taken.
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-foreground">
              Let's make it count for good.
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              We turn volunteered data into environmental funding. Every dataset purchase 
              supports green projects voted on by the community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contribute">
                <Button size="lg" className="text-lg px-8 py-6">
                  Contribute My Data
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Buy Ethical Data
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "Share Your Data",
                description: "Choose what data you're comfortable sharing through our simple, transparent quiz.",
              },
              {
                icon: TrendingUp,
                title: "Fund Green Projects",
                description: "Your data is ethically sold to verified companies, generating funds for environmental initiatives.",
              },
              {
                icon: Leaf,
                title: "Vote & Impact",
                description: "The community votes on which green projects get funded. Track your direct impact.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-colors"
              >
                <item.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-24 px-4 bg-card/50">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Our Impact
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "—", label: "Datasets Contributed" },
              { value: "—", label: "Funds Raised" },
              { value: "—", label: "Projects Funded" },
              { value: "—", label: "Trees Planted" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Join the Movement
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be part of the data revolution. Your information can heal the planet.
            </p>
            <Link to="/about">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Learn More About Our Mission
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;