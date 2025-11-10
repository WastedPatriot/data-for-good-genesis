import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Globe, Leaf, Smartphone, Zap, Shield, Wallet } from "lucide-react";
import PhoneMockup from "@/components/PhoneMockup";

const Home = () => {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="container mx-auto px-4 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-6 inline-block px-6 py-2 bg-primary/20 rounded-full border border-primary/40">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  🌍 Climate-Positive Mobile Data
                </p>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-gradient-hero glow-text leading-tight">
                Travel Connected.
                <br />
                <span className="text-gradient">Save the Planet.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                Instant eSIM data plans for 190+ countries. Every purchase funds verified environmental projects. No roaming fees. No plastic SIM cards. Pure impact.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-medium">Instant activation</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-medium">190+ countries</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-medium">100% profit to planet</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/esim/marketplace">
                  <Button size="lg" className="text-lg px-8 py-6 shadow-xl hover-lift w-full sm:w-auto">
                    <Globe className="w-5 h-5 mr-2" />
                    Browse Plans
                  </Button>
                </Link>
                <Link to="/install">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift w-full sm:w-auto">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Get the App
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <PhoneMockup>
                <div className="p-6 space-y-6">
                  <div className="text-center pt-8">
                    <h3 className="text-xl font-bold mb-2">Global eSIM Plans</h3>
                    <p className="text-sm text-muted-foreground">190+ Countries</p>
                  </div>
                  <div className="space-y-3">
                    {["Europe 5GB", "USA 10GB", "Asia 8GB"].map((plan, i) => (
                      <div key={i} className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">{plan}</span>
                          <span className="text-xs text-primary">From $9</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-center mb-4 text-gradient"
          >
            Why DataForEarth?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto"
          >
            The world's first eSIM service that fights climate change with every connection
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Global Coverage",
                description: "Access reliable mobile data in 190+ countries with instant eSIM activation. No physical SIM cards, no waiting.",
              },
              {
                icon: Leaf,
                title: "Climate Positive",
                description: "100% of profits fund verified environmental projects. Every GB you use plants trees, removes plastic, and offsets carbon.",
              },
              {
                icon: Zap,
                title: "Instant Setup",
                description: "Download the app, choose a plan, pay with crypto or card, and connect in minutes. It's that simple.",
              },
              {
                icon: Shield,
                title: "Virtual Location",
                description: "Mask your IP location with built-in virtual routing. Browse privately while traveling the world.",
              },
              {
                icon: Wallet,
                title: "Flexible Payments",
                description: "Pay with Stripe, Apple Pay, Google Pay, or crypto. We accept Bitcoin, Ethereum, and major stablecoins.",
              },
              {
                icon: Smartphone,
                title: "Cancel Anytime",
                description: "No contracts, no hidden fees. Pause or cancel your plan anytime with full control over your data.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-gradient border-2 border-border rounded-2xl p-8 hover-lift hover:border-primary/50 backdrop-blur-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg">
                    <item.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-gradient">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-24 px-4 bg-card/30">
        <div className="container mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-4 text-gradient"
          >
            Our Collective Impact
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground text-lg mb-16 max-w-2xl mx-auto"
          >
            Together we're building a better planet, one connection at a time
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "190+", label: "Countries" },
              { value: "100%", label: "Profit to Planet" },
              { value: "0kg", label: "Plastic Used" },
              { value: "24/7", label: "Support" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-5xl md:text-6xl font-black text-gradient glow-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-gradient border-2 border-primary/30 rounded-3xl p-12 text-center"
          >
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-gradient glow-text">
                Ready to Travel Sustainably?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Join thousands of conscious travelers using DataForEarth eSIM. Stay connected globally while funding environmental restoration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/esim/marketplace">
                  <Button size="lg" className="text-lg px-8 py-6 shadow-xl hover-lift w-full sm:w-auto">
                    <Globe className="w-5 h-5 mr-2" />
                    Get Started Now
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift w-full sm:w-auto">
                    Learn Our Mission
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;