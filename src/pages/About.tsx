import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import PhoneMockup from "@/components/PhoneMockup";
import DataHarvestAnimation from "@/components/DataHarvestAnimation";

const About = () => {
  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-6xl md:text-7xl font-black mb-8 text-center text-gradient-hero glow-text">Our Mission</h1>
          <p className="text-center text-muted-foreground mb-20 max-w-3xl mx-auto text-xl leading-relaxed">
            Watch how <span className="text-primary font-bold">data companies harvest your information</span> — 
            and how we're transforming that exploitation into <span className="text-accent font-bold">environmental action</span>
          </p>

          {/* Disney-Quality Phone Animation */}
          <motion.section
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="mb-32 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <PhoneMockup>
                <DataHarvestAnimation />
              </PhoneMockup>
            </motion.div>
          </motion.section>

          <div className="space-y-16">
            {/* The Problem */}
            <section className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="card-gradient border-2 border-border rounded-2xl p-10 hover-lift"
              >
                <h2 className="text-4xl font-black mb-6 text-gradient">
                  The Problem
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed mb-4">
                  Every click, every scroll, every ad impression — <span className="text-foreground font-semibold">your data already 
                  fuels the world's economy</span>. Tech giants generate <span className="text-destructive font-bold">billions in profits</span> 
                  from information about you, yet you never share in that value.
                </p>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Your digital footprint powers billion-dollar empires while you remain 
                  invisible in the equation. <span className="text-primary font-semibold">It's time to change that.</span>
                </p>
              </motion.div>
            </section>

            {/* The Solution */}
            <section className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="card-gradient border-2 border-primary/30 rounded-2xl p-10 hover-lift relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <h2 className="text-4xl font-black mb-6 text-gradient">
                    The Solution
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-4">
                    <span className="text-primary font-bold">We flip the model.</span> At Data for Earth, <span className="text-foreground font-semibold">you own your data</span>. 
                    You decide how it helps the planet. Instead of enriching corporations, 
                    your voluntarily shared information funds verifiable environmental initiatives.
                  </p>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    It's ethical data commerce with transparent impact — 
                    turning your digital presence into <span className="text-accent font-bold">real-world change</span>.
                  </p>
                </div>
              </motion.div>
            </section>

            {/* Our Promise */}
            <section className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-black mb-4 text-gradient">
                  Our Promise
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Every transaction is transparent. Every dataset purchased funds 
                  green projects voted on by you — the community. We verify the impact, 
                  track the results, and ensure your contribution makes a measurable 
                  difference. Your data becomes trees planted, oceans cleaned, 
                  and futures brightened.
                </p>
              </motion.div>
            </section>

            {/* CTA Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="card-gradient border-2 border-primary/50 rounded-2xl p-16 text-center hover-lift relative overflow-hidden animate-glow"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-8 text-gradient-hero glow-text">
                  Be Part of the Data Revolution
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of people who've chosen to make their data count 
                  for something <span className="text-primary font-bold">bigger than profits</span>. 
                  Let's <span className="text-accent font-bold">heal the planet together</span>.
                </p>
                <Link to="/submit-data">
                  <Button size="lg" className="text-xl px-12 py-8 border-glow hover-lift font-black shadow-elegant">
                    Start Contributing Now
                  </Button>
                </Link>
              </div>
            </motion.section>

            {/* Contact */}
            <section className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Get In Touch</h2>
              <p className="text-muted-foreground">
                Have questions? Want to partner with us?
              </p>
              <a href="mailto:hello@dataforearth.org" className="text-foreground hover:text-primary">
                <Button 
                  variant="outline" 
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  hello@dataforearth.org
                </Button>
              </a>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;