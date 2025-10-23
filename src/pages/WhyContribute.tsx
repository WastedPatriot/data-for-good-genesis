import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Database, Users, Leaf, DollarSign, Shield, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const WhyContribute = () => {
  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-gradient glow-text">
            Why Contribute Your Data?
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Your data is already being collected. Let's make it fund the planet instead.
          </p>
        </motion.div>

        {/* The Flow */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-center mb-12 text-gradient"
          >
            How Your Data Creates Impact
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "You Share Data",
                description: "Choose what you're comfortable sharing — from simple quiz answers to device sensors. All anonymous.",
                step: "1"
              },
              {
                icon: DollarSign,
                title: "Companies Buy Ethically",
                description: "Verified companies purchase your data for market research, paying premium rates for ethical sourcing.",
                step: "2"
              },
              {
                icon: Leaf,
                title: "Eco Projects Get Funded",
                description: "100% of data revenue funds community-voted environmental initiatives. Track every dollar's impact.",
                step: "3"
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative bg-card border-2 border-border rounded-xl p-8 hover-lift hover:border-primary"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-black text-xl">
                  {item.step}
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 mx-auto">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-center">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-center">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Planet Impact Progress */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-card/80 border-2 border-primary/30 rounded-xl p-12 backdrop-blur-sm"
          >
            <h2 className="text-4xl font-black text-center mb-12 text-gradient">
              Our Planet Impact Progress
            </h2>

            <div className="space-y-8">
              {[
                { label: "CO₂ Offset (tons)", value: 0, target: 1000, color: "from-green-500 to-emerald-600" },
                { label: "Trees Planted", value: 0, target: 50000, color: "from-green-600 to-teal-600" },
                { label: "Ocean Cleanup (kg)", value: 0, target: 100000, color: "from-blue-500 to-cyan-600" },
                { label: "Solar Homes Powered", value: 0, target: 500, color: "from-yellow-500 to-orange-600" },
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">{metric.label}</span>
                    <span className="text-2xl font-black text-gradient">
                      {metric.value.toLocaleString()} / {metric.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(metric.value / metric.target) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${metric.color} relative`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center text-muted-foreground">
              <p className="text-sm">
                Progress updates monthly as datasets are purchased and projects are funded
              </p>
            </div>
          </motion.div>
        </section>

        {/* Why It's Better */}
        <section className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-center mb-12 text-gradient"
          >
            Why This Model Works
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: "You Stay Anonymous",
                description: "No personal identifiers. No tracking cookies. Just aggregate, anonymized insights.",
              },
              {
                icon: TrendingUp,
                title: "Premium Ethical Pricing",
                description: "Companies pay 3-5x more for ethically-sourced data with verified consent.",
              },
              {
                icon: Users,
                title: "Community Votes",
                description: "You decide which green projects get funded. Democracy in action.",
              },
              {
                icon: Leaf,
                title: "100% Environmental Funding",
                description: "Every dollar from data sales funds eco projects. Platform operations run on donations.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-card border-2 border-border rounded-xl p-6 hover-lift hover:border-primary/50"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl p-12 text-center"
          >
            <h2 className="text-4xl font-black mb-6 text-gradient glow-text">
              Ready to Make Your Data Count?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands turning their data into environmental impact. Takes less than 3 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contribute">
                <Button size="lg" className="text-lg px-8 py-6 border-glow hover-lift font-bold">
                  Contribute My Data
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover-lift border-2 font-bold">
                  See What Companies Buy
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default WhyContribute;
