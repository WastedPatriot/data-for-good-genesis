import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-12 text-center">Our Mission</h1>

          <div className="space-y-16">
            {/* The Problem */}
            <section className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-4 text-primary">
                  The Problem
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Every click, every scroll, every ad impression — your data already 
                  fuels the world's economy. Tech giants generate billions in profits 
                  from information about you, yet you never share in that value. 
                  Your digital footprint powers billion-dollar empires while you remain 
                  invisible in the equation.
                </p>
              </motion.div>
            </section>

            {/* The Solution */}
            <section className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-4 text-primary">
                  The Solution
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  We flip the model. At Data for Earth, you own your data. 
                  You decide how it helps the planet. Instead of enriching corporations, 
                  your voluntarily shared information funds verifiable environmental 
                  initiatives. It's ethical data commerce with transparent impact — 
                  turning your digital presence into real-world change.
                </p>
              </motion.div>
            </section>

            {/* Our Promise */}
            <section className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-4 text-primary">
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
              className="bg-card border border-border rounded-lg p-12 text-center"
            >
              <h2 className="text-3xl font-bold mb-6">
                Be Part of the Data Revolution
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of people who've chosen to make their data count 
                for something bigger than profits. Let's heal the planet together.
              </p>
              <Button size="lg" className="text-lg px-8 py-6">
                Start Contributing
              </Button>
            </motion.section>

            {/* Contact */}
            <section className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Get In Touch</h2>
              <p className="text-muted-foreground">
                Have questions? Want to partner with us?
              </p>
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                hello@dataforearth.org
              </Button>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;