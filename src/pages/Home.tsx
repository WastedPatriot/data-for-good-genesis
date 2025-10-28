import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Database, Leaf, TrendingUp, Heart, Shield, Zap } from "lucide-react";
import DataImpactCounter from "@/components/DataImpactCounter";

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
              <DataImpactCounter />
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 text-gradient-hero glow-text leading-tight tracking-tight">
              Your Data.
              <br />
              Your Power.
              <br />
              <span className="text-gradient">Real Impact.</span>
            </h1>
            
            <div className="card-gradient border-2 border-primary/30 rounded-2xl p-8 mb-10 max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground leading-tight">
                The ethical alternative to <span className="text-destructive">data exploitation</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-4">
                <span className="text-primary font-bold">DataForEarth</span> turns voluntary data contributions into funding for causes that matter. 
                Your data creates valuable datasets. Those datasets generate revenue. That revenue funds environmental, medical, and social projects—chosen by contributors like you.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-foreground/80">100% Voluntary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent"></div>
                  <span className="text-foreground/80">100% Transparent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-foreground/80">100% Profit to Causes</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit-data">
                <Button size="lg" className="text-lg px-8 py-6 border-glow hover-lift font-bold">
                  <Heart className="w-5 h-5 mr-2" />
                  Submit Your Data
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift border-2 font-bold">
                  <Database className="w-5 h-5 mr-2" />
                  Explore Datasets
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
            className="text-4xl md:text-5xl font-black text-center mb-4 text-gradient"
          >
            Be a Data Hero
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto"
          >
            Three simple steps to turn your voluntary data contribution into real-world impact
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "You're in Control",
                description: "Choose exactly what you share through our transparent, easy process. No tricks, no hidden terms. Your data, your decision.",
              },
              {
                icon: Database,
                title: "Your Data Creates Value",
                description: "We package anonymized data into valuable datasets for researchers, businesses, and innovators solving real problems.",
              },
              {
                icon: Heart,
                title: "Fund What Matters",
                description: "100% of profits fund causes you vote on - from environmental projects to medical research to community programs.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="card-gradient border-2 border-border rounded-2xl p-8 hover-lift hover:border-primary/50 backdrop-blur-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg animate-glow">
                    <item.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-gradient">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
                </div>
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
            className="text-4xl md:text-5xl font-black text-center mb-4 text-gradient"
          >
            The Power of Collective Action
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground text-lg mb-16"
          >
            When we participate together, we create unstoppable momentum
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "—", label: "Datasets Shared", icon: Database },
              { value: "—", label: "Impact Generated", icon: Zap },
              { value: "—", label: "Projects Funded", icon: Heart },
              { value: "—", label: "Lives Improved", icon: TrendingUp },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-4xl md:text-6xl font-black text-gradient glow-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Projects Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-center mb-4 text-gradient"
          >
            Causes Making a Difference
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground text-lg mb-16"
          >
            From environment to education, your contributions fund real solutions
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: "Ocean Cleanup Initiative",
                description: "Removing plastic waste from oceans using AI-powered collection systems",
                funded: 42,
                goal: 50000,
                icon: "🌊",
                category: "Environment"
              },
              {
                title: "Rural Education Access",
                description: "Building digital learning centers in underserved communities worldwide",
                funded: 67,
                goal: 100000,
                icon: "📚",
                category: "Education"
              },
              {
                title: "Medical Research Fund",
                description: "Supporting breakthrough research in cancer treatment and prevention",
                funded: 28,
                goal: 75000,
                icon: "🔬",
                category: "Health"
              }
            ].map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-card border-2 border-border rounded-xl p-6 hover-lift hover:border-primary"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{project.icon}</div>
                  <span className="text-xs font-semibold text-primary">{project.category}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{project.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Funded</span>
                    <span className="font-semibold">{project.funded}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${project.funded}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-full bg-gradient-to-r from-primary to-accent"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    Goal: ${project.goal.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/projects">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift border-2 font-bold">
                <Leaf className="w-5 h-5 mr-2" />
                View All Projects
              </Button>
            </Link>
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
              Ready to Make Your Data Matter?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of people choosing to share their data consciously, 
              funding causes they believe in, and creating measurable impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit-data">
                <Button size="lg" className="text-lg px-8 py-6 border-glow hover-lift font-bold">
                  <Heart className="w-5 h-5 mr-2" />
                  Start Your Impact Journey
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift border-2 font-bold">
                  Learn More About Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;