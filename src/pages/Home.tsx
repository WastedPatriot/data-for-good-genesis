import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Database, Leaf, TrendingUp } from "lucide-react";
import DoomsdayCountdown from "@/components/DoomsdayCountdown";

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
            <div className="mb-12">
              <DoomsdayCountdown />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 text-gradient glow-text leading-tight tracking-tight">
              Your data already gets taken.
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-foreground leading-tight">
              Let's make it count for good.
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              We turn volunteered data into environmental funding. Every dataset purchase 
              supports green projects voted on by the community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contribute">
                <Button size="lg" className="text-lg px-8 py-6 border-glow hover-lift font-bold">
                  Contribute My Data
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift border-2 font-bold">
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
            className="text-4xl md:text-5xl font-black text-center mb-16 text-gradient"
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
                className="bg-card border-2 border-border rounded-xl p-8 hover-lift hover:border-primary backdrop-blur-sm"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
                  <item.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
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
            className="text-4xl md:text-5xl font-black text-center mb-16 text-gradient"
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
                <div className="text-4xl md:text-6xl font-black text-gradient glow-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
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
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-gradient glow-text">
              Join the Movement
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Be part of the data revolution. Your information can heal the planet.
            </p>
            <Link to="/about">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift border-2 font-bold">
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